# API reference

[Documentation index](../README.md)

This is a source-derived reference, including category routes. It is not a versioned public API commitment. Local base URL is `http://localhost:3000`; the production image exposes these routes through same-origin `/api`. Requests and responses are JSON. Dates serialize as ISO strings. Protected routes use `Authorization: Bearer <token>`. No global route prefix or OpenAPI document is configured in the inspected bootstrap.

## Routes

| Method and path | Authorization | Behavior / response |
| --- | --- | --- |
| GET `/health` | Public | `{ "status": "ok", "service": "passmint-api" }`; process liveness only |
| GET `/ready` | Public | Database connectivity check; 503 when unavailable |
| POST `/auth/register` | Public | `{name,email,password}` → `{token,user}`; password minimum 8 characters; normalized unique email |
| POST `/auth/login` | Public | `{email,password}` → `{token,user}` |
| GET `/auth/me` | Bearer | Current database user's public fields |
| GET `/events` | Public | Array of non-draft events, ascending `startsAt`; includes cancelled events |
| GET `/events/mine` | Bearer | Events whose `ownerId` is this user; includes own drafts |
| GET `/events/sales-summary` | Bearer | Caller-owned events only, including for admins; all-time issuance, cancellations, check-ins, saved face value and published-event capacity, plus 30 UTC daily issuance buckets; verified revenue is null |
| GET `/events/:id/sales-summary` | Owner or admin; drafts owner-only | Same report for a single event; snapshot reads, no buyer details, `Cache-Control: no-store` |
| GET `/events/:id/attendees` | Owner or admin; drafts owner-only | Optional `search` (name/email, up to 100 characters) and `page` (positive integer, default 1); returns 50 tickets per page plus `hasMore`; includes ticket category, issue status and check-in time, excludes QR credentials |
| GET `/events/:id` | Optional bearer | Event details; draft returns 404 unless caller is owner, including for unrelated platform admins |
| POST `/events` | Bearer | Creates published event owned by caller |
| POST `/events/drafts` | Bearer | Creates draft using partial details; missing start defaults to epoch sentinel |
| POST `/events/:id/duplicate` | Owner only | Requires future `startsAt`; copies details, capacity, artwork and categories into a new private draft; shifts category sales windows by the date difference; excludes tickets, cancellation and publication schedule |
| PATCH `/events/:id` | Owner or admin; drafts owner-only | Updates fields, publishes or schedules draft; rejects cancelled events |
| POST `/events/:id/cancel` | Owner or admin; draft rules apply | Requires `{ "confirm": true }`; preserves cancellation timestamp on repeat |
| POST `/events/uploads` | Bearer | `{fileName,contentType,dataUrl}` → `{url}`; validates JPEG/PNG/WebP/GIF bytes (5 MB default, 40 megapixels), stores oriented static WebP within 1920×1920 without enlargement or metadata; animated uploads use first frame |
| POST `/events/:id/ticket-types` | Owner or admin; drafts owner-only | Creates category |
| PATCH `/events/:id/ticket-types/:typeId` | Owner or admin; drafts owner-only | Updates category belonging to event |
| POST `/tickets` | Optional bearer | Directly issues an array of tickets; does not confirm payment |
| GET `/tickets/mine` | Bearer | Tickets linked to caller's user ID, newest first |
| GET `/tickets/:id` | Ticket owner, event owner or admin | One ticket with QR and public event projection |
| POST `/gate/scan` | Bearer plus event owner/admin check | `{code}` → accepted result or an error outcome |

There are no current routes for logout/revocation, email verification, password reset, guest recovery, refunds, tenants, seats, orders, payments or transfers. Client logout clears local session state.

## Payloads

Ticket-category `salesStart` and `salesEnd` are optional instants. Sales open at `salesStart` and close at `salesEnd`; clearing either field removes that bound. Availability combines the sales window, category inventory, event capacity and event status. Checkout uses the device clock for live window labels and refreshes server data while visible; the server clock and locked inventory check determine whether issuance succeeds.

Published event creation requires `name`, `description`, `venue`, `startsAt` and nonnegative integer `priceCents`. Optional `capacity` is null or a positive integer; optional `mapLocation` and `thumbnailUrl` supply presentation data. Example for an isolated demonstration environment:

```json
{
  "name": "Community demo",
  "description": "Test event for handover validation",
  "venue": "Demo room",
  "startsAt": "2026-10-01T15:00:00Z",
  "capacity": 50,
  "priceCents": 0
}
```

