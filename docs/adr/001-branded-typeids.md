# ADR-001: Branded TypeID Pattern for Entity IDs

## Status
Accepted

## Context
We needed a type-safe, scalable ID system for database entities that:
- Prevents accidental ID mixing between entities (e.g., using StoreId where ProductId expected)
- Provides readable, sortable IDs for debugging
- Works seamlessly with PostgreSQL text columns
- Supports runtime validation

Traditional approaches (UUID, auto-increment) lack type safety and readability.

## Decision
Use branded TypeID pattern for all entity IDs:
- TypeID library for ID generation (sortable, readable format)
- TypeScript branded types for compile-time safety
- Runtime validators (`isXxxId`, `asXxxId`)
- Zod schemas for validation in API boundaries

## Rationale
**Compile-time Safety:**
- `StoreId` and `ProductId` are incompatible types
- Impossible to accidentally use wrong ID type
- Refactoring catches all ID type errors

**Runtime Safety:**
- TypeID validation ensures correct format
- Prefix validation catches corrupted IDs early
- Clear error messages for debugging

**Developer Experience:**
- IDs are readable: `store_01ja5k...` vs `550e8400-e29b-41d4-a716-...`
- Sortable by creation time
- Prefix indicates entity type instantly

**PostgreSQL Compatibility:**
- Stores as `text` column (simple, indexed, performant)
- No UUID extension required
- Works with all PostgreSQL versions

## Consequences

**Positive:**
- Type errors caught at compile time prevent entire class of bugs
- Debugging easier with readable IDs
- API boundaries validated automatically
- Consistent pattern across all entities

**Negative:**
- Slight boilerplate per entity (4-file structure)
- Team must learn pattern
- Migration from existing UUID/int IDs requires data transformation

**Neutral:**
- Every entity needs: `id.ts`, `schema.ts`, `types.ts`, `index.ts`
- Pattern must be followed consistently

## Alternatives Considered

**UUID with branded types:**
- Less readable IDs
- Not sortable by time
- Still requires boilerplate

**Plain string IDs:**
- No type safety
- Easy to mix entity IDs
- No validation

**Auto-increment integers:**
- Not suitable for distributed systems
- Exposes business info (number of entities)
- No type safety

**NanoID/CUID:**
- Not sortable
- No prefix for entity identification
- Similar boilerplate needed for type safety
