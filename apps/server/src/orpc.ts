import { adminRouter } from "@repo/admin-orpc";
import { OpenAPIHandler } from "@orpc/openapi/fetch";
import { OpenAPIReferencePlugin } from "@orpc/openapi/plugins";
import { ZodToJsonSchemaConverter } from "@orpc/zod/zod4";
import { onError, onStart } from "@orpc/server";

export const rpcHandler = new OpenAPIHandler(adminRouter, {
  plugins: [
    new OpenAPIReferencePlugin({
      docsProvider: "scalar",
      schemaConverters: [new ZodToJsonSchemaConverter()],
      specGenerateOptions: {
        servers: [
          { url: "http://localhost:8080/rpc" },
          { url: "https://pf-server.jorgejim.com/rpc" },
        ],
        info: {
          title: "Admin API",
          version: "1.0.0",
        },
      },
    }),
  ],
  interceptors: [
    onStart((ctx) => {
      console.log(
        ctx.request.method,
        ctx.request.url.pathname,
        ctx.context.requestId,
      );
    }),
    onError((err, opts) => {
      console.error(opts.context.requestId, err);
    }),
  ],
});
