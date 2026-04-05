import type { JsonifiedClient } from "@orpc/openapi-client";
import { createORPCClient, onError } from "@orpc/client";
import { OpenAPILink } from "@orpc/openapi-client/fetch";
import { type AdminRouter, adminRouter } from "@repo/admin-orpc";

const link = new OpenAPILink(adminRouter, {
  url: (process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080") + "/rpc",
  // headers: () => ({
  //   'x-api-key': 'my-api-key',
  // }),
  // fetch: (request, init) => {
  //   return globalThis.fetch(request, {
  //     ...init,
  //     credentials: 'include', // Include cookies for cross-origin requests
  //   })
  // },
  interceptors: [
    onError((error: unknown) => {
      // Ignore AbortErrors - they're expected when navigating away from a page
      // React Query cancels in-flight requests automatically
      if (
        error instanceof Error &&
        (error.name === "AbortError" || error.message?.includes("aborted"))
      ) {
        return;
      }
      console.error(error);
    }),
  ],
});

export const client: JsonifiedClient<AdminRouter> = createORPCClient(link);
