# syntax=docker/dockerfile:1
FROM oven/bun:1-alpine AS builder

WORKDIR /app

COPY package.json bun.lock* tsconfig.json turbo.json ./

COPY shared/package.json   ./shared/package.json
COPY client/package.json ./client/package.json
COPY server/package.json ./server/package.json

RUN bun install --frozen-lockfile

COPY shared   ./shared
COPY client ./client
COPY server ./server

RUN cd client && bun run build


# ── Runtime stage ──────────────────────────────────────────────────────────────
FROM nginx:stable-alpine3.23 AS runtime

# React Router uses client-side routing — all requests must fall back to
# index.html so the router can handle the path, otherwise a hard refresh
# on /some/route returns a 404 from nginx.
COPY --from=builder /app/client/dist /usr/share/nginx/html

COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 3500
