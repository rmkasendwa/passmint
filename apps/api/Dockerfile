FROM node:22-alpine AS build
WORKDIR /app

COPY package.json package-lock.json* ./
COPY apps/api/package.json apps/api/package.json
COPY apps/web/package.json apps/web/package.json
RUN npm install --workspace apps/api

COPY apps/api apps/api
RUN npm --workspace apps/api run build

FROM node:22-alpine
WORKDIR /app
ENV NODE_ENV=production

COPY package.json package-lock.json* ./
COPY apps/api/package.json apps/api/package.json
COPY apps/web/package.json apps/web/package.json
RUN npm install --omit=dev --workspace apps/api

COPY --from=build /app/apps/api/dist apps/api/dist
CMD ["npm", "--workspace", "apps/api", "run", "start"]
