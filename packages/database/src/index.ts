/**
 * Database Package - Entity-based organization
 *
 * All exports maintain backward compatibility
 * Each entity is self-contained in its own folder under entities/
 */

// ===== Branded Type Utilities =====
export * from "./brand";

// ===== Store Brands Entity =====
export * from "./entities/store-brands";

// ===== Stores Entity =====
export * from "./entities/stores";

// ===== Employees Entity =====
export * from "./entities/employees";

// ===== Products Entity =====
export * from "./entities/products";

// ===== Inventory Entity =====
export * from "./entities/inventory";

// ===== Relations (All entities) =====
export * from "./relations";

// ===== Server-only exports =====
// Import from @repo/database/db for server-side usage
export type { DB } from "./db";
