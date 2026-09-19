# Portable event archives

The export/import endpoints, operator CLI and verification reports implement
issues #78, #79, #80, #81 and #82. Artwork uses reference-only export with explicit
target uploads and URL mappings; automatic bucket copying is not supported.
These endpoints move event definitions, not issued tickets or customers.

## Admin interface

Platform administrators can open `/admin` to download an export or select an
archive for import. Selecting a file keeps it in the browser and does not start
an import. The interface requires a successful dry run before enabling the write
operation and displays the latest validation/import counts. Authenticated
non-admin users receive a not-found page for this route; API authorization remains
the security boundary.

The browser and CLI use the same versioned archive endpoints and validation logic.
The current version 1 format remains definition-only and reference-only for media;
do not describe it as fully self-contained until the package/media work is complete.

## Operator CLI

From a repository checkout with Node.js 22+, use `pnpm events:archive` (or
`node scripts/event-archives.mjs` without pnpm). It calls the supported API;
it does not access a database or load `.env` files. Register/log in normally on
each deployment and supply its session token through the shell environment.

PowerShell example, after setting `PASSMINT_SOURCE_TOKEN` and
`PASSMINT_TARGET_TOKEN` to the respective session tokens:

```powershell
# Omit --event-id to export all events accessible to this account.
pnpm events:archive export --api-url http://localhost:3000 --token-env PASSMINT_SOURCE_TOKEN --file events.json --source-environment local --event-id evt_first --event-id evt_second
pnpm events:archive import --api-url https://your-domain/api --token-env PASSMINT_TARGET_TOKEN --file events.json --target-owner-id usr_target --report dry-run.json
# Review dry-run.json and its warnings before applying.
pnpm events:archive import --api-url https://your-domain/api --token-env PASSMINT_TARGET_TOKEN --file events.json --target-owner-id usr_target --apply --report import-result.json
```

`--api-url` is the API **base**, including `/api` for same-origin production.
Trailing slashes work. Credentials, query parameters and fragments in this URL
are rejected, and redirects are not followed. Use the final HTTPS URL directly.

- Common: `--api-url`, `--file`, `--token-env` (defaults to `PASSMINT_TOKEN`), `--help`.
- Export: repeat `--event-id` to select events; `--owner-id` filters the source
  owner; `--source-environment` labels the archive.
- Import: `--dry-run` is the default; only `--apply` writes. `--target-owner-id`
  explicitly remaps all records; omit it for email-based ownership matching.
  `--on-duplicate skip|error` defaults to `skip`. `--thumbnail-map media.json`
  supplies source event IDs mapped to uploaded target URLs or null. `--report` saves the complete
  machine-readable import response, including warnings and ID mappings.

The command prints counts, per-record failures/warnings, and generated event and
category IDs. Exit code `0` means success, `1` means a command/network/API/file
error, and `2` means the API reported per-record failures, verification mismatches,
or unavailable target verification (even though HTTP returned 200). Review the
saved report on partial failures. Reports include a target-state comparison at
the time of the request; they do not guarantee that targets remain unchanged later.

Archive input and API responses are bounded at 6 MiB. Files and responses are read
in bounded chunks, then parsed in memory; expect several times the file size in
memory for buffers, parsed objects and request serialization. Use smaller exports
for large catalogs or image data URLs. Requests time out after 120 seconds. A lost
response can follow a committed import: retry the **same** archive and owner
mapping with a new report filename, allowing duplicate detection to recover.

Output files are created exclusively and never overwrite existing files. A report
filename is reserved before any import request, so a path/permission error is
detected before mutation. New files request owner-only permissions where the OS
supports them; on Windows, restrict the containing folder's ACL. Failed operations
can leave empty/incomplete output files: inspect them and choose a new filename
on retry. The original input archive is never rewritten. Bearer tokens are never
printed, and raw HTTP error bodies are not echoed.

