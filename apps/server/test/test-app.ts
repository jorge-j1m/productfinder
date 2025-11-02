import { Hono } from "hono";
import storeBrandsRouter from "../src/routes/store_brands";
import storesRouter from "../src/routes/stores";
import type { drizzle } from "drizzle-orm/node-postgres";
import type * as schema from "../src/db/schema";

// Create app with injected test database
export function createTestApp(db: ReturnType<typeof drizzle<typeof schema>>) {
  const app = new Hono();

  // Inject test database into context
  app.use("*", async (c, next) => {
    c.set("db", db);
    await next();
  });

  // Mount routes
  app.route("/api/store-brands", storeBrandsRouter);
  app.route("/api/stores", storesRouter);

  return app;
}
