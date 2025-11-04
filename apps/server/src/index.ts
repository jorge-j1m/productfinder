import { createApp } from "./app";
import { db } from "./db";

// Create app with production database
const app = createApp(db);
console.log("App created");

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