PATCH accepts optional event fields plus `status: "published"` or `publishAt` (date or null). Scheduling requires complete publication details and a publication time in the future before the event start. Explicit manual publication clears the schedule. The draft creation method consumes content fields rather than scheduling immediately; schedule via PATCH.

Category create/update DTO requires `name` (up to 100 characters) and nonnegative `priceCents`, even on PATCH. Optional `capacity` is positive or null, `maxPerOrder` is 1–100, and `salesStart`/`salesEnd` are dates or null. Start must precede end when both exist. Capacity cannot fall below active allocations.

Ticket issuance example (replace the event ID with a real test event):

```json
{
  "eventId": "evt_REPLACE_WITH_TEST_EVENT_ID",
  "buyerName": "Demo Buyer",
  "buyerEmail": "buyer@example.com",
  "quantity": 2
}
```

Optional fields are `ticketTypeId`, `mobileMoneyNumber` and Boolean `confirmAdditional`. Quantity defaults to 1; DTO maximum is 100, while service maximum is the category limit or 10 without a category. If an event has categories, a valid category ID is required. Send JSON booleans, not strings: the DTO uses Boolean transformation and has not been hardened for string truthiness.

## Response contract

Public user fields are `id`, `email`, `name`, `role`. Event responses contain event fields plus `ticketsSold`, `remainingCapacity`, `soldOut`, and, where loaded, category inventory. The `owner` representation currently varies between an ID, `{id,name}` and null depending on query path; do not assume one stable shape. Internal `_count` fields may also be present because the event response spreads queried objects.

Ticket responses contain `id`, category ID/name, `unitPriceCents`, `code`, `buyerName`, `buyerEmail`, `status`, `checkedInAt`, `createdAt`, `qrPayload`, a PNG `qrCodeDataUrl`, and an event projection. QR payload is the raw ticket code, not a URL and not personal data. Treat the code as a bearer admission credential.

## Error semantics

| HTTP status | Examples |
| --- | --- |
| 400 | Invalid DTO, unknown category, insufficient capacity, closed category sales, cancelled-event purchase, invalid publication |
| 401 | Missing/invalid auth on protected route or invalid login |
| 403 | Caller does not own event/ticket or cannot validate its ticket |
| 404 | Missing resource, hidden draft or unknown ticket code |
| 409 | Duplicate registration, additional-purchase confirmation, used/cancelled ticket or cancelled-event scan |

Repeated-email issuance returns `result: "additional_confirmation_required"`, `existingTicketCount`, `requestedQuantity`, `totalAfterPurchase` and identifiers. Resubmitting with `confirmAdditional: true` allows another issuance if inventory remains. This is not idempotency and currently exposes purchase count for an unverified email.

Scan result values are `accepted`, `duplicate`, `cancelled`, `invalid`, `forbidden`. An accepted result includes the ticket. Some rejection responses include ticket information and prior check-in time. A code alone cannot read a ticket through the authenticated ticket endpoint.

`GET /tickets/:id/activity?page=1` requires the event owner or platform admin; unrelated admins cannot inspect draft tickets. Responses use `Cache-Control: no-store` and return `issuedAt`, `legacyCheckedInAt`, `activities`, `page` and `hasMore`. Pages contain at most 50 scan records, ordered newest first by timestamp and ID; page must be an integer from 1–100000. Each record contains ID, kind, timestamp, operator ID/name snapshot and device description. No ticket code, QR or buyer email is included. Refresh from page 1 when new scans arrive because page offsets can shift.

Known-ticket scan outcomes persist transactionally as `accepted`, `duplicate`, `cancelled`, `event_cancelled` or `forbidden`, including when the HTTP response is an error. Unknown codes cannot be attributed to a ticket and create no ticket history. Device descriptions come from the request User-Agent, with control characters removed and a 500-character limit; this is unverified client metadata. Issuance is not proof of payment. Existing issuance/check-in timestamps remain visible, but older failed scans and missing operator/device details cannot be reconstructed. Transfer history is pending ticket transfers (#16/#37); #24 remains open for that dependency. Deploy the additive `ticket_activities` table with the existing schema-sync process before running the updated API.

The global validation pipe transforms values, rejects unknown fields and whitelists DTO properties. The API has no pagination contract, request idempotency contract or published rate-limit contract. Use [controllers](../../apps/api/src/events/events.controller.ts), [DTOs](../../apps/api/src/tickets/dto/create-ticket.dto.ts) and services as the authority when behavior changes.
