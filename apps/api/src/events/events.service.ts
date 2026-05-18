import { Injectable, NotFoundException, OnApplicationBootstrap } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CreateEventDto } from './dto/create-event.dto';
import { Event } from './event.entity';

@Injectable()
export class EventsService implements OnApplicationBootstrap {
  constructor(
    @InjectRepository(Event)
    private readonly eventsRepository: Repository<Event>,
  ) {}

  async onApplicationBootstrap() {
    const count = await this.eventsRepository.count();
    if (count > 0) return;

    await this.eventsRepository.save([
      {
        name: 'Kampala Tech Night',
        description: 'A practical evening of demos, talks, and networking.',
        venue: 'Innovation Village, Ntinda',
        startsAt: new Date(Date.now() + 1000 * 60 * 60 * 24 * 14),
        capacity: 250,
        priceCents: 2500000,
      },
      {
        name: 'Lakeside Music Weekend',
        description: 'Two stages, local food vendors, and live performances.',
        venue: 'Munyonyo Lake Grounds',
        startsAt: new Date(Date.now() + 1000 * 60 * 60 * 24 * 30),
        capacity: 1000,
        priceCents: 5000000,
      },
    ]);
  }

  findAll() {
    return this.eventsRepository.find({
      order: { startsAt: 'ASC' },
      loadRelationIds: true,
    });
  }

  async findOne(id: string) {
    const event = await this.eventsRepository.findOne({ where: { id } });
    if (!event) throw new NotFoundException('Event not found');
    return event;
  }

  create(dto: CreateEventDto) {
    return this.eventsRepository.save(dto);
  }
}
