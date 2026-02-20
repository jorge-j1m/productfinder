# ADR-008: Public Frontend Design Decisions

## Status

Accepted

## Context

The public app (`apps/web`) serves consumers comparing prices. Several frontend design decisions were made during development that affect UX, architecture, and future work. This ADR captures them for reference.

## Decisions

### 1. Geolocation gating on the product page

**Problem:** `navigator.geolocation.getCurrentPosition` is async. If the price comparison query fires before geolocation resolves, the first render shows no distances. When geolocation resolves, coordinates change, `useMemo` recomputes, and distances appear — causing a flash of incomplete data.

**Solution:** The `useLocation` hook exposes a `resolved` boolean (true once geolocation succeeds OR fails). The product page sets `enabled: locationResolved` on its query, showing a skeleton until location state is determined.

```typescript
const { data: raw, isLoading } = useQuery({
  ...orpc.prices.compare.queryOptions({ input: { productId: id } }),
  enabled: locationResolved,
});
```

**Trade-off:** Slightly slower initial load (waits for geolocation). Acceptable because:

- Geolocation typically resolves in <1s
- A flash of no-distance data followed by distances appearing is confusing
- If geolocation fails, `resolved` still becomes `true` and the page renders without distances

**Note:** The store detail page does NOT gate on geolocation — it only uses distance for a single store header, which is less jarring to update.

### 2. In-stock / out-of-stock partitioning

**Rule:** OOS stores always appear AFTER all in-stock stores, regardless of sort order. Within each partition, items are sorted by the user's chosen criteria (price or distance).

```
[in-stock sorted by price] → [OOS sorted by price]
```

**Rationale:** Users primarily care about where they can actually buy the product. OOS stores are useful context ("this store carries it but is currently out") but should never rank above available options.

**Stats (best price, price range, in-stock count) are computed from in-stock stores only.** An OOS store with a lower price is irrelevant — you can't buy it there.

### 3. BEST PRICE badge logic

The "BEST PRICE" badge appears on a store card only when ALL of these are true:

- The store is in stock
- Sort mode is "price" (not "distance")
- The store's effective price equals the computed best price

Multiple stores can show BEST PRICE if they share the lowest price. The badge is hidden when sorting by distance because positional ranking (#1, #2...) already communicates the sort, and "best price" would be misleading in a distance-sorted list.

### 4. Brand filter populated from full dataset

The brand dropdown on the product page shows ALL brands that carry the product, extracted from the raw API response BEFORE any filtering. This means:

- Selecting "In stock only" doesn't remove brands from the dropdown
- Users can always see every brand option, even if currently filtered out

### 5. Landing page as search portal

The landing page has one job: get users to search. It's a search engine, not a marketing page.

- Auto-focused search input (h-12, larger than the header search)
- Stock type pills (All, By Weight, By Unit) that set URL params
- Three feature cards as secondary context (Compare, Nearby, On Sale)
- Header hides its search bar on the landing page (`hideSearch` prop)

### 6. URL-driven state on search page

The search page uses URL search params as the single source of truth: `q`, `stockType`, `sort`, `page`. This means:

- Shareable URLs with filters intact
- Browser back/forward works correctly
- No local state synchronization needed
- `updateParam()` helper manages URL mutations and resets page to 1 on filter changes

### 7. Component reuse from admin panel

UI components (button, card, badge, input, checkbox, select, skeleton, sonner) were copied from the admin panel, not shared via a package. This was intentional:

- The admin and public apps may diverge aesthetically
- Copying is simpler than extracting a shared UI package for two consumers
- If a third consumer appears, extract to `@repo/ui` then

### 8. Price display conventions

- All prices stored in cents (integers in DB)
- `WEIGHT` products: displayed as `$X.XX/kg` (price per gram × 1000)
- `UNITS` products: displayed as `$X.XX`
- Sale prices show effective price prominently + strikethrough original price
- `formatPrice(cents, stockType)` in `lib/format.ts` handles all formatting

## Consequences

These decisions create a frontend that:

- Feels instant for filter/sort operations (no API round-trips)
- Gracefully handles geolocation uncertainty
- Prioritizes actionable information (in-stock) over complete information (all stores)
- Is URL-shareable for the search experience
- Can evolve independently from the admin panel's UI

Future considerations:

- If geolocation delay becomes a UX issue, consider showing the page immediately with a "calculating distances..." indicator instead of a full skeleton
- If the brand list grows very large, consider a searchable combobox instead of a simple select
- If product inventory exceeds ~500 stores, consider server-side pagination for the compare endpoint
