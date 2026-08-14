FROM node:22-alpine AS build
WORKDIR /app

ENV PNPM_HOME=/pnpm
ENV PATH=$PNPM_HOME:$PATH
RUN corepack enable

ARG NEXT_PUBLIC_API_URL=http://localhost:3000
ENV NEXT_PUBLIC_API_URL=$NEXT_PUBLIC_API_URL

COPY package.json pnpm-lock.yaml* pnpm-workspace.yaml ./
COPY apps/api/package.json apps/api/package.json
COPY apps/web/package.json apps/web/package.json
RUN pnpm install --frozen-lockfile

COPY apps apps
RUN pnpm --recursive run build

FROM node:22-alpine AS production
WORKDIR /app

ENV NODE_ENV=production
ENV PNPM_HOME=/pnpm
ENV PATH=$PNPM_HOME:$PATH
ENV API_PORT=3000
ENV WEB_PORT=8088

RUN corepack enable

COPY package.json pnpm-lock.yaml* pnpm-workspace.yaml ./
COPY apps/api/package.json apps/api/package.json
COPY apps/web/package.json apps/web/package.json
RUN pnpm install --prod --frozen-lockfile

COPY apps/web/next.config.mjs apps/web/next.config.mjs
COPY --from=build /app/apps/api/dist apps/api/dist
COPY --from=build /app/apps/web/.next apps/web/.next
COPY scripts/start-production.sh scripts/start-production.sh

EXPOSE 3000 8088
CMD ["sh", "scripts/start-production.sh"]
