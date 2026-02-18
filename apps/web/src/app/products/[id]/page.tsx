"use client";

import { use, useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { Header } from "#/components/layout/header";
import { Badge } from "#/components/ui/badge";
import { Button } from "#/components/ui/button";
import { Card, CardContent } from "#/components/ui/card";
import { Checkbox } from "#/components/ui/checkbox";
import { Skeleton } from "#/components/ui/skeleton";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "#/components/ui/select";
import { StockTypeBadge } from "#/components/stock-type-badge";
import { PriceDisplay } from "#/components/price-display";
import { orpc } from "#/lib/query/orpc";
import { useLocation } from "#/hooks/use-location";
import { formatPrice, formatDistance } from "#/lib/format";
import { cn } from "#/lib/utils";
import {
  ArrowLeft,
  MapPin,
  PackageOpen,
  Crown,
  Tag,
  PackageX,
} from "lucide-react";

export default function ProductPriceComparisonPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const router = useRouter();
  const { latitude, longitude } = useLocation();

  const [inStockOnly, setInStockOnly] = useState(false);
  const [brandFilter, setBrandFilter] = useState("all");
  const [sortBy, setSortBy] = useState<"price" | "distance">("price");

  const hasLocation = latitude !== null && longitude !== null;

  const { data, isLoading } = useQuery(
    orpc.prices.compare.queryOptions({
      input: {
        productId: id,
        latitude: latitude ?? undefined,
        longitude: longitude ?? undefined,
        inStockOnly,
        sortBy: sortBy === "distance" && hasLocation ? "distance" : "price",
      },
    }),
  );

  // Extract unique brands from response for client-side filtering
  const brands = useMemo(() => {
    if (!data) return [];
    const seen = new Map<string, string>();
    for (const store of data.stores) {
      if (!seen.has(store.store.brand.id)) {
        seen.set(store.store.brand.id, store.store.brand.name);
      }
    }
    return Array.from(seen, ([id, name]) => ({ id, name }));
  }, [data]);

  // Client-side brand filter
  const filteredStores = useMemo(() => {
    if (!data) return [];
    if (brandFilter === "all") return data.stores;
    return data.stores.filter((s) => s.store.brand.id === brandFilter);
  }, [data, brandFilter]);

  return (
    <div className="min-h-svh">
      <Header />

      <main className="mx-auto max-w-5xl px-4 py-6">
        {/* Back link */}
        <Button
          variant="ghost"
          size="sm"
          className="mb-4"
          onClick={() => router.back()}
        >
          <ArrowLeft className="size-4" />
          Back to results
        </Button>

        {isLoading ? (
          <div className="space-y-4">
            <Skeleton className="h-32 w-full rounded-xl" />
            <Skeleton className="h-10 w-full rounded-lg" />
            <Skeleton className="h-24 w-full rounded-xl" />
            <Skeleton className="h-24 w-full rounded-xl" />
          </div>
        ) : data ? (
          <>
            {/* Product header */}
            <Card className="mb-6 py-0">
              <CardContent className="flex flex-col gap-4 py-5 sm:flex-row sm:items-center">
                {data.product.image ? (
                  <Image
                    src={data.product.image}
                    alt={data.product.name}
                    width={80}
                    height={80}
                    className="bg-muted size-20 shrink-0 rounded-lg object-cover"
                  />
                ) : (
                  <div className="bg-muted flex size-20 shrink-0 items-center justify-center rounded-lg">
                    <PackageOpen className="text-muted-foreground size-8" />
                  </div>
                )}

                <div className="min-w-0 flex-1 space-y-2">
                  <h1 className="text-2xl font-bold tracking-tight">
                    {data.product.name}
                  </h1>
                  <StockTypeBadge stockType={data.product.stockType} />
                </div>

                {/* Summary stats */}
                <div className="flex items-center gap-6 text-sm">
                  {data.lowestPrice !== null && (
                    <div className="text-center">
                      <div className="text-lg font-bold text-green-600 dark:text-green-400">
                        {formatPrice(data.lowestPrice, data.product.stockType)}
                      </div>
                      <div className="text-muted-foreground text-xs">
                        Best price
                      </div>
                    </div>
                  )}
                  <div className="text-center">
                    <div className="text-lg font-bold">{data.storeCount}</div>
                    <div className="text-muted-foreground text-xs">
                      {data.storeCount === 1 ? "Store" : "Stores"}
                    </div>
                  </div>
                  {data.lowestPrice !== null && data.highestPrice !== null && (
                    <div className="text-center">
                      <div className="text-muted-foreground text-sm">
                        {formatPrice(data.lowestPrice, data.product.stockType)}{" "}
                        -{" "}
                        {formatPrice(data.highestPrice, data.product.stockType)}
                      </div>
                      <div className="text-muted-foreground text-xs">
                        Price range
                      </div>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Filter bar */}
            <div className="mb-4 flex flex-wrap items-center gap-3">
              <label className="flex cursor-pointer items-center gap-2 text-sm">
                <Checkbox
                  checked={inStockOnly}
                  onCheckedChange={(v) => setInStockOnly(v === true)}
                />
                In stock only
              </label>

              {brands.length > 1 && (
                <Select value={brandFilter} onValueChange={setBrandFilter}>
                  <SelectTrigger size="sm">
                    <SelectValue placeholder="Brand" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Brands</SelectItem>
                    {brands.map((b) => (
                      <SelectItem key={b.id} value={b.id}>
                        {b.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}

              <Select
                value={sortBy}
                onValueChange={(v) => setSortBy(v as "price" | "distance")}
              >
                <SelectTrigger size="sm">
                  <SelectValue placeholder="Sort" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="price">Sort by Price</SelectItem>
                  <SelectItem value="distance" disabled={!hasLocation}>
                    Sort by Distance
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Store price cards */}
            {filteredStores.length > 0 ? (
              <div className="space-y-3">
                {filteredStores.map((store, index) => {
                  const isBest = index === 0 && sortBy === "price";
                  const isOos = !store.inStock;

                  return (
                    <Card
                      key={store.inventoryId}
                      className={cn("py-0", isOos && "opacity-60")}
                    >
                      <CardContent className="flex flex-col gap-3 py-4 sm:flex-row sm:items-center sm:justify-between">
                        <div className="flex items-start gap-3">
                          {/* Rank */}
                          <span className="text-muted-foreground mt-0.5 w-6 text-center text-sm font-medium tabular-nums">
                            #{index + 1}
                          </span>

                          <div className="min-w-0 space-y-1">
                            <div className="flex items-center gap-2">
                              {isBest && (
                                <Badge className="bg-green-600 text-white dark:bg-green-500">
                                  <Crown className="size-3" />
                                  BEST PRICE
                                </Badge>
                              )}
                              {store.isOnSale && (
                                <Badge className="bg-amber-500 text-white dark:bg-amber-400 dark:text-amber-950">
                                  <Tag className="size-3" />
                                  ON SALE
                                </Badge>
                              )}
                            </div>
                            <h3 className="font-semibold">
                              {store.store.brand.name} - {store.store.name}
                            </h3>
                            <p className="text-muted-foreground text-sm">
                              {store.store.address}, {store.store.city}
                            </p>
                            {store.distanceKm !== undefined && (
                              <p className="text-muted-foreground flex items-center gap-1 text-xs">
                                <MapPin className="size-3" />
                                {formatDistance(store.distanceKm)}
                              </p>
                            )}
                            {store.isOnSale && store.saleEndDate && (
                              <p className="text-xs text-amber-600 dark:text-amber-400">
                                Sale ends{" "}
                                {new Date(store.saleEndDate).toLocaleDateString(
                                  undefined,
                                  { month: "short", day: "numeric" },
                                )}
                              </p>
                            )}
                          </div>
                        </div>

                        <div className="flex items-center gap-4 sm:text-right">
                          <PriceDisplay
                            effectivePrice={store.effectivePrice}
                            regularPrice={store.regularPrice}
                            isOnSale={store.isOnSale}
                            stockType={data.product.stockType}
                          />
                          <div className="text-sm">
                            {store.inStock ? (
                              <span className="text-green-600 dark:text-green-400">
                                In Stock ({store.quantity})
                              </span>
                            ) : (
                              <span className="flex items-center gap-1 text-red-500">
                                <PackageX className="size-3" />
                                OUT OF STOCK
                              </span>
                            )}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-20">
                <PackageOpen className="text-muted-foreground mb-4 size-12" />
                <h2 className="text-lg font-semibold">
                  No stores found for this product
                </h2>
                <p className="text-muted-foreground text-sm">
                  Try adjusting your filters.
                </p>
              </div>
            )}
          </>
        ) : null}
      </main>
    </div>
  );
}
