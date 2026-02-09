# ADR-002: Single Source of Truth Type System

## Status

Accepted

## Context

In TypeScript applications, type definitions often proliferate:

- API response types defined separately from DB schemas
- Client-side types duplicating server types
- Manual synchronization between schema and types
- Drift between database reality and application types

This leads to invisible bugs when schema changes don't propagate to all type definitions.

## Decision

**All types derive from Drizzle database schemas:**

```
Drizzle Schema (schema.ts)
    ↓ via createSelectSchema/createInsertSchema
Zod Schemas (types.ts)
    ↓ via z.infer
TypeScript Types
    ↓ imported everywhere
Client & Server Code
```

**Strict rules:**

- ✅ ALL types derive from `createSelectSchema`/`createInsertSchema`
- ✅ ONLY exception: Branded IDs get custom Zod refinements
- ❌ NEVER define custom types that duplicate entity shapes
- ❌ NEVER use `as` to cast types
- ❌ NEVER use `any`

## Rationale

**Automatic Propagation:**

- Schema change → Type error everywhere that type is used
- Impossible to forget updating types
- Compiler enforces correctness

**Single Source of Truth:**

- Database schema IS the authority
- No manual synchronization needed
- drizzle-zod handles conversion automatically

**Type Safety:**

- Runtime validation (Zod) matches compile-time types (TypeScript)
- API boundaries validated automatically
- Database operations type-safe by default

## Consequences

**Positive:**

- Schema changes cascade as compile errors (catch bugs at build time)
- Zero drift between database and application types
- Refactoring is safe and comprehensive
- New team members can't accidentally violate pattern

**Negative:**

- Requires discipline to never define custom types
- Slightly less flexible (can't easily add computed fields to base types)
- Must understand Drizzle → Zod → TypeScript flow

**Neutral:**

- Entity types always in `packages/database/src/entities/{entity}/types.ts`
- Import pattern: `import { Store, NewStore } from "@repo/database"`

## Alternatives Considered

**Manual type definitions:**

- Flexible but error-prone
- Easy to forget updates
- No automation

**GraphQL schema as source:**

- Requires GraphQL (we use oRPC)
- Schema first might not match database reality

**Prisma schema:**

- Vendor lock-in
- Less flexible than Drizzle
- We chose Drizzle for SQL-first approach

**Separate type definitions with codegen:**

- Extra build step
- More moving parts
- Still possible to skip codegen and drift
