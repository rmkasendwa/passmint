import {
  Injectable,
  ForbiddenException,
  NotFoundException,
  OnApplicationBootstrap,
} from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { In, Repository } from "typeorm";
import { AuthUser } from "../auth/auth.types";
import { User } from "../users/user.entity";
import { UserRole } from "../users/user-role.enum";
import { CreateEventDto } from "./dto/create-event.dto";
import { UpdateEventDto } from "./dto/update-event.dto";
import { Event } from "./event.entity";

function startsInDays(days: number, hour: number, minute = 0) {
  const date = new Date();
  date.setDate(date.getDate() + days);
  date.setHours(hour, minute, 0, 0);
  return date;
}

const seedEvents = [
  {
    name: "Kampala Tech Night",
    description: "A practical evening of demos, talks, and networking.",
    venue: "Innovation Village, Ntinda",
    startsAt: startsInDays(11, 18, 30),
    capacity: 250,
    priceCents: 2500000,
    thumbnailUrl:
      "https://images.unsplash.com/photo-1516321318423-f06f85e504b3?auto=format&fit=crop&w=1200&q=80",
  },
  {
    name: "Lakeside Music Weekend",
    description: "Two stages, local food vendors, and live performances.",
    venue: "Munyonyo Lake Grounds",
    startsAt: startsInDays(19, 15),
    capacity: 1000,
    priceCents: 5000000,
    thumbnailUrl:
      "https://images.unsplash.com/photo-1501386761578-eac5c94b800a?auto=format&fit=crop&w=1200&q=80",
  },
  {
    name: "Founders Breakfast Club",
    description:
      "Early coffee, investor office hours, and crisp startup talks.",
    venue: "Design Hub Kampala",
    startsAt: startsInDays(4, 8),
    capacity: 120,
    priceCents: 1500000,
    thumbnailUrl:
      "https://images.unsplash.com/photo-1556761175-b413da4baf72?auto=format&fit=crop&w=1200&q=80",
  },
  {
    name: "Afro House Rooftop Sessions",
    description: "Sunset DJ sets, rooftop views, and a late-night dance floor.",
    venue: "The Villa, Bukoto",
    startsAt: startsInDays(7, 19),
    capacity: 420,
    priceCents: 3500000,
    thumbnailUrl:
      "https://images.unsplash.com/photo-1470229722913-7c0e2dbbafd3?auto=format&fit=crop&w=1200&q=80",
  },
  {
    name: "Women in Product Summit",
    description: "Panels, workshops, and mentorship for product teams.",
    venue: "Motiv, Bugolobi",
    startsAt: startsInDays(14, 9),
    capacity: 300,
    priceCents: 4000000,
    thumbnailUrl:
      "https://images.unsplash.com/photo-1515169067865-5387ec356754?auto=format&fit=crop&w=1200&q=80",
  },
  {
    name: "Sunday Craft Market",
    description:
      "Local makers, food stalls, family activities, and acoustic music.",
    venue: "Ndere Cultural Centre",
    startsAt: startsInDays(20, 10),
    capacity: 650,
    priceCents: 1000000,
    thumbnailUrl:
      "https://images.unsplash.com/photo-1488459716781-31db52582fe9?auto=format&fit=crop&w=1200&q=80",
  },
  {
    name: "Kampala Comedy Showcase",
    description: "A fast-paced evening with stand-up sets and surprise guests.",
    venue: "National Theatre",
    startsAt: startsInDays(25, 20),
    capacity: 500,
    priceCents: 3000000,
    thumbnailUrl:
      "https://images.unsplash.com/photo-1527224857830-43a7acc85260?auto=format&fit=crop&w=1200&q=80",
  },
  {
    name: "Startup Pitch Arena",
    description: "Ten companies pitch live to operators, angels, and founders.",
    venue: "MoTIV Warehouse",
    startsAt: startsInDays(32, 17, 30),
    capacity: 380,
    priceCents: 2000000,
    thumbnailUrl:
      "https://images.unsplash.com/photo-1559223607-a43c990c692c?auto=format&fit=crop&w=1200&q=80",
  },
  {
    name: "Maker Faire Kampala",
    description:
      "Hardware demos, robotics, design booths, and family workshops.",
    venue: "UMA Show Grounds",
    startsAt: startsInDays(38, 11),
    capacity: 1200,
    priceCents: 2500000,
    thumbnailUrl:
      "https://images.unsplash.com/photo-1581090464777-f3220bbe1b8b?auto=format&fit=crop&w=1200&q=80",
  },
  {
    name: "Indie Film Night",
    description: "Short films, director Q&A, and a relaxed lobby mixer.",
    venue: "Century Cinemax Acacia",
    startsAt: startsInDays(44, 18),
    capacity: 180,
    priceCents: 2200000,
    thumbnailUrl:
      "https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?auto=format&fit=crop&w=1200&q=80",
  },
  {
    name: "Wellness Reset Day",
    description:
      "Yoga, guided breathwork, nutrition talks, and recovery sessions.",
    venue: "Forest Park Resort",
    startsAt: startsInDays(52, 7, 30),
    capacity: 240,
    priceCents: 4500000,
    thumbnailUrl:
      "https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?auto=format&fit=crop&w=1200&q=80",
  },
  {
    name: "Basketball Opening Night",
    description: "City league tip-off with courtside access and halftime acts.",
    venue: "Lugogo Indoor Arena",
    startsAt: startsInDays(60, 19, 30),
    capacity: 900,
    priceCents: 3000000,
    thumbnailUrl:
      "https://images.unsplash.com/photo-1546519638-68e109498ffc?auto=format&fit=crop&w=1200&q=80",
  },
];

