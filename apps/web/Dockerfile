FROM node:22-alpine AS build
WORKDIR /app

ARG VITE_API_URL=http://localhost:3000
ENV VITE_API_URL=$VITE_API_URL

COPY package.json package-lock.json* ./
COPY apps/api/package.json apps/api/package.json
COPY apps/web/package.json apps/web/package.json
RUN npm install --workspace apps/web

COPY apps/web apps/web
RUN npm --workspace apps/web run build

FROM node:22-alpine
WORKDIR /app
ENV NODE_ENV=production
ENV PORT=80

COPY package.json package-lock.json* ./
COPY apps/api/package.json apps/api/package.json
COPY apps/web/package.json apps/web/package.json
RUN npm install --omit=dev --workspace apps/web

COPY apps/web/server.js apps/web/server.js
COPY --from=build /app/apps/web/dist apps/web/dist
WORKDIR /app/apps/web
EXPOSE 80
CMD ["node", "server.js"]
