# Architecture

[Documentation index](../README.md)

## Current system

Passmint is a pnpm monorepo with a Next.js frontend and NestJS API. PostgreSQL stores users, events and tickets through Prisma. Event images use S3-compatible storage, with MinIO in the local Compose environment. A filesystem storage branch also exists.

```mermaid
flowchart LR
  Buyer[Buyer or organizer browser] --> Web[Next.js web]
  Buyer --> API[NestJS JSON API]
  Web --> API
  API --> DB[(PostgreSQL via Prisma)]
  API --> Images[S3-compatible image storage]
  Buyer --> Images
  Scanner[Authenticated browser scanner] --> API
```

This diagram contains the current main components. There is no implemented payment provider, email service, background job queue or independent tenant service.

## Component responsibilities

| Component | Responsibility | Entry point |
| --- | --- | --- |
| Web routes and React components | Discovery, auth UI, organizer UI, checkout and scanning | [Web app](../../apps/web/app/page.tsx), [app provider](../../apps/web/components/app-provider.tsx) |
| API client | JSON requests and bearer headers | [api.ts](../../apps/web/api.ts) |
| API bootstrap | CORS, 7 MB request parsing, DTO validation, local uploads | [main.ts](../../apps/api/src/main.ts) |
| Authentication | Register, login, token verification and database user lookup | [auth service](../../apps/api/src/auth/auth.service.ts) |
| Events | Ownership, drafts, publication, cancellation, capacity and categories | [events service](../../apps/api/src/events/events.service.ts) |
| Tickets/gate | Direct issuance, history, inventory and scan validation | [tickets service](../../apps/api/src/tickets/tickets.service.ts) |
| Image storage | Base64 validation, object key generation and signed upload | [storage service](../../apps/api/src/events/image-storage.service.ts) |
| Persistence | Schema and connection lifecycle | [Prisma schema](../../prisma/schema.prisma), [Prisma service](../../apps/api/src/prisma/prisma.service.ts) |

## Request and transaction behavior

The browser sends bearer tokens to the API. Protected routes require a valid token; optional-auth routes permit guests. Verification reads the current database user, so authorization uses the stored role. Frontend session state is stored in browser local storage.

Ticket creation locks the event row inside a database transaction, validates event and optional category availability, counts active tickets, checks repeat-email confirmation and creates one row per ticket. QR rendering happens after that transaction. A rendering/response failure therefore need not mean issuance failed; no idempotency key is implemented for replaying the purchase request.

Capacity edits, category writes, event cancellation and scans also use the event row as a lock boundary. This simplifies consistency within one event but can serialize a busy event's sales and gate traffic. No load benchmark establishes its maximum throughput.

Gate validation looks up the code, checks ownership/admin privileges and cancellation/used state, then records `checked_in` and a timestamp. The current scan request contains only the code; it has no explicit selected gate or occurrence, and the service does not enforce an event-time validity window.

## Publication and demo behavior

The event service publishes due drafts during startup, on a 30-second timer and during selected reads/purchases. It is an in-process mechanism, not a durable job queue. Each API process can run the timer; failure is logged and retried on a later tick.

Startup also inserts named demo events and fills missing image/map details for matching names. There is no inspected production-only seeding exclusion. Separately, server-rendered pages fall back to demo data when API calls fail. These behaviors are useful for demonstration but must be accounted for in production operations and commercial reporting.

## Deployment shape and dependencies

Local development runs the web and API as separate processes and PostgreSQL/MinIO in Docker. The supplied production Dockerfile aims to run both apps in one image; its startup script backgrounds the API and foregrounds the web. The file does not currently copy all required runtime scripts/schema assets. Treat this path as unverified; see [known gaps](12-gaps-and-verification.md).

`NEXT_PUBLIC_API_URL` is used by browser and server web code and must be correct at build time. A URL reachable only inside a container will fail for browsers; a localhost URL may point to the wrong process inside containers. Separate public/internal endpoint handling is not implemented.

## Future architecture boundary

The proposed model adds Tenant → Activity → Occurrence, reusable resources and layout versions, orders/payments, inventory holds and admission entitlements. This is a roadmap, not the current schema. Existing event IDs, ticket codes and ownership history need a deliberate migration. Do not introduce separate vertical databases or services merely because the product supports different activity names.
