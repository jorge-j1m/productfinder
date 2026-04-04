"use client";

import { Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";
import { Search } from "lucide-react";
import { Input } from "#/components/ui/input";

function SearchBarContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [query, setQuery] = useState(searchParams.get("q") ?? "");

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const trimmed = query.trim();
    if (!trimmed) return;

    const params = new URLSearchParams();
    params.set("q", trimmed);
    // Preserve stockType if it exists
    const stockType = searchParams.get("stockType");
    if (stockType) params.set("stockType", stockType);
    router.push(`/search?${params.toString()}`);
  }

  return (
    <form onSubmit={handleSubmit} className="relative w-full">
      <Search className="text-muted-foreground absolute top-1/2 left-3 size-4 -translate-y-1/2" />
      <Input
        type="search"
        placeholder="Search products..."
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        className="pl-9"
      />
    </form>
  );
}

export function SearchBar() {
  return (
    <Suspense
      fallback={
        <div className="relative w-full">
          <Search className="text-muted-foreground absolute top-1/2 left-3 size-4 -translate-y-1/2" />
          <Input
            type="search"
            placeholder="Search products..."
            disabled
            className="pl-9"
          />
        </div>
      }
    >
      <SearchBarContent />
    </Suspense>
  );
}
