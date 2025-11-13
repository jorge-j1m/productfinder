import { Hono } from "hono";
import storeBrandsRouter from "./routes/store_brands";
import storesRouter from "./routes/stores";
import { type DB } from "@repo/database";
import { typeid } from "typeid-js";
import { rpcHandler } from "./orpc";

/**
 * Creates the Hono app with database injection.
 * This factory is used by BOTH production and tests to ensure identical behavior.
 */
export function createApp(db: DB) {
  const app = new Hono();

  // Inject database into context for all requests
  app.use("*", (c, next) => {
    const requestId = typeid("req").toString();
    c.set("db", db);
    c.set("requestId", requestId);
    return next();
  });

  // Health check
  app.get("/", (c) => {
    return c.text("Hello Hono!");
  });

  app.use("/rpc/*", async (c, next) => {
    const { matched, response } = await rpcHandler.handle(c.req.raw, {
      prefix: "/rpc",
      context: {
        db: c.get("db"),
        requestId: c.get("requestId"),
      },
    });

    if (matched) {
      return c.newResponse(response.body, response);
    }

    return next();
  });

  // Mount CRUD routes
  app.route("/api/store-brands", storeBrandsRouter);
  app.route("/api/stores", storesRouter);

  return app;
}
