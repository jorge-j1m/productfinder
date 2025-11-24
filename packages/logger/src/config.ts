import type { LoggerOptions } from "pino";

/**
 * Pino logger configuration
 * Automatically adapts based on NODE_ENV:
 * - Development: Pretty-printed, colorized logs at debug level
 * - Production: Structured JSON logs at info level
 */

const isDevelopment = process.env.NODE_ENV === "development";
const isTest = process.env.NODE_ENV === "test";

export const pinoConfig: LoggerOptions = {
  // Log level hierarchy: trace < debug < info < warn < error < fatal
  level: process.env.LOG_LEVEL || (isDevelopment ? "debug" : "info"),

  // Pretty print only in development (not in production - it's slower)
  transport: isDevelopment
    ? {
        target: "pino-pretty",
        options: {
          colorize: true,
          translateTime: "HH:MM:ss Z",
          ignore: "pid,hostname",
          singleLine: false,
        },
      }
    : undefined,

  // Base fields to include in every log
  base: {
    env: process.env.NODE_ENV || "development",
  },

  // Custom serializers for common objects
  serializers: {
    // Pino's built-in serializers handle errors, requests, responses
    err: (err: Error) => ({
      type: err.name,
      message: err.message,
      stack: err.stack,
    }),
  },

  // Redact sensitive fields from logs
  redact: {
    paths: ["password", "*.password", "authorization", "*.authorization"],
    remove: true,
  },

  // Don't log in test environment unless explicitly requested
  enabled: !isTest || !!process.env.LOG_LEVEL,
};
