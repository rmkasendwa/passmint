import { strFromU8, strToU8, unzip, zip } from "fflate";

const MAX_IMAGE_BYTES = 5 * 1024 * 1024;
const MAX_BUNDLE_BYTES = 100 * 1024 * 1024;
const MAX_FILES = 1002;
const imageTypes = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
]);

type ArchiveEvent = {
  sourceId: string;
  name?: string;
  thumbnailUrl?: string | null;
};

type BundleMediaEntry = {
  sourceId: string;
  path: string;
  contentType: string;
  size: number;
  sha256: string;
};

type BundleManifest = {
  format: "passmint-event-bundle";
  version: 1;
  archiveId: string;
  files: BundleMediaEntry[];
};

export type ImportedBundle = {
  archive: Record<string, unknown>;
  media: Array<BundleMediaEntry & { bytes: Uint8Array }>;
};

function archiveEvents(archive: Record<string, unknown>): ArchiveEvent[] {
  if (!Array.isArray(archive.events))
    throw new Error("Archive events are missing.");
  return archive.events.map((value) => {
    if (!value || typeof value !== "object" || Array.isArray(value)) {
      throw new Error("Archive contains an invalid event.");
    }
    const event = value as Record<string, unknown>;
    if (typeof event.sourceId !== "string" || !event.sourceId) {
      throw new Error("Archive event source ID is missing.");
    }
    if (
      event.thumbnailUrl !== null &&
      event.thumbnailUrl !== undefined &&
      typeof event.thumbnailUrl !== "string"
    ) {
      throw new Error(`Artwork reference is invalid for ${event.sourceId}.`);
    }
    return event as ArchiveEvent;
  });
}

function archiveId(archive: Record<string, unknown>) {
  const manifest = archive.manifest;
  if (!manifest || typeof manifest !== "object" || Array.isArray(manifest))
    throw new Error("Archive manifest is missing.");
  const value = (manifest as Record<string, unknown>).archiveId;
  if (typeof value !== "string" || !/^sha256:[a-f0-9]{64}$/.test(value))
    throw new Error("Archive ID is invalid.");
  return value;
}

function normalizeContentType(value: string) {
  const contentType = value.split(";", 1)[0].trim().toLowerCase();
  if (!imageTypes.has(contentType))
    throw new Error("Artwork must be JPEG, PNG, WebP, or GIF.");
  return contentType;
}

function extension(contentType: string) {
  return {
    "image/jpeg": "jpg",
    "image/png": "png",
    "image/webp": "webp",
    "image/gif": "gif",
  }[contentType]!;
}

async function sha256(bytes: Uint8Array) {
  const digest = await crypto.subtle.digest("SHA-256", bytes as BufferSource);
  return Array.from(new Uint8Array(digest), (byte) =>
    byte.toString(16).padStart(2, "0"),
  ).join("");
}

function zipFiles(files: Record<string, Uint8Array>) {
  return new Promise<Uint8Array>((resolve, reject) => {
    zip(files, { level: 6 }, (error, data) =>
      error ? reject(error) : resolve(data),
    );
  });
}

function unzipFiles(data: Uint8Array) {
  return new Promise<Record<string, Uint8Array>>((resolve, reject) => {
    const paths = new Set<string>();
    let totalSize = 0;
    unzip(
      data,
      {
        filter: (file) => {
          if (paths.has(file.name) || !validatePath(file.name))
            throw new Error("Unsafe ZIP entry.");
          paths.add(file.name);
          totalSize += file.originalSize;
          const maximum =
            file.name === "archive.json"
              ? 6 * 1024 * 1024
              : file.name === "media-manifest.json"
                ? 1024 * 1024
                : MAX_IMAGE_BYTES;
          if (
            paths.size > MAX_FILES ||
            file.originalSize < 0 ||
            file.originalSize > maximum ||
            totalSize > MAX_BUNDLE_BYTES
          ) {
            throw new Error("ZIP contents exceed the allowed size.");
          }
          return true;
        },
      },
      (error, files) => (error ? reject(error) : resolve(files)),
    );
  });
}

export async function createEventBundle(archive: Record<string, unknown>) {
  const files: Record<string, Uint8Array> = {
    "archive.json": strToU8(JSON.stringify(archive, null, 2)),
  };
  const media: BundleMediaEntry[] = [];
  const events = archiveEvents(archive);
  let mediaBytes = 0;

  for (const [index, event] of events.entries()) {
    if (!event.thumbnailUrl) continue;
    let response: Response;
    try {
      response = await fetch(event.thumbnailUrl, {
        cache: "no-store",
        credentials: "same-origin",
      });
    } catch {
      throw new Error(
        `Could not download artwork for ${event.name || event.sourceId}. The image host may block portable exports.`,
      );
    }
    if (!response.ok) {
      throw new Error(
        `Could not download artwork for ${event.name || event.sourceId} (HTTP ${response.status}).`,
      );
    }
    const contentType = normalizeContentType(
      response.headers.get("content-type") ?? "",
    );
    const declaredSize = Number(response.headers.get("content-length"));
    if (Number.isFinite(declaredSize) && declaredSize > MAX_IMAGE_BYTES) {
      throw new Error(
        `Artwork for ${event.name || event.sourceId} exceeds 5 MB.`,
      );
    }
    const bytes = new Uint8Array(await response.arrayBuffer());
    if (!bytes.length || bytes.length > MAX_IMAGE_BYTES) {
      throw new Error(
        `Artwork for ${event.name || event.sourceId} must be between 1 byte and 5 MB.`,
      );
    }
    mediaBytes += bytes.length;
    if (mediaBytes > MAX_BUNDLE_BYTES)
      throw new Error(
        "Complete archive exceeds the 100 MB browser limit. Export fewer events.",
      );
    const path = `media/${String(index + 1).padStart(4, "0")}.${extension(contentType)}`;
    files[path] = bytes;
    media.push({
      sourceId: event.sourceId,
      path,
      contentType,
      size: bytes.length,
      sha256: await sha256(bytes),
    });
  }

  const manifest: BundleManifest = {
    format: "passmint-event-bundle",
    version: 1,
    archiveId: archiveId(archive),
    files: media,
  };
  files["media-manifest.json"] = strToU8(JSON.stringify(manifest, null, 2));
  const bytes = await zipFiles(files);
  if (bytes.length > MAX_BUNDLE_BYTES)
    throw new Error(
      "Complete archive exceeds the 100 MB browser limit. Export fewer events.",
    );
  return {
    blob: new Blob([bytes as BlobPart], { type: "application/zip" }),
    mediaCount: media.length,
  };
}

