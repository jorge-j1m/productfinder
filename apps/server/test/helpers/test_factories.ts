import { testDb } from "../setup";
import { storeBrands, stores, employees } from "@repo/database/schema";
import type {
  NewStoreBrand,
  NewStore,
  NewEmployee,
  StoreBrand,
  Store,
  Employee,
  StoreBrandId,
  StoreId,
} from "@repo/database";

/**
 * Test factory functions for creating test data with proper TypeIDs.
 * Each factory returns the created entity for use in assertions.
 * Uses timestamps + random suffixes to ensure uniqueness within transactions.
 */

// Generate unique suffix for test data
function uniqueSuffix(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

/**
 * Creates a test store brand with optional overrides.
 * Default: unique name and placeholder logo.
 */
export async function createTestBrand(
  overrides: Partial<NewStoreBrand> = {},
): Promise<StoreBrand> {
  const data: NewStoreBrand = {
    name: `Test Brand ${uniqueSuffix()}`,
    logo: "https://placehold.co/200x200?text=Test",
    ...overrides,
  };

  const [brand] = await testDb.insert(storeBrands).values(data).returning();
  if (!brand) throw new Error("Failed to create test brand");
  return brand;
}

/**
 * Creates a test store with required brand reference.
 * Default: unique name, address, and test location data.
 */
export async function createTestStore(
  brandId: StoreBrandId,
  overrides: Partial<Omit<NewStore, "brandId">> = {},
): Promise<Store> {
  const suffix = uniqueSuffix();
  const data: NewStore = {
    brandId,
    name: `Test Store ${suffix}`,
    address: `${Math.floor(1000 + Math.random() * 8999)} Test St`,
    city: "Test City",
    state: "TS",
    zip: `${Math.floor(10000 + Math.random() * 89999)}`,
    countryCode: "US",
    latitude: 40.7128 + Math.random() * 0.1,
    longitude: -74.006 + Math.random() * 0.1,
    ...overrides,
  };

  const [store] = await testDb.insert(stores).values(data).returning();
  if (!store) throw new Error("Failed to create test store");
  return store;
}

/**
 * Creates a test employee with required store reference.
 * Default: unique email, STAFF role, ACTIVE status.
 */
export async function createTestEmployee(
  storeId: StoreId,
  overrides: Partial<Omit<NewEmployee, "storeId">> = {},
): Promise<Employee> {
  const suffix = uniqueSuffix();
  const data: NewEmployee = {
    storeId,
    name: `Test Employee ${suffix}`,
    email: `test-${suffix}@example.com`,
    emailVerified: false,
    firstName: "Test",
    lastName: "Employee",
    role: "STAFF",
    status: "ACTIVE",
    ...overrides,
  };

  const [employee] = await testDb.insert(employees).values(data).returning();
  if (!employee) throw new Error("Failed to create test employee");
  return employee;
}

/**
 * Creates a full data chain: brand + store.
 * Useful when tests need both entities without caring about specifics.
 */
export async function createTestDataChain(): Promise<{
  brand: StoreBrand;
  store: Store;
}> {
  const brand = await createTestBrand();
  const store = await createTestStore(brand.id);
  return { brand, store };
}

/**
 * Creates a full data chain with employee: brand + store + employee.
 */
export async function createTestDataChainWithEmployee(): Promise<{
  brand: StoreBrand;
  store: Store;
  employee: Employee;
}> {
  const brand = await createTestBrand();
  const store = await createTestStore(brand.id);
  const employee = await createTestEmployee(store.id);
  return { brand, store, employee };
}
