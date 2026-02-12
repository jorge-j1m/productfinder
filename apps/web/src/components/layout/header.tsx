"use client";

import Link from "next/link";
import { useTheme } from "next-themes";
import { ShoppingCart, Sun, Moon } from "lucide-react";
import { Button } from "#/components/ui/button";
import { SearchBar } from "#/components/search-bar";

export function Header({ hideSearch = false }: { hideSearch?: boolean }) {
  const { resolvedTheme, setTheme } = useTheme();

  return (
    <header className="bg-background/80 sticky top-0 z-50 border-b backdrop-blur-sm">
      <div className="mx-auto flex max-w-5xl items-center gap-4 px-4 py-3">
        <Link
          href="/"
          className="flex shrink-0 items-center gap-2 font-semibold tracking-tight"
        >
          <ShoppingCart className="size-5" />
          <span className="text-lg">ProductFinder</span>
        </Link>

        {!hideSearch && (
          <div className="hidden flex-1 md:block">
            <SearchBar />
          </div>
        )}

        <div className="ml-auto">
          <Button
            variant="ghost"
            size="icon"
            onClick={() =>
              setTheme(resolvedTheme === "dark" ? "light" : "dark")
            }
            aria-label="Toggle theme"
          >
            <Sun className="size-[1.2rem] scale-100 rotate-0 transition-all dark:scale-0 dark:-rotate-90" />
            <Moon className="absolute size-[1.2rem] scale-0 rotate-90 transition-all dark:scale-100 dark:rotate-0" />
          </Button>
        </div>
      </div>

      {/* Mobile: full-width search below header row */}
      {!hideSearch && (
        <div className="border-t px-4 pb-3 md:hidden">
          <SearchBar />
        </div>
      )}
    </header>
  );
}
