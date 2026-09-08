# Deploy Passmint with Docker

This image runs the existing Next.js web and NestJS API together. It supports current event publishing, guest/member ticket issuance and online QR validation. It does **not** add verified payments, email delivery or password recovery; do not treat priced-ticket issuance as proof of payment.

## Build and test

From a clean checkout with Docker Engine/Compose installed:

```sh
docker build -t passmint:local .
node scripts/docker-smoke.mjs passmint:local
```

The smoke test requires Node.js 22+ and Docker. It creates uniquely named, isolated PostgreSQL/container/volume resources and removes only those resources afterward. It verifies same-origin API routing, database readiness, static/public assets, ordinary-user ownership, guest issuance, scan/duplicate handling, upload persistence, container replacement and process shutdown. No existing application database is used.

The build uses the frozen pnpm lockfile, generates Prisma Client and runs type checks and application builds inside Linux. The runtime intentionally includes the locked Node dependencies and Prisma CLI for operator-run schema setup; it favors a straightforward deployable artifact over a minimal standalone image. Startup does not install dependencies. Schema initialization is disabled by default; explicit opt-in only initializes an empty schema. No `.env` files, local modules, caches or upload data are copied from the host.

## Coolify deployment (Dockerfile build pack)

Use the repository Dockerfile with a separate PostgreSQL 16 resource in Coolify. The standalone-host Compose file below requires a local `.env.production` and is not the Coolify configuration.

1. Create/start PostgreSQL in Coolify. Ensure the app and database share a reachable Docker network; use its internal connection URL as `DATABASE_URL`, not `localhost`.
2. Connect `rmkasendwa/passmint`, branch `main`. Select **Dockerfile** build pack, base directory `/`, Dockerfile `/Dockerfile`, and **Ports Exposes `8088`**. Keep the image's default start command. The web listens on `0.0.0.0:8088`; the internal API on port 3000 must remain private.
3. Add runtime environment variables: `DATABASE_URL`, a unique random `AUTH_SECRET` (at least 32 characters), `PORT=8088`, `PUBLIC_API_URL=/api`, `SEED_DEMO_DATA=false`. Leave `ADMIN_EMAILS` empty. Do not override `NEXT_PUBLIC_API_URL`; `/api` is already built into the image. Secrets need runtime availability, not build-time injection.
4. For a **new, empty database**, set `INITIALIZE_DATABASE=true` for the first deploy. The initializer checks for tables and creates the schema before starting the API. A database advisory lock serializes concurrent first starts. Existing tables cause setup to be skipped entirely; this is not an upgrade/migration mechanism. After the first successful deploy, remove the variable or set it to `false`.
5. Add persistent storage with destination `/app/uploads`, writable by UID 1000, or configure external S3 storage. Prefer a named volume; an empty root-owned bind directory needs its permissions prepared. Keep the same storage on redeploy.
6. Assign your HTTPS domain and retain the image's health check. It uses Node (already installed) to call `/api/ready`; no curl installation is required. Deploy and check the logs, healthy state, event creation, upload and ticket scan.

Coolify's pre-deployment hook runs in the old container and cannot initialize the first deployment. Post-deployment is also too late for an API that needs tables to start. Use the opt-in empty-schema initializer above, or initialize separately with the image's Prisma CLI before deploying. For later schema upgrades, back up and apply a reviewed migration explicitly; leaving `INITIALIZE_DATABASE=true` does not update existing tables.

The same first-start flow is covered by `node scripts/docker-smoke.mjs passmint:local --initialize-at-startup`, including a redeploy that proves existing records and extra schema objects are preserved. This validates the container behavior, not your particular Coolify server, DNS or database credentials.

