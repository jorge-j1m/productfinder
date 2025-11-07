import { createApp } from "./app";
import { db, shutdownDb } from "./db";

// Create app with production database
const app = createApp(db);
console.log("App created");

const server = Bun.serve({
  port: 8080,
  fetch: app.fetch,
});

console.log(`Started development server: http://localhost:${server.port}`);

// Graceful shutdown handler
process.on("SIGINT", async () => {
  console.log("\nShutting down server gracefully...");
  await server.stop();
  console.log("Server shutdown complete.");
  console.log("Shutting down database...");
  await shutdownDb(db);
  console.log("Database shutdown");
  console.log("Exiting.");
  process.exit(0);
});

process.on("SIGTERM", () => {
  console.log("\nShutting down gracefully...");
  server.stop();
  shutdownDb(db);
  process.exit(0);
});
