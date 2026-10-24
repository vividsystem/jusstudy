# syntax=docker/dockerfile:1
FROM oven/bun:1-alpine AS builder

WORKDIR /app

COPY package.json bun.lock* tsconfig.json turbo.json ./

COPY shared/package.json   ./shared/package.json
COPY client/package.json ./client/package.json
COPY server/package.json ./server/package.json

RUN apk update && apk add git
RUN bun install --frozen-lockfile

COPY shared   ./shared
COPY client ./client
COPY server ./server

ARG VITE_CLIENT_URL
ARG VITE_SERVER_URL
ENV VITE_CLIENT_URL=$VITE_CLIENT_URL \
		VITE_SERVER_URL=$VITE_SERVER_URL


RUN cd client && bun run build --base $VITE_CLIENT_URL


# ── Runtime stage ──────────────────────────────────────────────────────────────
FROM nginx:stable-alpine3.23 AS runtime

# React Router uses client-side routing — all requests must fall back to
# index.html so the router can handle the path, otherwise a hard refresh
# on /some/route returns a 404 from nginx.
COPY --from=builder /app/client/dist /usr/share/nginx/html/docs
COPY --from=builder /app/client/client-dist /usr/share/nginx/html

COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 3500
