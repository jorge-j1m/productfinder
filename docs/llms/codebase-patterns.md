# Codebase Patterns for Claude Code

This document outlines the critical patterns and rules for this TypeScript monorepo. Follow these strictly.

## Golden Rules

1. **Single Source of Truth**: All types derive from Drizzle schemas. NEVER define custom types that duplicate entity shapes.
2. **Branded TypeIDs**: Every entity ID uses branded types with typeid-js for compile-time and runtime safety.
3. **No Type Casting**: Never use `as`, `as unknown as`, or `any`. If you need these, the approach is wrong.
4. **Push Schema After Changes**: After modifying database schemas, push to BOTH dev and test databases.

---

## Database Entity Pattern

Location: `packages/database/src/entities/{entity}/`

### File Structure (4 files per entity)

```
entities/{entity}/
├── id.ts      # Branded type + validators
├── schema.ts  # Drizzle table definition
├── types.ts   # Zod schemas + TS types
└── index.ts   # Barrel exports
```

### id.ts Pattern

```typescript
import { fromString } from "typeid-js";
import { z } from "zod";
import { Brand } from "../../brand";

export type ProductId = Brand<string, "ProductId">;

export function isProductId(id: unknown): id is ProductId {
  try {
    fromString(id as string, "prod"); // TypeID prefix
    return true;
  } catch {
    return false;
  }
}

export const asProductId = (id: unknown): ProductId => {
  if (!isProductId(id)) throw new Error("Invalid ProductId");
  return id as ProductId;
};

export const productIdSchema = z.custom<ProductId>((val) => isProductId(val), {
  message: "Invalid ProductId format",
});
```

### schema.ts Pattern

```typescript
import { text, pgTable, varchar, pgEnum } from "drizzle-orm/pg-core";
import { typeid } from "typeid-js";
import { ProductId } from "./id";

export const stockType = pgEnum("stock_type", ["WEIGHT", "UNITS"]);

export const products = pgTable("products", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => typeid("prod").toString())
    .$type<ProductId>(),
  name: varchar({ length: 255 }).notNull().unique(),
  // ... other fields
});
```

### types.ts Pattern

```typescript
import { createInsertSchema, createSelectSchema } from "drizzle-zod";
import { z } from "zod";
import { products } from "./schema";
import { productIdSchema } from "./id";

export type Product = z.infer<typeof productSchema>;
export type NewProduct = z.infer<typeof newProductSchema>;

export const productSchema = createSelectSchema(products, {
  id: productIdSchema, // Override with branded schema
});

export const newProductSchema = createInsertSchema(products, {
  id: productIdSchema.optional(),
});
```

### Files to Update When Adding Entity

1. `packages/database/src/index.ts` - Add export
2. `packages/database/src/db.ts` - Register table + enums in schema object
3. `packages/database/src/relations.ts` - Add relations (even if empty)
4. `packages/database/package.json` - Add export path

### Push Schema to Databases

```bash
# Test database
npm run test:setup --workspace=apps/server

# Dev database
cd apps/server && DATABASE_URL="postgresql://postgres:postgres@127.0.0.1:5432/bun_pf" bunx drizzle-kit push --config=drizzle.config.ts
```

**CRITICAL**: Always push to BOTH databases after schema changes.

---

## oRPC Procedure Pattern

Location: `packages/admin-orpc/src/{entity}.ts`

### Structure

```typescript
import { os } from "@orpc/server";
import { z } from "zod";
import {
  DB,
  products,
  productSchema,
  isProductId,
  asProductId,
} from "@repo/database";
import { eq, asc, desc, ilike, count, and } from "drizzle-orm";

const osdb = os.$context<{ db: DB; requestId: string }>().errors({
  INTERNAL_SERVER_ERROR: { status: 500, message: "Internal server error" },
  NOT_FOUND: { status: 404, message: "Product not found" },
  CONFLICT_NAME: {
    status: 409,
    message: "Product with this name already exists",
  },
  // Separate conflict errors for each unique field
});

const pathBase = "/products";
```

### CRUD Operations

| Operation | Method | Path             | Key Points                                       |
| --------- | ------ | ---------------- | ------------------------------------------------ |
| getAll    | GET    | `/products`      | Pagination, filtering, sorting                   |
| get       | GET    | `/products/{id}` | Validate ID format, return 404 if not found      |
| create    | POST   | `/products`      | Check all unique constraints, return 201         |
| update    | PUT    | `/products/{id}` | Check exists, check unique only if field changed |
| delete    | DELETE | `/products/{id}` | Check exists first                               |

### ID Validation Pattern

```typescript
.input(z.object({
  id: z.string().refine(isProductId, { message: "Invalid ProductId format" }),
}))
.handler(async ({ input, context, errors }) => {
  const id = asProductId(input.id); // Always convert in handler
  // ...
})
```

### Uniqueness Check on Update

Only check if field is being changed:

```typescript
if (input.data.name && input.data.name !== existing.name) {
  const duplicate = await context.db.query.products.findFirst({
    where: (fields, { eq }) => eq(fields.name, input.data.name!),
  });
  if (duplicate) throw errors.CONFLICT_NAME();
}
```

### Register in Router

Update `packages/admin-orpc/src/index.ts`:

```typescript
import { productsProcedures } from "./products";

export const adminRouter = {
  // ...existing
  products: { ...productsProcedures },
};
```

---

## Admin Panel Pattern

Location: `apps/admin-panel/src/app/(app)/{entity}/`

