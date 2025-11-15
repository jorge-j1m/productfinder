// Type-only exports (safe for client)
export * from "./schemas";
export * from "./types";
export * from "./id";

// Server-only exports (import from @repo/database/db)
export type { DB } from "./db";

// Auth config (server-only but doesn't create connection)
export { employeeAuthConfig } from "./employee-auth";
