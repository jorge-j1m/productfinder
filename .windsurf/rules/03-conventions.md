---
trigger: always_on
---

# CODING CONVENTIONS

## Repository Management

- Always use npm as package manager to manage dependencies
- Use (from the root) `npm run format` to format the code
- Before committing, run `npm run check` to validate changes, no errors or warnings allowed
- Never use deprecated APIs from a package (especially zod)

## Naming Conventions

- **Database tables**: snake_case (`store_brands`, `employee_sessions`)
- **Entity files**: snake_case (`store_brands.ts`, `employee_auth.ts`)
- **React components**: kebab-case (`data-table.tsx`, `brand-dialog.tsx`)
- **Variables/functions**: camelCase
- **Types**: PascalCase

## Testing

### Server

- Test using Bun test
- Make sure that tests work before starting to modify existing code (if there are tests)
- Make sure that tests are updated when modifying existing code
- Focus on happy path and critical error cases - avoid over-testing edge cases
- Keep tests fast and maintainable
- Use transaction rollback pattern (BEGIN → test → ROLLBACK) for isolation
- DO NOT accommodate tests to the code, make the code fit the tests

## Admin-panel (apps/admin-panel)

- Next.js application with Tailwind CSS
- Uses `#/*` as import prefix for local imports (imports from the same app, not from other monorepo packages)
- Data fetching, state and external data (including data from oRPC) should always be handled client side, avoid server hydration and pre-rendering complexity, this is an admin-panel. Freshness matters, SEO not so much.

## Import Patterns

- **Cross-package imports**: Use `@repo/*` (e.g., `@repo/database`, `@repo/admin-orpc`)
- **Admin-panel local imports**: Use `#/*` (e.g., `#/components/ui/button`)
- **Server imports**: Relative paths within app, `@repo/*` for packages
- Never mix import styles within the same file
