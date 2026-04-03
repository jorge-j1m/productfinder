FROM oven/bun:1 AS base
WORKDIR /app

# --- prune: extract only what the server needs from the monorepo ---
FROM base AS prune
RUN bun add -g turbo@^2
COPY . .
RUN turbo prune server --docker

# --- deps: full install to resolve lockfile ---
FROM base AS deps
COPY --from=prune /app/out/json/ .
RUN bun install --ignore-scripts

# --- prod-deps: production-only install using resolved lockfile ---
FROM base AS prod-deps
COPY --from=prune /app/out/json/ .
COPY --from=deps /app/bun.lock ./bun.lock
RUN bun install --ignore-scripts --production --frozen-lockfile

# --- runner: prod deps + source ---
FROM base AS runner

COPY --from=prod-deps /app/ .
COPY --from=prune /app/out/full/ .

EXPOSE 8080
CMD ["bun", "run", "apps/server/src/index.ts"]
