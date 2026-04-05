FROM oven/bun:1 AS base
WORKDIR /app

# --- prune: extract only what admin-panel needs ---
FROM base AS prune
RUN bun add -g turbo@^2
COPY . .
RUN turbo prune admin-panel --docker

# --- deps: install all dependencies (needed for build) ---
FROM base AS deps
COPY --from=prune /app/out/json/ .
RUN bun install --ignore-scripts

# --- builder: build with Node (Next.js is most reliable with Node) ---
FROM node:22-slim AS builder
WORKDIR /app

COPY --from=deps /app/ .
COPY --from=prune /app/out/full/ .

ARG ADMIN_PANEL_API_URL
ENV NEXT_PUBLIC_API_URL=${ADMIN_PANEL_API_URL}
ENV NEXT_TELEMETRY_DISABLED=1
RUN npm run build --workspace=admin-panel

# --- runner: minimal production image ---
FROM node:22-slim AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

RUN addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 nextjs

COPY --from=builder --chown=nextjs:nodejs /app/apps/admin-panel/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/apps/admin-panel/.next/static ./apps/admin-panel/.next/static
COPY --from=builder --chown=nextjs:nodejs /app/apps/admin-panel/public ./apps/admin-panel/public

USER nextjs
EXPOSE 3000
CMD ["node", "apps/admin-panel/server.js"]