Apply the [schema upgrade](#schema-setup-for-an-existing-target) first on existing
targets. Media is still reference-only; inspect thumbnail warnings before applying.

## Export

`POST /events/archives/export` requires a bearer token and returns HTTP 200 with
JSON, `Cache-Control: no-store`, and attachment filename `passmint-events.json`.
For the same-origin production web endpoint, use `/api/events/archives/export`.

The JSON request accepts these optional fields:

| Field               | Meaning                                                                                                                                       |
| ------------------- | --------------------------------------------------------------------------------------------------------------------------------------------- |
| `eventIds`          | 1–1000 unique source event IDs. Omit to export all accessible events.                                                                         |
| `ownerId`           | Filter by source owner ID. Ordinary users may specify only their own ID. Admins may select any owner.                                         |
| `sourceEnvironment` | Operator-provided label of up to 100 characters, such as `local`. Omission produces `null`. Use a label, never a connection string or secret. |

Ordinary users export only their own events, including their drafts. Admins can
export across owners, including unowned events, but **other owners' drafts remain
private**, matching existing event-read rules. An admin's own drafts are included.
Owner and event filters intersect. A selection containing any missing, inaccessible,
or filtered-out event fails entirely with 404 without identifying the offending ID.
An empty accessible scope returns a valid archive with zero counts.

Requests with unknown fields, null options, malformed selections or more than
1000 IDs return 400. Results exceeding 1000 events or 6 MiB of compact UTF-8 JSON
also return 400; select smaller batches instead. Exports are assembled in memory,
not streamed. Very large descriptions or inline thumbnails can require smaller
batches. Export is read-only and does not change publication state.

PowerShell example (set `PASSMINT_TOKEN` to your authenticated source session token):

```powershell
$headers = @{ Authorization = "Bearer $env:PASSMINT_TOKEN" }
$body = @{ sourceEnvironment = 'local'; eventIds = @('evt_first', 'evt_second') } | ConvertTo-Json
Invoke-WebRequest -Uri 'http://localhost:3000/events/archives/export' -Method Post -Headers $headers -ContentType 'application/json' -Body $body -OutFile './passmint-events.json'
```

Keep the archive private: it contains organizer names and email addresses as
ownership context. Review event text and image references before sharing.

## Version 1 contract

Top-level fields are `schemaVersion` (integer `1`), `sourceEnvironment` (string or
null), `events` (array), and `manifest` (object).

Each event includes `sourceId`, `name`, `description`, `venue`, `mapLocation`,
`startsAt`, `capacity`, `priceCents`, `thumbnailUrl`, `status`, `publishAt`,
`cancelledAt`, `booking`, `createdAt`, `updatedAt`, `owner`, and `ticketTypes`.
Source IDs are provenance, not instructions to reuse IDs in another deployment.
All timestamps are UTC ISO 8601 strings with milliseconds; optional timestamps
are null. Unlimited capacity is null. Lifecycle status is preserved as stored,
including draft, scheduled, published and cancelled; exporting does not publish
overdue scheduled events. Incomplete drafts remain incomplete.

`owner` is null for unowned events, otherwise `{ sourceId, email, name }`.
Each ticket type contains `sourceId`, `name`, `priceCents`, `capacity`,
`maxPerOrder`, `salesStart`, and `salesEnd`. Events and ticket types are sorted by
source ID. `booking` is null or the supported booking definition (`kind`, optional
`destination`, `service`, `durationMinutes`, and `seating` with `rows`, `columns`,
`aisleAfter`, `blocked`). Unsupported booking properties are stripped; invalid
stored booking definitions fail validation with 400 and must be corrected before
export. There are no occupied-seat or ticket inventory snapshots.

The manifest contains:

- `application`: `passmint` (no build version is currently supplied).
- `exportedAt`: UTC export timestamp.
- `counts`: `{ events, ticketTypes }` totals.
- `checksum`: `{ algorithm: "sha256", value: "<lowercase hex digest>" }`.
- `archiveId`: `sha256:<same digest>`.

The checksum covers only `{ schemaVersion, sourceEnvironment, events }`. Recursively
sort object keys in JavaScript string sort order, preserve array order, serialize
as compact JSON without whitespace using JSON string escaping, and hash its UTF-8
bytes. The response uses this same key ordering. Export time is excluded so identical
definitions and source labels have identical archive IDs across exports. Changing
definitions, provenance timestamps, ownership context or the source label changes
identity. A checksum detects content changes; it is not a signature or authorization.

No tickets, ticket codes, QR payloads, buyers, scan activity, password hashes,
auth tokens, database configuration or object-storage configuration are selected.
Event text is user-authored content, so the exporter is not a secret scrubber for
text pasted into event fields. Images are currently references only: `thumbnailUrl`
is preserved for URL references, no remote URL is fetched, and no image bytes are
transferred. Embedded data URLs are omitted (set to null). Local `/uploads` and
localhost/object-storage references may not work on the target. See the artwork
workflow below to upload replacement images and map their target URLs.

## Import into another deployment

`POST /events/archives/import` (production: `/api/events/archives/import`) requires
a bearer token and accepts `{ archive, dryRun, targetOwnerId, onDuplicate }`.

| Field           | Meaning                                                                                                                                                                             |
| --------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `archive`       | Required, complete version 1 JSON archive from the export endpoint.                                                                                                                 |
| `dryRun`        | Boolean, defaults to **true**. Only explicit `false` writes events.                                                                                                                 |
| `targetOwnerId` | Optional existing target account ID. Explicitly remaps **all** archive events to that owner. Ordinary users may specify only their own ID; admins may specify any existing account. |
| `onDuplicate`   | `skip` (default) or `error`. Existing records are never overwritten.                                                                                                                |

Without `targetOwnerId`, owners are matched by trimmed, lowercase email, never by
source database ID. Ordinary users may import only records matching their own
email; admins can match multiple existing owners. Missing or unowned source
owners fail per record unless explicitly remapped. Create target accounts through
normal registration first. Import never creates accounts, passwords or roles.
An admin importing another owner's draft cannot subsequently view that draft
through ordinary event reads; it remains private to its assigned owner.

Archives must fit within 6 MiB of compact JSON and 1000 events (20 categories per
event). The complete request must also fit the API/proxy request body limit of
7 MiB. Unsupported versions, mismatched checksums/counts, duplicate source event
IDs and malformed envelopes return 400 before any writes. Unauthorized target
ownership returns 403; an explicit nonexistent target owner returns 404.
The checksum is an integrity check, not a trust or authorization mechanism.

Every record is validated, including booking/seat capacity, category limits,
integer ranges, unique category names and IDs, sale windows, and publication
state. Unsupported fields are rejected rather than copied into the database.
Past event dates and past ticket sale windows are retained. Scheduled drafts must
have a **future** publication time before the start time; expired schedules fail
instead of immediately publishing. Version 1 `scheduled` status is accepted and
mapped to the application's actual representation, `draft` with `publishAt`.
Cancelled events retain `cancelledAt`; other statuses cannot carry it. Incomplete
unscheduled drafts are allowed. No date or sale window is shifted automatically.

### Schema setup for an existing target

Import adds the `event_imports` table for persistent duplicate detection and source
to target mappings. A brand-new empty database receives it during normal schema
initialization. **Already deployed databases need an explicit upgrade**; startup
skips schema changes when any tables exist.

Back up and rehearse on a copy, then run the additive
[`20260918-event-imports.sql`](../prisma/upgrades/20260918-event-imports.sql) once
against the application's database/schema before enabling import. It creates one
table, two foreign keys and a unique index; it does not alter retained events or
tickets. The SQL is transactional and deliberately errors if already applied.
The runtime image contains this file. From its `/app` directory, with the target
`DATABASE_URL` configured, an operator can run:

```sh
node node_modules/prisma/build/index.js db execute --schema prisma/schema.prisma --file prisma/upgrades/20260918-event-imports.sql
```

Use the same schema/search path as the application. This repository still uses
explicit schema setup rather than a Prisma migration history; do not run
`migrate reset`. Local development can use the existing `pnpm run db:push` workflow.
No schema upgrade is performed by the import endpoint.

### Dry run, review, then import

PowerShell example with the **target** session token and existing target owner ID:

```powershell
$headers = @{ Authorization = "Bearer $env:PASSMINT_TARGET_TOKEN" }
$archive = Get-Content -Raw './passmint-events.json' | ConvertFrom-Json
$request = @{ archive = $archive; dryRun = $true; targetOwnerId = 'usr_target_owner'; onDuplicate = 'skip' }
$body = $request | ConvertTo-Json -Depth 20 -Compress
$report = Invoke-RestMethod -Uri 'https://your-domain/api/events/archives/import' -Method Post -Headers $headers -ContentType 'application/json; charset=utf-8' -Body ([Text.Encoding]::UTF8.GetBytes($body))
$report | ConvertTo-Json -Depth 20 | Set-Content './import-dry-run.json'
$report.summary
# Review all failures and warnings in import-dry-run.json before running this part.
$request.dryRun = $false
$body = $request | ConvertTo-Json -Depth 20 -Compress
$report = Invoke-RestMethod -Uri 'https://your-domain/api/events/archives/import' -Method Post -Headers $headers -ContentType 'application/json; charset=utf-8' -Body ([Text.Encoding]::UTF8.GetBytes($body))
$report | ConvertTo-Json -Depth 20 | Set-Content './import-result.json'
$report.summary
```

HTTP 200 returns `{ archiveId, dryRun, counts, records, verification, summary }`, **including when
individual records fail**. Check `counts.failed` and each record; HTTP success
alone does not mean the entire archive was imported. Counts include `total`,
`valid` (dry run only), `imported`, `skipped`, and `failed`. Each record includes
`sourceId`, `status`, `warnings`, and, after owner resolution, `targetOwnerId`.
Successful imports and skips also return `targetId` and `ticketTypes` mappings
of `{ sourceId, targetId }`. Failures include a safe `error` string. A valid dry
run allocates no target IDs and writes no events, categories or import records.

All imported events/categories get new prefixed IDs. Target creation/update
timestamps reflect the import time; retain the archive for original provenance.
Artwork URLs are preserved unless explicitly overridden, with a warning: uploads
and localhost URLs do not become portable merely because definitions import
successfully. Use shared public storage or the upload-and-map workflow below.

## Artwork portability

The default is **reference-only**. New exports include optional `manifest.media`
entries `{ sourceId, mode, strategy: "reference-only" }` for every event. `mode`
is `external` for HTTP(S) hostname URLs, `local` for relative URLs, localhost,
single-label hosts, `.local` names and IP literals, or `omitted` for no thumbnail.
IP literals are conservatively marked local even when publicly routed. This is a
classification, not a connectivity or licensing check. Embedded data URLs are
omitted on export: save their original image separately before migration.

Media metadata is advisory and excluded from the content checksum; import derives
the source classification from the actual event URL. Old version 1 archives without
media entries are still accepted. Deploy this release to both exporter and importer:
older importers reject the new optional manifest field. Legacy archives containing
inline data URLs need an explicit override or null; importing raw inline image
bytes without upload validation is rejected. Bundled/inline-transfer manifest modes
are unsupported and fail per event without creating its event or categories.

For S3-compatible target storage, configure the existing `S3_BUCKET`, `S3_REGION`,
access-key/secret settings and optional endpoint/public base URL in the target
environment before uploading. Ensure its public image URLs are reachable by users.
For local target uploads, mount persistent `/app/uploads` storage. No storage
credentials belong in an archive or mapping file. Reference-preserved source
storage must remain available after cutover.

Use the target's existing `POST /events/uploads` endpoint (production:
`/api/events/uploads`) to upload files you obtained from the source. It enforces
the configured byte limit (5 MiB by default), supported JPEG/PNG/WebP/GIF types,
40-megapixel input limit, orientation correction, a maximum 1920-pixel side, and
metadata-free WebP conversion. The import endpoint never fetches arbitrary URLs
or copies image bytes itself. Example for one original PNG:

