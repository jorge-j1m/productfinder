# Database Package Documentation

> **Comprehensive guide to the entity-based database architecture**

## Table of Contents

1. [Overview](#overview)
2. [Package Structure](#package-structure)
3. [Core Concepts](#core-concepts)
4. [Working with Entities](#working-with-entities)
5. [Adding a New Entity](#adding-a-new-entity)
6. [Editing an Existing Entity](#editing-an-existing-entity)
7. [Removing an Entity](#removing-an-entity)
8. [Branded Types System](#branded-types-system)
9. [Relations](#relations)
10. [Better-Auth Integration](#better-auth-integration)
11. [Package Exports](#package-exports)
12. [Database Scripts](#database-scripts)
13. [Drizzle Kit Usage](#drizzle-kit-usage)
14. [Best Practices](#best-practices)

---

## Overview

This package contains the complete database schema, types, and utilities for the ProductFinder application. It uses:

- **Drizzle ORM** - TypeScript ORM for PostgreSQL
- **Zod** - Runtime validation and type inference
- **TypeID** - Type-safe, sortable unique identifiers
- **Better-Auth** - Employee authentication system
- **Branded Types** - Compile-time type safety for IDs

The package is organized by **entity** - each business domain (store brands, stores, employees) is self-contained in its own folder.

---

## Package Structure

```
packages/database/
├── src/
│   ├── brand.ts                    # Shared branded type utilities
│   ├── index.ts                    # Main entry point - exports everything
│   ├── db.ts                       # Database connection setup
│   ├── relations.ts                # All Drizzle relations in one place
│   │
│   ├── entities/                   # Entity-based organization
│   │   ├── store-brands/          # Store Brands entity
│   │   │   ├── id.ts              # ID types, validators, schemas
│   │   │   ├── schema.ts          # Drizzle table definition
│   │   │   ├── types.ts           # TypeScript types + Zod schemas
│   │   │   └── index.ts           # Re-exports all store-brand items
│   │   │
│   │   ├── stores/                # Stores entity
│   │   │   ├── id.ts
│   │   │   ├── schema.ts
│   │   │   ├── types.ts
│   │   │   └── index.ts
│   │   │
│   │   └── employees/             # Employees entity (auth-enabled)
│   │       ├── id.ts              # Multiple ID types (Employee, Session, Account, Verification)
│   │       ├── schema.ts          # Multiple tables + enums
│   │       ├── types.ts           # Core employee types
│   │       ├── auth-config.ts     # Better-auth configuration
│   │       ├── auth-types.ts      # Better-auth integration types
│   │       └── index.ts
│   │
│   ├── scripts/                   # Database utility scripts
│   │   ├── seed-db.ts            # Seed test data
│   │   ├── drop-tables.ts        # Drop all tables
│   │   └── empty-tables.ts       # Truncate all tables
│   │
│   └── legacy/                    # Old files (for reference only)
│       ├── id.ts
│       ├── schemas.ts
│       ├── types.ts
│       └── ...
│
├── package.json                   # Package configuration + exports
└── README.md                      # This file
```

---

## Core Concepts

### Entity-Based Organization

Each **entity** represents a core business domain and is completely self-contained:

- **Store Brands** - Food store chains (Publix, Fresco, Sedanos, etc.)
- **Stores** - Physical store locations
- **Employees** - Staff members with authentication

### File Structure per Entity

Each entity folder contains exactly **4 files**:

1. **`id.ts`** - Branded ID types, runtime validators, Zod schemas
2. **`schema.ts`** - Drizzle table definitions (database schema)
3. **`types.ts`** - TypeScript types and Zod validation schemas
4. **`index.ts`** - Re-exports everything from the entity

### Separation of Concerns

- **IDs** - Type-safe identifiers with runtime validation
- **Schema** - Database structure (tables, columns, constraints)
- **Types** - Application types and validation
- **Relations** - How entities connect (centralized in `relations.ts`)

---

## Working with Entities

### Importing from an Entity

```typescript
// Import everything from an entity
import {
  StoreBrand,
  NewStoreBrand,
  storeBrands,
  storeBrandIdSchema,
} from "@repo/database";

// Import specific entity
import { Store, stores } from "@repo/database/stores";
import { Employee, employees } from "@repo/database/employees";
```

### Using Entity Types

```typescript
import type { StoreBrand, NewStoreBrand } from "@repo/database";

// Select type (includes all fields with proper types)
const brand: StoreBrand = {
  id: "sb_01h2xcejqtf2nbrexx3vqjhp41" as StoreBrandId,
  name: "Publix",
  logo: "https://example.com/logo.png",
};

// Insert type (ID is optional, will be auto-generated)
const newBrand: NewStoreBrand = {
  name: "Fresh Market",
  logo: "https://example.com/fresh.png",
};
```

### Querying with Drizzle

```typescript
import { db } from "@repo/database/db";
import { storeBrands, stores } from "@repo/database";
import { eq } from "drizzle-orm";

// Simple query
const allBrands = await db.select().from(storeBrands);

// With conditions
const publix = await db
  .select()
  .from(storeBrands)
  .where(eq(storeBrands.name, "Publix"));

// With relations (nested query)
const storesWithBrand = await db.query.stores.findMany({
  with: {
    brand: true, // Include related store brand
  },
});
```

---

## Adding a New Entity

Let's add a **Products** entity step-by-step.

### Step 1: Create Entity Folder

```bash
cd packages/database/src/entities
mkdir products
cd products
```

### Step 2: Create `id.ts`

```typescript
// packages/database/src/entities/products/id.ts
import { fromString } from "typeid-js";
import { z } from "zod";
import { Brand } from "../../brand";

// ProductId branded type
export type ProductId = Brand<string, "ProductId">;

// Runtime validation function with type predicate
export function isProductId(id: unknown): id is ProductId {
  try {
    fromString(id as string, "prod");
    return true;
  } catch {
    return false;
  }
}

// Helper function to cast strings to branded type with validation
export const asProductId = (id: unknown): ProductId => {
  if (!isProductId(id)) {
    throw new Error("Invalid ProductId");
  }
  return id as ProductId;
};

// Branded ID schema with proper output type
export const productIdSchema = z.custom<ProductId>((val) => isProductId(val), {
  message: "Invalid ProductId format",
});
```

### Step 3: Create `schema.ts`

```typescript
// packages/database/src/entities/products/schema.ts
import { text, pgTable, varchar, decimal } from "drizzle-orm/pg-core";
import { typeid } from "typeid-js";
import { ProductId } from "./id";
import { stores } from "../stores/schema";
import { StoreId } from "../stores/id";

export const products = pgTable("products", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => typeid("prod").toString())
    .$type<ProductId>(),
  storeId: text("store_id")
    .notNull()
    .references(() => stores.id)
    .$type<StoreId>(),
  name: varchar({ length: 255 }).notNull(),
  price: decimal({ precision: 10, scale: 2 }).notNull(),
  description: text("description"),
});
```

### Step 4: Create `types.ts`

```typescript
// packages/database/src/entities/products/types.ts
import { createInsertSchema, createSelectSchema } from "drizzle-zod";
import { z } from "zod";
import { products } from "./schema";
import { productIdSchema } from "./id";
import { storeIdSchema } from "../stores/id";

// Inferred types from database schema
export type Product = z.infer<typeof productSchema>;
export type NewProduct = z.infer<typeof newProductSchema>;

// Zod schemas with explicit branded ID types
export const productSchema = createSelectSchema(products, {
  id: productIdSchema,
  storeId: storeIdSchema,
});

export const newProductSchema = createInsertSchema(products, {
  id: productIdSchema.optional(),
  storeId: storeIdSchema,
});
```

### Step 5: Create `index.ts`

```typescript
// packages/database/src/entities/products/index.ts

// Products Entity - Everything related to products in one place

export * from "./id";
export * from "./schema";
export * from "./types";
```

### Step 6: Update `relations.ts`

```typescript
// packages/database/src/relations.ts

import { products } from "./entities/products/schema";

// Add to existing storesRelations
export const storesRelations = relations(stores, ({ one, many }) => ({
  brand: one(storeBrands, {
    fields: [stores.brandId],
    references: [storeBrands.id],
  }),
  employees: many(employees),
  products: many(products), // ADD THIS
}));

// Add new productsRelations
export const productsRelations = relations(products, ({ one }) => ({
  store: one(stores, {
    fields: [products.storeId],
    references: [stores.id],
  }),
}));
```

### Step 7: Update `db.ts`

```typescript
// packages/database/src/db.ts

// Add to imports
import { products } from "./entities/products/schema";
import { productsRelations } from "./relations";

// Add to schema object
const schema = {
  // Tables
  storeBrands,
  stores,
  products, // ADD THIS
  employees,
  // ... rest

  // Relations
  storeBrandsRelations,
  storesRelations,
  productsRelations, // ADD THIS
  employeesRelations,
  // ... rest
};
```

### Step 8: Update `index.ts`

```typescript
// packages/database/src/index.ts

// Add after other entities
// ===== Products Entity =====
export * from "./entities/products";
```

### Step 9: Update `package.json` (optional)

```json
{
  "exports": {
    "./products": {
      "types": "./src/entities/products/index.ts",
      "default": "./src/entities/products/index.ts"
    }
  }
}
```

### Step 10: Generate Migration

```bash
cd apps/server
npx drizzle-kit generate
npx drizzle-kit migrate
```

**Done!** Your new entity is ready to use.

---

## Editing an Existing Entity

### Adding a Field to Store Brands

**Location**: `packages/database/src/entities/store-brands/`

1. **Update `schema.ts`**:

```typescript
export const storeBrands = pgTable("store_brands", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => typeid("sb").toString())
    .$type<StoreBrandId>(),
  name: varchar({ length: 255 }).notNull().unique(),
  logo: varchar({ length: 255 }).notNull(),
  website: varchar({ length: 255 }), // NEW FIELD
});
```

2. **Update `types.ts`** (usually auto-inferred, no changes needed)

3. **Generate migration**:

```bash
cd apps/server
npx drizzle-kit generate
npx drizzle-kit migrate
```

### Changing a Field Type

1. Update the field definition in `schema.ts`
2. Generate migration: `npx drizzle-kit generate`
3. Review the generated SQL migration
4. Apply: `npx drizzle-kit migrate`

---

## Removing an Entity

### Example: Removing Products Entity

**⚠️ WARNING**: This is destructive. Backup your data first!

1. **Remove from `db.ts`**:
   - Remove `products` import
   - Remove `products` and `productsRelations` from schema object

2. **Remove from `relations.ts`**:
   - Remove `productsRelations`
   - Remove references from other entities (e.g., `products: many(products)` in `storesRelations`)

3. **Remove from `index.ts`**:
   - Remove `export * from "./entities/products";`

4. **Remove entity folder**:

```bash
rm -rf packages/database/src/entities/products
```

5. **Generate migration**:

```bash
cd apps/server
npx drizzle-kit generate
npx drizzle-kit migrate
```

---

## Branded Types System

### What are Branded Types?

Branded types add **compile-time type safety** to primitive types like strings:

```typescript
// Without branding
const storeId: string = "store_123";
const brandId: string = "brand_456";

// Oops! TypeScript allows this even though it's wrong
someFunction(brandId); // Accepts StoreId but got StoreBrandId

// With branding
const storeId: StoreId = "store_123" as StoreId;
const brandId: StoreBrandId = "brand_456" as StoreBrandId;

// TypeScript catches the error at compile time!
someFunction(brandId); // ❌ Error: StoreBrandId not assignable to StoreId
```

### How We Implement It

**`brand.ts`** - Single source of truth:

```typescript
export declare const __brand: unique symbol;
export type Brand<T, TBrand extends string> = T & { [__brand]: TBrand };
```

**Entity ID files** use this:

```typescript
import { Brand } from "../../brand";

export type StoreBrandId = Brand<string, "StoreBrandId">;
```

### Runtime Validation

Branded types are compile-time only. We add runtime validation:

```typescript
export function isStoreBrandId(id: unknown): id is StoreBrandId {
  try {
    fromString(id as string, "sb"); // Validates TypeID format
    return true;
  } catch {
    return false;
  }
}
```

### Zod Integration

For API validation, we use `z.custom()`:

```typescript
export const storeBrandIdSchema = z.custom<StoreBrandId>(
  (val) => isStoreBrandId(val),
  { message: "Invalid StoreBrandId format" },
);
```

This ensures:

- ✅ Compile-time type safety
- ✅ Runtime validation
- ✅ Type flows through entire stack (DB → API → Client)

---

## Relations

**Location**: `packages/database/src/relations.ts`

Relations define how entities connect for **nested queries**.

### Example: Store Brands → Stores

```typescript
export const storeBrandsRelations = relations(storeBrands, ({ many }) => ({
  stores: many(stores), // One brand has many stores
}));

export const storesRelations = relations(stores, ({ one, many }) => ({
  brand: one(storeBrands, {
    fields: [stores.brandId],
    references: [storeBrands.id],
  }),
  employees: many(employees),
}));
```

### Using Relations

```typescript
// Nested query - get stores with their brand
const result = await db.query.stores.findMany({
  with: {
    brand: true, // Include the related storeBrand
    employees: true, // Include all related employees
  },
});

// Deep nesting
const employee = await db.query.employees.findFirst({
  with: {
    store: {
      with: {
        brand: true, // Include store's brand
      },
    },
  },
});
```

---

## Better-Auth Integration

**Location**: `packages/database/src/entities/employees/`

The employees entity includes **Better-Auth** configuration for authentication.

### Files

- **`auth-config.ts`** - Better-auth settings (table names, ID generation)
- **`auth-types.ts`** - TypeScript types for sessions, users

### Auth Schema

Better-auth uses 4 tables:

- `employees` - Main user table
- `employee_sessions` - Active sessions
- `employee_accounts` - OAuth accounts
- `employee_verifications` - Email verification tokens

### Custom Fields

```typescript
// auth-types.ts
export const EmployeeExtension = {
  firstName: { type: "string", required: true },
  lastName: { type: "string", required: true },
  role: { type: "string", required: true },
  storeId: {
    type: "string",
    required: true,
    references: { model: "stores", field: "id" },
  },
  status: { type: "string", required: true },
};
```

### ID Generation

```typescript
// auth-config.ts
generateId: ({ model }) => {
  const prefixMap = {
    user: "emp",
    session: "esess",
    account: "eacc",
    verification: "evfn",
  };
  return typeid(prefixMap[model]).toString();
};
```

---

## Package Exports

**Location**: `packages/database/package.json`

### Main Export

```typescript
import { StoreBrand, stores, employeeAuthConfig } from "@repo/database";
```

### Entity-Specific Exports

```typescript
import { StoreBrand } from "@repo/database/store-brands";
import { Store } from "@repo/database/stores";
import { Employee } from "@repo/database/employees";
```

### Database Connection

```typescript
import { _localDb, type DB } from "@repo/database/db";
```

### Backward Compatibility

Old imports still work:

```typescript
import { StoreBrand } from "@repo/database/schema"; // ✅ Works
import { StoreBrand } from "@repo/database/types"; // ✅ Works
```

---

## Database Scripts

**Location**: `packages/database/src/scripts/`

### Seed Database

Creates test data (1 brand, 1 store, 1 employee):

```bash
cd packages/database
bun run src/scripts/seed-db.ts
```

### Empty Tables

Truncates all tables (keeps schema):

```bash
bun run src/scripts/empty-tables.ts
```

### Drop Tables

Drops all tables (destructive):

```bash
bun run src/scripts/drop-tables.ts
```

---

## Drizzle Kit Usage

**Location**: `apps/server/drizzle.config.ts`

### Check Schema

Verify code matches database:

```bash
cd apps/server
npx drizzle-kit check
```

Expected output: `Everything's fine 🐶🔥`

### Generate Migration

Create SQL migration from schema changes:

```bash
npx drizzle-kit generate
```

Output: `drizzle/0001_migration_name.sql`

### Apply Migration

Run migrations against database:

```bash
npx drizzle-kit migrate
```

### Push Schema (Dev Only)

Directly update database without migrations:

```bash
npx drizzle-kit push
```

⚠️ **Warning**: Use only in development. Skips migrations.

### Studio (GUI)

Visual database browser:

```bash
npx drizzle-kit studio
```

Opens at `https://local.drizzle.studio`

---

## Best Practices

### ✅ DO

1. **Keep entities self-contained** - All entity code in one folder
2. **Use branded types** - Always use `StoreBrandId`, never plain `string`
3. **Validate at boundaries** - Use Zod schemas in API endpoints
4. **Generate migrations** - Never manually edit database
5. **Update relations** - When adding foreign keys, update `relations.ts`
6. **Type-safe queries** - Use Drizzle's query builder, not raw SQL
7. **Use TypeID prefixes** - Consistent prefixes help debugging (`sb_`, `store_`, `emp_`)

### ❌ DON'T

1. **Don't use `as unknown as` casts** - Defeats type safety
2. **Don't skip migrations** - Always use `drizzle-kit generate`
3. **Don't manually edit IDs** - Let database generate them
4. **Don't mix entity concerns** - Keep products separate from stores
5. **Don't forget exports** - Update `index.ts` and `package.json`
6. **Don't delete legacy folder** - Keep for reference during migration
7. **Don't edit `db.ts` schema directly** - Edit entity files

---

## Migration Guide

### From Old Structure to New

**Old Import**:

```typescript
import { storeBrands } from "@repo/database/schemas";
import { StoreBrand } from "@repo/database/types";
```

**New Import** (both work):

```typescript
import { storeBrands, StoreBrand } from "@repo/database";
```

All old imports are **backward compatible** - no breaking changes!

---

## Troubleshooting

### TypeScript Error: "Cannot find module '@repo/database/schema'"

**Fix**: Use `@repo/database` instead:

```typescript
import { storeBrands } from "@repo/database";
```

### Branded Type Mismatch Error

**Problem**: `StoreBrandId is not assignable to StoreBrandId`

**Fix**: Ensure all entity ID files import from shared `brand.ts`:

```typescript
import { Brand } from "../../brand";
```

### Drizzle Kit Schema Mismatch

**Problem**: `drizzle-kit check` reports differences

**Fix**:

1. Check `db.ts` includes all tables and relations
2. Regenerate schema: `npx drizzle-kit generate`
3. Apply migration: `npx drizzle-kit migrate`

### Migration Won't Apply

**Problem**: Drizzle migration fails

**Fix**:

1. Check migration SQL in `drizzle/` folder
2. Verify database is running
3. Check `DATABASE_URL` environment variable
4. Try: `npx drizzle-kit push` (dev only)

---

## Summary

This database package provides a **clean, scalable, type-safe** foundation:

- ✅ **Entity-based** - Each domain is self-contained
- ✅ **Type-safe** - Branded IDs prevent mixing types
- ✅ **Validated** - Runtime validation with Zod
- ✅ **Maintainable** - Clear structure, easy to extend
- ✅ **Documented** - This guide + inline comments

**To work on stores**: Go to `entities/stores/`
**To add products**: Follow "Adding a New Entity" guide
**To verify schema**: Run `npx drizzle-kit check`

For questions, refer to this document or check inline comments in entity files.
