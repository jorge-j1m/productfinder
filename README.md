# ProductFinder

A monorepo for a grocery-price-comparison product: customers search products and compare prices across nearby stores, while store employees manage brands, stores, catalog, and inventory from an admin panel.

## Repository Structure

Turborepo monorepo using npm workspaces.

```
productfinder/
├── apps/
│   ├── server/         # Bun + Hono API (better-auth, admin + public oRPC)
│   ├── admin-panel/    # Next.js employee admin dashboard
│   └── web/            # Next.js customer-facing storefront
├── packages/
│   ├── database/           # Drizzle schema, entities, Zod types, TypeIDs
│   ├── admin-orpc/         # Protected oRPC contract (shared by server + admin-panel)
│   ├── public-orpc/        # Public read-only oRPC contract (shared by server + web)
│   ├── employee-auth/      # Better-auth React client + typed session hook
│   ├── logger/             # Pino-based shared logger
│   ├── ui/                 # Shared React primitives (scaffold; minimally consumed)
│   ├── eslint-config/      # Shared ESLint flat configs (base / next / react)
│   └── typescript-config/  # Shared tsconfig presets (base / nextjs / react-library)
├── apps/server/drizzle/    # Generated SQL migrations
├── docs/
│   ├── adr/                # Architecture Decision Records
│   └── llms/               # Reference documentation for external libraries
├── docker-compose.yml      # Postgres, migrations, server, admin-panel, web, tunnel
├── turbo.json              # Turborepo task pipeline
└── package.json            # Workspace root
```

## Applications

### `apps/server` — Bun + Hono API

Single API process that mounts four areas on top of a shared Postgres pool:

- `GET /` — health check.
- `/api/employee-auth/*` — all better-auth endpoints (email/password sign-in, sessions, etc.).
- `/api/store-brands/*` and `/api/stores/*` — legacy REST CRUD kept for the seed script flow.
- `/rpc/public/*` — public oRPC handler (`@repo/public-orpc`), no auth. Used by the customer web app.
- `/rpc/*` — admin oRPC handler (`@repo/admin-orpc`). The server reads the better-auth session at this boundary, validates it with `EmployeeSessionSchema`, and injects it into the oRPC context; `protectedProcedure` converts a null/suspended session into 401/403.

Other notable pieces:

- `src/app.ts` — `createApp(db)` factory used by both production and tests for identical behavior.
- `src/db/` — Postgres pool + drizzle instance (re-exports `@repo/database/schema`).
- `src/lib/employee_auth.ts` — `createAuth(db)` wrapping better-auth with `employeeAuthConfig` from `@repo/database`.
- `src/scripts/seed_brand_stores.ts` — seeds real South Florida brands and stores by calling admin-orpc with a synthetic admin session.
- `src/scripts/create_test_employee.ts` — interactive CLI to provision a test ADMIN employee via HTTP.
- `drizzle/` — generated SQL migrations (`drizzle-kit generate` / `migrate`).
- `test/` — Bun tests preloaded via `bunfig.toml`. `test/setup.ts` spins up PGlite in-memory, applies the schema with `drizzle-kit`'s `pushSchema`, then wraps each test in `BEGIN` / `ROLLBACK` for isolation. `test/helpers/test_factories.ts` provides `createTestBrand` / `Store` / `Employee` / chained helpers.

Stack: Bun runtime, Hono, `@orpc/server` + `@orpc/openapi` (Scalar docs at the handler), drizzle-orm + node-postgres, better-auth, Zod.

### `apps/admin-panel` — Employee admin dashboard

Next.js 16 / React 19 app on port **3000**. Tailwind CSS v4, shadcn/ui components (`new-york` style, neutral palette), Radix primitives, TanStack Query + `@orpc/tanstack-query`.

- `src/proxy.ts` — Next middleware that optimistically redirects unauthenticated users to `/login` based on the better-auth session cookie (real validation is still server-side).
- `src/app/(app)/layout.tsx` — shell with `AppSidebar` + `Navbar` (session-aware via `useEmployeeSession`).
- Feature routes under `src/app/(app)/`:
  - `dashboard/` — session info panel.
  - `store_brands/`, `stores/`, `products/`, `employees/`, `inventory/` — paginated data tables with create/edit/delete dialogs wired through oRPC mutations.
  - `inventory/` adds stock adjustment, sale set/clear, and a barcode lookup flow.
  - `products/` and `inventory/` use `html5-qrcode` via `src/components/barcode-scanner.tsx`.