```powershell
$bytes = [IO.File]::ReadAllBytes((Resolve-Path './banner.png'))
$image = @{ fileName = 'banner.png'; contentType = 'image/png'; dataUrl = 'data:image/png;base64,' + [Convert]::ToBase64String($bytes) } | ConvertTo-Json -Compress
$headers = @{ Authorization = "Bearer $env:PASSMINT_TARGET_TOKEN" }
$uploaded = Invoke-RestMethod -Uri 'https://your-domain/api/events/uploads' -Method Post -Headers $headers -ContentType 'application/json' -Body $image
@{ evt_source = $uploaded.url } | ConvertTo-Json | Set-Content -Encoding utf8 './media.json'
pnpm events:archive import --api-url https://your-domain/api --token-env PASSMINT_TARGET_TOKEN --file events.json --thumbnail-map media.json --target-owner-id usr_target --report media-dry-run.json
# After reviewing the report, repeat with --apply and a new report filename.
```

Direct API requests pass the same object as `thumbnailOverrides`. Keys must be
source event IDs in the archive; values must be HTTP(S) URLs without embedded
credentials, target `/uploads/event-images/...webp` or `/api/uploads/event-images/...webp`
paths, or null to omit artwork. Invalid values fail only their event; unknown keys
reject the request before writes. External URLs are preserved without fetching or
validating their remote contents, so use the upload endpoint when importing bytes.

