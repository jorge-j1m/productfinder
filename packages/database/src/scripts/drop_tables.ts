/**
 * Completely resets the database: drops every table, enum, and the
 * drizzle-kit migrations bookkeeping schema. Run this when you want to
 * replay migrations from scratch.
 */

import { _localDb } from "../db";

console.log("Resetting database...");

// Wipes every object (tables, enums, sequences, functions, …) in the
// application schema, then rebuilds an empty public schema.
await _localDb.execute(`DROP SCHEMA IF EXISTS public CASCADE`);
console.log("Dropped public schema");

await _localDb.execute(`CREATE SCHEMA public`);
console.log("Recreated public schema");

await _localDb.execute(`GRANT ALL ON SCHEMA public TO public`);

// drizzle-kit stores applied-migration bookkeeping in its own schema;
// without dropping it, `drizzle-kit migrate` skips replaying migrations
// even though the tables are gone.
await _localDb.execute(`DROP SCHEMA IF EXISTS drizzle CASCADE`);
console.log("Dropped drizzle migrations schema");

console.log("Database reset successfully");

process.exit(0);
