/**
 * Will drop all the tables from the database
 */

import { db } from "../src/db";

console.log("Dropping tables...");
await db.execute(`DROP TABLE IF EXISTS employees CASCADE`);
console.log("Dropped employees");
await db.execute(`DROP TABLE IF EXISTS employee_sessions CASCADE`);
console.log("Dropped employee_sessions");
await db.execute(`DROP TABLE IF EXISTS employee_accounts CASCADE`);
console.log("Dropped employee_accounts");
await db.execute(`DROP TABLE IF EXISTS employee_verifications CASCADE`);
console.log("Dropped employee_verifications");
await db.execute(`DROP TABLE IF EXISTS stores CASCADE`);
console.log("Dropped stores");
await db.execute(`DROP TABLE IF EXISTS store_brands CASCADE`);
console.log("Dropped store_brands");
console.log("Tables dropped successfully");

process.exit(0);