- `src/lib/navigation.ts` — role hierarchy (STAFF / MANAGER / ADMIN), grouped nav items, and `getGroupedNavigationForRole()` filtering.
- `src/lib/orpc.ts` — typed oRPC client against `/rpc` with `credentials: "include"` for cookie auth.
- `src/components/ui/` — shadcn components (sidebar, dialog, select, table, etc.).

### `apps/web` — Customer-facing storefront

Next.js 16 / React 19 app on port **3001**. Tailwind CSS v4, `next-themes` for light/dark, TanStack Query + the public oRPC client.

- `src/app/page.tsx` — landing page with a product search box and stock-type pills.
- `src/app/search/page.tsx` — paginated product search with sort / stock-type filters.
- `src/app/products/[id]/page.tsx` — price comparison. Fetches one raw `prices.compare` payload (product + inventory with store + brand) and does all sale detection, effective-price calculation, haversine distance, brand filtering, radius filtering, and sorting client-side (see ADR-007).
- `src/app/stores/[id]/page.tsx` — store detail with per-product pricing, in-stock / on-sale filters, and client-side pagination.
- `src/hooks/use-location.ts` — context-backed geolocation state used to enable distance-based features; auto-requests on mount.
- `src/hooks/use-distance-unit.ts` — mi/km toggle persisted in `localStorage` via `useSyncExternalStore`.
- `src/lib/prices.ts` — pure functions for processing raw inventory (`processCompareData`, `processStoreData`, `haversineKm`, `isSaleActive`).
- `src/lib/format.ts` — price (`$X.XX` with optional `/kg`) and distance formatting.

## Shared Packages

### `@repo/database`

Single source of truth for the database layer.

- `src/entities/<name>/` — one folder per domain (`store-brands`, `stores`, `employees`, `products`, `inventory`). Each entity has `id.ts` (TypeID-backed branded type + `is*`/`as*` validators + Zod schema), `schema.ts` (drizzle table), `types.ts` (drizzle-zod `selectSchema` / `insertSchema`), and `index.ts` re-exporting the triple.
- `src/brand.ts` — shared `Brand<T, TBrand>` utility.
- `src/relations.ts` — central drizzle relations for nested queries (`brand`, `store`, `employees`, `inventory`, `product`, etc.).
- `src/db.ts` — bundled `schema` object + a `_localDb` used by package scripts; exports `type DB`.
- `src/entities/employees/auth_config.ts` and `auth_types.ts` — better-auth `user/session/account/verification` model remapping, `EmployeeExtension` additional fields, `EmployeeSessionSchema` / `EmployeeAuthUserSchema`.
- `src/scripts/` — local maintenance scripts run against `_localDb`: `drop_tables.ts`, `empty_tables.ts`, `seed_products.ts` (pulls ~100 grocery products from Open Food Facts with retry/backoff), `seed_inventory.ts` (generates prices and stock for every store × product pair using keyword-based price rules and brand multipliers).
- `src/legacy/` — pre-entity schema kept temporarily for reference.

Package exports are entity-scoped (`@repo/database/stores`, `@repo/database/products`, etc.) as well as the root barrel.

Tables and IDs:

| Table                                                              | ID prefix                  | Notes                                                                                                                                                                                                         |
| ------------------------------------------------------------------ | -------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `store_brands`                                                     | `sb_`                      | Unique name + logo URL.                                                                                                                                                                                       |
| `stores`                                                           | `store_`                   | `brandId` FK, address fields, `latitude` / `longitude` (double precision) for proximity queries.                                                                                                              |
| `products`                                                         | `prod_`                    | Unique `name`, `sku`, and optional unique `barcode`; `stockType` enum `WEIGHT`/`UNITS`.                                                                                                                       |
| `inventory`                                                        | `inv_`                     | `(storeId, productId)` unique. Integer `quantity` (grams for WEIGHT, units for UNITS), integer `regularPrice`/`salePrice` in cents, optional `saleStartDate`/`saleEndDate`. Cascades on store/product delete. |
| `employees`                                                        | `emp_`                     | Better-auth user with extra `firstName`, `lastName`, `role` (`STAFF`/`MANAGER`/`ADMIN`), `storeId`, `status` (`ACTIVE`/`SUSPENDED`).                                                                          |
| `employee_sessions`, `employee_accounts`, `employee_verifications` | `esess_`, `eacc_`, `evfn_` | Better-auth-managed.                                                                                                                                                                                          |

### `@repo/admin-orpc`

oRPC contract used by the admin panel.

