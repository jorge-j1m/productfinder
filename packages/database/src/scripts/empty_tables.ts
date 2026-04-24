/**
 * Will empty all the tables from the database
 */

import { _localDb } from "../db";

console.log("Emptying tables...");
await _localDb.execute(`DELETE FROM employees`);
console.log("Emptied employees");
await _localDb.execute(`DELETE FROM employee_sessions`);
console.log("Emptied employee_sessions");
await _localDb.execute(`DELETE FROM employee_accounts`);
console.log("Emptied employee_accounts");
await _localDb.execute(`DELETE FROM employee_verifications`);
console.log("Emptied employee_verifications");
await _localDb.execute(`DELETE FROM stores`);
console.log("Emptied stores");
await _localDb.execute(`DELETE FROM store_brands`);
console.log("Emptied store_brands");
await _localDb.execute(`DELETE FROM products`);
console.log("Emptied products");
await _localDb.execute(`DELETE FROM inventory`);
console.log("Emptied inventory");

console.log("Tables emptied successfully");

process.exit(0);
