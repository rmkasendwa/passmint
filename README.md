# Passmint

A pnpm monorepo ticketing system for publishing events, issuing QR tickets, and validating entry at the gate.

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

The default local setup uses Docker only for PostgreSQL. The API and web app run as independent local workspaces.

## Monorepo Layout

```text
apps/
  api/      NestJS API and PostgreSQL integration
  web/      Next.js frontend
infra/
  postgres/ Database initialization scripts
```

## Database IDs

Entity IDs are application-generated strings with readable prefixes:

- Users: `usr_...`
- Events: `evt_...`
- Tickets: `tkt_...`

If you have an older local database with UUID primary keys, wipe it and recreate the schema:

```bash
docker compose down -v
pnpm run dev:db
```

## Main Flows

1. Registered users create and publish free or paid events.
2. Discovery cards link to `/event/:eventId`, where attendees review details and buy tickets.
3. Attendees get tickets anonymously with an email address, or log in first to attach the purchase to account history.
4. Paid checkout captures a mobile money number for the payment flow.
5. The API creates unique ticket codes and QR codes.
6. Tickets already owned for the event are listed on that event detail page when the attendee is signed in.
7. Event owners can edit their own event details from the event detail page.
8. If the same email requests more tickets for the same event, checkout asks for confirmation and tracks the total for that event-email pair.
9. Event hosts validate tickets for their own events. Platform admins can validate across events.
10. Valid unused tickets are marked as checked in. Duplicate scans are rejected.

See [docs/product-flow.md](docs/product-flow.md) for the fuller product model.

## Useful Commands

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

The production Dockerfile builds the API and web app into one image. Docker Compose keeps that app image behind an explicit profile so local development can use only the database container.

```bash
pnpm run docker:build
pnpm run docker:up
```