@Injectable()
export class EventsService implements OnApplicationBootstrap {
  constructor(
    @InjectRepository(Event)
    private readonly eventsRepository: Repository<Event>,
    @InjectRepository(User)
    private readonly usersRepository: Repository<User>,
  ) {}

  async onApplicationBootstrap() {
    const seededNames = seedEvents.map((event) => event.name);
    const existingEvents = await this.eventsRepository.find({
      select: ["id", "name", "thumbnailUrl"],
      where: { name: In(seededNames) },
    });
    const existingNames = new Set(existingEvents.map((event) => event.name));
    const missingEvents = seedEvents.filter(
      (event) => !existingNames.has(event.name),
    );
    const seedEventByName = new Map(
      seedEvents.map((event) => [event.name, event]),
    );
    const eventsMissingImages = existingEvents.filter(
      (event) => !event.thumbnailUrl,
    );

    if (eventsMissingImages.length > 0) {
      await Promise.all(
        eventsMissingImages.map((event) => {
          const seedEvent = seedEventByName.get(event.name);
          if (!seedEvent?.thumbnailUrl) return null;

          return this.eventsRepository.update(event.id, {
            thumbnailUrl: seedEvent.thumbnailUrl,
          });
        }),
      );
    }

    if (missingEvents.length > 0) {
      await this.eventsRepository.save(
        this.eventsRepository.create(missingEvents),
      );
    }
  }

  findAll() {
    return this.eventsRepository.find({
      order: { startsAt: "ASC" },
      loadRelationIds: true,
    });
  }

  findMine(userId: string) {
    return this.eventsRepository.find({
      where: { owner: { id: userId } },
      order: { startsAt: "ASC" },
      loadRelationIds: true,
    });
  }

  async findOne(id: string) {
    const event = await this.eventsRepository.findOne({
      where: { id },
      loadRelationIds: true,
    });
    if (!event) throw new NotFoundException("Event not found");
    return event;
  }

  async findOneWithOwner(id: string) {
    const event = await this.eventsRepository.findOne({
      where: { id },
      relations: { owner: true },
    });
    if (!event) throw new NotFoundException("Event not found");
    return event;
  }

  async create(dto: CreateEventDto, authUser: AuthUser) {
    const owner = await this.usersRepository.findOne({
      where: { id: authUser.id },
    });

    return this.eventsRepository.save(
      this.eventsRepository.create({ ...dto, owner }),
    );
  }

  async update(id: string, dto: UpdateEventDto, authUser: AuthUser) {
    const event = await this.findOneWithOwner(id);
    const canUpdate =
      authUser.role === UserRole.Admin || event.owner?.id === authUser.id;

    if (!canUpdate) {
      throw new ForbiddenException("You can only edit events you created.");
    }

    Object.assign(event, dto);
    return this.eventsRepository.save(event);
  }
}
