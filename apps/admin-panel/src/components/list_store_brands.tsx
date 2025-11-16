"use client";

import { useSuspenseQuery } from "@tanstack/react-query";
import { orpc } from "#/lib/query/orpc";

export function ListStoreBrands() {
  const {
    data: storeBrands,
    refetch,
    isRefetching,
  } = useSuspenseQuery(orpc.storeBrands.getAll.queryOptions());

  return (
    <div className="mb-8">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-2xl font-semibold">Store Brands</h2>
        <button
          onClick={() => refetch()}
          disabled={isRefetching}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-blue-400 disabled:cursor-not-allowed transition-colors"
        >
          {isRefetching ? "Refreshing..." : "Refresh"}
        </button>
      </div>

      {storeBrands.length === 0 ? (
        <p className="text-gray-500">No store brands found.</p>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {storeBrands.map((brand) => (
            <div
              key={String(brand.id)}
              className="border rounded-lg p-4 hover:shadow-md transition-shadow"
            >
              <h3 className="font-semibold text-lg">{String(brand.name)}</h3>
              <p className="text-sm text-gray-500">{String(brand.id)}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
