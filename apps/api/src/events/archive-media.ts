import { BadRequestException } from "@nestjs/common";

export function mediaMode(
  url: string | null,
): "external" | "local" | "omitted" {
  if (!url) return "omitted";
  try {
    const parsed = new URL(url);
    const host = parsed.hostname.toLowerCase();
    if (!["https:", "http:"].includes(parsed.protocol)) return "local";
    if (
      host === "localhost" ||
      host.endsWith(".localhost") ||
      host.endsWith(".local") ||
      !host.includes(".") ||
      host.startsWith("[") ||
      /^\d+\.\d+\.\d+\.\d+$/.test(host)
    )
      return "local";
    return "external";
  } catch {
    return "local";
  }
}

export function validateThumbnailOverrides(
  input: unknown,
  sourceIds: string[],
): Record<string, unknown> {
  if (input === undefined) return {};
  if (!input || typeof input !== "object" || Array.isArray(input))
    throw new BadRequestException(
      "thumbnailOverrides must map source event IDs to target URLs or null.",
    );
  if (Object.keys(input).some((id) => !sourceIds.includes(id)))
    throw new BadRequestException(
      "thumbnailOverrides contains an event not in this archive.",
    );
  return input as Record<string, unknown>;
}

export function thumbnailOverride(value: unknown): string | null {
  if (value === null) return null;
  if (
    typeof value !== "string" ||
    !value ||
    value.length > 2500000 ||
    /[\s\\]/.test(value)
  )
    throw new BadRequestException(
      "Thumbnail override must be an HTTP(S) URL, target upload path, or null.",
    );
  if (/^\/(?:api\/)?uploads\/event-images\/[\w/-]+\.webp$/.test(value))
    return value;
  try {
    const url = new URL(value);
    if (
      ["http:", "https:"].includes(url.protocol) &&
      !url.username &&
      !url.password
    )
      return value;
  } catch {
    /* Report one safe validation message. */
  }
  throw new BadRequestException(
    "Thumbnail override must be an HTTP(S) URL, target upload path, or null.",
  );
}
