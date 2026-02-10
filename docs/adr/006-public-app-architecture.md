# ADR-006: Public App Architecture

## Status

Accepted

## Context

ProductFinder needs a user-facing application (`apps/web`) for price comparison across stores. The admin panel (`apps/admin-panel`) handles data management for employees; the public app serves end-users browsing products and prices.

Key questions:

- How should the public API be structured relative to the admin API?
- Should we add a separate backend service?
- What data fetching strategy fits this use case?
- What auth model applies to public users?

## Decision

### Product Scope

**Core features (no auth required):**

- Product search and browse (name, barcode, filters)
- Side-by-side price comparison across stores for a product
- Store proximity filtering using geolocation (lat/lng already on `stores` table)
- Sale/deal discovery and out-of-stock visibility

**Future features (auth required):**

- Favorite products
- Shopping lists
- Price alerts

### Separate oRPC Package: `@repo/public-orpc`

- Read-only procedures for public consumption
- No authentication required for core features
- Separate from `@repo/admin-orpc` — different auth model, different surface area

### Single Server, Separate Route Prefix

Both APIs run on the same Hono server (`apps/server`):

```
/rpc/*          -> @repo/admin-orpc (employee auth required)
/rpc/public/*   -> @repo/public-orpc (no auth, read-only)
```

Note: Admin kept at `/rpc/*` (not `/rpc/admin/*`) to avoid breaking existing tests and the admin panel client. Public uses the more specific `/rpc/public/*` path, mounted first in Hono for correct route precedence.

### Client-Side Data Fetching

Same approach as the admin panel (see [ADR-003](./003-client-side-data-fetching.md)). SSR/SSG is not a priority — simplicity and developer control are preferred. SEO can be added incrementally later if needed.

### No New Database Entities for Core

Existing tables cover the core feature set:

| Table          | Relevant Fields                                                         |
| -------------- | ----------------------------------------------------------------------- |
| `stores`       | name, address, city, state, zip, latitude, longitude, brandId           |
| `store_brands` | name, logo                                                              |
| `products`     | name, description, sku, barcode, stockType (WEIGHT/UNITS), image        |
| `inventory`    | storeId, productId, quantity, regularPrice, salePrice, sale date fields |

### Pricing Display Logic

- All prices stored in **cents** (integers)
- Display depends on `product.stockType`:
  - `WEIGHT`: price per gram — display as price/kg or price/lb
  - `UNITS`: price per unit
- Sale active when: `salePrice` set AND current date within `[saleStartDate, saleEndDate]` (no dates = permanent sale)

## Rationale

**Separate package, same server:**
The app is still simple — multiple services add deployment and networking complexity for no gain. Separate packages keep the code organized without operational overhead.

**Client-side data fetching:**
The developer prioritizes simplicity, readability, and direct control over the data flow. This is not a production release — SEO and initial load performance are not concerns yet. The same TanStack Query + oRPC pattern from the admin panel applies, keeping the codebase consistent.

**No new entities:**
The existing data model (stores with lat/lng, products, inventory with pricing/sales) already supports the core comparison use case. Adding entities for user auth and personalization features will come later.

## Consequences

**Positive:**

- Consistent patterns across admin and public apps
- Single deployment, simpler infrastructure
- Clean API boundary between admin (write) and public (read)
- No schema changes needed to start building

**Negative:**

- No SEO out of the box (acceptable for now)
- Public and admin APIs share server resources (rate limiting should be considered)
- Future user auth will require a separate auth table and configuration

## Alternatives Considered

**Separate backend service for public API:**

- Unnecessary complexity for current scale
- Additional deployment, monitoring, networking
- Rejected: single server with route prefixes achieves the same separation

**SSR/SSG for public app:**

- Better SEO and initial load
- More complex data fetching patterns, hydration concerns
- Rejected: developer prefers simplicity and client-side control; SEO not a priority yet

**Reuse `@repo/admin-orpc` with public routes mixed in:**

- Muddies the auth boundary
- Harder to reason about which routes need auth
- Rejected: separate package is cleaner
