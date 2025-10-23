/**
 * Will empty all the tables from the database
 */

import { db } from "../src/db";

console.log("Emptying tables...");
await db.execute(`DELETE FROM employees`);
console.log("Emptied employees");
await db.execute(`DELETE FROM employee_sessions`);
console.log("Emptied employee_sessions");
await db.execute(`DELETE FROM employee_accounts`);
console.log("Emptied employee_accounts");
await db.execute(`DELETE FROM employee_verifications`);
console.log("Emptied employee_verifications");
await db.execute(`DELETE FROM stores`);
console.log("Emptied stores");
await db.execute(`DELETE FROM store_brands`);
console.log("Emptied store_brands");
console.log("Tables emptied successfully");

process.exit(0);
