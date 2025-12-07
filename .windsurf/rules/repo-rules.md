---
trigger: always_on
---

# RULES

## Repository

- Always use npm as package manager to manage dependencies
- Use (from the root) `npm run format` to format the code
- Before committing, run `npm run check` to validate changes, no errors or warnings allowed
- Never use depecreated APIs from a package (specially zod).

## Testing

### Server

- Test using Bun test
- Make sure that tests work before starting to modify existing code (if there are tests)
- Make sure that tests are updated when modifying existing code
- Make sure that testing is not too focused on edge cases, keep them lean and fast but rigorous enough
- DO NOT accomodate tests to the code, make the code fit the tests

## Admin-panel (apps/admin-panel)

- Next js application with tailwind
- Uses #/\* as import prefix for local imports (imports from the same app, not from other monorepo packages).
- Data fetching, state and external data (inluding data from oRPC) should always be handled client side, avoid server hydration and pre-rendering complexity, this is an admin-panel. Freshness matters, SEO not so much.

## Naming Conventions

- Use snake_case for database table names
- Use snake_case for file names.
- Use camelCase for variable names.

## DATABASE

- Use Drizzle ORM for database operations
- Use the relational query API

## Types

- Avoid using `as` to cast types
- Never use `as unknown as` or `any`