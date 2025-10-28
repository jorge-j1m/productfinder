import { Hono } from "hono";
import { db } from "./db";
import { employees } from "./db/schema";
import type { Employee } from "@repo/employee-auth";
const app = new Hono();

app.get("/", (c) => {
  return c.text("Hello Hono!");
});

app.get("/test", async (c) => {
  const users = (await db.select().from(employees)) as unknown as Employee[];
  return c.json(users);
});

const server = Bun.serve({
  port: 8080,
  fetch: app.fetch,
});

console.log(`Started development server: http://localhost:${server.port}`);

// Graceful shutdown handler
process.on("SIGINT", () => {
  console.log("\nShutting down gracefully...");
  server.stop();
  process.exit(0);
});

process.on("SIGTERM", () => {
  console.log("\nShutting down gracefully...");
  server.stop();
  process.exit(0);
});