function parseObject(bytes: Uint8Array, label: string) {
  try {
    const value = JSON.parse(strFromU8(bytes));
    if (!value || typeof value !== "object" || Array.isArray(value))
      throw new Error();
    return value as Record<string, unknown>;
  } catch {
    throw new Error(`${label} is not valid JSON.`);
  }
}

function validatePath(path: string) {
  return (
    path === "archive.json" ||
    path === "media-manifest.json" ||
    /^media\/\d{4}\.(?:jpg|png|webp|gif)$/.test(path)
  );
}

export async function readEventArchive(file: File): Promise<ImportedBundle> {
  if (file.size > MAX_BUNDLE_BYTES)
    throw new Error("Archive exceeds the 100 MB browser limit.");
  if (file.name.toLowerCase().endsWith(".json")) {
    const archive = parseObject(
      new Uint8Array(await file.arrayBuffer()),
      "Archive",
    );
    archiveEvents(archive);
    return { archive, media: [] };
  }
  if (!file.name.toLowerCase().endsWith(".zip"))
    throw new Error("Choose a Passmint ZIP or JSON archive.");

  let files: Record<string, Uint8Array>;
  try {
    files = await unzipFiles(new Uint8Array(await file.arrayBuffer()));
  } catch {
    throw new Error("The ZIP archive could not be read.");
  }
  const paths = Object.keys(files);
  if (paths.length > MAX_FILES || paths.some((path) => !validatePath(path))) {
    throw new Error("The ZIP contains unexpected or unsafe files.");
  }
  if (!files["archive.json"] || !files["media-manifest.json"]) {
    throw new Error("The ZIP is missing archive.json or media-manifest.json.");
  }
  const archive = parseObject(files["archive.json"], "archive.json");
  const events = archiveEvents(archive);
  const expectedMedia = new Set(
    events.filter((event) => event.thumbnailUrl).map((event) => event.sourceId),
  );
  const sourceIds = new Set(events.map((event) => event.sourceId));
  const manifest = parseObject(
    files["media-manifest.json"],
    "media-manifest.json",
  );
  if (
    manifest.format !== "passmint-event-bundle" ||
    manifest.version !== 1 ||
    manifest.archiveId !== archiveId(archive) ||
    !Array.isArray(manifest.files)
  ) {
    throw new Error("Unsupported Passmint bundle manifest.");
  }
  const seenSources = new Set<string>();
  const seenPaths = new Set<string>();
  const media: ImportedBundle["media"] = [];
  for (const value of manifest.files) {
    if (!value || typeof value !== "object" || Array.isArray(value))
      throw new Error("Bundle media entry is invalid.");
    const entry = value as Record<string, unknown>;
    if (
      typeof entry.sourceId !== "string" ||
      !sourceIds.has(entry.sourceId) ||
      seenSources.has(entry.sourceId) ||
      typeof entry.path !== "string" ||
      !/^media\/\d{4}\.(?:jpg|png|webp|gif)$/.test(entry.path) ||
      seenPaths.has(entry.path) ||
      typeof entry.contentType !== "string" ||
      !imageTypes.has(entry.contentType) ||
      entry.path.split(".").at(-1) !== extension(entry.contentType) ||
      !Number.isSafeInteger(entry.size) ||
      Number(entry.size) < 1 ||
      Number(entry.size) > MAX_IMAGE_BYTES ||
      typeof entry.sha256 !== "string" ||
      !/^[a-f0-9]{64}$/.test(entry.sha256)
    )
      throw new Error("Bundle media entry is invalid.");
    const bytes = files[entry.path];
    if (
      !bytes ||
      bytes.length !== entry.size ||
      (await sha256(bytes)) !== entry.sha256
    ) {
      throw new Error(`Artwork integrity check failed for ${entry.sourceId}.`);
    }
    seenSources.add(entry.sourceId);
    seenPaths.add(entry.path);
    media.push({ ...(entry as unknown as BundleMediaEntry), bytes });
  }
  if (paths.some((path) => path.startsWith("media/") && !seenPaths.has(path))) {
    throw new Error("The ZIP contains artwork not declared in its manifest.");
  }
  if (
    seenSources.size !== expectedMedia.size ||
    [...expectedMedia].some((sourceId) => !seenSources.has(sourceId))
  ) {
    throw new Error("The ZIP does not contain every referenced artwork file.");
  }
  return { archive, media };
}

export function imageDataUrl(bytes: Uint8Array, contentType: string) {
  let binary = "";
  const chunkSize = 0x8000;
  for (let offset = 0; offset < bytes.length; offset += chunkSize) {
    binary += String.fromCharCode(
      ...bytes.subarray(offset, offset + chunkSize),
    );
  }
  return `data:${contentType};base64,${btoa(binary)}`;
}
