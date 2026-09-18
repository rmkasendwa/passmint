# Portable event archives

The export and import endpoints implement issues #78 and #79. Media transfer (#80),
operator CLI (#81), and post-import verification (#82) are separate follow-ups.
These endpoints move event definitions, not issued tickets or customers.

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
is preserved verbatim, no remote URL is fetched, and no image bytes are transferred.
Local `/uploads` and localhost/object-storage references may not work on the target.
Media classification, copying and URL rewriting are tracked in #80.

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

HTTP 200 returns `{ archiveId, dryRun, counts, records, summary }`, **including when
individual records fail**. Check `counts.failed` and each record; HTTP success
alone does not mean the entire archive was imported. Counts include `total`,
`valid` (dry run only), `imported`, `skipped`, and `failed`. Each record includes
`sourceId`, `status`, `warnings`, and, after owner resolution, `targetOwnerId`.
Successful imports and skips also return `targetId` and `ticketTypes` mappings
of `{ sourceId, targetId }`. Failures include a safe `error` string. A valid dry
run allocates no target IDs and writes no events, categories or import records.

All imported events/categories get new prefixed IDs. Target creation/update
timestamps reflect the import time; retain the archive for original provenance.
Artwork URLs are preserved verbatim, with a warning: uploads and localhost URLs
do not become portable merely because definitions import successfully. Use shared
public storage or repair artwork in the target; image transfer remains #80.

### Retry and recovery

Each event, all its categories, and its import receipt are committed in one
transaction. A failed event leaves none of those records behind; other successful
events remain committed. Parallel/repeated imports are serialized per archive,
source event and target owner, with a unique database key as a second safeguard.
An unchanged archive retried for the same target owner skips completed records
and returns their original mappings. `onDuplicate: "error"` reports those as failed
instead. Dry runs also report existing duplicates. A skipped record's mapping is
the original mapping, not a fresh verification of edited target data (#82).

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
receipts alone to force retries. Post-import comparison against target state and
the operator CLI are tracked separately in #82 and #81.