- `src/base.ts` — `protectedProcedure` with shared error shapes. Reads `{ db, requestId, session }` from the context, throws `UNAUTHORIZED` on missing session and `FORBIDDEN` on suspended accounts.
- `src/store_brands.ts`, `stores.ts`, `employees.ts`, `products.ts`, `inventory.ts` — paginated CRUD procedures with Zod-validated inputs/outputs, field-based filtering, and consistent `{ data, pagination }` responses. Inventory adds `getByStoreProduct`, `getEffectivePrice`, `adjustStock` (atomic delta with non-negative guard), `setSale` / `clearSale`, `upsert`, and `bulkUpsert` (up to 100 rows).
- `src/index.ts` — assembles `adminRouter` and exports the `AdminRouter` client type.

### `@repo/public-orpc`

Unauthenticated contract used by the web app.

- `src/products.ts` — `search`, `get`, and `getByBarcode`.
- `src/stores.ts` — `nearby` (Haversine in SQL, radius-limited with optional brand filter) and `get`.
- `src/prices.ts` — `compare` (all inventory for a product, including store + brand) and `forStore` (all inventory for a store, including product). Returns raw records; the web app computes effective price, distance, sorting, filtering, and stats client-side.

### `@repo/employee-auth`

- `src/client.ts` — `employeeAuthClient` built from `createAuthClient` with `inferAdditionalFields<...>` matching `EmployeeExtension`. Reads its base URL from `NEXT_PUBLIC_API_URL`.
- Re-exports `employeeSignIn`, `employeeSignOut`, and a typed `useEmployeeSession` hook whose `data.user` is the extended `EmployeeAuthUser`.
- `src/types.ts` — re-exports employee types from `@repo/database` to preserve a single source of truth.

### `@repo/logger`

Pino wrapper with `pino-pretty` in development, structured JSON in production, secret redaction, disabled in tests unless `LOG_LEVEL` is set. Exposes `logger` and `createChildLogger(context)`. Currently referenced only by its own `example.ts`; apps log via `console.*`.

### `@repo/ui`

Tiny scaffold package (`button`, `card`, `code`) left over from the initial Turborepo template. Real UI primitives live under `apps/admin-panel/src/components/ui/` and `apps/web/src/components/ui/`.

### `@repo/eslint-config` and `@repo/typescript-config`

Shared flat ESLint configs (`base`, `next-js`, `react-internal`) and tsconfig presets (`base.json`, `nextjs.json`, `react-library.json`). Consumed by every package through `extends` / direct imports.

## How the pieces fit together

```
Admin panel (Next.js)        Web app (Next.js)
      │                             │
      │  /rpc/* (cookie auth)       │  /rpc/public/*  (no auth)
      ▼                             ▼
           apps/server (Hono)
      ├─ /api/employee-auth/*  (better-auth)
      ├─ /rpc/*                (adminRouter + protectedProcedure)
      └─ /rpc/public/*         (publicRouter, read-only)
                │
                ▼
          @repo/database  →  PostgreSQL (drizzle-orm)
```

Every ID is a TypeID-prefixed branded string produced by `typeid-js` (`store_01h…`, `prod_01h…`, etc.). IDs flow end-to-end as Zod-refined strings in API contracts and get narrowed to branded types via `as<Entity>Id()` inside handlers. Money is stored as integer cents; weights are grams. See `apps/server/BUSINESS_LOGIC_RULES.md` for the full rule set and `docs/adr/` for architectural decisions.

## Getting started

### Prerequisites

