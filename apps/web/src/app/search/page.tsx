"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import Image from "next/image";
import { Header } from "#/components/layout/header";
import { Button } from "#/components/ui/button";
import { Card, CardContent } from "#/components/ui/card";
import { Skeleton } from "#/components/ui/skeleton";
import { StockTypeBadge } from "#/components/stock-type-badge";
import { Pagination } from "#/components/pagination";
import { orpc } from "#/lib/query/orpc";
import { ArrowRight, PackageOpen } from "lucide-react";
import Link from "next/link";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "#/components/ui/select";

const STOCK_TYPE_OPTIONS = [
  { label: "All Types", value: "all" },
  { label: "By Weight", value: "WEIGHT" },
  { label: "By Unit", value: "UNITS" },
] as const;

const SORT_OPTIONS = [
  { label: "Name A-Z", value: "name-asc" },
  { label: "Name Z-A", value: "name-desc" },
] as const;

export default function SearchPage() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const q = searchParams.get("q") ?? "";
  const stockType = searchParams.get("stockType") ?? "all";
  const sort = searchParams.get("sort") ?? "name-asc";
  const page = Number(searchParams.get("page") ?? "1");

  const [sortBy, sortOrder] = sort.split("-") as [
    "name" | "id",
    "asc" | "desc",
  ];

  const { data, isLoading } = useQuery(
    orpc.products.search.queryOptions({
      input: {
        query: q || undefined,
        stockType:
          stockType === "all" ? undefined : (stockType as "WEIGHT" | "UNITS"),
        sortBy,
        sortOrder,
        page,
        pageSize: 20,
      },
    }),
  );

  function updateParam(key: string, value: string) {
    const params = new URLSearchParams(searchParams.toString());
    if (value && value !== "all") {
      params.set(key, value);
    } else {
      params.delete(key);
    }
    // Reset to page 1 when filters change
    if (key !== "page") params.delete("page");
    router.push(`/search?${params.toString()}`);
  }

  return (
    <div className="min-h-svh">
      <Header />

      <main className="mx-auto max-w-5xl px-4 py-6">
        {/* Results header */}
        <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">
              {q ? `Results for "${q}"` : "All Products"}
            </h1>
            {data && (
              <p className="text-muted-foreground text-sm">
                {data.pagination.total} product
                {data.pagination.total !== 1 ? "s" : ""} found
              </p>
            )}
          </div>

          <div className="flex items-center gap-2">
            <Select value={sort} onValueChange={(v) => updateParam("sort", v)}>
              <SelectTrigger size="sm">
                <SelectValue placeholder="Sort" />
              </SelectTrigger>
              <SelectContent>
                {SORT_OPTIONS.map((opt) => (
                  <SelectItem key={opt.value} value={opt.value}>
                    {opt.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select
              value={stockType}
              onValueChange={(v) => updateParam("stockType", v)}
            >
              <SelectTrigger size="sm">
                <SelectValue placeholder="Type" />
              </SelectTrigger>
              <SelectContent>
                {STOCK_TYPE_OPTIONS.map((opt) => (
                  <SelectItem key={opt.value} value={opt.value}>
                    {opt.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Product list */}
        {isLoading ? (
          <div className="space-y-3">
            {Array.from({ length: 5 }).map((_, i) => (
              <Skeleton key={i} className="h-24 w-full rounded-xl" />
            ))}
          </div>
        ) : data && data.data.length > 0 ? (
          <div className="space-y-3">
            {data.data.map((product) => (
              <Card key={product.id} className="py-0">
                <CardContent className="flex items-center gap-4 py-4">
                  {product.image ? (
                    <Image
                      src={product.image}
                      alt={product.name}
                      width={64}
                      height={64}
                      className="bg-muted size-16 shrink-0 rounded-lg object-cover"
                    />
                  ) : (
                    <div className="bg-muted flex size-16 shrink-0 items-center justify-center rounded-lg">
                      <PackageOpen className="text-muted-foreground size-6" />
                    </div>
                  )}

                  <div className="min-w-0 flex-1">
                    <h2 className="truncate font-semibold">{product.name}</h2>
                    <div className="mt-1 flex items-center gap-2">
                      <StockTypeBadge stockType={product.stockType} />
                      {product.barcode && (
                        <span className="text-muted-foreground font-mono text-xs">
                          {product.barcode}
                        </span>
                      )}
                    </div>
                  </div>

                  <Button variant="ghost" size="sm" asChild>
                    <Link href={`/products/${product.id}`}>
                      Compare Prices
                      <ArrowRight className="size-4" />
                    </Link>
                  </Button>
                </CardContent>
              </Card>
            ))}

            <Pagination
              page={data.pagination.page}
              totalPages={data.pagination.totalPages}
              onPageChange={(p) => updateParam("page", String(p))}
            />
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-20">
            <PackageOpen className="text-muted-foreground mb-4 size-12" />
            <h2 className="text-lg font-semibold">No products found</h2>
            <p className="text-muted-foreground text-sm">
              Try a different search term or filter.
            </p>
          </div>
        )}
      </main>
    </div>
  );
}