Per-record `media` reports `sourceMode` and `action` (`preserved`, `rewritten` or
`omitted`). Verification compares the **effective mapped URL**, while still leaving
actual image availability unchecked. Keep the same archive, owner mapping **and
thumbnail map** on retries. Overrides do not change archive identity: an already
imported duplicate is never rewritten, and a different override appears as a
verification mismatch. Decide image mappings before the first real import.
Uploads occur separately from the database transaction; a failed event import can
leave an unused uploaded object. Retain and reuse its URL on retry; clean up unused
objects only after checking they are not referenced by another event.

### Retry and recovery

Each event, all its categories, and its import receipt are committed in one
transaction. A failed event leaves none of those records behind; other successful
events remain committed. Parallel/repeated imports are serialized per archive,
source event and target owner, with a unique database key as a second safeguard.
An unchanged archive retried for the same target owner skips completed records
and returns their original mappings. `onDuplicate: "error"` reports those as failed
instead. Dry runs also report existing duplicates. A skipped record's mapping is
the original mapping; its verification uses a fresh target read to detect edits,
missing categories or lifecycle changes.

If a response is lost or a database problem occurs, retry the **same archive and
owner mapping**. Changing archive content, environment label or ownership changes
the duplicate scope and may create another copy. Keep exports stable across retries.
Validate and fix records in the source **before** the first real import. If only
some records fail and source corrections are needed, export just those failed
source IDs into a new archive; re-exporting the entire changed archive could
duplicate successes. Missing-owner failures can instead be retried with the same
archive after registering the correct account. A previously imported event whose
ownership has since changed reports a failure rather than exposing its mapping.

