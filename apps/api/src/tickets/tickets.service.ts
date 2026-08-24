import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { randomUUID } from "crypto";
import { Repository } from "typeorm";
import { AuthUser } from "../auth/auth.types";
import { EventsService } from "../events/events.service";
import { User } from "../users/user.entity";
import { UserRole } from "../users/user-role.enum";
import { CreateTicketDto } from "./dto/create-ticket.dto";
import { TicketStatus } from "./ticket-status.enum";
import { Ticket } from "./ticket.entity";
import { toTicketResponse } from "./ticket-response";

@Injectable()
export class TicketsService {
  constructor(
    @InjectRepository(Ticket)
    private readonly ticketsRepository: Repository<Ticket>,
    @InjectRepository(User)
    private readonly usersRepository: Repository<User>,
    private readonly eventsService: EventsService,
  ) {}

  async create(dto: CreateTicketDto, authUser?: AuthUser) {
    const event = await this.eventsService.findOneWithOwner(dto.eventId);
    const quantity = dto.quantity ?? 1;
    const soldCount = await this.ticketsRepository.count({
      where: { event: { id: event.id } },
    });
    const buyerEmail = dto.buyerEmail.trim().toLowerCase();
    const existingEmailCount = await this.ticketsRepository.count({
      where: {
        event: { id: event.id },
        buyerEmail,
      },
    });
    const owner = authUser
      ? await this.usersRepository.findOne({ where: { id: authUser.id } })
      : null;

    if (soldCount + quantity > event.capacity) {
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

    const tickets = Array.from({ length: quantity }, () =>
      this.ticketsRepository.create({
        event,
        buyerName: dto.buyerName,
        buyerEmail,
        code: randomUUID(),
        owner,
      }),
    );

    const saved = await this.ticketsRepository.save(tickets);
    return Promise.all(saved.map(toTicketResponse));
  }

  async findOne(id: string) {
    const ticket = await this.ticketsRepository.findOne({ where: { id } });
    if (!ticket) throw new NotFoundException("Ticket not found");
    return toTicketResponse(ticket);
  }

  async findMine(userId: string) {
    const tickets = await this.ticketsRepository.find({
      where: { owner: { id: userId } },
      order: { createdAt: "DESC" },
    });

    return Promise.all(tickets.map(toTicketResponse));
  }

  async scan(code: string, authUser: AuthUser) {
    const ticket = await this.ticketsRepository.findOne({
      where: { code },
      relations: { event: { owner: true } },
    });
    if (!ticket) {
      throw new NotFoundException({
        result: "invalid",
        message: "Ticket does not exist",
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

    ticket.status = TicketStatus.CheckedIn;
    ticket.checkedInAt = new Date();
    const saved = await this.ticketsRepository.save(ticket);

    return {
      result: "accepted",
      message: "Ticket accepted",
      ticket: await toTicketResponse(saved),
    };
  }
}
