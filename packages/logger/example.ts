#!/usr/bin/env bun
/**
 * Example usage of the @repo/logger package
 * Run with: bun run packages/logger/example.ts
 */

import { logger, createChildLogger } from "./src/index";

// Basic logging at different levels
logger.info("🚀 Logger is working!");
logger.debug("Debug level message");
logger.warn({ userId: 123 }, "Warning with context");

// Child logger with persistent context
const requestLogger = createChildLogger({ requestId: "req_123", userId: 456 });
requestLogger.info("Processing request");
requestLogger.info({ action: "fetch_data" }, "Fetching user data");

// Error logging
try {
  throw new Error("Something went wrong!");
} catch (err) {
  logger.error({ err }, "Caught an error");
}

// Object logging (best practice - log objects, not template strings)
logger.info(
  {
    user: {
      id: 789,
      email: "user@example.com",
    },
    action: "login",
  },
  "User logged in",
);

logger.info("✅ Example complete!");
