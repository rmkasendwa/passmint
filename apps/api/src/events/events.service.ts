import {
  Injectable,
  ForbiddenException,
  NotFoundException,
  OnApplicationBootstrap,
} from "@nestjs/common";
import { Event, User } from "@prisma/client";
import { AuthUser } from "../auth/auth.types";
import { prefixedId } from "../common/prefixed-id";
import { PrismaService } from "../prisma/prisma.service";
import { UserRole } from "../users/user-role.enum";
import { CreateEventDto } from "./dto/create-event.dto";
import { UpdateEventDto } from "./dto/update-event.dto";

type EventWithOwner = Event & { owner: User | null };

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
    mapLocation: "Innovation Village Ntinda Kampala",
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
    mapLocation: "Munyonyo Lake Grounds Kampala",
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
    mapLocation: "Design Hub Kampala",
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
    mapLocation: "The Villa Bukoto Kampala",
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
    mapLocation: "MoTIV Bugolobi Kampala",
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
    mapLocation: "Ndere Cultural Centre Kampala",
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
    mapLocation: "Uganda National Theatre Kampala",
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
    mapLocation: "MoTIV Warehouse Kampala",
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
    mapLocation: "UMA Show Grounds Kampala",
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
    mapLocation: "Century Cinemax Acacia Kampala",
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
    mapLocation: "Forest Park Resort Kampala",
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
    mapLocation: "Lugogo Indoor Arena Kampala",
    startsAt: startsInDays(60, 19, 30),
    capacity: 900,
    priceCents: 3000000,
    thumbnailUrl:
      "https://images.unsplash.com/photo-1546519638-68e109498ffc?auto=format&fit=crop&w=1200&q=80",
  },
];

@Injectable()
export class EventsService implements OnApplicationBootstrap {
  constructor(private readonly prisma: PrismaService) {}

  async onApplicationBootstrap() {
    const seededNames = seedEvents.map((event) => event.name);
    const existingEvents = await this.prisma.event.findMany({
      select: { id: true, name: true, thumbnailUrl: true, mapLocation: true },
      where: { name: { in: seededNames } },
    });
    const existingNames = new Set(existingEvents.map((event) => event.name));
    const missingEvents = seedEvents.filter(
      (event) => !existingNames.has(event.name),
    );
    const seedEventByName = new Map(
      seedEvents.map((event) => [event.name, event]),
    );
    const eventsMissingSeedDetails = existingEvents.filter(
      (event) => !event.thumbnailUrl || !event.mapLocation,
    );

    if (eventsMissingSeedDetails.length > 0) {
      await Promise.all(
        eventsMissingSeedDetails.map((event) => {
          const seedEvent = seedEventByName.get(event.name);
          if (!seedEvent) return null;

          return this.prisma.event.update({
            where: { id: event.id },
            data: {
              ...(!event.thumbnailUrl && seedEvent.thumbnailUrl
                ? { thumbnailUrl: seedEvent.thumbnailUrl }
                : {}),
              ...(!event.mapLocation && seedEvent.mapLocation
                ? { mapLocation: seedEvent.mapLocation }
                : {}),
            },
          });
        }),
      );
    }

    if (missingEvents.length > 0) {
      await this.prisma.event.createMany({
        data: missingEvents.map((event) => ({
          id: prefixedId("evt"),
          ...event,
        })),
      });
    }
  }

  async findAll() {
    const events = await this.prisma.event.findMany({
      orderBy: { startsAt: "asc" },
    });

    return events.map((event) => this.toEventResponse(event));
  }

  async findMine(userId: string) {
    const events = await this.prisma.event.findMany({
      where: { ownerId: userId },
      orderBy: { startsAt: "asc" },
    });

    return events.map((event) => this.toEventResponse(event));
  }

  async findOne(id: string) {
    const event = await this.prisma.event.findUnique({
      where: { id },
      include: { owner: true },
    });
    if (!event) throw new NotFoundException("Event not found");
    return this.toEventResponse(event);
  }

  async findOneWithOwner(id: string) {
    const event = await this.prisma.event.findUnique({
      where: { id },
      include: { owner: true },
    });
    if (!event) throw new NotFoundException("Event not found");
    return event;
  }

  async create(dto: CreateEventDto, authUser: AuthUser) {
    const event = await this.prisma.event.create({
      data: {
        id: prefixedId("evt"),
        ...dto,
        ownerId: authUser.id,
      },
      include: { owner: true },
    });

    return this.toEventResponse(event);
  }

  async update(id: string, dto: UpdateEventDto, authUser: AuthUser) {
    const event = await this.findOneWithOwner(id);
    const canUpdate =
      authUser.role === UserRole.Admin || event.owner?.id === authUser.id;

    if (!canUpdate) {
      throw new ForbiddenException("You can only edit events you created.");
    }

    const updated = await this.prisma.event.update({
      where: { id },
      data: dto,
      include: { owner: true },
    });

    return this.toEventResponse(updated);
  }

  private toEventResponse(event: Event | EventWithOwner) {
    const owner = "owner" in event ? event.owner : event.ownerId;

    return {
      ...event,
      owner,
    };
  }
}
