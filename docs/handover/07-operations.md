# Operations, deployment and recovery

[Documentation index](../README.md)

## Operating status

The repository supplies development automation and a tested container deployment setup. The actual hosting account, public domain, running release, backups, alerting, traffic and support rota are **owner confirmation required**. The procedures below are a handover runbook to validate in staging, not evidence of an already operating production service.

## Configuration inventory

Never place real values in this document. [`.env.example`](../../.env.example) contains development examples; [root environment loading](../../scripts/root-env.mjs) supplies additional defaults and preserves existing environment values with `??=`.

| Variables | Purpose / handling |
| --- | --- |
| `DATABASE_URL` | Prisma connection; secret, correct environment essential |
| `POSTGRES_HOST`, `POSTGRES_PORT`, `POSTGRES_DB`, `POSTGRES_USER`, `POSTGRES_PASSWORD` | Local connection/default construction and Compose; password secret |
| `TEST_DATABASE_URL` | Isolated test connection; secret; overrides test runner target |
| `APP_DATABASE_URL` | Compose application's database URL; default uses `postgres` hostname |
| `API_PORT`, `WEB_PORT`, `PORT`, `API_HOST` | Development listener settings; production supervisor reserves loopback port 3000 for API and uses `PORT`/`WEB_PORT` (8088 default) for web |
| `NEXT_PUBLIC_API_URL`, `API_INTERNAL_URL` | Browser API address (image builds `/api`) and internal server fetch address (loopback in image) |
| `CORS_ORIGIN` | Allowed browser origin; default local web origin; Compose app currently sets localhost explicitly |
| `AUTH_SECRET` | HMAC token signing secret; must replace development fallback |
| `INITIALIZE_DATABASE` | Initializes an empty schema automatically, skips existing tables; set false to manage schema setup separately |
| `ROOT_ADMIN_EMAIL` | Single configuration-owned root administrator; reconciled at startup and registration |
| `MINIO_API_PORT`, `MINIO_CONSOLE_PORT`, `MINIO_ROOT_USER`, `MINIO_ROOT_PASSWORD` | Local storage service and administrative credentials |
| `S3_BUCKET`, `S3_REGION`, `S3_ENDPOINT`, `S3_FORCE_PATH_STYLE` | Object destination and addressing; custom endpoint forces path-style behavior in service |
| `S3_ACCESS_KEY_ID`, `S3_SECRET_ACCESS_KEY`, `S3_SESSION_TOKEN` | Storage credentials, including optional session token |
| `S3_PUBLIC_BASE_URL` | Public image prefix; must be reachable by browsers |
| `IMAGE_UPLOAD_MAX_BYTES` | Decoded image maximum, default 5 MiB; API request body limit is separately 7 MB |
| `LOCAL_UPLOAD_DIR`, `PUBLIC_API_URL` | Filesystem fallback directory and public URL prefix |

The storage service chooses S3 when bucket/access key/secret are populated. Development scripts populate local defaults; merely removing S3 lines from development `.env` does not necessarily activate filesystem fallback. Production startup does not load those development defaults. Its default upload directory `/app/uploads` must be persisted and writable by UID 1000. Validate effective configuration without printing secrets.

## Release procedure to establish

1. Identify release SHA and resolve working-tree additions. Capture passing CI and a tested build artifact.
2. Inventory target environment, secret custodian, database and storage locations; confirm there is a recoverable backup.
3. Follow the [Docker/Coolify guide](../deployment.md), build the image and run both documented smoke modes. Source builds alone do not validate the image.
4. Review schema delta and run a staged migration/restore rehearsal. Do not use automatic development `db push` as a production migration strategy.
5. Configure HTTPS routing, browser/server API reachability, CORS, private database access and persistent image storage. Define an explicit demo-seed/fallback policy before launch.
6. Deploy to staging and execute the smoke scenario below, then approve the release for its actual supported scope.
7. Record deployment time, artifact, schema version, operator, smoke results and rollback decision. Obtain production evidence separately.

