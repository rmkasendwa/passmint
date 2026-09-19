import { BadRequestException } from "@nestjs/common";
import { createHash } from "node:crypto";
import { Prisma } from "@prisma/client";
import { seatLabels, validateBooking } from "../common/booking";
import { canonicalJson } from "./event-archive";

export function invalid(message: string): never {
  throw new BadRequestException(message);
}

function object(
  value: unknown,
  keys: string[],
  label: string,
): Record<string, unknown> {
  if (!value || typeof value !== "object" || Array.isArray(value))
    invalid(`${label} must be an object.`);
  const record = value as Record<string, unknown>;
  if (Object.keys(record).some((key) => !keys.includes(key)))
    invalid(`${label} contains unsupported fields.`);
  return record;
}

function text(
  value: unknown,
  label: string,
  max = 6 * 1024 * 1024,
  nonempty = false,
): string {
  if (
    typeof value !== "string" ||
    value.length > max ||
    (nonempty && !value.trim())
  )
    invalid(
      `${label} must be ${nonempty ? "nonempty " : ""}text of at most ${max} characters.`,
    );
  return value;
}

function integer(
  value: unknown,
  label: string,
  min = 0,
  max = 2147483647,
): number {
  if (
    typeof value !== "number" ||
    !Number.isInteger(value) ||
    value < min ||
    value > max
  )
    invalid(`${label} must be an integer between ${min} and ${max}.`);
  return value;
}

function date(value: unknown, label: string): Date {
  const input = text(value, label, 30, true);
  const parsed = new Date(input);
  if (!Number.isFinite(parsed.getTime()) || parsed.toISOString() !== input)
    invalid(`${label} must be a UTC ISO timestamp with milliseconds.`);
  return parsed;
}

function nullable<T>(value: unknown, parse: (value: unknown) => T): T | null {
  return value === null ? null : parse(value);
}

// Bound nesting before canonicalization; deeply nested untrusted JSON must not
// overflow the stack even if an otherwise small HTTP request carries it.
function checkDepth(value: unknown, depth = 0): void {
  if (depth > 12) invalid("Archive nesting exceeds the supported format.");
  if (value && typeof value === "object")
    Object.values(value).forEach((child) => checkDepth(child, depth + 1));
}

export function validateArchive(input: unknown) {
  checkDepth(input);
  const archive = object(
    input,
    ["schemaVersion", "sourceEnvironment", "events", "manifest"],
    "Archive",
  );
  if (archive.schemaVersion !== 1)
    invalid("Unsupported archive schemaVersion; expected 1.");
  nullable(archive.sourceEnvironment, (value) =>
    text(value, "sourceEnvironment", 100, true),
  );
  if (!Array.isArray(archive.events) || archive.events.length > 1000)
    invalid("Archive events must be an array of at most 1000 records.");
  const events = archive.events as unknown[];
  const sourceIds = events.map((event) =>
    text(
      (event as Record<string, unknown> | null)?.sourceId,
      "sourceId",
      200,
      true,
    ),
  );
  if (new Set(sourceIds).size !== sourceIds.length)
    invalid("Archive source event IDs must be unique.");
  const manifest = object(
    archive.manifest,
    ["application", "exportedAt", "counts", "checksum", "archiveId", "media"],
    "Manifest",
  );
  if (manifest.application !== "passmint")
    invalid("Manifest application must be passmint.");
  date(manifest.exportedAt, "exportedAt");
  if (
    manifest.media !== undefined &&
    (!Array.isArray(manifest.media) || manifest.media.length > 1000)
  )
    invalid("Manifest media must be an array of at most 1000 entries.");
  const media = (manifest.media ?? []) as unknown[];
  const mediaIds = media.map((value) => {
    const entry = object(
      value,
      ["sourceId", "mode", "strategy"],
      "Media entry",
    );
    const sourceId = text(entry.sourceId, "Media sourceId", 200, true);
    if (!sourceIds.includes(sourceId))
      invalid("Media entry must reference an archive event.");
    text(entry.mode, "Media mode", 30, true);
    text(entry.strategy, "Media strategy", 30, true);
    return sourceId;
  });
  if (new Set(mediaIds).size !== mediaIds.length)
    invalid("Media entries must have unique source IDs.");
  const counts = object(
    manifest.counts,
    ["events", "ticketTypes"],
    "Manifest counts",
  );
  integer(counts.events, "Event count", 0, 1000);
  integer(counts.ticketTypes, "Ticket type count", 0, 20000);
  const typeCount = events.reduce<number>((count, event) => {
    const types = (event as Record<string, unknown>).ticketTypes;
    return count + (Array.isArray(types) ? types.length : 0);
  }, 0);
  if (counts.events !== events.length || counts.ticketTypes !== typeCount)
    invalid("Manifest counts do not match the archive.");
  const checksum = object(
    manifest.checksum,
    ["algorithm", "value"],
    "Checksum",
  );
  if (checksum.algorithm !== "sha256")
    invalid("Unsupported checksum algorithm.");
  if (Buffer.byteLength(canonicalJson(archive), "utf8") > 6 * 1024 * 1024)
    invalid("Archive exceeds 6 MiB.");
  const digest = createHash("sha256")
    .update(
      canonicalJson({
        schemaVersion: 1,
        sourceEnvironment: archive.sourceEnvironment,
        events,
      }),
    )
    .digest("hex");
  if (checksum.value !== digest || manifest.archiveId !== `sha256:${digest}`)
    invalid("Archive checksum or archiveId does not match its content.");
  return {
    archiveId: `sha256:${digest}`,
    events,
    sourceIds,
    media: media as { sourceId: string; mode: string; strategy: string }[],
  };
}

