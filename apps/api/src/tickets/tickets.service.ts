import { BadRequestException, ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { randomUUID } from 'crypto';
import { Repository } from 'typeorm';
import { EventsService } from '../events/events.service';
import { CreateTicketDto } from './dto/create-ticket.dto';
import { TicketStatus } from './ticket-status.enum';
import { Ticket } from './ticket.entity';
import { toTicketResponse } from './ticket-response';

@Injectable()
export class TicketsService {
  constructor(
    @InjectRepository(Ticket)
    private readonly ticketsRepository: Repository<Ticket>,
    private readonly eventsService: EventsService,
  ) {}

  async create(dto: CreateTicketDto) {
    const event = await this.eventsService.findOne(dto.eventId);
    const quantity = dto.quantity ?? 1;
    const soldCount = await this.ticketsRepository.count({ where: { event: { id: event.id } } });

    if (soldCount + quantity > event.capacity) {
      throw new BadRequestException('Not enough tickets remaining for this event');
    }

    const tickets = Array.from({ length: quantity }, () =>
      this.ticketsRepository.create({
        event,
        buyerName: dto.buyerName,
        buyerEmail: dto.buyerEmail,
        code: randomUUID(),
      }),
    );

    const saved = await this.ticketsRepository.save(tickets);
    return Promise.all(saved.map(toTicketResponse));
  }

  async findOne(id: string) {
    const ticket = await this.ticketsRepository.findOne({ where: { id } });
    if (!ticket) throw new NotFoundException('Ticket not found');
    return toTicketResponse(ticket);
  }

  async scan(code: string) {
    const ticket = await this.ticketsRepository.findOne({ where: { code } });
    if (!ticket) {
      throw new NotFoundException({
        result: 'invalid',
        message: 'Ticket does not exist',
      });
    }

    if (ticket.status === TicketStatus.Cancelled) {
      throw new ConflictException({
        result: 'cancelled',
        message: 'Ticket has been cancelled',
        ticket,
      });
    }

    if (ticket.status === TicketStatus.CheckedIn) {
      throw new ConflictException({
        result: 'duplicate',
        message: 'Ticket has already been checked in',
        checkedInAt: ticket.checkedInAt,
        ticket,
      });
    }

    ticket.status = TicketStatus.CheckedIn;
    ticket.checkedInAt = new Date();
    const saved = await this.ticketsRepository.save(ticket);

    return {
      result: 'accepted',
      message: 'Ticket accepted',
      ticket: await toTicketResponse(saved),
    };
  }
}
