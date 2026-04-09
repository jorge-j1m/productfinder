import { Hono } from "hono";
import { cors } from "hono/cors";
import storeBrandsRouter from "./routes/store_brands";
import storesRouter from "./routes/stores";
import { type DB } from "@repo/database";
import { typeid } from "typeid-js";
import { rpcHandler } from "./orpc";
import { publicRpcHandler } from "./public-orpc";
import { createAuth } from "./lib/employee_auth";

/**
 * Creates the Hono app with database injection.
 * This factory is used by BOTH production and tests to ensure identical behavior.
 */
export function createApp(db: DB) {
  const app = new Hono();

  // Create auth instance with the injected database
  // This ensures tests and production use the correct database connection
  const auth = createAuth(db);

  // Inject database into context for all requests
  app.use("*", (c, next) => {
    const requestId = typeid("req").toString();
    c.set("db", db);
    c.set("requestId", requestId);
    return next();
  });

  app.use(
    "*",
    cors({
      origin: [
        "http://localhost:3000",
        "http://localhost:3001",
        process.env.ADMIN_CLIENT_URL!,
        process.env.WEB_CLIENT_URL!,
      ],
      credentials: true, // Allow cookies for authentication
    }),
  );

  // Health check
  app.get("/", (c) => {
    return c.text("Hello Hono!");
  });

  // Employee Auth endpoints
  // Handles all authentication-related requests: sign-in, sign-up, sign-out, sessions, etc.
  // Mounted at /api/employee-auth/* to match the client configuration
  app.all("/api/employee-auth/*", (c) => {
    console.log(c.req.method, c.req.url, c.get("requestId"));

    return auth.handler(c.req.raw);
  });

  // Public API - no authentication required, read-only
  // Must be mounted before /rpc/* to match the more specific path first
  app.use("/rpc/public/*", async (c, next) => {
    const { matched, response } = await publicRpcHandler.handle(c.req.raw, {
      prefix: "/rpc/public",
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

  // Admin API - employee authentication required
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
