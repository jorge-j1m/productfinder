/**
 * This script will take care of creating a default test
 * Store Brand, then a new store with that store brand
 * And then a user with that store
 */

import { db } from "../src/db";
import { employees, storeBrands, stores } from "../src/db/schema";

const randomString = () => {
  return Math.random().toString(36).substring(2, 8);
};

const brand: typeof storeBrands.$inferInsert = {
  logo: "https://via.placeholder.com/150",
  name: `Test Brand ${randomString()}`,
};

const fromDb = await db.insert(storeBrands).values(brand).returning();
console.log("Brand created:", fromDb);

const store: typeof stores.$inferInsert = {
  brandId: fromDb[0]!.id,
  name: `Test Store ${randomString()}`,
  address: "123 Test St",
  city: "Test City",
  state: "CA",
  zip: "12345",
  countryCode: "US",
  latitude: 0,
  longitude: 0,
};

const storeFromDb = await db.insert(stores).values(store).returning();
console.log("Store created:", storeFromDb);

const employee: typeof employees.$inferInsert = {
  name: `Test Employee ${randomString()}`,
  email: `test-${randomString()}@test.com`,
  firstName: `Test ${randomString()}`,
  lastName: `Test ${randomString()}`,
  role: "admin",
  storeId: storeFromDb[0]!.id,
  status: "active",
};

const employeeFromDb = await db.insert(employees).values(employee).returning();
console.log("Employee created:", employeeFromDb);
process.exit(0);