There is no automatic bulk rollback. Save the report, inspect imported target
records, and use your reviewed backup/restore process if rollback is necessary;
do not erase events that have subsequently issued tickets. Deleting a target event
also deletes its receipt, so reimporting can create a replacement. Do not delete
receipts alone to force retries. Use the verification evidence below to assess
target differences before deciding whether a retry or rollback is appropriate.

## Verification evidence

Each record includes `verification` with these fields:

- `status`: `match`, `mismatch`, `not_imported`, `not_checked` or `unavailable`.
- `expectedStatus` and `actualStatus`: lifecycle labels; drafts with a publication
  time count as `scheduled`. Unavailable/unchecked values are null.
- `checks`: comparisons for name, description, venue, map location, start time,
  capacity, price, booking JSON, status, publication/cancellation time, thumbnail
  URL and the **resolved target owner**. Values are true, false or null when not
  checked. Owner remapping remains an explicit warning; a remapped record can match.
- `categories`: expected/actual counts and `matches`. Each `ticketTypes` entry
  links source/target IDs and says whether name, price, capacity, order limit and
  sale-window values match. Missing or extra categories cause a mismatch.
- `media`: `absent`, `reference_preserved`, `changed` or `not_checked`. This checks
  the stored thumbnail reference only; no image is downloaded or storage verified.

Real imports are read back **after the transaction commits**. Skipped retries,
including dry runs, read their existing target records again. No target state is
inferred from the request or receipt alone. Comparisons normalize dates to UTC
ISO strings and compare booking JSON independent of object-key ordering. Target
creation/update timestamps are intentionally excluded because they reflect import
time. Unsupported fields and invalid records retain their validation errors and
`not_checked` status; the importer does not silently discard them.

A valid dry run with no existing target reports `not_imported`, with expected
status/category counts and null comparison values. It never claims a match or
allocates target IDs. Verification errors after commit retain `status: imported`
and the generated IDs, while reporting `verification.status: unavailable`;
they do not imply that the transaction was rolled back.

Top-level `verification.version` is `1`. It includes counts for `matched`,
`mismatched`, `unavailable`, `notImported` and `notChecked`, plus
`expectedByStatus`, `actualByStatus`, and category totals `{ expected, actual }`.
Expected totals cover fully validated definitions only; actual totals cover
successfully read targets only. Use the coverage counts before interpreting a
smaller actual total as missing data. The concise `summary` and CLI output report
both import outcomes and verification coverage. Save the JSON alongside the
unchanged archive as deployment evidence.

A mismatch does not overwrite or roll back anything. Inspect the false checks:
an organizer may have edited the target, removed a category, or a scheduled draft
may have published since import. An unchanged retry verifies it again but does
not repair it. For unavailable verification, restore database availability and
retry the same archive/owner mapping. If a genuine migration problem requires
rollback, use reviewed restore procedures and account for any tickets issued since
import. Reports are per-record observations, not one atomic snapshot of the whole
catalog, and do not verify tickets, buyers, payment records or scan activity.
