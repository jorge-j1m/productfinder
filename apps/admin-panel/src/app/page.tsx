import { Suspense } from "react";
import { ListStoreBrands } from "#/components/list_store_brands";
import { AuthStatus } from "#/components/auth-status";

export default function Home() {
  return (
    <div className="p-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Admin Panel</h1>
        <AuthStatus />
      </div>
      <Suspense fallback={<LoadingSkeleton />}>
        <ListStoreBrands />
      </Suspense>
    </div>
  );
}

function LoadingSkeleton() {
  console.log("LoadingSkeleton");

  return (
    <div className="mb-8">
      <h2 className="text-2xl font-semibold mb-4">Store Brands</h2>
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {[...Array(6)].map((_, i) => (
          <div key={i} className="border rounded-lg p-4 animate-pulse">
            <div className="h-6 bg-gray-200 rounded w-3/4 mb-2" />
            <div className="h-4 bg-gray-200 rounded w-1/2" />
          </div>
        ))}
      </div>
    </div>
  );
}
