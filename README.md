# Passmint

A pnpm monorepo ticketing system for selling QR tickets and validating entry at the gate.

- Next.js frontend for event discovery, anonymous checkout, account history, and admin verification
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

Set `ADMIN_EMAILS` in `.env` to a comma-separated list of admin email addresses. Users register and log in the same way; matching admin emails receive verifier access.

Event thumbnails upload through the API. Local development needs no object-store setup: files are written to `uploads/` and served from `/uploads`. To use S3-compatible storage, set `S3_BUCKET`, `S3_REGION`, `S3_ACCESS_KEY_ID`, `S3_SECRET_ACCESS_KEY`, and optionally `S3_ENDPOINT`, `S3_FORCE_PATH_STYLE`, and `S3_PUBLIC_BASE_URL` for R2 or MinIO.

Then open:

- Web app: http://localhost:8088
- API health: http://localhost:3000/health

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

1. Create or view events.
2. Buy a ticket anonymously, or log in first to attach the purchase to account history.
3. The API creates a unique ticket code and QR code.
4. Logged-in users can view ticket history.
5. Logged-in admins use the verification app to scan QR codes at the gate.
6. Valid unused tickets are marked as checked in. Duplicate scans are rejected.

## Useful Commands

```bash
pnpm run dev       # run API and web locally
pnpm run dev:db    # run PostgreSQL in Docker
pnpm run dev:api   # run only the API
pnpm run dev:web   # run only the Next.js app
pnpm run build     # build all workspaces locally
pnpm run lint      # type-check all workspaces
```

## Docker Image

The production Dockerfile builds the API and web app into one image. Docker Compose keeps that app image behind an explicit profile so local development can use only the database container.

```bash
pnpm run docker:build
pnpm run docker:up
```
