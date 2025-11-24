import pino from "pino";
import { pinoConfig } from "./config";

/**
 * Shared logger instance for the entire monorepo
 *
 * Usage:
 * ```typescript
 * import { logger } from '@repo/logger'
 *
 * logger.info('Simple message')
 * logger.info({ userId: 123 }, 'User logged in')
 * logger.error({ err: error }, 'Something went wrong')
 * ```
 */
export const logger = pino(pinoConfig);

/**
 * Create a child logger with additional context
 * Child loggers inherit parent configuration and add context to every log
 *
 * Usage:
 * ```typescript
 * import { createChildLogger } from '@repo/logger'
 *
 * const requestLogger = createChildLogger({ requestId: '123' })
 * requestLogger.info('Processing request') // Will include requestId in log
 * ```
 *
 * @param context - Additional fields to include in all logs from this child logger
 */
export function createChildLogger(context: Record<string, unknown>) {
  return logger.child(context);
}

/**
 * Re-export pino types for convenience
 */
export type { Logger, LoggerOptions } from "pino";