- Node.js 18+
- npm 11+
- [Bun](https://bun.sh) 1.x (runs the server and its tests)
- Docker + Docker Compose, or a local Postgres on port 5433

### Install

```bash
npm install
```

### Start Postgres and run migrations

Using Docker Compose (starts Postgres and runs `drizzle-kit migrate` once):

```bash
docker compose --profile dev up -d postgres migrate
```

Or run migrations against a local Postgres:

```bash
cp apps/server/.env.example apps/server/.env     # set DATABASE_URL / BETTER_AUTH_SECRET
bunx --cwd apps/server drizzle-kit migrate
```

### Seed data (optional)

```bash
# Brands and stores (calls the admin-orpc router with a synthetic admin session)
bun run apps/server/src/scripts/seed_brand_stores.ts

# Products from Open Food Facts (~100 grocery items)
bun run packages/database/src/scripts/seed_products.ts

# Inventory (prices + stock) for every store × product pair
bun run packages/database/src/scripts/seed_inventory.ts

# Interactive: create a test ADMIN employee via the API (server must be running)
bun run apps/server/src/scripts/create_test_employee.ts
```

### Develop

Start every app:

```bash
npm run dev
```

Or a single app via Turborepo filters:

```bash
npx turbo run dev --filter=server
npx turbo run dev --filter=admin-panel
npx turbo run dev --filter=web
```

Defaults: server on `:8080`, admin-panel on `:3000`, web on `:3001`.

### Test, lint, type-check, build

```bash
npm run test          # bun test under apps/server, via turbo
npm run lint
npm run check-types
npm run build
npm run format        # prettier on **/*.{ts,tsx,md}
npm run check         # format + lint + check-types + build + test
```

Server tests use PGlite in-memory Postgres plus per-test `BEGIN`/`ROLLBACK` (see `apps/server/test/setup.ts`).

## Environment variables

### `apps/server` (see `apps/server/.env.example`)

- `DATABASE_URL` — Postgres connection string.
- `BETTER_AUTH_SECRET` — secret for auth token signing (generate with `openssl rand -base64 32`).
- `ADMIN_CLIENT_URL`, `WEB_CLIENT_URL` — allowed CORS origins beyond `http://localhost:3000/3001`.
- `NODE_ENV` — `development` / `production` / `test`. In production, better-auth sets cross-subdomain cookies on `.jorgejim.com`.
- `LOG_LEVEL` — optional override for `@repo/logger`.

### `apps/admin-panel` and `apps/web`

- `NEXT_PUBLIC_API_URL` — base URL of the server (default `http://localhost:8080`). Baked in at build time because it uses the `NEXT_PUBLIC_` prefix.

### Root `.env` (used by `docker-compose.yml`)

- `SERVER_NODE_ENV` → passed to the server container as `NODE_ENV`.
- `SERVER_URL`, `ADMIN_CLIENT_URL`, `WEB_CLIENT_URL` — service URLs baked into the server container's env.
- `ADMIN_PANEL_API_URL`, `WEB_API_URL` — build args used to bake `NEXT_PUBLIC_API_URL` into the Next.js images.
- `CLOUDFLARE_TUNNEL_TOKEN` — token for the `pf-tunnel` service (prod profile only).

## Docker

`docker-compose.yml` defines profiles so only the relevant services start:

| Service       | Profiles              | Notes                                                                                                                                                                                                                            |
| ------------- | --------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `postgres`    | `dev`, `test`, `prod` | Postgres 17. Host port **5433** → container 5432. `pgdata` volume. Healthcheck via `pg_isready`.                                                                                                                                 |
| `migrate`     | `dev`, `test`, `prod` | One-shot `bunx drizzle-kit migrate`, depends on `postgres` being healthy.                                                                                                                                                        |
| `server`      | `test`, `prod`        | Built via multi-stage `apps/server/Dockerfile` (`turbo prune` → `bun install` → `bun run src/index.ts`). Exposes 8080.                                                                                                           |
| `admin-panel` | `test`, `prod`        | `apps/admin-panel/Dockerfile` prunes with turbo, builds with Node 22 using Next.js `output: "standalone"`, serves on 3000 as a non-root `nextjs` user. Takes `ADMIN_PANEL_API_URL` as a build arg to bake `NEXT_PUBLIC_API_URL`. |
| `web`         | `test`, `prod`        | Same pattern as admin-panel, serving on 3001, build arg `WEB_API_URL`.                                                                                                                                                           |
| `pf-tunnel`   | `prod`                | Cloudflare tunnel (`cloudflare/cloudflared`) exposing the server publicly.                                                                                                                                                       |

Common commands:

```bash
# Local dev Postgres only
docker compose --profile dev up -d postgres migrate

# Full stack
docker compose --profile prod up --build

# Stop and remove everything (keeps volumes)
docker compose --profile prod down
```

## Documentation

- `docs/adr/` — Architecture Decision Records (branded TypeIDs, single-source-of-truth types, client-side data fetching in the admin, transaction-based test isolation, barcode scanner, public-app architecture, raw-API + client-side processing, public frontend design).
- `docs/llms/` — Reference documentation for external libraries (Next.js, Drizzle, Hono, oRPC, better-auth, Turborepo) plus `codebase-patterns.md`.
- `apps/server/BUSINESS_LOGIC_RULES.md` — natural-language business rules for every entity.
- `packages/database/README.md` — entity-based DB package guide (adding, editing, or removing an entity; branded types; drizzle-kit workflow).