References: [Coolify Dockerfile build pack](https://coolify.io/docs/applications/build-packs/dockerfile), [deployment-hook behavior](https://next.coolify.io/docs/applications/builds/dockerfile), and [health-check precedence](https://coolify.io/docs/knowledge-base/health-checks).

## First deployment on a Docker host

Copy `.env.production.example` to `.env.production`. Generate **two independent** values with the following command, setting `POSTGRES_PASSWORD` and `AUTH_SECRET`:

```sh
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

Use URL-safe hexadecimal for the database password because Compose embeds it in a connection URL. Keep the environment file outside source control. The startup script requires `DATABASE_URL` and a non-placeholder signing secret of at least 32 characters. Ordinary users already own/administer their events; leave `ADMIN_EMAILS` empty unless you have reviewed privileged provisioning separately.

```sh
docker compose --env-file .env.production -f compose.production.yml build app
docker compose --env-file .env.production -f compose.production.yml up -d --wait postgres
docker compose --env-file .env.production -f compose.production.yml run --rm db-setup
docker compose --env-file .env.production -f compose.production.yml up -d --wait app
```

`db-setup` uses the included Prisma CLI to run `db push --skip-generate`. This initializes a new database without resetting it and without `--accept-data-loss`. It is an explicit operation because this repository does not yet have a versioned migration history. On an existing database, inspect the schema diff and take a verified backup first. An unsuccessful schema update is not permission to bypass a data-loss warning.

The app binds host loopback at port 8088 by default. Put an HTTPS reverse proxy on the host in front of `http://127.0.0.1:8088`. Forward all paths, including `/api/*`, static files and `/api/uploads/*`. Configure the proxy request size to accommodate the API's 7 MB body limit. HTTPS is also needed for camera scanning outside localhost. If your reverse proxy runs on another machine or container, deliberately configure its network access; `BIND_ADDRESS=0.0.0.0` exposes the host port and should be paired with appropriate host firewall/routing.

PostgreSQL has no published host port in the production Compose file. Database and filesystem uploads use named volumes. `docker compose down` keeps those volumes; **do not add `-v` when retaining data**. The original `docker-compose.yml` remains a local development stack. The separate production file avoids inheriting local database ports and development storage credentials.

## Runtime configuration

| Setting | Behavior |
| --- | --- |
| `DATABASE_URL` | Required by the image; Compose constructs an internal PostgreSQL URL |
| `AUTH_SECRET` | Required; rotation invalidates existing bearer sessions |
| `INITIALIZE_DATABASE` | Default off; `true` initializes only an empty schema before the API starts; skips any schema with tables |
| `PORT` / `WEB_PORT` | Image web listener, default 8088; production Compose fixes container port to 8088 and uses `WEB_PORT` for host mapping |
| Internal API | Fixed loopback port 3000, not exposed by production Compose; do not use 3000 as the web port |
| Browser API | Built as relative `/api`, proxied by Next to internal API; works across domains without rebuilding |
| Server web requests | Supervisor supplies internal API URL; no public DNS dependency |
| `LOCAL_UPLOAD_DIR` | `/app/uploads`; mount persistent storage writable by UID 1000 |
| `PUBLIC_API_URL` | Defaults to `/api`, so local images use same-origin `/api/uploads/...` URLs |
| `S3_*` | Optional object storage settings; omit bucket/access keys to use filesystem volume |
| `SEED_DEMO_DATA` | Production does not seed demo events unless explicitly `true` |
| `ADMIN_EMAILS` | Optional platform-wide role assignment, independent of ordinary event ownership |

Image startup bypasses the local development environment loader, so it does not silently supply MinIO credentials. External S3-compatible storage requires bucket, access key and secret, plus appropriate endpoint/region and a browser-reachable public base URL. Only event artwork should be public. Back up object storage separately if used.

Production web pages do not substitute demo events for API failures. Existing demo records already stored in a database are not removed automatically. `/api/health` reports API process liveness; `/api/ready` checks the database through the web proxy, and is used by Docker health checks. Health is not proof that a new database has been initialized: follow schema setup and test event creation.

## Existing releases and upgrades

Use a release-specific image tag/digest rather than overwriting the only known-good artifact. Record the source SHA and database schema baseline. Back up the database and uploads, rehearse any schema update in isolation, build/pull the new image, then recreate only the app after the approved schema operation. Confirm ready state and a synthetic free-ticket journey. Preserve the prior image and restore point; code rollback alone is insufficient after an incompatible schema change.

`PASSMINT_IMAGE` selects the Compose image tag. To move the built image without rebuilding on the host, use your registry's authenticated push/pull process or `docker save` / `docker load`, then skip the build step. This PR does not configure or publish to a registry account and does not deploy to a live domain.

## Troubleshooting and lifecycle

```sh
docker compose --env-file .env.production -f compose.production.yml ps
docker compose --env-file .env.production -f compose.production.yml logs --tail 100 app
```

If the app exits, check required configuration, schema initialization and database connectivity. The supervisor stops both services and exits nonzero if either child exits unexpectedly, allowing the restart policy to recover the whole app. SIGTERM is forwarded to both children, with a forced-stop deadline. Compose uses an init process to reap children.

If uploads disappear after replacement, confirm the volume or S3 configuration. For bind mounts, grant the container's UID 1000 write access to the selected upload directory. If the homepage fails while the container runs, check `/api/ready` and logs rather than assuming a successful TCP connection means a healthy API.

Maintain off-host database and upload backups and practice restoration. Docker volumes provide persistence, not backups. Real payment collection and email workflows remain separate backlog work.
