# ProductFinder

A modern monorepo for product finding and store management, built with TypeScript and turborepo.

## Repository Structure

This is a **Turborepo monorepo** with npm workspaces, containing multiple applications and shared packages:

```
productfinder/
├── apps/
│   ├── admin-panel/    # Admin dashboard (Next.js)
│   ├── server/         # API server (Bun + Hono)
│   └── web/            # Customer-facing app (Next.js)
├── packages/
│   ├── database/       # Drizzle schemas & types
│   ├── admin-orpc/     # oRPC contracts
│   ├── employee-auth/  # Better-auth setup
│   ├── logger/         # Pino logger
│   └── [config packages]
```

## Tech Stack

### Backend (`apps/server`)

- **Runtime**: Bun (fast JavaScript runtime)
- **Framework**: Hono (lightweight web framework)
- **RPC**: oRPC (type-safe RPC with OpenAPI generation)
- **Database**: PostgreSQL + Drizzle ORM
- **Auth**: Better-auth (employee authentication)
- **Testing**: Bun test with transaction isolation
- **IDs**: TypeID (branded, sortable unique identifiers)

### Admin Panel (`apps/admin-panel`)

- **Framework**: Next.js 15 + Turbopack
- **Styling**: Tailwind CSS v4
- **Components**: Radix UI primitives
- **Data Fetching**: TanStack Query + oRPC client
- **Auth**: Better-auth React client
- **Rendering**: Client-side data fetching (no SSR complexity)

### Web App (`apps/web`)

- **Framework**: Next.js 15 + Turbopack
- **Styling**: Tailwind CSS v4
- Status: Placeholder/minimal implementation

### Shared Packages

#### `@repo/database`

- Drizzle ORM schemas organized by entity
- Branded TypeID validators for type safety
- Zod schemas for runtime validation
- Relational query utilities
- Entity-based structure: `entities/stores/`, `entities/employees/`, etc.

#### `@repo/admin-orpc`

- Shared oRPC contract between server and admin-panel
- Type-safe API procedures with Zod validation
- Automatic OpenAPI/Scalar documentation
- Standardized pagination, filtering, and sorting

#### `@repo/employee-auth`

- Better-auth client/server configuration
- Custom employee fields (role, storeId, status)
- Type-safe session hooks

#### `@repo/logger`

- Pino-based logging utilities
- Shared logger instance
- Child logger creation for context

## How It All Connects

### Type-Safe Communication Flow

```
Admin Panel (Next.js)
    ↓ HTTP requests
    ↓ via oRPC client
    ↓
Server (Hono)
    ↓ /rpc/* endpoints
    ↓ oRPC handler
    ↓
@repo/admin-orpc (shared contract)
    ↓ procedures
    ↓
Database (PostgreSQL)
    ↓ via Drizzle ORM
    ↓
@repo/database (schemas)
```

### Key Architectural Patterns

1. **Entity-Based Organization**: Each database entity (stores, employees, brands) lives in its own folder with schema, types, IDs, and validators.

2. **Branded TypeIDs**: All IDs use TypeID with branded types for compile-time safety (e.g., `StoreId`, `EmployeeId`).

3. **oRPC Contract Sharing**: The `admin-orpc` package defines type-safe procedures used by both server and client, ensuring end-to-end type safety.

4. **Client-Side Data Fetching**: Admin panel uses TanStack Query for data fetching, keeping the UI fresh and avoiding SSR complexity.

5. **Test Isolation**: Server tests use transaction-based isolation (BEGIN → test → ROLLBACK) for fast, independent test runs.

6. **Role-Based Access**: Employee authentication with three roles (STAFF, MANAGER, ADMIN) controlling UI navigation and API access.

## Getting Started

### Prerequisites

- Node.js 18+
- PostgreSQL database
- npm 11+

### Installation

```bash
npm install
```

### Database Setup

```bash
# Set up your database connection in .env
DATABASE_URL=postgresql://user:password@localhost:5433/productfinder
TEST_DATABASE_URL=postgresql://user:password@localhost:5433/productfinder_test

# Run migrations
cd apps/server
bunx drizzle-kit push
```

### Development

Run all apps in development mode:

```bash
npm run dev
```

Run specific apps:

```bash
# Server only
npm run dev --filter=server

# Admin panel only
npm run dev --filter=admin-panel
```

### Testing

```bash
# Run all tests
npm run test

# Server tests only
npm run test --filter=server
```

### Code Quality

```bash
# Format code
npm run format

# Lint
npm run lint

# Type check
npm run check-types

# Build
npm run build

# Run all checks (format + lint + type-check + build + test)
npm run check
```

## Environment Variables

### Server (`apps/server`)

- `DATABASE_URL`: PostgreSQL connection string
- `TEST_DATABASE_URL`: Test database connection string
- `BETTER_AUTH_SECRET`: Secret for auth token signing
- `BETTER_AUTH_URL`: Base URL for auth callbacks
- `LOG_LEVEL`: Logging level (info, debug, error)
- `NODE_ENV`: Environment (development, production, test)

### Admin Panel (`apps/admin-panel`)

- `NEXT_PUBLIC_API_URL`: Server API URL (default: http://127.0.0.1:8080)

## Key Features

- ✅ **Multi-store Management**: Manage multiple store brands and locations
- ✅ **Employee Management**: CRUD operations with role-based access
- ✅ **Type-Safe APIs**: End-to-end TypeScript with runtime validation
- ✅ **Authentication**: Better-auth with employee-specific fields
- ✅ **Comprehensive Testing**: Transaction-isolated tests with Bun
- ✅ **Auto-Generated Docs**: OpenAPI/Scalar docs from oRPC contracts

## Project Commands

- `npm run dev` - Start all apps in development
- `npm run build` - Build all apps
- `npm run test` - Run all tests
- `npm run lint` - Lint all code
- `npm run format` - Format all code with Prettier
- `npm run check-types` - Type check all packages
- `npm run check` - Run all validation (format, lint, type-check, build, test)

## Documentation

For detailed coding guidelines and conventions, see `.windsurf/rules/repo-rules.md`.
