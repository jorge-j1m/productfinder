/**
 * Pure functions for processing raw inventory data from the API.
 * All sale detection, effective price computation, distance calculation,
 * sorting, filtering, and stats aggregation happens here — not on the server.
 */

export function isSaleActive(
  salePrice: number | null,
  saleStartDate: Date | string | null,
  saleEndDate: Date | string | null,
): boolean {
  if (salePrice === null) return false;
  const now = new Date();
  if (saleStartDate && now < new Date(saleStartDate)) return false;
  if (saleEndDate && now > new Date(saleEndDate)) return false;
  return true;
}

export function getEffectivePrice(
  regularPrice: number,
  salePrice: number | null,
  saleStartDate: Date | string | null,
  saleEndDate: Date | string | null,
): number {
  if (isSaleActive(salePrice, saleStartDate, saleEndDate)) {
    return salePrice!;
  }
  return regularPrice;
}

export function haversineKm(
  lat1: number,
  lng1: number,
  lat2: number,
  lng2: number,
): number {
  const R = 6371;
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) *
      Math.cos(toRad(lat2)) *
      Math.sin(dLng / 2) *
      Math.sin(dLng / 2);
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

function toRad(deg: number): number {
  return deg * (Math.PI / 180);
}

/** Enriched inventory item with computed fields */
export interface ProcessedStorePricing {
  inventoryId: string;
  store: {
    id: string;
    name: string;
    address: string;
    city: string;
    latitude: number;
    longitude: number;
    brand: { id: string; name: string };
  };
  quantity: number;
  inStock: boolean;
  regularPrice: number;
  salePrice: number | null;
  effectivePrice: number;
  isOnSale: boolean;
  saleEndDate: Date | string | null;
  distanceKm: number | null;
}

/** Raw inventory record from the compare API */
interface RawInventoryWithStore {
  id: string;
  storeId: string;
  productId: string;
  quantity: number;
  regularPrice: number;
  salePrice: number | null;
  saleStartDate: Date | string | null;
  saleEndDate: Date | string | null;
  store: {
    id: string;
    name: string;
    address: string;
    city: string;
    latitude: number;
    longitude: number;
    brand: { id: string; name: string };
    brandId: string;
  };
}

/**
 * Process raw inventory records into enriched, sorted store pricing list.
 * In-stock stores come first, OOS stores come last.
 */
export function processCompareData(
  rawInventory: RawInventoryWithStore[],
  options: {
    latitude?: number | null;
    longitude?: number | null;
    sortBy: "price" | "distance";
    inStockOnly: boolean;
    brandId?: string;
    radiusKm?: number;
  },
) {
  const hasLocation = options.latitude != null && options.longitude != null;

  // Enrich with computed fields
  let items: ProcessedStorePricing[] = rawInventory.map((inv) => {
    const isOnSale = isSaleActive(
      inv.salePrice,
      inv.saleStartDate,
      inv.saleEndDate,
    );
    const effectivePrice = isOnSale ? inv.salePrice! : inv.regularPrice;
    const distanceKm = hasLocation
      ? haversineKm(
          options.latitude!,
          options.longitude!,
          inv.store.latitude,
          inv.store.longitude,
        )
      : null;

    return {
      inventoryId: inv.id,
      store: {
        id: inv.store.id,
        name: inv.store.name,
        address: inv.store.address,
        city: inv.store.city,
        latitude: inv.store.latitude,
        longitude: inv.store.longitude,
        brand: inv.store.brand,
      },
      quantity: inv.quantity,
      inStock: inv.quantity > 0,
      regularPrice: inv.regularPrice,
      salePrice: inv.salePrice,
      effectivePrice,
      isOnSale,
      saleEndDate: inv.saleEndDate,
      distanceKm,
    };
  });

  // Apply radius filter (requires location)
  if (options.radiusKm != null && hasLocation) {
    items = items.filter(
      (i) => i.distanceKm !== null && i.distanceKm <= options.radiusKm!,
    );
  }

  // Apply brand filter
  if (options.brandId) {
    items = items.filter((i) => i.store.brand.id === options.brandId);
  }

  // Apply in-stock filter
  if (options.inStockOnly) {
    items = items.filter((i) => i.inStock);
  }

  // Sort function
  const sortFn = (a: ProcessedStorePricing, b: ProcessedStorePricing) => {
    if (options.sortBy === "distance" && hasLocation) {
      return (a.distanceKm ?? Infinity) - (b.distanceKm ?? Infinity);
    }
    return a.effectivePrice - b.effectivePrice;
  };

  // Partition: in-stock first (sorted), then OOS (sorted)
  const inStock = items.filter((i) => i.inStock).sort(sortFn);
  const oos = items.filter((i) => !i.inStock).sort(sortFn);
  const sorted = [...inStock, ...oos];

  // Stats from in-stock stores only
  const inStockPrices = inStock.map((i) => i.effectivePrice);
  const bestPrice =
    inStockPrices.length > 0 ? Math.min(...inStockPrices) : null;
  const priceRange =
    inStockPrices.length > 0
      ? { low: Math.min(...inStockPrices), high: Math.max(...inStockPrices) }
      : null;

  // Extract unique brands (from ALL items before filtering, for the dropdown)
  const brandMap = new Map<string, string>();
  for (const inv of rawInventory) {
    if (!brandMap.has(inv.store.brand.id)) {
      brandMap.set(inv.store.brand.id, inv.store.brand.name);
    }
  }
  const brands = Array.from(brandMap, ([id, name]) => ({ id, name }));

  return {
    stores: sorted,
    bestPrice,
    priceRange,
    inStockCount: inStock.length,
    brands,
  };
}

