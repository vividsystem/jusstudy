# syntax=docker/dockerfile:1
# Build context must be the monorepo root:
#   docker build -f backend/Dockerfile .

FROM oven/bun:1-alpine AS builder

WORKDIR /app

COPY package.json bun.lock* tsconfig.json ./

COPY client/package.json ./client/package.json
COPY shared/package.json  ./shared/package.json
COPY server/package.json ./server/package.json

RUN bun install --frozen-lockfile

COPY shared  ./shared
COPY server ./server

FROM dhi.io/bun:1-alpine3.22 AS runtime

WORKDIR /app

COPY --from=builder --chown=1000:1000 /app/node_modules  ./node_modules
COPY --from=builder --chown=1000:1000 /app/shared        ./shared
COPY --from=builder --chown=1000:1000 /app/server      ./server
COPY --from=builder --chown=1000:1000 /app/package.json  ./package.json
COPY --from=builder --chown=1000:1000 /app/tsconfig.json  ./tsconfig.json


USER 1000

EXPOSE 3000

ENTRYPOINT ["bun", "run", "server/src/index.ts"]
