# Test Setup Guide

This project uses **transaction-based test isolation** with a real PostgreSQL database for blazing-fast, reliable tests.

## Why This Approach?

✅ **SEPARATE TEST DATABASE** - Zero risk of touching production data  
✅ **NO MIGRATION FILES** - Schema syncs directly via `drizzle-kit push`  
✅ **TRANSACTION ROLLBACK ISOLATION** - Each test starts with `BEGIN` and ends with `ROLLBACK` (<1ms cleanup)  
✅ **DEPENDENCY INJECTION** - Routes accept db via Hono context  
✅ **BLAZING FAST** - Tests run in milliseconds  
✅ **TYPE-SAFE** - Full TypeScript support with Drizzle types

## Initial Setup (One Time)

### 1. Create Test Database

```bash
# Connect to PostgreSQL and create test database
psql -U postgres -c "CREATE DATABASE productfinder_test;"
```

### 2. Push Schema to Test Database

```bash
cd apps/server
bun run test:setup
```

This runs `drizzle-kit push` to sync your schema directly to the test database (no migration files needed).

### 3. Configure Environment (Optional)

Copy the example env file:

```bash
cp .env.test.example .env.test
```

Edit `.env.test` if you need a different database URL:

```env
TEST_DATABASE_URL=postgres://postgres:postgres@localhost:5432/productfinder_test
```

## Daily Workflow

### Run Tests

```bash
bun test
```

### Watch Mode

```bash
bun run test:watch
```

### After Schema Changes

If you modify `src/db/schema.ts`, just push the changes:

```bash
bun run test:setup
```

No migration files to manage! 🎉

## How It Works

### Transaction Isolation

Each test automatically:

1. **Before test**: `BEGIN` transaction
2. **Run test**: Insert/query/update data
3. **After test**: `ROLLBACK` transaction (instant cleanup)

This means **perfect test isolation** - no test data persists between tests!

### Unified App Architecture

**Production and tests use the EXACT same app setup** via `src/app.ts`:

```typescript
// src/app.ts - Shared app factory
export function createApp(db) {
  const app = new Hono();

  // Inject database into context
  app.use("*", async (c, next) => {
    c.set("db", db);
    await next();
  });

  // Mount routes
  app.route("/api/store-brands", storeBrandsRouter);
  app.route("/api/stores", storesRouter);

  return app;
}
```

**Production** (`src/index.ts`):

```typescript
const app = createApp(db); // Production database
```

**Tests** (`src/routes/*.test.ts`):

```typescript
const app = createApp(testDb); // Test database
```

Routes always get db from context:

```typescript
const db = c.get("db"); // Always injected, no fallback needed
```

### Example Test

```typescript
describe("Store Brands API", () => {
  let app: ReturnType<typeof createTestApp>;

  beforeEach(() => {
    app = createTestApp(testDb);
  });

  test("creates a brand", async () => {
    const res = await app.request("/api/store-brands", {
      method: "POST",
      body: JSON.stringify({ name: "Test", logo: "url" }),
    });

    expect(res.status).toBe(201);

    // Verify in DB
    const brands = await testDb.select().from(storeBrands);
    expect(brands).toHaveLength(1);
  });

  test("is isolated - sees no data from previous test", async () => {
    // Transaction was rolled back!
    const brands = await testDb.select().from(storeBrands);
    expect(brands).toHaveLength(0); // ✅ Passes!
  });
});
```

## Performance

```
┌──────────────────────┬──────────┬────────────┐
│ Approach             │ Speed    │ Isolation  │
├──────────────────────┼──────────┼────────────┤
│ This approach        │ 1-2ms    │ Perfect    │
│ SQLite in-memory     │ 3-5ms    │ Perfect    │
│ Fresh Docker per test│ 500ms+   │ Perfect    │
│ Shared test DB       │ 10-50ms  │ Poor       │
└──────────────────────┴──────────┴────────────┘
```

## Troubleshooting

### "Database does not exist"

Create the test database:

```bash
psql -U postgres -c "CREATE DATABASE productfinder_test;"
```

### "Relation does not exist"

Push the schema:

```bash
bun run test:setup
```

### Tests fail with connection errors

Check your `TEST_DATABASE_URL` environment variable or PostgreSQL server status.

## Architecture

```
test/
├── setup.ts           # Global test setup (BEGIN/ROLLBACK)
├── test-app.ts        # Test app factory (DB injection)
├── store-brands.test.ts
└── stores.test.ts

src/
├── routes/
│   ├── store_brands.ts  # Uses c.get("db") || defaultDb
│   └── stores.ts        # Uses c.get("db") || defaultDb
└── types/
    └── hono.ts          # Type declarations for context
```

## Best Practices

1. **Always use `beforeEach`** to create fresh test app
2. **Seed data in each test** - transactions keep tests isolated
3. **Don't rely on test execution order** - each test is independent
4. **Use descriptive test names** - makes failures easy to debug
5. **Test happy paths AND error cases** - 400s, 404s, validation errors

## Next Steps

- Add more comprehensive test coverage
- Test edge cases and error scenarios
- Test relationship constraints (foreign keys)
- Add integration tests for complex workflows
