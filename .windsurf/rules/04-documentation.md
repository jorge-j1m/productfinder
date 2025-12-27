---
trigger: always_on
---

# DOCUMENTATION REFERENCE

## Official Technology Documentation

**IMPORTANT**: The `/docs/llms` directory contains the official LLM-optimized documentation for all major technologies used in this codebase. This is the **source of truth** and must be consulted when:

- Understanding API usage and best practices
- Debugging errors or understanding why an API is failing
- Learning how to combine technologies together
- Implementing features with Better-auth, Drizzle, Hono, Next.js, oRPC, or Turborepo

Available documentation:
- `docs/llms/better-auth-llms-full.txt` - Authentication patterns and API reference
- `docs/llms/drizzle-llms-full.txt` - Database ORM usage and schema patterns
- `docs/llms/hono-llms-full.txt` - Web framework and middleware patterns
- `docs/llms/nextjs-llms-full.txt` - Frontend framework and routing
- `docs/llms/orpc-llms-full.txt` - RPC framework and type-safe APIs
- `docs/llms/turborepo-llms-full.txt` - Monorepo tooling and configuration

**Always reference these docs before implementing features or fixing issues with these technologies.**

## When Documentation Conflicts

If you find conflicts between:
1. These rules files (`.windsurf/rules/*.md`)
2. Official tech docs (`/docs/llms/*.txt`)
3. Existing codebase patterns

**STOP and ask for clarification** before proceeding. Explain:
- What the conflict is
- What each source suggests
- Your recommendation based on the context

Never proceed with conflicting guidance without user confirmation.
