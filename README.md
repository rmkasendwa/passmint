# Passmint

A Dockerized monorepo ticketing system for selling QR tickets and validating entry at the gate.

- Server-rendered React frontend for event discovery, anonymous checkout, account history, and admin verification
- NestJS backend API
- PostgreSQL database
- QR code tickets that can be scanned once at the gate

## Quick Start

```bash
cp .env.example .env
docker compose up --build
```

Set `ADMIN_EMAILS` in `.env` to a comma-separated list of admin email addresses. Users register and log in the same way; matching admin emails receive verifier access.

Then open:

- Web app: http://localhost:8088
- API health: http://localhost:3000/health

## Monorepo Layout

```text
apps/
  api/      NestJS API and PostgreSQL integration
  web/      React + Vite frontend
infra/
  postgres/ Database initialization scripts
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
npm run dev       # run the full stack with Docker Compose
npm run build     # build all workspaces locally
```

The web app uses Vite SSR. Local web-only development runs the SSR dev server:

```bash
npm --workspace apps/web run dev
```

Production preview renders routes through the Node SSR server:

```bash
npm --workspace apps/web run build
npm --workspace apps/web run preview
```
