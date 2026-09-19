import {
  BadRequestException,
  ForbiddenException,
  NotFoundException,
} from "@nestjs/common";
import { Prisma } from "@prisma/client";
import { createHash } from "node:crypto";
import { AuthUser } from "../auth/auth.types";
import { validateBooking } from "../common/booking";
import { PrismaService } from "../prisma/prisma.service";
import { UserRole } from "../users/user-role.enum";
import { ExportEventsDto } from "./dto/export-events.dto";
import { mediaMode } from "./archive-media";

// Keep an explicit allowlist: adding a database field must never expand an archive.
const definitionSelect = {
  id: true,
  name: true,
  description: true,
  venue: true,
  mapLocation: true,
  startsAt: true,
  capacity: true,
  priceCents: true,
  thumbnailUrl: true,
  status: true,
  publishAt: true,
  cancelledAt: true,
  booking: true,
  createdAt: true,
  updatedAt: true,
  owner: { select: { id: true, email: true, name: true } },
  ticketTypes: {
    orderBy: { id: "asc" },
    select: {
      id: true,
      name: true,
      priceCents: true,
      capacity: true,
      maxPerOrder: true,
      salesStart: true,
      salesEnd: true,
    },
  },
} satisfies Prisma.EventSelect;

// Recursively sort object keys; arrays retain their defined order. Hash the UTF-8
// compact JSON, so JSONB key order and HTTP pretty-printing cannot change identity.
export function canonicalJson(value: unknown): string {
  if (Array.isArray(value)) return `[${value.map(canonicalJson).join(",")}]`;
  if (value !== null && typeof value === "object") {
    const object = value as Record<string, unknown>;
    return `{${Object.keys(object)
      .sort()
      .map((key) => `${JSON.stringify(key)}:${canonicalJson(object[key])}`)
      .join(",")}}`;
  }
  return JSON.stringify(value);
}

export async function exportEventArchive(
  prisma: PrismaService,
  user: AuthUser,
  dto: ExportEventsDto,
  now = new Date(),
) {
  const admin = user.role === UserRole.Admin;
  if (!admin && dto.ownerId !== undefined && dto.ownerId !== user.id) {
    throw new ForbiddenException("You can only export your own events.");
  }
  const where: Prisma.EventWhereInput = {
    ...(!admin
      ? { ownerId: user.id }
      : dto.ownerId
        ? { ownerId: dto.ownerId }
        : {}),
    // Admins may export other published/scheduled/cancelled events, never others' drafts.
    OR: [{ status: { not: "draft" } }, { ownerId: user.id }],
    ...(dto.eventIds ? { id: { in: dto.eventIds } } : {}),
  };
  const rows = await prisma.event.findMany({
    where,
    select: definitionSelect,
    orderBy: { id: "asc" },
    take: 1001,
  });
  if (rows.length > 1000)
    throw new BadRequestException(
      "Export at most 1000 events; select eventIds or filter by ownerId.",
    );
  if (dto.eventIds && rows.length !== dto.eventIds.length) {
    throw new NotFoundException(
      "One or more selected events were not found or are not exportable by you.",
    );
  }
  const events = rows.map(({ id, owner, ticketTypes, booking, ...event }) => ({
    sourceId: id,
    ...event,
    // Inline bytes are not part of reference-only exports. Upload them separately.
    thumbnailUrl: event.thumbnailUrl?.startsWith("data:")
      ? null
      : event.thumbnailUrl,
    startsAt: event.startsAt.toISOString(),
    publishAt: event.publishAt?.toISOString() ?? null,
    cancelledAt: event.cancelledAt?.toISOString() ?? null,
    createdAt: event.createdAt.toISOString(),
    updatedAt: event.updatedAt.toISOString(),
    owner: owner
      ? { sourceId: owner.id, email: owner.email, name: owner.name }
      : null,
    // Validate and project supported booking fields instead of copying arbitrary JSON.
    booking: validateBooking(booking),
    ticketTypes: ticketTypes.map(
      ({ id: typeId, salesStart, salesEnd, ...type }) => ({
        sourceId: typeId,
        ...type,
        salesStart: salesStart?.toISOString() ?? null,
        salesEnd: salesEnd?.toISOString() ?? null,
      }),
    ),
  }));
  const payload = {
    schemaVersion: 1,
    sourceEnvironment: dto.sourceEnvironment ?? null,
    events,
  };
  const checksum = createHash("sha256")
    .update(canonicalJson(payload))
    .digest("hex");
  const archive = {
    ...payload,
    manifest: {
      archiveId: `sha256:${checksum}`,
      checksum: { algorithm: "sha256", value: checksum },
      exportedAt: now.toISOString(),
      application: "passmint",
      media: events.map((event) => ({
        sourceId: event.sourceId,
        mode: mediaMode(event.thumbnailUrl),
        strategy: "reference-only",
      })),
      counts: {
        events: events.length,
        ticketTypes: events.reduce(
          (count, event) => count + event.ticketTypes.length,
          0,
        ),
      },
    },
  };
  const json = canonicalJson(archive);
  if (Buffer.byteLength(json, "utf8") > 6 * 1024 * 1024) {
    throw new BadRequestException(
      "Archive exceeds 6 MiB; export fewer eventIds per request.",
    );
  }
  return JSON.parse(json) as typeof archive;
}
