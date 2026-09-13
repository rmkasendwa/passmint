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
import { isWithinSalesWindow } from "../common/ticket-sales";
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
    await this.eventsService.publishDue();
    const quantity = dto.quantity ?? 1;
    if (!Number.isInteger(quantity) || quantity < 1 || quantity > 100) {
      throw new BadRequestException("Quantity must be a whole number between 1 and 100.");
    }
    const buyerEmail = dto.buyerEmail.trim().toLowerCase();
    const tickets = await this.prisma.$transaction(async (tx) => {
      // Serialize inventory changes for this event, including capacity edits.
      await tx.$queryRaw`SELECT id FROM events WHERE id = ${dto.eventId} FOR UPDATE`;
      const event = await tx.event.findUnique({ where: { id: dto.eventId } });
      if (!event) throw new NotFoundException("Event not found");
      if (event.status === "draft") throw new NotFoundException("Event not found");
      if (event.status === "cancelled") throw new BadRequestException("This event has been cancelled. Ticket sales are closed.");
      const types = await tx.ticketType.findMany({ where: { eventId: event.id } });
      const type = dto.ticketTypeId ? types.find(type => type.id === dto.ticketTypeId) : undefined;
      if ((types.length > 0 && !type) || (dto.ticketTypeId && !type)) throw new BadRequestException("Choose a valid ticket category for this event.");
      if (quantity > (type?.maxPerOrder ?? 10)) throw new BadRequestException(`You can buy at most ${type?.maxPerOrder ?? 10} tickets per order.`);
      if (type) {
        if (!isWithinSalesWindow(type)) throw new BadRequestException("This ticket category is outside its sales window.");
        const typeSold = await tx.ticket.count({ where: { ticketTypeId: type.id, status: { not: TicketStatus.Cancelled } } });
        if (type.capacity !== null && typeSold + quantity > type.capacity) throw new BadRequestException("Not enough tickets remaining in this category.");
      }
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
              ticketTypeId: type?.id,
              ticketTypeName: type?.name ?? "General admission",
              unitPriceCents: type?.priceCents ?? event.priceCents,
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

  async findOne(id: string, authUser: AuthUser) {
    const ticket = await this.prisma.ticket.findUnique({
      where: { id },
      include: { event: true },
    });
    if (!ticket) throw new NotFoundException("Ticket not found");
    if (ticket.ownerId !== authUser.id && ticket.event?.ownerId !== authUser.id && authUser.role !== UserRole.Admin) {
      throw new ForbiddenException("You do not have access to this ticket.");
    }
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

  async activity(id: string, authUser: AuthUser, page = 1) {
    if (!Number.isInteger(page) || page < 1 || page > 100000) throw new BadRequestException('Invalid activity page.');
    const ticket = await this.prisma.ticket.findUnique({ where: { id }, include: { event: true } });
    if (!ticket?.event || (ticket.event.status === 'draft' && ticket.event.ownerId !== authUser.id)) throw new NotFoundException('Ticket not found');
    if (ticket.event.ownerId !== authUser.id && authUser.role !== UserRole.Admin) throw new ForbiddenException('You can only inspect ticket activity for events you manage.');
    const rows = await this.prisma.ticketActivity.findMany({
      where: { ticketId: id }, orderBy: [{ createdAt: 'desc' }, { id: 'desc' }], skip: (page - 1) * 50, take: 51,
      select: { id: true, kind: true, createdAt: true, operatorId: true, operatorName: true, device: true },
    });
    const hasRecordedCheckIn = await this.prisma.ticketActivity.count({ where: { ticketId: id, kind: 'accepted' } });
    return {
      issuedAt: ticket.createdAt,
      legacyCheckedInAt: hasRecordedCheckIn ? null : ticket.checkedInAt,
      activities: rows.slice(0, 50), page, hasMore: rows.length > 50,
    };
  }

  async scan(code: string, authUser: AuthUser, device?: string) {
    const outcome = await this.prisma.$transaction(async (tx) => {
    const reference = await tx.ticket.findUnique({ where: { code }, select: { eventId: true } });
    if (reference?.eventId) await tx.$queryRaw`SELECT id FROM events WHERE id = ${reference.eventId} FOR UPDATE`;
    const ticket = await tx.ticket.findUnique({
      where: { code },
      include: { event: true },
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

    const record = (kind: string) => tx.ticketActivity.create({ data: {
      id: prefixedId('act'), ticketId: ticket.id, kind,
      operatorId: authUser.id, operatorName: authUser.name,
      createdAt: new Date(),
      device: device?.replace(/[\x00-\x1f\x7f]/g, '').slice(0, 500) || null,
    } });

    const canValidate =
      authUser.role === UserRole.Admin ||
      ticket.event.ownerId === authUser.id;

    if (!canValidate) {
      await record('forbidden');
      return { error: new ForbiddenException({
        result: "forbidden",
        message: "You can only validate tickets for events you created.",
      }) };
    }

    if (ticket.event.status === "cancelled") {
      await record('event_cancelled');
      return { error: new ConflictException({ result: "cancelled", message: "This event has been cancelled." }) };
    }

    if (ticket.status === TicketStatus.Cancelled) {
      await record('cancelled');
      return { error: new ConflictException({
        result: "cancelled",
        message: "Ticket has been cancelled",
        ticket: await toTicketResponse(ticket),
      }) };
    }

    if (ticket.status === TicketStatus.CheckedIn) {
      await record('duplicate');
      return { error: new ConflictException({
        result: "duplicate",
        message: "Ticket has already been checked in",
        checkedInAt: ticket.checkedInAt,
        ticket: await toTicketResponse(ticket),
      }) };
    }

    const saved = await tx.ticket.update({
      where: { id: ticket.id },
      data: {
        status: TicketStatus.CheckedIn,
        checkedInAt: new Date(),
      },
      include: { event: true },
    });

    await record('accepted');
    return { value: {
      result: "accepted",
      message: "Ticket accepted",
      ticket: await toTicketResponse(saved),
    } };
    });
    // Throw only after committing so rejected scans retain their audit record.
    if (outcome.error) throw outcome.error;
    return outcome.value;
  }
}
