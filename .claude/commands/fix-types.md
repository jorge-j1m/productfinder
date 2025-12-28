---
description: Debug and fix type errors in the codebase
---

Analyze and fix TypeScript type errors:

1. **Run type check:**

   ```bash
   npm run check-types
   ```

2. **For each error:**
   - Identify the root cause
   - Check if it violates the single-source-of-truth type system
   - Consult `/docs/llms/drizzle-llms-full.txt` and architecture rules
   - Propose fix following established patterns

3. **Common type error fixes:**
   - Missing branded ID refinement: use `asXxxId()`
   - Type not imported: import from `@repo/database`
   - Custom type definition: derive from schema instead

4. **Verify fix:**
   - Run `npm run check-types` again
   - Ensure no new errors introduced

Present findings and proposed fixes before applying.
