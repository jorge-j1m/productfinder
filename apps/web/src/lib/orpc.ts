import type { JsonifiedClient } from "@orpc/openapi-client";
import { createORPCClient, onError } from "@orpc/client";
import { OpenAPILink } from "@orpc/openapi-client/fetch";
import { type PublicRouter, publicRouter } from "@repo/public-orpc";

const link = new OpenAPILink(publicRouter, {
  url: (process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8080") + "/rpc/public",
  interceptors: [
    onError((error: unknown) => {
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

export const client: JsonifiedClient<PublicRouter> = createORPCClient(link);
