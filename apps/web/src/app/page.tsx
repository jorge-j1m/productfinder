"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Header } from "#/components/layout/header";
import { Input } from "#/components/ui/input";
import { Button } from "#/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardTitle,
} from "#/components/ui/card";
import { Search, ArrowLeftRight, MapPin, Tag } from "lucide-react";

const STOCK_TYPE_OPTIONS = [
  { label: "All", value: "" },
  { label: "By Weight (/kg)", value: "WEIGHT" },
  { label: "By Unit", value: "UNITS" },
] as const;

const FEATURES = [
  {
    icon: ArrowLeftRight,
    title: "Compare prices",
    description: "See every store's price for a product, ranked lowest first.",
  },
  {
    icon: MapPin,
    title: "Nearby stores",
    description:
      "Find the closest stores with the best deals on what you need.",
  },
  {
    icon: Tag,
    title: "On sale right now",
    description: "Spot active sales with end dates so you never miss a deal.",
  },
] as const;

export default function Home() {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [stockType, setStockType] = useState("");

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const trimmed = query.trim();
    if (!trimmed) return;

    const params = new URLSearchParams();
    params.set("q", trimmed);
    if (stockType) params.set("stockType", stockType);
    router.push(`/search?${params.toString()}`);
  }

  return (
    <div className="flex min-h-svh flex-col">
      <Header hideSearch />

      <main className="flex flex-1 flex-col items-center justify-center px-4 py-16">
        <div className="w-full max-w-2xl space-y-8">
          {/* Headline */}
          <h1 className="text-center text-3xl font-bold tracking-tight md:text-4xl">
            Find the best prices near you.
          </h1>

          {/* Search */}
          <form onSubmit={handleSubmit} className="space-y-3">
            <div className="relative">
              <Search className="text-muted-foreground absolute top-1/2 left-4 size-5 -translate-y-1/2" />
              <Input
                type="search"
                placeholder="Search products..."
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                autoFocus
                className="h-12 rounded-lg pl-11 text-base shadow-sm md:text-base"
              />
            </div>

            {/* Stock type pills */}
            <div className="flex items-center justify-center gap-2">
              {STOCK_TYPE_OPTIONS.map((opt) => (
                <Button
                  key={opt.value}
                  type="button"
                  variant={stockType === opt.value ? "default" : "outline"}
                  size="sm"
                  onClick={() => setStockType(opt.value)}
                >
                  {opt.label}
                </Button>
              ))}
            </div>
          </form>

          {/* Feature cards */}
          <div className="grid gap-4 pt-8 md:grid-cols-3">
            {FEATURES.map((feature) => (
              <Card key={feature.title} className="py-4">
                <CardContent className="space-y-2">
                  <feature.icon className="text-muted-foreground size-5" />
                  <CardTitle className="text-sm">{feature.title}</CardTitle>
                  <CardDescription>{feature.description}</CardDescription>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </main>
    </div>
  );
}
