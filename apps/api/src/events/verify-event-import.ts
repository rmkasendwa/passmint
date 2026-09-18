import { Prisma } from "@prisma/client";
import { PrismaService } from "../prisma/prisma.service";
import { canonicalJson } from "./event-archive";
import { validateArchiveEvent } from "./import-archive-validation";

type Definition = ReturnType<typeof validateArchiveEvent>;
const eventFields = [
  "name",
  "description",
  "venue",
  "mapLocation",
  "startsAt",
  "capacity",
  "priceCents",
  "booking",
  "status",
  "publishAt",
  "cancelledAt",
  "thumbnailUrl",
] as const;
const typeFields = [
  "name",
  "priceCents",
  "capacity",
  "maxPerOrder",
  "salesStart",
  "salesEnd",
] as const;
const normalize = (value: unknown) =>
  value === Prisma.DbNull
    ? null
    : value instanceof Date
      ? value.toISOString()
      : value;
const equal = (a: unknown, b: unknown) =>
  canonicalJson(normalize(a)) === canonicalJson(normalize(b));
const lifecycle = (event: { status: string; publishAt: Date | null }) =>
  event.status === "draft" && event.publishAt ? "scheduled" : event.status;

export type ImportVerification = {
  status: "match" | "mismatch" | "not_imported" | "not_checked" | "unavailable";
  expectedStatus: string | null;
  actualStatus: string | null;
  checks: Record<string, boolean | null>;
  categories: {
    expected: number | null;
    actual: number | null;
    matches: boolean | null;
  };
  ticketTypes: {
    sourceId: string;
    targetId: string | null;
    matches: boolean;
  }[];
  media: "not_checked" | "absent" | "reference_preserved" | "changed";
};

export function uncheckedImport(definition?: Definition): ImportVerification {
  return {
    status: "not_checked",
    expectedStatus: definition ? lifecycle(definition.data) : null,
    actualStatus: null,
    checks: Object.fromEntries(
      [...eventFields, "ownerId"].map((field) => [field, null]),
    ),
    categories: {
      expected: definition?.ticketTypes.length ?? null,
      actual: null,
      matches: null,
    },
    ticketTypes: [],
    media: "not_checked",
  };
}

export async function verifyEventImport(
  prisma: PrismaService,
  definition: Definition,
  targetId: string,
  ownerId: string,
  mappings: { sourceId: string; targetId: string }[],
): Promise<ImportVerification> {
  const report = uncheckedImport(definition);
  // Read after commit, including on a skipped retry: the receipt alone cannot
  // establish whether an event or category was subsequently edited or removed.
  const target = await prisma.event.findFirst({
    where: { id: targetId, ownerId },
    select: {
      name: true,
      description: true,
      venue: true,
      mapLocation: true,
      startsAt: true,
      capacity: true,
      priceCents: true,
      booking: true,
      status: true,
      publishAt: true,
      cancelledAt: true,
      thumbnailUrl: true,
      ownerId: true,
      ticketTypes: {
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
    },
  });
  if (!target) return { ...report, status: "unavailable" };
  report.actualStatus = lifecycle(target);
  for (const field of eventFields)
    report.checks[field] = equal(definition.data[field], target[field]);
  report.checks.ownerId = target.ownerId === ownerId;
  report.ticketTypes = definition.ticketTypes.map((source) => {
    const targetTypeId =
      mappings.find((mapping) => mapping.sourceId === source.sourceId)
        ?.targetId ?? null;
    const category = target.ticketTypes.find(
      (type) => type.id === targetTypeId,
    );
    return {
      sourceId: source.sourceId,
      targetId: targetTypeId,
      matches:
        !!category &&
        typeFields.every((field) => equal(source[field], category[field])),
    };
  });
  report.categories.actual = target.ticketTypes.length;
  report.categories.matches =
    target.ticketTypes.length === definition.ticketTypes.length &&
    report.ticketTypes.every((type) => type.matches);
  report.media = report.checks.thumbnailUrl
    ? target.thumbnailUrl
      ? "reference_preserved"
      : "absent"
    : "changed";
  report.status =
    Object.values(report.checks).every((value) => value === true) &&
    report.categories.matches
      ? "match"
      : "mismatch";
  return report;
}

export function summarizeVerification(
  records: { verification: ImportVerification }[],
) {
  const counts = {
    matched: 0,
    mismatched: 0,
    unavailable: 0,
    notImported: 0,
    notChecked: 0,
  };
  const expectedByStatus: Record<string, number> = {
    draft: 0,
    published: 0,
    scheduled: 0,
    cancelled: 0,
  };
  const actualByStatus: Record<string, number> = { ...expectedByStatus };
  const categories = { expected: 0, actual: 0 };
  const key = {
    match: "matched",
    mismatch: "mismatched",
    unavailable: "unavailable",
    not_imported: "notImported",
    not_checked: "notChecked",
  } as const;
  for (const { verification: report } of records) {
    counts[key[report.status]]++;
    if (report.expectedStatus)
      expectedByStatus[report.expectedStatus] =
        (expectedByStatus[report.expectedStatus] ?? 0) + 1;
    if (report.actualStatus)
      actualByStatus[report.actualStatus] =
        (actualByStatus[report.actualStatus] ?? 0) + 1;
    categories.expected += report.categories.expected ?? 0;
    categories.actual += report.categories.actual ?? 0;
  }
  return {
    version: 1,
    ...counts,
    expectedByStatus,
    actualByStatus,
    categories,
  };
}
