/**
 * This script will take care of creating a default test
 * Store Brand, then a new store with that store brand
 * And then a user with that store
 */

import { _localDb } from "../db";
import {
  NewEmployee,
  NewStore,
  NewStoreBrand,
  employees,
  storeBrands,
  stores,
} from "../";
import { eq } from "drizzle-orm";

const randomString = () => {
  return Math.random().toString(36).substring(2, 8);
};

const brand: NewStoreBrand = {
  logo: "https://via.placeholder.com/150",
  name: `Test Brand ${randomString()}`,
};

const fromDb = await _localDb.insert(storeBrands).values(brand).returning();
console.log("Brand created:", fromDb);

const store: NewStore = {
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

const storeFromDb = await _localDb.insert(stores).values(store).returning();
console.log("Store created:", storeFromDb);

const employee: NewEmployee = {
  name: `Test Employee ${randomString()}`,
  email: `test-${randomString()}@test.com`,
  firstName: `Test ${randomString()}`,
  lastName: `Test ${randomString()}`,
  role: "ADMIN",
  storeId: storeFromDb[0]!.id,
  status: "ACTIVE",
};

const employeeFromDb = await _localDb
  .insert(employees)
  .values(employee)
  .returning();
console.log("Employee created:", employeeFromDb);

// APPROACH 1: SQL-like API with joins (flat structure)
const employeeWithStoreFlat = await _localDb
  .select()
  .from(employees)
  .leftJoin(stores, eq(employees.storeId, stores.id))
  .where(eq(employees.id, employeeFromDb[0]!.id));
console.log("Flat structure:", JSON.stringify(employeeWithStoreFlat, null, 2));

// APPROACH 2: Relational Query API (nested structure)
const employeeWithStoreNested = await _localDb.query.employees.findFirst({
  where: (employees, { eq }) => eq(employees.id, employeeFromDb[0]!.id),
  with: {
    store: {
      with: {
        brand: true,
      },
    },
  },
});
console.log(
  "Nested structure:",
  JSON.stringify(employeeWithStoreNested, null, 2),
);

process.exit(0);
