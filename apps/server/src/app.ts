import { Hono } from "hono";
import storeBrandsRouter from "./routes/store_brands";
import storesRouter from "./routes/stores";
import { type DB } from "@repo/database";

/**
 * Creates the Hono app with database injection.
 * This factory is used by BOTH production and tests to ensure identical behavior.
 */
export function createApp(db: DB) {
  const app = new Hono();
  // Inject database into context for all requests
  app.use("*", async (c, next) => {
    c.set("db", db);
    await next();
  });

  // Health check
  app.get("/", (c) => {
    return c.text("Hello Hono!");
  });

  // Mount CRUD routes
  app.route("/api/store-brands", storeBrandsRouter);
  app.route("/api/stores", storesRouter);

  return app;
}
