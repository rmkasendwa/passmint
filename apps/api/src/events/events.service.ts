import { exportEventArchive } from './event-archive';
import { ExportEventsDto } from './dto/export-events.dto';
import { ImportEventsDto } from './dto/import-events.dto';
import { importEventArchive } from './import-event-archive';
import { validateBooking, seatLabels, Booking } from "../common/booking";
import {
  Injectable,
  ForbiddenException,
  NotFoundException,
  OnApplicationBootstrap,
  BadRequestException,
  OnModuleDestroy,
  Logger,
} from "@nestjs/common";
import { Event, User, TicketType, Prisma } from "@prisma/client";
import { AuthUser } from "../auth/auth.types";
import { prefixedId } from "../common/prefixed-id";
import { isWithinSalesWindow } from "../common/ticket-sales";
import { PrismaService } from "../prisma/prisma.service";
import { isPlatformAdmin } from "../users/user-role.enum";
import { CreateEventDto } from "./dto/create-event.dto";
import { UpdateEventDto } from "./dto/update-event.dto";
import { TicketTypeDto } from "./dto/ticket-type.dto";
import { AttendeeQueryDto } from "./dto/attendee-query.dto";

const typeInventory = {
  ticketTypes: { include: { _count: { select: { tickets: { where: { status: { not: "cancelled" as const } } } } } }, orderBy: { createdAt: "asc" as const } },
};

type EventWithOwner = Event & { owner: User | null };

@Injectable()
export class EventsService implements OnApplicationBootstrap, OnModuleDestroy {
  private readonly logger = new Logger(EventsService.name);
  private publicationTimer?: ReturnType<typeof setInterval>;
  constructor(private readonly prisma: PrismaService) {}

  exportArchive(dto: ExportEventsDto, user: AuthUser) {
    return exportEventArchive(this.prisma, user, dto);
  }

  importArchive(dto: ImportEventsDto, user: AuthUser) {
    return importEventArchive(this.prisma, user, dto);
  }

  async onApplicationBootstrap() {
    await this.publishDue();
    this.publicationTimer = setInterval(() => { void this.publishDue().catch(() => this.logger.error("Scheduled publication failed; retrying on the next tick.")); }, 30_000);
    this.publicationTimer.unref();
  }

  async findAll() {
    await this.publishDue();
    const events = await this.prisma.event.findMany({
      where: { status: { not: "draft" } },
      orderBy: { startsAt: "asc" },
      include: {
        ...typeInventory,
        _count: {
          select: { tickets: { where: { status: { not: "cancelled" } } } },
        },
      },
    });

    return events.map((event) => this.toEventResponse(event));
  }

  async findMine(userId: string) {
    await this.publishDue();
    const events = await this.prisma.event.findMany({
      where: { ownerId: userId },
      include: {
        ...typeInventory,
        _count: {
          select: { tickets: { where: { status: { not: "cancelled" } } } },
        },
      },
      orderBy: { startsAt: "asc" },
    });

    return events.map((event) => this.toEventResponse(event));
  }

  async findOne(id: string, authUser?: AuthUser) {
    await this.publishDue();
    const event = await this.prisma.event.findUnique({
      where: { id },
      include: {
        ...typeInventory,
        owner: true,
        _count: {
          select: { tickets: { where: { status: { not: "cancelled" } } } },
        },
      },
    });
    if (!event) throw new NotFoundException("Event not found");
    if (event.status === "draft" && event.ownerId !== authUser?.id) throw new NotFoundException("Event not found");
    const occupied = await this.prisma.ticket.findMany({where:{eventId:id,status:{not:"cancelled"},seatLabel:{not:null}},select:{seatLabel:true}});
    return {...this.toEventResponse(event), occupiedSeats: occupied.map(ticket => ticket.seatLabel)};
  }

  async findOneWithOwner(id: string) {
    const event = await this.prisma.event.findUnique({
      where: { id },
      include: { owner: true },
    });
    if (!event) throw new NotFoundException("Event not found");
    return event;
  }

