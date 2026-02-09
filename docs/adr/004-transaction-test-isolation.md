# ADR-004: Transaction-Based Test Isolation

## Status

Accepted

## Context

Integration tests need isolated database state:

- Tests must not affect each other
- Cleanup after tests required
- Fast test execution critical for TDD workflow

Common approaches:

- Truncate tables after each test (slow)
- Create/destroy test databases (very slow)
- In-memory databases (SQLite - different from production Postgres)
- Transaction rollback (fast, production-like)

## Decision

Use **transaction rollback pattern** for test isolation:

```typescript
beforeEach(async () => {
  await testDb.execute(sql`BEGIN`);
});

afterEach(async () => {
  await testDb.execute(sql`ROLLBACK`);
});
```

Each test runs in a transaction that's rolled back after completion.

## Rationale

**Speed:**

- Rollback is instant (microseconds)
- No table truncation overhead
- Tests run 10-100x faster than cleanup-based approaches

**Isolation:**

- Each test starts with clean slate
- Tests can run in parallel safely
- No test pollution possible

**Production Parity:**

- Uses actual PostgreSQL (not SQLite)
- Same SQL dialect, features, constraints
- Catches Postgres-specific issues

**Simplicity:**

- No cleanup logic needed
- Works with existing database
- Minimal test setup code

## Consequences

**Positive:**

- Fast test execution enables TDD workflow
- Tests can run in parallel
- No cleanup logic to maintain
- Production database parity

**Negative:**

- Can't test transaction behavior itself
- Tests that explicitly commit will break pattern
- Requires disciplined test writing

**Neutral:**

- All tests use shared `testDb` connection
- Test database separate from development database
- Pattern enforced via setup.ts imports

## Alternatives Considered

**Table truncation:**

- Slow (seconds per test)
- Doesn't reset sequences properly
- Cascade deletes complex

**Database recreation:**

- Very slow (10+ seconds per test)
- Complex setup/teardown
- Not practical for TDD

**SQLite in-memory:**

- Different SQL dialect
- Missing Postgres features
- False confidence in tests

**Separate database per test:**

- Extremely slow
- Resource intensive
- Overcomplicated

## Implementation Notes

Tests must NOT:

- Explicitly commit transactions
- Use connection pooling (breaks isolation)
- Spawn background workers that modify DB

Tests SHOULD:

- Import testDb from setup.ts
- Focus on single responsibility
- Be fast (<100ms typical)
