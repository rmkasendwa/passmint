import {
  BadRequestException,
  ForbiddenException,
  NotFoundException,
} from "@nestjs/common";
import { Prisma } from "@prisma/client";
import { AuthUser } from "../auth/auth.types";
import { prefixedId } from "../common/prefixed-id";
import { PrismaService } from "../prisma/prisma.service";
import { UserRole } from "../users/user-role.enum";
import { ImportEventsDto } from "./dto/import-events.dto";
import {
  validateArchive,
  validateArchiveEvent,
  invalid,
} from "./import-archive-validation";

type Mapping = { sourceId: string; targetId: string };
type Result = {
  sourceId: string;
  status: "valid" | "imported" | "skipped" | "failed";
  targetOwnerId?: string;
  targetId?: string;
  ticketTypes?: Mapping[];
  warnings: string[];
  error?: string;
};

export async function importEventArchive(
  prisma: PrismaService,
  user: AuthUser,
  dto: ImportEventsDto,
  now = new Date(),
) {
  const admin = user.role === UserRole.Admin;
  if (
    !admin &&
    dto.targetOwnerId !== undefined &&
    dto.targetOwnerId !== user.id
  ) {
    throw new ForbiddenException(
      "You can only import into your own ownership scope.",
    );
  }
  const { archiveId, events, sourceIds } = validateArchive(dto.archive);
  const explicitOwner =
    dto.targetOwnerId === undefined
      ? null
      : await prisma.user.findUnique({
          where: { id: dto.targetOwnerId },
          select: { id: true, email: true },
        });
  if (dto.targetOwnerId !== undefined && !explicitOwner)
    throw new NotFoundException("Target owner does not exist.");
  const dryRun = dto.dryRun ?? true;
  const records: Result[] = [];
  for (let index = 0; index < events.length; index++) {
    const result: Result = {
      sourceId: sourceIds[index],
      status: "failed",
      warnings: [],
    };
    try {
      const event = validateArchiveEvent(events[index]);
      let targetOwner = explicitOwner;
      if (!targetOwner) {
        if (!event.owner)
          invalid("Unowned source events require explicit targetOwnerId.");
        const email = event.owner.email.trim().toLowerCase();
        if (!admin && email !== user.email.trim().toLowerCase())
          invalid(
            "Source owner differs from your account; set targetOwnerId to your own ID to remap explicitly.",
          );
        targetOwner = await prisma.user.findUnique({
          where: { email },
          select: { id: true, email: true },
        });
        if (!targetOwner)
          invalid(
            "Source owner is missing in the target; create the account or provide targetOwnerId.",
          );
      }
      if (!admin && targetOwner.id !== user.id)
        invalid("You can only import into your own ownership scope.");
      result.targetOwnerId = targetOwner.id;
      if (
        explicitOwner &&
        event.owner?.email.trim().toLowerCase() !==
          targetOwner.email.toLowerCase()
      )
        result.warnings.push(
          "Owner explicitly remapped to the target account.",
        );
      if (event.sourceStatus === "scheduled")
        result.warnings.push(
          "Scheduled status represented as a draft with publishAt.",
        );
      if (event.data.publishAt)
        result.warnings.push(
          "Scheduled draft will publish automatically at publishAt.",
        );
      if (event.data.thumbnailUrl)
        result.warnings.push(
          "Thumbnail reference preserved without copying or checking media availability.",
        );

      const ownerId = targetOwner.id;
      const key = { archiveId, sourceEventId: event.sourceId, ownerId };
      const existing = async (client: Prisma.TransactionClient) =>
        client.eventImport.findUnique({
          where: { archiveId_sourceEventId_ownerId: key },
          include: { event: { select: { ownerId: true } } },
        });
      const skipped = (
        receipt: NonNullable<Awaited<ReturnType<typeof existing>>>,
      ) => {
        if (receipt.event.ownerId !== ownerId)
          invalid(
            "Previously imported event ownership has changed; review it before retrying.",
          );
        if (dto.onDuplicate === "error")
          invalid(
            "This source event was already imported from this archive for this owner.",
          );
        return {
          status: "skipped" as const,
          targetId: receipt.eventId,
          ticketTypes: receipt.ticketTypeMapping as Mapping[],
        };
      };
      if (dryRun) {
        const receipt = await existing(prisma);
        if (!receipt && event.data.publishAt && event.data.publishAt <= now)
          invalid(
            "Publication time has passed; revise the schedule before importing.",
          );
        Object.assign(result, receipt ? skipped(receipt) : { status: "valid" });
      } else {
        const outcome = await prisma.$transaction(async (tx) => {
          // Serialize overlapping retries across processes. The unique receipt key
          // additionally protects against duplicate imports at the database layer.
          await tx.$executeRaw`SELECT pg_advisory_xact_lock(hashtextextended(${JSON.stringify(key)}, 0))`;
          const receipt = await existing(tx);
          if (receipt) return skipped(receipt);
          // A long bulk request may cross a publication boundary after validation.
          if (event.data.publishAt && event.data.publishAt <= new Date())
            invalid(
              "Publication time has passed; revise the schedule before importing.",
            );
          const targetId = prefixedId("evt");
          const ticketTypes = event.ticketTypes.map((type) => ({
            sourceId: type.sourceId,
            targetId: prefixedId("typ"),
          }));
          await tx.event.create({
            data: {
              ...event.data,
              id: targetId,
              ownerId,
              ticketTypes: {
                create: event.ticketTypes.map(({ sourceId, ...type }, i) => ({
                  ...type,
                  id: ticketTypes[i].targetId,
                })),
              },
            },
          });
          await tx.eventImport.create({
            data: { ...key, eventId: targetId, ticketTypeMapping: ticketTypes },
          });
          return { status: "imported" as const, targetId, ticketTypes };
        });
        Object.assign(result, outcome);
      }
    } catch (error) {
      // Do not expose ORM errors, connection strings or raw archive contents.
      result.error =
        error instanceof BadRequestException
          ? error.message
          : "Import failed. Check database availability and the event-import schema upgrade, then retry.";
    }
    records.push(result);
  }
  const counts = {
    total: records.length,
    valid: 0,
    imported: 0,
    skipped: 0,
    failed: 0,
  };
  for (const record of records) counts[record.status]++;
  return {
    archiveId,
    dryRun,
    counts,
    records,
    summary: `${counts.total} events: ${counts.valid} valid, ${counts.imported} imported, ${counts.skipped} skipped, ${counts.failed} failed.`,
  };
}