  async scanMetrics(id: string, user: AuthUser, requestedDay?: string, now = new Date()) {
    const day = requestedDay ?? now.toISOString().slice(0, 10);
    const start = new Date(`${day}T00:00:00.000Z`);
    if (!/^\d{4}-\d{2}-\d{2}$/.test(day) || !Number.isFinite(start.getTime()) || start.getUTCFullYear() < 1 || start.toISOString().slice(0, 10) !== day) {
      throw new BadRequestException('Choose a valid date in YYYY-MM-DD format.');
    }
    const end = new Date(start.getTime() + 86400000);
    return this.prisma.$transaction(async tx => {
      const event = await tx.event.findUnique({ where: { id }, select: { ownerId: true, status: true } });
      if (!event || (event.status === 'draft' && event.ownerId !== user.id)) throw new NotFoundException('Event not found');
      if (event.ownerId !== user.id && !isPlatformAdmin(user.role)) throw new ForbiddenException('You can only inspect scan metrics for your own events.');
      const rows = await tx.$queryRaw<{ hour: string; attempts: number; accepted: number; duplicates: number; timedScans: number; totalDurationMs: number }[]>`
        SELECT to_char(a."createdAt" AT TIME ZONE 'UTC', 'HH24') AS hour,
          COUNT(*)::int AS attempts,
          COUNT(*) FILTER (WHERE a.kind = 'accepted')::int AS accepted,
          COUNT(*) FILTER (WHERE a.kind = 'duplicate')::int AS duplicates,
          COUNT(a."decisionDurationMs")::int AS "timedScans",
          COALESCE(SUM(a."decisionDurationMs"), 0)::float8 AS "totalDurationMs"
        FROM ticket_activities a JOIN tickets t ON t.id = a."ticketId"
        WHERE t."eventId" = ${id} AND a."createdAt" >= ${start} AND a."createdAt" < ${end}
          AND a.kind IN ('accepted', 'duplicate', 'cancelled', 'event_cancelled', 'forbidden')
        GROUP BY 1`;
      const hourly = Array.from({ length: 24 }, (_, index) => {
        const hour = String(index).padStart(2, '0');
        const row = rows.find(row => row.hour === hour);
        return {
          hour: `${day}T${hour}:00:00.000Z`, attempts: row?.attempts ?? 0, accepted: row?.accepted ?? 0,
          failed: (row?.attempts ?? 0) - (row?.accepted ?? 0), duplicates: row?.duplicates ?? 0,
          timedScans: row?.timedScans ?? 0,
          averageDecisionMs: row?.timedScans ? row.totalDurationMs / row.timedScans : null,
        };
      });
      const attempts = rows.reduce((sum, row) => sum + row.attempts, 0);
      const accepted = rows.reduce((sum, row) => sum + row.accepted, 0);
      const timedScans = rows.reduce((sum, row) => sum + row.timedScans, 0);
      const peak = hourly.reduce((best, row) => row.accepted > best.accepted ? row : best, hourly[0]);
      return {
        day, attempts, accepted, failed: attempts - accepted,
        duplicates: rows.reduce((sum, row) => sum + row.duplicates, 0), timedScans,
        averageDecisionMs: timedScans ? rows.reduce((sum, row) => sum + row.totalDurationMs, 0) / timedScans : null,
        peakCheckInHour: peak.accepted ? peak.hour : null, peakCheckIns: peak.accepted,
        hourly, generatedAt: now.toISOString(),
      };
    }, { isolationLevel: Prisma.TransactionIsolationLevel.RepeatableRead });
  }

