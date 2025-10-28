/**
 * Will drop all the tables from the database
 */

import { _localDb } from "../";

console.log("Dropping tables...");
await _localDb.execute(`DROP TABLE IF EXISTS employees CASCADE`);
console.log("Dropped employees");
await _localDb.execute(`DROP TABLE IF EXISTS employee_sessions CASCADE`);
console.log("Dropped employee_sessions");
await _localDb.execute(`DROP TABLE IF EXISTS employee_accounts CASCADE`);
console.log("Dropped employee_accounts");
await _localDb.execute(`DROP TABLE IF EXISTS employee_verifications CASCADE`);
console.log("Dropped employee_verifications");
await _localDb.execute(`DROP TABLE IF EXISTS stores CASCADE`);
console.log("Dropped stores");
await _localDb.execute(`DROP TABLE IF EXISTS store_brands CASCADE`);
console.log("Dropped store_brands");
console.log("Tables dropped successfully");

process.exit(0);
