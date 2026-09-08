# Passmint

A pnpm monorepo ticketing system for publishing events, issuing QR tickets, and validating entry at the gate.

For product, technical, operational and acquisition documentation, start with the [documentation and handover index](docs/README.md). It distinguishes current source capabilities from the broader planned ticketing platform.

**Current scope:** event management and direct QR-ticket issuance. Real payment processing, email delivery, password recovery, tenants and reserved seating are not implemented end to end. Paid-priced ticket issuance does not establish payment success. See the [capability register](docs/handover/02-capability-register.md).

- Next.js frontend for event discovery, event detail checkout, account history, host publishing, event editing, and ticket verification
- NestJS backend API
- PostgreSQL database
- QR code tickets that can be scanned once at the gate

## Quick Start

```bash
cp .env.example .env
pnpm install
pnpm run dev:db
```

In another terminal, run both local apps:

```bash
pnpm run dev
```

Set `ADMIN_EMAILS` in `.env` to a comma-separated list of platform admin email addresses. Users register and log in the same way; any registered user can publish events and validate tickets for events they created, while matching admin emails receive marketplace-wide verifier access.

Event thumbnails upload through the API into MinIO during local development. `pnpm run dev` starts MinIO, creates the `passmint-event-images` bucket, and makes uploaded event images readable at `http://localhost:${MINIO_API_PORT}/passmint-event-images/...`. The MinIO console runs at `http://localhost:${MINIO_CONSOLE_PORT}`. To use production object storage, set `S3_BUCKET`, `S3_REGION`, `S3_ACCESS_KEY_ID`, `S3_SECRET_ACCESS_KEY`, and optionally `S3_ENDPOINT`, `S3_FORCE_PATH_STYLE`, and `S3_PUBLIC_BASE_URL` for S3-compatible providers such as R2 or MinIO.

Then open:

- Web app: http://localhost:8088
- API health: http://localhost:3000/health
- Prisma Studio: http://localhost:5555
- MinIO console: http://localhost:9001

The default local setup uses Docker for PostgreSQL and MinIO. The API and web app run as independent local workspaces. `pnpm run dev` generates Prisma Client and synchronizes the development database schema before starting the apps; use a disposable development database.

## Monorepo Layout

```text
apps/
  api/      NestJS API and PostgreSQL integration
  web/      Next.js frontend
prisma/     Database schema
scripts/    Development, test and startup tooling
docs/       Product, engineering and acquisition handover documentation
```

## Database IDs

Entity IDs are application-generated strings with readable prefixes:

- Users: `usr_...`
- Events: `evt_...`
- Tickets: `tkt_...`
- Ticket types (current working tree): `typ_...`

Do not wipe retained records to change ID or schema formats. Review a migration and backup/restore approach first. Local reset commands delete data and are suitable only for a deliberately disposable development environment; see the [engineering guide](docs/handover/06-engineering.md).

## Main Flows

1. Registered users create and publish free or paid events.
2. Discovery cards link to `/event/:eventId`, where attendees review details and buy tickets.
3. Attendees get tickets anonymously with an email address, or log in first to attach the purchase to account history.
4. Priced checkout captures a mobile money number, but the API currently issues tickets without provider payment confirmation.
5. The API creates unique ticket codes and QR codes.
6. Tickets already owned for the event are listed on that event detail page when the attendee is signed in.
7. Event owners can edit their own event details from the event detail page.
8. If the same email requests more tickets for the same event, checkout asks for confirmation and tracks the total for that event-email pair.
9. Event hosts validate tickets for their own events. Platform admins can validate across events.
10. Valid unused tickets are marked as checked in. Duplicate scans are rejected.

See [docs/product-flow.md](docs/product-flow.md) for the fuller product model.

## Useful Commands

Hosts can leave capacity blank for unlimited sales. Limited events display remaining availability and stop checkout when sold out. Cancelled tickets release capacity; capacity cannot be reduced below the active ticket count. Run `pnpm run db:push` after updating an existing installation to allow unlimited capacity.

Run `pnpm test` with PostgreSQL available. Tests use a unique temporary schema, leaving application records untouched. Set `TEST_DATABASE_URL` to use a separate PostgreSQL test database. Pull requests also run integration tests, type checks, and production builds in CI.

```bash
pnpm run dev       # run API and web locally
pnpm run dev:db    # run PostgreSQL in Docker
pnpm run db:push   # sync the Prisma schema to the local database
pnpm run db:studio # open the local PostgreSQL database with Prisma Studio
pnpm run dev:api   # run only the API
pnpm run dev:web   # run only the Next.js app
pnpm run build     # build all workspaces locally
pnpm run lint      # type-check all workspaces
```

`pnpm run db:studio` starts PostgreSQL in Docker, then opens Prisma Studio without a database login screen.

## Docker Image

The supplied Dockerfile is intended to build the API and web app into one image. Its current build/runtime file-copy gaps must be addressed before relying on it for deployment. Docker Compose keeps the app behind an explicit profile. See the [operations runbook](docs/handover/07-operations.md) for limitations and release validation.

```bash
pnpm run docker:build
pnpm run docker:up
```