/** Enriched inventory item for the store detail page */
export interface ProcessedStoreItem {
  inventoryId: string;
  product: {
    id: string;
    name: string;
    stockType: "WEIGHT" | "UNITS";
    image: string | null;
  };
  quantity: number;
  inStock: boolean;
  regularPrice: number;
  salePrice: number | null;
  effectivePrice: number;
  isOnSale: boolean;
  saleEndDate: Date | string | null;
}

interface RawInventoryWithProduct {
  id: string;
  storeId: string;
  productId: string;
  quantity: number;
  regularPrice: number;
  salePrice: number | null;
  saleStartDate: Date | string | null;
  saleEndDate: Date | string | null;
  product: {
    id: string;
    name: string;
    stockType: "WEIGHT" | "UNITS";
    image: string | null;
  };
}

/**
 * Process raw inventory records for a store detail page.
 * Returns enriched items with client-side filtering, sorting, and pagination.
 */
export function processStoreData(
  rawInventory: RawInventoryWithProduct[],
  options: {
    inStockOnly: boolean;
    onSaleOnly: boolean;
    page: number;
    pageSize: number;
  },
) {
  let items: ProcessedStoreItem[] = rawInventory.map((inv) => {
    const isOnSale = isSaleActive(
      inv.salePrice,
      inv.saleStartDate,
      inv.saleEndDate,
    );
    return {
      inventoryId: inv.id,
      product: inv.product,
      quantity: inv.quantity,
      inStock: inv.quantity > 0,
      regularPrice: inv.regularPrice,
      salePrice: inv.salePrice,
      effectivePrice: isOnSale ? inv.salePrice! : inv.regularPrice,
      isOnSale,
      saleEndDate: inv.saleEndDate,
    };
  });

  if (options.inStockOnly) {
    items = items.filter((i) => i.inStock);
  }
  if (options.onSaleOnly) {
    items = items.filter((i) => i.isOnSale);
  }

  // Sort: in-stock by price first, then OOS by price
  const inStock = items.filter((i) => i.inStock);
  const oos = items.filter((i) => !i.inStock);
  inStock.sort((a, b) => a.effectivePrice - b.effectivePrice);
  oos.sort((a, b) => a.effectivePrice - b.effectivePrice);
  const sorted = [...inStock, ...oos];

  // Paginate
  const total = sorted.length;
  const offset = (options.page - 1) * options.pageSize;
  const paginated = sorted.slice(offset, offset + options.pageSize);
  const totalPages = Math.ceil(total / options.pageSize);

  return {
    data: paginated,
    pagination: {
      page: options.page,
      pageSize: options.pageSize,
      total,
      totalPages,
    },
  };
}