### Smoke scenario

In an isolated environment, register two ordinary users; create a free event as one; confirm the other cannot edit or scan it. Save a private draft, publish it, issue guest/member tickets, inspect QR results and account history, scan once and reject the second scan. Exercise category selection, limited capacity and cancellation. Upload an image and retrieve it from a fresh browser. Verify that API unavailability is detected and production shows no demo fallback. Use synthetic contact details. Paid checkout is not a valid payment smoke test until provider integration exists.

### Container behavior and remaining operational work

The image includes generated Prisma Client, compiled apps, public assets and direct startup scripts. The supervisor requires a database URL and non-placeholder signing secret of at least 32 characters. It forwards shutdown signals and exits when either child stops. `/api/ready` tests database connectivity. CI tests normal setup and optional empty-schema initialization, including retained data and uploads after container replacement.

Production Compose supplies a private PostgreSQL service and persistent volumes. Coolify supplies routing/TLS when configured according to the deployment guide. A live reverse proxy, secret store, monitoring and backup service still require deployment-specific evidence.

## Monitoring to establish

Monitor API reachability and latency, authenticated requests, database connectivity/locks, issuance errors, duplicate/failed scans, upload failures, overdue draft publication, disk/object capacity and application restarts. `/health` is static liveness; `/ready` checks the database (both under `/api` through the image). Add a synthetic user journey to test application behavior beyond connectivity.

There is no verified alert destination, SLO, dashboard or on-call rotation in source. Record owners and targets in the transition checklist. Define desired recovery-point and recovery-time objectives before selecting backup intervals; no achieved RPO/RTO is claimed here.

## Incident triage

| Symptom | First investigation | Handling |
| --- | --- | --- |
| Unexpected listings or empty account history | API URL, actual API response, DB connectivity and seed configuration | Confirm real service state before telling customers records are missing |
| Tickets appear without payment | Current direct-issuance design | Do not report them as settled sales; payment integration is pending |
| Duplicate scan | Confirm prior acceptance and authorized event owner | Do not reset used status to bypass validation without a reviewed support process |
| Sales fail at capacity | Event and category counts, limits and sale windows | Verify inventory; do not raise capacity beyond actual venue allowance |
| Scheduled draft stays private | API uptime, timer errors, `publishAt` and clock | Inspect correct environment; use supported owner publication flow if appropriate |
| Upload fails / image inaccessible | Effective S3 config, endpoint, permissions, public prefix and size | Preserve existing asset; test with a synthetic upload |
| User loses access | Token expiry, `/auth/me`, correct account | Password-reset UI is not functional; establish controlled support handling |

Record incident time, affected environment, release, symptoms, actions and customer impact. Keep tokens, QR codes and personal data out of ordinary incident notes. Customer notifications require an assigned operator and channel; none is established in source.

## Backup and restoration runbook to validate

Back up PostgreSQL and event-image objects, plus the release manifest, configuration names and secure access to the secrets store. Include externally hosted image rights/availability in the asset inventory. Docker named volumes persist locally but are not independent backups.

For a restore rehearsal: choose a documented backup pair, restore into a new isolated database and storage target, point a staging release at it, verify row counts and referential integrity, sample event-image access, and check ticket status/history with synthetic or approved sanitized data. Disable or isolate unintended outbound traffic. Never run development startup commands against the restored environment because they seed fixtures. Record start/end time, data cutoff, errors and acceptance evidence.

Only switch production traffic after the authorized operator verifies the target and reconciliation. Preserve the previous environment for rollback under an agreed retention window. If schema changes are incompatible with the older application, reverting code alone is not a rollback. Never use `db:reset` or `docker compose down -v` to recover production.

This documentation does not execute backups, restores, infrastructure changes or credential rotation. Exact provider commands and schedules must be added once the real hosting environment is identified.
