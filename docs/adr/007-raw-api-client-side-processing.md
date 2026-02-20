# ADR-007: Raw Data API with Client-Side Processing

## Status

Accepted

## Context

The public app's price comparison and store detail pages need enriched data: effective prices (accounting for active sales), sale status detection, distance from user, sorting, filtering, pagination, and aggregate stats (best price, price range, in-stock count).

The initial implementation computed all of this server-side — the API returned pre-crunched fields like `effectivePrice`, `isOnSale`, `bestPrice`, and accepted filter/sort/pagination params. This worked but tightly coupled the API response shape to a single frontend's UI needs, limiting reuse.

Key questions:

- Should the API return computed/enriched data or raw records?
- Where should business logic like sale detection and distance calculation live?
- How do we keep the API reusable for future consumers (mobile app, other frontends)?

## Decision

### API returns raw database records only

The `@repo/public-orpc` price endpoints return raw inventory rows with relations — no computed fields, no filtering, no sorting, no pagination:

- `prices.compare({ productId })` → `{ product, inventory[] }` where each inventory record includes `store` + `store.brand`
- `prices.forStore({ storeId })` → `inventory[]` where each record includes `product`

Raw fields returned: `quantity`, `regularPrice`, `salePrice`, `saleStartDate`, `saleEndDate`, store coordinates, etc.

### All processing happens in frontend pure functions

A dedicated utility module (`apps/web/src/lib/prices.ts`) contains pure functions that transform raw API data:

| Function               | Responsibility                                                                                                                                                                                        |
| ---------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `isSaleActive()`       | Determines if a sale is currently active based on dates                                                                                                                                               |
| `getEffectivePrice()`  | Returns sale price if active, otherwise regular price                                                                                                                                                 |
| `haversineKm()`        | Calculates distance between two coordinates                                                                                                                                                           |
| `processCompareData()` | Enriches inventory for product page: computes effective prices, distances, filters by brand/stock, partitions in-stock before OOS, sorts, computes stats (best price, price range from in-stock only) |
| `processStoreData()`   | Enriches inventory for store page: computes effective prices, filters, partitions, paginates client-side                                                                                              |

### Pages use `useMemo` for derived state

Pages call a single `useQuery` to fetch raw data, then derive everything via `useMemo`:

```typescript
const { data: raw } = useQuery(
  orpc.prices.compare.queryOptions({ input: { productId: id } }),
);

const { stores, bestPrice, priceRange, inStockCount, brands } = useMemo(() => {
  if (!raw) return defaults;
  return processCompareData(raw.inventory, {
    latitude,
    longitude,
    sortBy,
    inStockOnly,
    brandId,
  });
}, [raw, latitude, longitude, sortBy, inStockOnly, brandId]);
```

Changing a filter or sort recomputes instantly from cached data — no additional API calls.

## Rationale

**API reusability:** A raw data endpoint can serve any consumer. A mobile app might sort differently, show different stats, or not need distance at all. The API doesn't prescribe how to present the data.

**Single network request per page:** One fetch gets all inventory for a product/store. All filter/sort/page changes are instant — no loading spinners, no waterfall requests.

**TanStack Query compatibility:** `useMemo` on top of cached query data is idiomatic. TanStack Query caches the raw response; derived state recomputes only when dependencies change. No custom cache layers needed.

**Testability:** Pure functions with no side effects. `processCompareData` and `processStoreData` can be unit tested with fixture data — no mocking needed.

**Separation of concerns:** The API is a data layer. The frontend owns presentation logic. Sale detection rules, distance thresholds, and sort orders can change without API deployments.

## Consequences

**Positive:**

- API endpoints are simple and reusable
- Filter/sort changes are instant (no network round-trip)
- Processing logic is testable pure functions
- Frontend has full control over presentation
- Single API call per page load

**Negative:**

- Larger response payloads (all inventory, not filtered subsets) — acceptable for expected data volumes (hundreds, not millions of records per product/store)
- Business logic duplicated if multiple frontends need the same processing — mitigated by extracting `lib/prices.ts` into a shared package if needed later
- Client does more computation — negligible for the data volumes involved

**Scaling boundary:** If a single product has thousands of inventory records, server-side pagination would be necessary. Current data model makes this unlikely (bounded by number of stores).

## Alternatives Considered

**Server-side computed fields + filter/sort params:**

- API returns `effectivePrice`, `isOnSale`, `bestPrice`, accepts `?sortBy=price&inStockOnly=true`
- Tightly couples API to one frontend's UI needs
- Every new filter or sort requires API changes
- Rejected: limits reusability, adds unnecessary coupling

**Hybrid: server computes, client filters:**

- API returns enriched records (with `effectivePrice`, `isOnSale`) but no filtering/sorting
- Client handles display logic
- Rejected: still couples the API to specific business logic (sale detection rules)

**GraphQL with field selection:**

- Client requests only the fields it needs
- Overkill for this use case; adds significant complexity
- Rejected: oRPC + raw data achieves the same flexibility with less overhead
