"use client";

import { useState } from "react";
import { createQueryClient } from "#/lib/query/client";
import { QueryClientProvider } from "@tanstack/react-query";
import { ThemeProvider } from "next-themes";
import { Toaster } from "#/components/ui/sonner";
import { LocationContext, useLocationState } from "#/hooks/use-location";

function LocationProvider({ children }: { children: React.ReactNode }) {
  const location = useLocationState();
  return <LocationContext value={location}>{children}</LocationContext>;
}

export function Providers({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(() => createQueryClient());

  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider
        attribute="class"
        defaultTheme="system"
        enableSystem
        disableTransitionOnChange
      >
        <LocationProvider>
          {children}
          <Toaster />
        </LocationProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
}
