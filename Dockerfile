# syntax=docker/dockerfile:1
FROM node:22-bookworm-slim AS base
RUN apt-get update && apt-get install -y --no-install-recommends openssl ca-certificates \
    && rm -rf /var/lib/apt/lists/*
WORKDIR /app
ENV PNPM_HOME=/pnpm
ENV PATH=$PNPM_HOME:$PATH
RUN corepack enable && corepack prepare pnpm@9.14.4 --activate

FROM base AS build
ENV NEXT_TELEMETRY_DISABLED=1
ENV NEXT_PUBLIC_API_URL=/api
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY apps/api/package.json apps/api/package.json
COPY apps/web/package.json apps/web/package.json
COPY prisma prisma
RUN pnpm install --frozen-lockfile
COPY scripts scripts
COPY apps apps
RUN pnpm exec prisma generate && pnpm run lint && pnpm run build

FROM base AS production
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV NEXT_PUBLIC_API_URL=/api
ENV WEB_PORT=8088
ENV LOCAL_UPLOAD_DIR=/app/uploads
# Keep the locked toolchain/Prisma CLI for an explicit, operator-run schema setup.
# No schema mutation or dependency download happens when the app starts.
COPY --from=build /app/node_modules ./node_modules
COPY --from=build /app/apps/api/node_modules ./apps/api/node_modules
COPY --from=build /app/apps/web/node_modules ./apps/web/node_modules
COPY --from=build /app/apps/api/dist ./apps/api/dist
COPY --from=build --chown=node:node /app/apps/web/.next ./apps/web/.next
COPY --from=build /app/apps/web/public ./apps/web/public
COPY apps/web/next.config.mjs apps/web/package.json ./apps/web/
COPY package.json pnpm-workspace.yaml ./
COPY prisma prisma
COPY scripts/start-production.mjs scripts/container-health.mjs ./scripts/
RUN mkdir -p /app/uploads && chown node:node /app/uploads
USER node
EXPOSE 8088
HEALTHCHECK --interval=30s --timeout=5s --start-period=40s --retries=3 \
    CMD ["node", "scripts/container-health.mjs"]
CMD ["node", "scripts/start-production.mjs"]
