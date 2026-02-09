# ADR-003: Client-Side Data Fetching in Admin Panel

## Status

Accepted

## Context

Next.js offers multiple data fetching strategies:

- Server Components with async data fetching
- Server-Side Rendering (SSR) with getServerSideProps
- Static Generation (SSG) with getStaticProps
- Client-side fetching with SWR/React Query

Admin panels have different requirements than public websites:

- Freshness matters (data changes frequently)
- SEO irrelevant (authenticated users only)
- Interactivity critical (forms, real-time updates)
- Complex state management (filters, pagination, sorting)

## Decision

**Admin panel uses 100% client-side data fetching:**

- All data fetching via TanStack Query + oRPC client
- No Server Components with data fetching
- No SSR/SSG
- All pages are Client Components (`"use client"`)

## Rationale

**Data Freshness:**

- Client fetching with cache invalidation keeps data current
- No stale data from SSR/SSG
- Real-time updates easy with query invalidation

**Simplified Mental Model:**

- All data flow is obvious and traceable
- No hydration mismatches
- No server/client boundary complexity

**Better DX:**

- Faster hot reload (no server components to rebuild)
- Easier debugging (all state client-side)
- TanStack Query DevTools shows all queries

**Admin Panel Reality:**

- SEO irrelevant (private, authenticated)
- Initial load time less critical than interactivity
- Users tolerate loading states in admin UIs

**Type Safety:**

- oRPC gives end-to-end type safety without codegen
- Same types on server and client
- Compile errors when API changes

## Consequences

**Positive:**

- Simple, predictable data flow
- Fast development iteration
- Easy state management
- Clear separation: Server = API, Client = UI

**Negative:**

- Slightly slower initial page load (no SSR data)
- Requires JavaScript enabled (acceptable for admin)
- More client bundle size (TanStack Query)

**Neutral:**

- All pages use `"use client"` directive
- Import pattern: `#/*` for local imports
- Data fetching pattern consistent across all pages

## Alternatives Considered

**Server Components with async data:**

- Complexity with forms and interactivity
- Hydration issues
- Harder debugging
- Not worth it for admin panel

**SSR with getServerSideProps:**

- Slower page transitions
- Hydration complexity
- Stale data possible
- Overcomplicated for admin needs

**Mix of SSR and client fetching:**

- Hardest to reason about
- Hydration mismatches
- Inconsistent patterns across codebase
