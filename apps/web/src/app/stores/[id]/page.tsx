"use client";

import { use, useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { Header } from "#/components/layout/header";
import { Badge } from "#/components/ui/badge";
import { Button } from "#/components/ui/button";
import { Card, CardContent } from "#/components/ui/card";
import { Checkbox } from "#/components/ui/checkbox";
import { Skeleton } from "#/components/ui/skeleton";
import { StockTypeBadge } from "#/components/stock-type-badge";
import { PriceDisplay } from "#/components/price-display";
import { Pagination } from "#/components/pagination";
import { orpc } from "#/lib/query/orpc";
import { useLocation } from "#/hooks/use-location";
import { haversineKm } from "#/lib/prices";
import { processStoreData } from "#/lib/prices";
import { formatDistance } from "#/lib/format";
import {
  ArrowLeft,
  ArrowRight,
  MapPin,
  PackageOpen,
  Store,
  Tag,
} from "lucide-react";

export default function StoreDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const router = useRouter();
  const { latitude, longitude } = useLocation();

  const [page, setPage] = useState(1);
  const [inStockOnly, setInStockOnly] = useState(false);
  const [onSaleOnly, setOnSaleOnly] = useState(false);

  // Fetch store info
  const { data: store, isLoading: storeLoading } = useQuery(
    orpc.stores.get.queryOptions({
      input: { id },
    }),
  );

  // Single fetch: all raw inventory for this store
  const { data: rawInventory, isLoading: inventoryLoading } = useQuery(
    orpc.prices.forStore.queryOptions({
      input: { storeId: id },
    }),
  );

  // All filtering, sorting, pagination happens client-side
  const processed = useMemo(() => {
    if (!rawInventory) return null;
    return processStoreData(rawInventory, {
      inStockOnly,
      onSaleOnly,
      page,
      pageSize: 20,
    });
  }, [rawInventory, inStockOnly, onSaleOnly, page]);

  // Compute distance if location available
  const distanceKm =
    latitude !== null && longitude !== null && store
      ? haversineKm(latitude, longitude, store.latitude, store.longitude)
      : null;

  return (
    <div className="min-h-svh">
      <Header />

      <main className="mx-auto max-w-5xl px-4 py-6">
        <Button
          variant="ghost"
          size="sm"
          className="mb-4"
          onClick={() => router.back()}
        >
          <ArrowLeft className="size-4" />
          Back
        </Button>

        {storeLoading ? (
          <Skeleton className="mb-6 h-32 w-full rounded-xl" />
        ) : store ? (
          <Card className="mb-6 py-0">
            <CardContent className="flex flex-col gap-3 py-5 sm:flex-row sm:items-center">
              <div className="bg-muted flex size-14 shrink-0 items-center justify-center rounded-lg">
                <Store className="text-muted-foreground size-7" />
              </div>

              <div className="min-w-0 flex-1 space-y-1">
                <h1 className="text-2xl font-bold tracking-tight">
                  {store.brand.name} - {store.name}
                </h1>
                <p className="text-muted-foreground text-sm">
                  {store.address}, {store.city}
                </p>
                {distanceKm !== null && (
                  <p className="text-muted-foreground flex items-center gap-1 text-xs">
                    <MapPin className="size-3" />
                    {formatDistance(distanceKm)}
                  </p>
                )}
              </div>
            </CardContent>
          </Card>
        ) : null}

        {/* Filters */}
        <div className="mb-4 flex flex-wrap items-center gap-4">
          <label className="flex cursor-pointer items-center gap-2 text-sm">
            <Checkbox
              checked={inStockOnly}
              onCheckedChange={(v) => {
                setInStockOnly(v === true);
                setPage(1);
              }}
            />
            In stock only
          </label>
          <label className="flex cursor-pointer items-center gap-2 text-sm">
            <Checkbox
              checked={onSaleOnly}
              onCheckedChange={(v) => {
                setOnSaleOnly(v === true);
                setPage(1);
              }}
            />
            On sale only
          </label>
        </div>

        {/* Product list */}
        {inventoryLoading ? (
          <div className="space-y-3">
            {Array.from({ length: 5 }).map((_, i) => (
              <Skeleton key={i} className="h-20 w-full rounded-xl" />
            ))}
          </div>
        ) : processed && processed.data.length > 0 ? (
          <div className="space-y-3">
            {processed.data.map((item) => (
              <Card key={item.inventoryId} className="py-0">
                <CardContent className="flex items-center gap-4 py-3">
                  {item.product.image ? (
                    <Image
                      src={item.product.image}
                      alt={item.product.name}
                      width={56}
                      height={56}
                      className="bg-muted size-14 shrink-0 rounded-lg object-cover"
                    />
                  ) : (
                    <div className="bg-muted flex size-14 shrink-0 items-center justify-center rounded-lg">
                      <PackageOpen className="text-muted-foreground size-5" />
                    </div>
                  )}

                  <div className="min-w-0 flex-1 space-y-1">
                    <h3 className="truncate font-semibold">
                      {item.product.name}
                    </h3>
                    <div className="flex items-center gap-2">
                      <StockTypeBadge stockType={item.product.stockType} />
                      {item.isOnSale && (
                        <Badge className="bg-amber-500 text-white dark:bg-amber-400 dark:text-amber-950">
                          <Tag className="size-3" />
                          ON SALE
                        </Badge>
                      )}
                    </div>
                    {item.isOnSale && item.saleEndDate && (
                      <p className="text-xs text-amber-600 dark:text-amber-400">
                        Ends{" "}
                        {new Date(item.saleEndDate).toLocaleDateString(
                          undefined,
                          { month: "short", day: "numeric" },
                        )}
                      </p>
                    )}
                  </div>

                  <div className="flex items-center gap-4">
                    <PriceDisplay
                      effectivePrice={item.effectivePrice}
                      regularPrice={item.regularPrice}
                      isOnSale={item.isOnSale}
                      stockType={item.product.stockType}
                    />
                    <div className="hidden text-sm sm:block">
                      {item.inStock ? (
                        <span className="text-green-600 dark:text-green-400">
                          In Stock ({item.quantity})
                        </span>
                      ) : (
                        <span className="text-red-500">OOS</span>
                      )}
                    </div>
                    <Button variant="ghost" size="icon-sm" asChild>
                      <Link href={`/products/${item.product.id}`}>
                        <ArrowRight className="size-4" />
                      </Link>
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}

            <Pagination
              page={processed.pagination.page}
              totalPages={processed.pagination.totalPages}
              onPageChange={setPage}
            />
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-20">
            <PackageOpen className="text-muted-foreground mb-4 size-12" />
            <h2 className="text-lg font-semibold">No products found</h2>
            <p className="text-muted-foreground text-sm">
              Try adjusting your filters.
            </p>
          </div>
        )}
      </main>
    </div>
  );
}
