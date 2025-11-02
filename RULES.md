# RULES

## Repository

- Always use npm as package manager
- Use (from the root) `npm run format` to format the code
- Before committing, run `npm run check` to validate changes, no errors or warnings allowed

## Testing
### Server

- Test using Bun test
- Make sure that tests work before starting to modify existing code (if there are tests)
- Make sure that tests are updated when modifying existing code
- Make sure that testing is not too focused on edge cases, keep them lean and fast but rigorous enough
- DO NOT accomodate tests to the code, make the code fit the tests


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
