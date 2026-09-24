import { randomUUID } from "crypto";

export type EntityIdPrefix =
  | "evt"
  | "tkt"
  | "usr"
  | "typ"
  | "act"
  | "ord"
  | "pm"
  | "pay"
  | "momo"
  | "dlv"
  | "rec";

export function prefixedId(prefix: EntityIdPrefix) {
  return `${prefix}_${randomUUID().replaceAll("-", "")}`;
}