export function validateArchiveEvent(input: unknown) {
  const event = object(
    input,
    [
      "sourceId",
      "name",
      "description",
      "venue",
      "mapLocation",
      "startsAt",
      "capacity",
      "priceCents",
      "thumbnailUrl",
      "status",
      "publishAt",
      "cancelledAt",
      "booking",
      "createdAt",
      "updatedAt",
      "owner",
      "ticketTypes",
    ],
    "Event",
  );
  const sourceId = text(event.sourceId, "sourceId", 200, true);
  const name = text(event.name, "name");
  const description = text(event.description, "description");
  const venue = text(event.venue, "venue");
  const startsAt = date(event.startsAt, "startsAt");
  date(event.createdAt, "createdAt");
  date(event.updatedAt, "updatedAt");
  const mapLocation = nullable(event.mapLocation, (value) =>
    text(value, "mapLocation", 500),
  );
  const thumbnailUrl = nullable(event.thumbnailUrl, (value) =>
    text(value, "thumbnailUrl", 2500000),
  );
  const capacity = nullable(event.capacity, (value) =>
    integer(value, "capacity", 1),
  );
  const priceCents = integer(event.priceCents, "priceCents");
  const sourceStatus = text(event.status, "status", 20);
  if (!["draft", "published", "scheduled", "cancelled"].includes(sourceStatus))
    invalid("Unsupported event status.");
  // Scheduling in this application is represented by a draft with publishAt.
  const status = sourceStatus === "scheduled" ? "draft" : sourceStatus;
  const publishAt = nullable(event.publishAt, (value) =>
    date(value, "publishAt"),
  );
  const cancelledAt = nullable(event.cancelledAt, (value) =>
    date(value, "cancelledAt"),
  );
  if (sourceStatus === "scheduled" && !publishAt)
    invalid("Scheduled events need publishAt.");
  if (publishAt && (status !== "draft" || publishAt >= startsAt))
    invalid("Publication must be before startsAt and only on drafts.");
  if ((status === "cancelled") !== (cancelledAt !== null))
    invalid("Only cancelled events must have cancelledAt.");
  if (
    (status !== "draft" || publishAt) &&
    (!name.trim() ||
      !description.trim() ||
      !venue.trim() ||
      startsAt.getTime() === 0)
  )
    invalid(
      "Published, cancelled and scheduled events require name, description, venue and startsAt.",
    );
  const owner = nullable(event.owner, (value) => {
    const data = object(value, ["sourceId", "email", "name"], "Owner");
    return {
      sourceId: text(data.sourceId, "Owner sourceId", 200, true),
      email: text(data.email, "Owner email", 320, true),
      name: text(data.name, "Owner name"),
    };
  });
  if (event.booking !== null) {
    const raw = object(
      event.booking,
      ["kind", "destination", "service", "durationMinutes", "seating"],
      "Booking",
    );
    if (raw.seating !== undefined)
      object(
        raw.seating,
        ["rows", "columns", "aisleAfter", "blocked"],
        "Seating",
      );
  }
  const booking = validateBooking(event.booking);
  if (booking?.seating && capacity !== seatLabels(booking).length)
    invalid("Capacity must match the available seats in booking.");
  if (!Array.isArray(event.ticketTypes) || event.ticketTypes.length > 20)
    invalid("Each event supports at most 20 ticket categories.");
  const ticketTypes = event.ticketTypes.map((value) => {
    const type = object(
      value,
      [
        "sourceId",
        "name",
        "priceCents",
        "capacity",
        "maxPerOrder",
        "salesStart",
        "salesEnd",
      ],
      "Ticket category",
    );
    const salesStart = nullable(type.salesStart, (value) =>
      date(value, "salesStart"),
    );
    const salesEnd = nullable(type.salesEnd, (value) =>
      date(value, "salesEnd"),
    );
    if (salesStart && salesEnd && salesStart >= salesEnd)
      invalid("Ticket sales must end after they start.");
    return {
      sourceId: text(type.sourceId, "Category sourceId", 200, true),
      name: text(type.name, "Category name", 100, true),
      priceCents: integer(type.priceCents, "Category priceCents"),
      capacity: nullable(type.capacity, (value) =>
        integer(value, "Category capacity", 1),
      ),
      maxPerOrder: integer(type.maxPerOrder, "maxPerOrder", 1, 100),
      salesStart,
      salesEnd,
    };
  });
  if (
    new Set(ticketTypes.map((type) => type.sourceId)).size !==
    ticketTypes.length
  )
    invalid("Category source IDs must be unique within each event.");
  if (
    new Set(ticketTypes.map((type) => type.name.trim().toLowerCase())).size !==
    ticketTypes.length
  )
    invalid("Ticket category names must be unique.");
  return {
    sourceId,
    owner,
    ticketTypes,
    sourceStatus,
    data: {
      name,
      description,
      venue,
      startsAt,
      mapLocation,
      thumbnailUrl,
      capacity,
      priceCents,
      status,
      publishAt,
      cancelledAt,
      booking: booking
        ? (booking as unknown as Prisma.InputJsonValue)
        : Prisma.DbNull,
    },
  };
}
