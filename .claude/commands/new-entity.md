---
description: Create a new database entity following the established pattern
---

Create a new database entity with the following structure:

**Entity name:** {prompt}

Follow this pattern:

1. **Create entity folder structure:**
   - `packages/database/src/entities/{entity}/schema.ts` - Drizzle table definition
   - `packages/database/src/entities/{entity}/id.ts` - Branded TypeID validators
   - `packages/database/src/entities/{entity}/types.ts` - Zod schemas using createSelectSchema
   - `packages/database/src/entities/{entity}/index.ts` - Barrel exports

2. **Update database package:**
   - Add entity to `packages/database/src/index.ts` exports
   - Add relations to `packages/database/src/relations.ts` if needed

3. **Create oRPC procedures:**
   - `packages/admin-orpc/src/{entity}.ts` with CRUD procedures
   - Add to `packages/admin-orpc/src/index.ts` router

4. **Create basic tests:**
   - `apps/server/src/routes/{entity}.test.ts` following transaction rollback pattern

5. **Update documentation:**
   - Update README.md if this adds significant functionality
   - Document any special patterns in `.windsurf/rules/` if needed

**Important:**

- Use TypeID prefix: choose a short, unique prefix (2-4 chars)
- Follow Branded TypeID Pattern exactly
- All types derive from schema.ts
- Include relations if entity references other tables
- Write tests before considering done

Proceed with entity creation?
