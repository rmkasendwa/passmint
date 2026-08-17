import {
  Injectable,
  NotFoundException,
  OnApplicationBootstrap,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';
import { CreateEventDto } from './dto/create-event.dto';
import { Event } from './event.entity';

function startsInDays(days: number, hour: number, minute = 0) {
  const date = new Date();
  date.setDate(date.getDate() + days);
  date.setHours(hour, minute, 0, 0);
  return date;
}

const seedEvents = [
  {
    name: 'Kampala Tech Night',
    description: 'A practical evening of demos, talks, and networking.',
    venue: 'Innovation Village, Ntinda',
    startsAt: startsInDays(11, 18, 30),
    capacity: 250,
    priceCents: 2500000,
  },
  {
    name: 'Lakeside Music Weekend',
    description: 'Two stages, local food vendors, and live performances.',
    venue: 'Munyonyo Lake Grounds',
    startsAt: startsInDays(19, 15),
    capacity: 1000,
    priceCents: 5000000,
  },
  {
    name: 'Founders Breakfast Club',
    description: 'Early coffee, investor office hours, and crisp startup talks.',
    venue: 'Design Hub Kampala',
    startsAt: startsInDays(4, 8),
    capacity: 120,
    priceCents: 1500000,
  },
  {
    name: 'Afro House Rooftop Sessions',
    description: 'Sunset DJ sets, rooftop views, and a late-night dance floor.',
    venue: 'The Villa, Bukoto',
    startsAt: startsInDays(7, 19),
    capacity: 420,
    priceCents: 3500000,
  },
  {
    name: 'Women in Product Summit',
    description: 'Panels, workshops, and mentorship for product teams.',
    venue: 'Motiv, Bugolobi',
    startsAt: startsInDays(14, 9),
    capacity: 300,
    priceCents: 4000000,
  },
  {
    name: 'Sunday Craft Market',
    description: 'Local makers, food stalls, family activities, and acoustic music.',
    venue: 'Ndere Cultural Centre',
    startsAt: startsInDays(20, 10),
    capacity: 650,
    priceCents: 1000000,
  },
  {
    name: 'Kampala Comedy Showcase',
    description: 'A fast-paced evening with stand-up sets and surprise guests.',
    venue: 'National Theatre',
    startsAt: startsInDays(25, 20),
    capacity: 500,
    priceCents: 3000000,
  },
  {
    name: 'Startup Pitch Arena',
    description: 'Ten companies pitch live to operators, angels, and founders.',
    venue: 'MoTIV Warehouse',
    startsAt: startsInDays(32, 17, 30),
    capacity: 380,
    priceCents: 2000000,
  },
  {
    name: 'Maker Faire Kampala',
    description: 'Hardware demos, robotics, design booths, and family workshops.',
    venue: 'UMA Show Grounds',
    startsAt: startsInDays(38, 11),
    capacity: 1200,
    priceCents: 2500000,
  },
  {
    name: 'Indie Film Night',
    description: 'Short films, director Q&A, and a relaxed lobby mixer.',
    venue: 'Century Cinemax Acacia',
    startsAt: startsInDays(44, 18),
    capacity: 180,
    priceCents: 2200000,
  },
  {
    name: 'Wellness Reset Day',
    description: 'Yoga, guided breathwork, nutrition talks, and recovery sessions.',
    venue: 'Forest Park Resort',
    startsAt: startsInDays(52, 7, 30),
    capacity: 240,
    priceCents: 4500000,
  },
  {
    name: 'Basketball Opening Night',
    description: 'City league tip-off with courtside access and halftime acts.',
    venue: 'Lugogo Indoor Arena',
    startsAt: startsInDays(60, 19, 30),
    capacity: 900,
    priceCents: 3000000,
  },
];

@Injectable()
export class EventsService implements OnApplicationBootstrap {
  constructor(
    @InjectRepository(Event)
    private readonly eventsRepository: Repository<Event>,
  ) {}

  async onApplicationBootstrap() {
    const seededNames = seedEvents.map((event) => event.name);
    const existingEvents = await this.eventsRepository.find({
      select: ['name'],
      where: { name: In(seededNames) },
    });
    const existingNames = new Set(existingEvents.map((event) => event.name));
    const missingEvents = seedEvents.filter(
      (event) => !existingNames.has(event.name),
    );

    if (missingEvents.length === 0) return;

    await this.eventsRepository.save(
      this.eventsRepository.create(missingEvents),
    );
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
    return this.eventsRepository.save(this.eventsRepository.create(dto));
  }
}
