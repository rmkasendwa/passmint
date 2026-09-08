# Engineering guide

[Documentation index](../README.md)

## Toolchain and repository map

Use Node.js 22 (CI/container baseline), pnpm 9.14.4 (root package-manager declaration), Docker Compose and PostgreSQL 16 for the supplied environment. Manifests specify Next.js 15, React 18, NestJS 10, Prisma 6 and TypeScript 5 families; exact resolved dependencies belong to [pnpm-lock.yaml](../../pnpm-lock.yaml), not these family summaries.

| Path | Role |
| --- | --- |
| `apps/web/app` | Next.js route pages |
| `apps/web/components` | Buyer, organizer and scanner interface |
| `apps/web/api.ts` | Client request/response types and requests |
| `apps/api/src/auth` | Authentication and guards |
| `apps/api/src/events` | Event/category lifecycle and image storage |
| `apps/api/src/tickets`, `gate` | Issuance, ownership and check-in |
| `apps/api/test` | Node test-runner tests using PostgreSQL |
| `prisma/schema.prisma` | Database schema; no tracked migration history found |
| `scripts` | Environment loading, local development, tests and startup |
| `.github/workflows/ci.yml` | Type checks, integration tests and build configuration |

## Local setup

Use a disposable development environment. Do not point development scripts at an acquired production database: `pnpm run dev` performs schema synchronization and application startup seeds demo records.

```powershell
Copy-Item .env.example .env
corepack enable
pnpm install --frozen-lockfile
pnpm run dev
```

Copy the example only when creating a new local environment; preserve an existing `.env`. These instructions are documented, not executed as part of this documentation task. `dev` starts PostgreSQL and MinIO, initializes the public image bucket, waits for PostgreSQL, generates Prisma Client, runs `prisma db push`, then starts both applications.

Defaults: web port 8088, API 3000, PostgreSQL 5432, MinIO API 9000, console 9001. A separate `pnpm run dev:db` runs the backing services in the foreground. For separate application terminals use `dev:api` and `dev:web` after database setup and client generation. `db:studio` opens database administration; treat it as privileged access.

## Working changes and schema discipline

Ticket types span Prisma, API and web files. Schema changes require client generation and a reviewed database update; existing databases are not automatically upgraded by production startup. Record the release SHA and validation evidence before deployment.

`db:push` synchronizes schema without a versioned migration trail. `db:reset` invokes Compose volume deletion and removes local database/image data; it is not a recovery procedure. Establish reviewed migrations, backups and restore drills before applying schema changes to real retained records. Schema changes also require regenerating Prisma Client.

## Verification workflow

```text
pnpm run db:generate
pnpm run lint
pnpm test
pnpm run build
```

`lint` is TypeScript checking, not an ESLint/security scan. The [test runner](../../scripts/test.mjs) selects `TEST_DATABASE_URL` or `DATABASE_URL`, creates a unique temporary schema, pushes schema into it, compiles API code, runs `*.test.cjs`, then drops that schema in cleanup. Use a separate test database and appropriate schema permissions. Process termination can prevent normal cleanup; inspect orphaned `test_` schemas before removing only a verified test target.

Tests cover HTTP auth/ownership, capacity concurrency and unlimited inventory, cancellation/confirmation, draft privacy, scheduled publication and ticket-category limits, windows, price snapshots and concurrent purchases. Docker CI also exercises fresh initialization, persistence, uploads and process failure. No browser end-to-end suite, payment integration, disaster-recovery drill or load benchmark is supplied. Capture actual CI run links and results for the chosen release.

CI runs on pull requests and pushes to `main`, installs with a frozen lockfile, generates the client, type-checks, tests and builds with a PostgreSQL service. Deployment, container smoke tests and formal artifact signing are not configured in that workflow.

## Change and release expectations

Use small, reviewed changes with behavior-focused validation. Update capability status, API/data documentation and known gaps as features land. For a release, record commit SHA, dependency lockfile, schema transition, environment changes, CI evidence, restore point and rollback compatibility. Do not infer production deployment from a merged PR or a successful source build.

Avoid repository-wide formatting during unrelated work: the checkout uses mixed formatting. Keep credentials and production exports outside Git. Use descriptive `feat/`, `fix/` or `chore/` branch names. Before acquisition transfer, capture outstanding branches, issues and uncommitted work with their authors and disposition.
