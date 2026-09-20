import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { test } from "node:test";
import { File } from "node:buffer";
import { strToU8, zipSync } from "fflate";
import {
  createEventBundle,
  readEventArchive,
} from "../archive-bundle.ts";

function archive(thumbnailUrl: string | null = null) {
  return {
    events: [{ sourceId: "evt_source", name: "Portable event", thumbnailUrl }],
    manifest: { archiveId: `sha256:${"a".repeat(64)}` },
  };
}

function bundle(entries: Record<string, Uint8Array>) {
  return new File([zipSync(entries)], "events.zip", {
    type: "application/zip",
  });
}

test("complete bundles preserve and verify referenced artwork", async () => {
  const source = archive("data:image/png;base64,AQID");
  const exported = await createEventBundle(source);
  const imported = await readEventArchive(
    new File([await exported.blob.arrayBuffer()], "events.zip", {
      type: "application/zip",
    }),
  );

  assert.equal(exported.mediaCount, 1);
  assert.deepEqual(imported.archive, source);
  assert.equal(imported.media[0].sourceId, "evt_source");
  assert.deepEqual([...imported.media[0].bytes], [1, 2, 3]);
  assert.equal(
    imported.media[0].sha256,
    createHash("sha256")
      .update(Buffer.from([1, 2, 3]))
      .digest("hex"),
  );
});

test("bundle import rejects unsafe ZIP paths before extraction", async () => {
  const source = archive();
  const manifest = {
    format: "passmint-event-bundle",
    version: 1,
    archiveId: source.manifest.archiveId,
    files: [],
  };

  await assert.rejects(
    readEventArchive(
      bundle({
        "archive.json": strToU8(JSON.stringify(source)),
        "media-manifest.json": strToU8(JSON.stringify(manifest)),
        "../outside.txt": strToU8("unsafe"),
      }),
    ),
    /could not be read/,
  );
});

test("bundle import rejects artwork with a mismatched digest", async () => {
  const source = archive("https://images.example.com/event.webp");
  const manifest = {
    format: "passmint-event-bundle",
    version: 1,
    archiveId: source.manifest.archiveId,
    files: [
      {
        sourceId: "evt_source",
        path: "media/0001.webp",
        contentType: "image/webp",
        size: 3,
        sha256: "0".repeat(64),
      },
    ],
  };

  await assert.rejects(
    readEventArchive(
      bundle({
        "archive.json": strToU8(JSON.stringify(source)),
        "media-manifest.json": strToU8(JSON.stringify(manifest)),
        "media/0001.webp": new Uint8Array([1, 2, 3]),
      }),
    ),
    /integrity check failed/,
  );
});
