"use client";

import { useState } from "react";
import { createQueryClient } from "#/lib/query/client";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "#/components/ui/sonner";

export function Providers(props: { children: React.ReactNode }) {
  const [queryClient] = useState(() => createQueryClient());

  return (
    <QueryClientProvider client={queryClient}>
      {props.children}
      <Toaster />
    </QueryClientProvider>
  );
}
