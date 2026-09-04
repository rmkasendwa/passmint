import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import { randomUUID } from "crypto";
import { AuthUser } from "../auth/auth.types";
import { prefixedId } from "../common/prefixed-id";
import { EventsService } from "../events/events.service";
import { PrismaService } from "../prisma/prisma.service";
import { UserRole } from "../users/user-role.enum";
import { CreateTicketDto } from "./dto/create-ticket.dto";
import { TicketStatus } from "./ticket-status.enum";
import { toTicketResponse } from "./ticket-response";

@Injectable()
export class TicketsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly eventsService: EventsService,
  ) {}

  async create(dto: CreateTicketDto, authUser?: AuthUser) {
    const quantity = dto.quantity ?? 1;
    const buyerEmail = dto.buyerEmail.trim().toLowerCase();
    const tickets = await this.prisma.$transaction(async (tx) => {
      // Serialize inventory changes for this event, including capacity edits.
      await tx.$queryRaw`SELECT id FROM events WHERE id = ${dto.eventId} FOR UPDATE`;
      const event = await tx.event.findUnique({ where: { id: dto.eventId } });
      if (!event) throw new NotFoundException("Event not found");
      const soldCount = await tx.ticket.count({
        where: { eventId: event.id, status: { not: TicketStatus.Cancelled } },
      });
      const existingEmailCount = await tx.ticket.count({
        where: {
          eventId: event.id,
          buyerEmail,
        },
      });

      if (event.capacity !== null && soldCount + quantity > event.capacity) {
        throw new BadRequestException(
          "Not enough tickets remaining for this event",
        );
      }

      if (existingEmailCount > 0 && !dto.confirmAdditional) {
        throw new ConflictException({
          result: "additional_confirmation_required",
          message:
            "This email already has tickets for this event. Confirm if you want to issue more.",
          eventId: event.id,
          buyerEmail,
          existingTicketCount: existingEmailCount,
          requestedQuantity: quantity,
          totalAfterPurchase: existingEmailCount + quantity,
        });
      }

      return Promise.all(
        Array.from({ length: quantity }, () =>
          tx.ticket.create({
            data: {
              id: prefixedId("tkt"),
              eventId: event.id,
              ownerId: authUser?.id,
              buyerName: dto.buyerName,
              buyerEmail,
              code: randomUUID(),
            },
            include: { event: true },
          }),
        ),
      );
    });

    return Promise.all(tickets.map(toTicketResponse));
  }

  async findOne(id: string) {
    const ticket = await this.prisma.ticket.findUnique({
      where: { id },
      include: { event: true },
    });
    if (!ticket) throw new NotFoundException("Ticket not found");
    return toTicketResponse(ticket);
  }

  async findMine(userId: string) {
    const tickets = await this.prisma.ticket.findMany({
      where: { ownerId: userId },
      orderBy: { createdAt: "desc" },
      include: { event: true },
    });

    return Promise.all(tickets.map(toTicketResponse));
  }

  async scan(code: string, authUser: AuthUser) {
    const ticket = await this.prisma.ticket.findUnique({
      where: { code },
      include: { event: { include: { owner: true } } },
    });
    if (!ticket) {
      throw new NotFoundException({
        result: "invalid",
        message: "Ticket does not exist",
      });
    }
    if (!ticket.event) {
      throw new NotFoundException({
        result: "invalid",
        message: "Ticket event does not exist",
      });
    }

    const canValidate =
      authUser.role === UserRole.Admin ||
      ticket.event.owner?.id === authUser.id;

    if (!canValidate) {
      throw new ForbiddenException({
        result: "forbidden",
        message: "You can only validate tickets for events you created.",
      });
    }

    if (ticket.status === TicketStatus.Cancelled) {
      throw new ConflictException({
        result: "cancelled",
        message: "Ticket has been cancelled",
        ticket,
      });
    }

    if (ticket.status === TicketStatus.CheckedIn) {
      throw new ConflictException({
        result: "duplicate",
        message: "Ticket has already been checked in",
        checkedInAt: ticket.checkedInAt,
        ticket,
      });
    }

    const saved = await this.prisma.ticket.update({
      where: { id: ticket.id },
      data: {
        status: TicketStatus.CheckedIn,
        checkedInAt: new Date(),
      },
      include: { event: true },
    });

    return {
      result: "accepted",
      message: "Ticket accepted",
      ticket: await toTicketResponse(saved),
    };
  }
}
