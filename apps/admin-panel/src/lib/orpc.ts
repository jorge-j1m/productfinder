import type { JsonifiedClient } from "@orpc/openapi-client";
import { createORPCClient, onError } from "@orpc/client";
import { OpenAPILink } from "@orpc/openapi-client/fetch";
import { type AdminRouter, adminRouter } from "@repo/admin-orpc";

const link = new OpenAPILink(adminRouter, {
  url: "http://127.0.0.1:8080/rpc",
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
    onError((error) => {
      console.error(error);
    }),
  ],
});

export const client: JsonifiedClient<AdminRouter> = createORPCClient(link);