  async salesSummary(user: AuthUser, eventId?: string, now = new Date()) {
    await this.publishDue();
    const start = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() - 29));
    const end = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() + 1));
    return this.prisma.$transaction(async tx => {
      if (eventId) {
        const event = await tx.event.findUnique({ where: { id: eventId }, select: { ownerId: true, status: true } });
        if (!event || (event.status === 'draft' && event.ownerId !== user.id)) throw new NotFoundException('Event not found');
        if (event.ownerId !== user.id && !isPlatformAdmin(user.role)) throw new ForbiddenException('You can only view sales for your own events.');
      }
      // All-organizer reports always scope to the caller, including platform admins.
      const scope = eventId ? Prisma.sql`e.id = ${eventId}` : Prisma.sql`e."ownerId" = ${user.id}`;
      const [totals] = await tx.$queryRaw<{ ticketsIssued: number; ticketsCancelled: number; checkedIn: number; faceValueCents: number; unpricedTickets: number }[]>(Prisma.sql`
        SELECT count(*)::int AS "ticketsIssued",
          count(*) FILTER (WHERE t.status = 'cancelled')::int AS "ticketsCancelled",
          count(*) FILTER (WHERE t."checkedInAt" IS NOT NULL)::int AS "checkedIn",
          coalesce(sum(t."unitPriceCents"), 0)::float8 AS "faceValueCents",
          count(*) FILTER (WHERE t."unitPriceCents" IS NULL)::int AS "unpricedTickets"
        FROM tickets t JOIN events e ON e.id = t."eventId" WHERE ${scope}`);
      const [inventory] = await tx.$queryRaw<{ events: number; remainingCapacity: number; unlimitedEvents: number }[]>(Prisma.sql`
        WITH inventory AS (
          SELECT e.id, e.status, e.capacity, count(t.id) FILTER (WHERE t.status <> 'cancelled') AS issued
          FROM events e LEFT JOIN tickets t ON t."eventId" = e.id WHERE ${scope}
          GROUP BY e.id
        )
        SELECT count(*)::int AS events,
          coalesce(sum(greatest(capacity - issued, 0)) FILTER (WHERE status = 'published' AND capacity IS NOT NULL), 0)::float8 AS "remainingCapacity",
          count(*) FILTER (WHERE status = 'published' AND capacity IS NULL)::int AS "unlimitedEvents"
        FROM inventory`);
      const rows = await tx.$queryRaw<{ day: string; ticketsIssued: number }[]>(Prisma.sql`
        SELECT to_char(t."createdAt", 'YYYY-MM-DD') AS day, count(*)::int AS "ticketsIssued"
        FROM tickets t JOIN events e ON e.id = t."eventId"
        WHERE ${scope} AND t."createdAt" >= ${start.toISOString().slice(0, 19)}::timestamp AND t."createdAt" < ${end.toISOString().slice(0, 19)}::timestamp
        GROUP BY day ORDER BY day`);
      const counts = new Map(rows.map(row => [row.day, row.ticketsIssued]));
      const daily = Array.from({ length: 30 }, (_, index) => {
        const day = new Date(start.getTime() + index * 86_400_000).toISOString().slice(0, 10);
        return { day, ticketsIssued: counts.get(day) ?? 0 };
      });
      return { ...totals, ...inventory, daily, verifiedRevenueCents: null, generatedAt: now.toISOString() };
    }, { isolationLevel: Prisma.TransactionIsolationLevel.RepeatableRead });
  }

  async findAttendees(id: string, query: AttendeeQueryDto, user: AuthUser) {
    const event = await this.prisma.event.findUnique({ where: { id }, select: { ownerId: true, status: true } });
    if (!event || (event.status === "draft" && event.ownerId !== user.id)) throw new NotFoundException("Event not found");
    if (event.ownerId !== user.id && !isPlatformAdmin(user.role)) throw new ForbiddenException("You can only view attendees for your own events.");
    const search = query.search?.trim();
    const page = query.page ?? 1;
    const pageSize = 50;
    const attendees = await this.prisma.ticket.findMany({
      where: { eventId: id, ...(search ? { OR: [
        { buyerName: { contains: search, mode: "insensitive" as const } },
        { buyerEmail: { contains: search, mode: "insensitive" as const } },
      ] } : {}) },
      select: { id: true, buyerName: true, buyerEmail: true, seatLabel: true, ticketTypeName: true, status: true, createdAt: true, checkedInAt: true },
      orderBy: [{ createdAt: "desc" }, { id: "desc" }],
      skip: (page - 1) * pageSize,
      take: pageSize + 1,
    });
    return { attendees: attendees.slice(0, pageSize), page, pageSize, hasMore: attendees.length > pageSize };
  }

  private creationOptions(dto: CreateEventDto | UpdateEventDto) {
    const booking = validateBooking(dto.booking);
    const types = dto.ticketTypes ?? [];
    if (new Set(types.map(t => t.name.trim().toLowerCase())).size !== types.length) throw new BadRequestException("Ticket category names must be unique.");
    for (const type of types) if (type.salesStart && type.salesEnd && type.salesStart >= type.salesEnd) throw new BadRequestException("Ticket sales must end after they start.");
    return {
      booking: booking ? booking as unknown as Prisma.InputJsonValue : Prisma.DbNull,
      ...(booking?.seating ? {capacity: seatLabels(booking).length} : {}),
      ...(types.length ? {priceCents: Math.min(...types.map(t => t.priceCents)), ticketTypes: {create: types.map(type => ({...type, id: prefixedId("typ")}))}} : {}),
    };
  }

  async create(dto: CreateEventDto, authUser: AuthUser) {
    const event = await this.prisma.event.create({
      data: {
        id: prefixedId("evt"),
        ...dto,
        ticketTypes: undefined,
        ...this.creationOptions(dto),
        ownerId: authUser.id,
      },
      include: { owner: true },
    });

    return this.toEventResponse(event);
  }

  async createDraft(dto: UpdateEventDto, authUser: AuthUser) {
    const draft = await this.prisma.event.create({ data: {
      id: prefixedId("evt"), name: dto.name ?? "", description: dto.description ?? "", venue: dto.venue ?? "",
      startsAt: dto.startsAt ?? new Date(0), priceCents: dto.priceCents ?? 0,
      capacity: dto.capacity ?? null, thumbnailUrl: dto.thumbnailUrl, mapLocation: dto.mapLocation,
      ...this.creationOptions(dto),
      ownerId: authUser.id, status: "draft",
    } });
    return this.toEventResponse(draft);
  }

  async duplicate(id: string, startsAt: Date, user: AuthUser) {
    if (!(startsAt instanceof Date) || !Number.isFinite(startsAt.getTime()) || startsAt <= new Date()) {
      throw new BadRequestException("Choose a future date for the new event.");
    }
    const duplicate = await this.prisma.$transaction(async tx => {
      await tx.$queryRaw`SELECT id FROM events WHERE id = ${id} FOR UPDATE`;
      const source = await tx.event.findUnique({ where: { id }, include: { ticketTypes: true } });
      if (!source) throw new NotFoundException("Event not found");
      if (source.ownerId !== user.id) throw new ForbiddenException("You can only duplicate events you created.");
      const offset = startsAt.getTime() - source.startsAt.getTime();
      const shift = (date: Date | null) => date ? new Date(date.getTime() + offset) : null;
      return tx.event.create({ data: {
        id: prefixedId("evt"), ownerId: user.id, status: "draft",
        name: source.name, description: source.description, venue: source.venue,
        mapLocation: source.mapLocation, startsAt, capacity: source.capacity,
        booking: source.booking ?? Prisma.DbNull,
        priceCents: source.priceCents, thumbnailUrl: source.thumbnailUrl,
        ticketTypes: { create: source.ticketTypes.map(type => ({
          id: prefixedId("typ"), name: type.name, priceCents: type.priceCents,
          capacity: type.capacity, maxPerOrder: type.maxPerOrder,
          salesStart: shift(type.salesStart), salesEnd: shift(type.salesEnd),
        })) },
      } });
    });
    return this.findOne(duplicate.id, user);
  }

  private validatePublication(event: Pick<Event, "name" | "description" | "venue" | "startsAt">) {
    if (!event.name.trim() || !event.description.trim() || !event.venue.trim() || event.startsAt.getTime() === 0) {
      throw new BadRequestException("Add an event name, description, venue, and start date before publishing.");
    }
  }

  onModuleDestroy() { if (this.publicationTimer) clearInterval(this.publicationTimer); }

  async publishDue(now = new Date()) {
    return this.prisma.event.updateMany({
      where: { status: "draft", publishAt: { lte: now } },
      data: { status: "published", publishAt: null },
    });
  }

  async update(id: string, dto: UpdateEventDto, authUser: AuthUser) {
    const event = await this.findOneWithOwner(id);
    const canUpdate =
      isPlatformAdmin(authUser.role) || event.owner?.id === authUser.id;

    if (!canUpdate || (event.status === "draft" && event.ownerId !== authUser.id)) {
      throw new ForbiddenException("You can only edit events you created.");
    }

    const updated = await this.prisma.$transaction(async (tx) => {
      await tx.$queryRaw`SELECT id FROM events WHERE id = ${id} FOR UPDATE`;
      const current = await tx.event.findUniqueOrThrow({ where: { id } });
      if (current.status === "cancelled") throw new BadRequestException("Cancelled events cannot be edited.");
      if ((dto.status ?? current.status) === "published") this.validatePublication({ ...current, ...dto });
      const publishAt = dto.publishAt === undefined ? current.publishAt : dto.publishAt;
      if (publishAt && dto.status !== "published") {
        if (current.status !== "draft") throw new BadRequestException("Only drafts can be scheduled.");
        const next = { ...current, ...dto };
        this.validatePublication(next);
        if (publishAt <= new Date() || publishAt >= next.startsAt) throw new BadRequestException("Publication must be in the future and before the event starts.");
      }
      if (dto.capacity != null) {
        const sold = await tx.ticket.count({
          where: { eventId: id, status: { not: "cancelled" } },
        });
        if (dto.capacity < sold)
          throw new BadRequestException(
            "Capacity cannot be lower than the number of active tickets.",
          );
      }
      if (dto.ticketTypes) throw new BadRequestException("Use the ticket category editor for existing events.");
      const booking = validateBooking(dto.booking === undefined ? current.booking : dto.booking);
      if (dto.booking !== undefined && JSON.stringify(booking) !== JSON.stringify(current.booking)) {
        const issued = await tx.ticket.count({where:{eventId:id}});
        if (issued) throw new BadRequestException("Format and seating cannot change after tickets have been issued. Duplicate the event to use a new layout.");
      }
      const { ticketTypes, booking: rawBooking, ...fields } = dto;
      return tx.event.update({
        where: { id },
        data: { ...fields, ...(rawBooking !== undefined ? {booking: booking ? booking as unknown as Prisma.InputJsonValue : Prisma.DbNull} : {}), ...(booking?.seating ? {capacity: seatLabels(booking).length} : {}), ...(dto.status === "published" ? { publishAt: null } : {}) },
        include: {
          owner: true,
          _count: {
            select: { tickets: { where: { status: { not: "cancelled" } } } },
          },
        },
      });
    });

    return this.findOne(updated.id, authUser);
  }

  async cancel(id: string, authUser: AuthUser) {
    return this.prisma.$transaction(async (tx) => {
      await tx.$queryRaw`SELECT id FROM events WHERE id = ${id} FOR UPDATE`;
      const event = await tx.event.findUnique({ where: { id } });
      if (!event) throw new NotFoundException("Event not found");
      if (event.status === "draft" && event.ownerId !== authUser.id) throw new NotFoundException("Event not found");
      if (event.status === "draft") throw new BadRequestException("Drafts are private. Remove their publication schedule to keep them unpublished.");
      if (event.ownerId !== authUser.id && !isPlatformAdmin(authUser.role)) {
        throw new ForbiddenException("You can only cancel events you created.");
      }
      const cancelled = await tx.event.update({
        where: { id },
        data: { status: "cancelled", cancelledAt: event.cancelledAt ?? new Date() },
        include: { _count: { select: { tickets: { where: { status: { not: "cancelled" } } } } } },
      });
      return this.toEventResponse(cancelled);
    });
  }

  private toEventResponse(
    event: (Event | EventWithOwner) & { _count?: { tickets: number }, ticketTypes?: (TicketType & { _count: { tickets: number } })[] },
  ) {
    const owner = "owner" in event
      ? event.owner ? { id: event.owner.id, name: event.owner.name } : null
      : event.ownerId;
    const now = new Date();
    const eventSoldOut = event.capacity !== null && (event._count?.tickets ?? 0) >= event.capacity;

    return {
      ...event,
      owner,
      ticketTypes: event.ticketTypes?.map(type => {
        const remainingCapacity = type.capacity === null ? null : Math.max(0, type.capacity - type._count.tickets);
        return { ...type, ticketsSold: type._count.tickets, remainingCapacity,
          available: event.status === "published" && !eventSoldOut && remainingCapacity !== 0 && isWithinSalesWindow(type, now),
        };
      }),
      ticketsSold: event._count?.tickets ?? 0,
      remainingCapacity:
        event.capacity === null
          ? null
          : Math.max(0, event.capacity - (event._count?.tickets ?? 0)),
      soldOut:
        event.capacity !== null &&
        (event._count?.tickets ?? 0) >= event.capacity,
    };
  }

  async saveTicketType(eventId: string, dto: TicketTypeDto, user: AuthUser, typeId?: string) {
    return this.prisma.$transaction(async tx => {
      await tx.$queryRaw`SELECT id FROM events WHERE id = ${eventId} FOR UPDATE`;
      const event = await tx.event.findUnique({ where: { id: eventId } });
      if (!event) throw new NotFoundException("Event not found");
      if (event.ownerId !== user.id && (!isPlatformAdmin(user.role) || event.status === "draft")) throw new ForbiddenException("You can only manage ticket types for your own events.");
      if (event.status === "cancelled") throw new BadRequestException("Cancelled events cannot be edited.");
      const existing = typeId ? await tx.ticketType.findUnique({ where: { id: typeId } }) : null;
      if (typeId && existing?.eventId !== eventId) throw new NotFoundException("Ticket type not found");
      const start = dto.salesStart === undefined ? existing?.salesStart : dto.salesStart;
      const end = dto.salesEnd === undefined ? existing?.salesEnd : dto.salesEnd;
      if (start && end && start >= end) throw new BadRequestException("Sales must end after they start.");
      if (dto.capacity != null && typeId) {
        const sold = await tx.ticket.count({ where: { ticketTypeId: typeId, status: { not: "cancelled" } } });
        if (dto.capacity < sold) throw new BadRequestException("Ticket type capacity cannot be below active sales.");
      }
      return typeId ? tx.ticketType.update({ where: { id: typeId }, data: dto }) : tx.ticketType.create({ data: { ...dto, id: prefixedId("typ"), eventId } });
    });
  }
}
