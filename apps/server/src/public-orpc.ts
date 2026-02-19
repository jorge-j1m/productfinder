import { publicRouter } from "@repo/public-orpc";
import { OpenAPIHandler } from "@orpc/openapi/fetch";
import { OpenAPIReferencePlugin } from "@orpc/openapi/plugins";
import { ZodToJsonSchemaConverter } from "@orpc/zod/zod4";
import { onError, onStart } from "@orpc/server";

export const publicRpcHandler = new OpenAPIHandler(publicRouter, {
  plugins: [
    new OpenAPIReferencePlugin({
      docsProvider: "scalar",
      schemaConverters: [new ZodToJsonSchemaConverter()],
      specGenerateOptions: {
        info: {
          title: "Public API",
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
        ctx.request.url.search,
        ctx.context.requestId,
      );
    }),
    onError((err, opts) => {
      console.error(opts.context.requestId, err);
    }),
  ],
});