### File Structure (5 files per entity)

```
{entity}/
├── page.tsx           # Main page, state management, queries/mutations
├── data-table.tsx     # Table with filters, pagination, sorting
├── columns.tsx        # Column definitions
├── {entity}-dialog.tsx # Create/edit form
└── delete-dialog.tsx  # Delete confirmation
```

### page.tsx Key Patterns

```typescript
"use client";

// State
const [page, setPage] = React.useState(1);
const [pageSize, setPageSize] = React.useState(10);
const [filters, setFilters] = React.useState({...});
const [sortBy, setSortBy] = React.useState("name");
const [sortOrder, setSortOrder] = React.useState<"asc" | "desc">("asc");
const [dialogOpen, setDialogOpen] = React.useState(false);
const [selectedItem, setSelectedItem] = React.useState<Entity | null>(null);

// Query
const { data, isLoading, isError, error } = useQuery(
  orpc.products.getAll.queryOptions({ input: {...} })
);

// Mutations - use mutationOptions pattern
const createMutation = useMutation(
  orpc.products.create.mutationOptions({
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: orpc.products.getAll.key() });
      toast.success("Created successfully");
      setDialogOpen(false);
    },
    onError: (error) => {
      if (isDefinedError(error)) {
        toast.error(error.message);
      } else {
        toast.error("Failed to create");
      }
    },
  })
);

// Handlers - ALWAYS use React.useCallback
const handleEdit = React.useCallback((item: Entity) => {...}, []);

// Columns - ALWAYS memoize
const columns = React.useMemo(() => createColumns({...}), [deps]);
```

### data-table.tsx Key Patterns

```typescript
// Use refs for callbacks to avoid infinite effect loops
const onFilterChangeRef = React.useRef(onFilterChange);
React.useEffect(() => {
  onFilterChangeRef.current = onFilterChange;
}, [onFilterChange]);

// Debounce filters (300ms)
React.useEffect(() => {
  const timer = setTimeout(() => {
    onFilterChangeRef.current({...});
  }, 300);
  return () => clearTimeout(timer);
}, [filterValues]);

// Manual sorting/pagination
const table = useReactTable({
  manualSorting: true,
  manualPagination: true,
  // ...
});
```

### columns.tsx Key Patterns

- Sortable columns: Use `column.toggleSorting()` in header
- ID column: Show truncated (`prefix_...last5`) + copy button
- Badge columns: Use color helper functions
- Actions: Edit + Delete with tooltips

### Dialog Patterns

- Reset form in `useEffect` when `open` or `entity` changes
- Validate before submit
- Show field-level errors
- Disable inputs during `isPending`
- Button text changes: "Create" → "Creating..."

---

## What NOT To Do

### Database

- ❌ Define types outside of Drizzle schemas
- ❌ Use `any` or type casting
- ❌ Forget to push schema to both dev AND test databases
- ❌ Forget to add relations (even empty ones)

### oRPC

- ❌ Skip ID validation with `isXxxId` refinement
- ❌ Forget to convert to branded type with `asXxxId()` in handler
- ❌ Use single CONFLICT error for multiple unique fields
- ❌ Check uniqueness on update without comparing to existing value

### Admin Panel

- ❌ Forget `"use client"` directive
- ❌ Skip `React.useCallback` for handlers
- ❌ Skip `React.useMemo` for columns
- ❌ Put callbacks directly in useEffect deps (use refs)
- ❌ Forget to reset page to 1 when filters change
- ❌ Skip loading/error states

---

## Verification Checklist

After any changes:

```bash
# 1. Type check
npm run check-types

# 2. Format
npm run format

# 3. Run tests
npm run test --workspace=apps/server

# 4. If schema changed, push to databases
npm run test:setup --workspace=apps/server
cd apps/server && DATABASE_URL="..." bunx drizzle-kit push
```

---

## File Naming Conventions

| Type                | Convention               | Example                              |
| ------------------- | ------------------------ | ------------------------------------ |
| Database tables     | snake_case               | `store_brands`, `employees`          |
| Entity folders      | kebab-case or snake_case | `store-brands/`, `products/`         |
| React components    | kebab-case               | `data-table.tsx`, `brand-dialog.tsx` |
| Variables/functions | camelCase                | `handleSubmit`, `isLoading`          |
| Types               | PascalCase               | `Product`, `StoreBrand`              |
| TypeID prefixes     | short lowercase          | `prod`, `store`, `sb`, `emp`         |

---

## Import Patterns

```typescript
// Cross-package
import { Product, products, isProductId } from "@repo/database";

// Admin panel local
import { Button } from "#/components/ui/button";
import { orpc } from "#/lib/query/orpc";

// Never mix styles in same file
```

---

## Public App (apps/web)

See [ADR-006: Public App Architecture](../adr/006-public-app-architecture.md) for full specification.

### Key Differences from Admin Panel

| Concern       | Admin Panel            | Public App                        |
| ------------- | ---------------------- | --------------------------------- |
| Auth          | Employee (better-auth) | None for core; future user auth   |
| oRPC package  | `@repo/admin-orpc`     | `@repo/public-orpc`               |
| API prefix    | `/rpc/admin/*`         | `/rpc/public/*`                   |
| Data access   | Full CRUD              | Read-only                         |
| Data fetching | Client-side            | Client-side (simplicity over SSR) |
| Design        | Functional admin UI    | User-facing, polished             |

### Server: Single Service

Both admin and public APIs run on the same Hono server (`apps/server`). Do NOT create a separate service.
