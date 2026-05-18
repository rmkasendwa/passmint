# Passmint

A Dockerized monorepo pass management system for issuing QR passes and validating entry at the gate.

- React frontend for events, checkout, passes, and gate scanning
- NestJS backend API
- PostgreSQL database
- QR code passes that can be scanned at the gate

## Quick Start

```bash
cp .env.example .env
docker compose up --build
```

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
2. Buy a ticket for an event.
3. The API creates a unique ticket code and QR code.
4. The gate scanner reads the QR code and calls the validation endpoint.
5. Valid unused tickets are marked as checked in. Duplicate scans are rejected.

## Useful Commands

```bash
npm run dev       # run the full stack with Docker Compose
npm run build     # build all workspaces locally
```
