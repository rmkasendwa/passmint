# Portable event archives

The export endpoint implements issue #78. Import (#79), media transfer (#80),
operator CLI (#81), and post-import verification (#82) are separate follow-ups.
An export alone cannot yet bootstrap a target deployment.

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
