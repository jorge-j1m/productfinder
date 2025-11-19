#!/usr/bin/env bun

/**
 * Script to create a test employee via the HTTP API
 * This ensures all business logic and validation happens through the application layer
 */

import type {
  StoreBrand,
  NewStoreBrand,
  Store,
  NewStore,
  NewEmployee,
} from "@repo/database";

const API_URL = process.env.API_URL || "http://localhost:8080";
const TEST_BRAND_NAME = "Test";
const TEST_STORE_NAME = "Test";
const DEFAULT_PASSWORD = "password123";

async function findOrCreateBrand(): Promise<StoreBrand> {
  // Try to find existing brand
  const brandsResponse = await fetch(`${API_URL}/api/store-brands`);
  if (!brandsResponse.ok) {
    throw new Error(`Failed to fetch brands: ${await brandsResponse.text()}`);
  }

  const brands: StoreBrand[] = await brandsResponse.json();
  const existingBrand = brands.find((b) => b.name === TEST_BRAND_NAME);

  if (existingBrand) {
    console.log(`Found existing brand: ${existingBrand.name}`);
    return existingBrand;
  }

  // Create new brand
  const newBrand: NewStoreBrand = {
    name: TEST_BRAND_NAME,
    logo: "https://example.com/logo.png",
  };

  const createResponse = await fetch(`${API_URL}/api/store-brands`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(newBrand),
  });

  if (!createResponse.ok) {
    throw new Error(`Failed to create brand: ${await createResponse.text()}`);
  }

  const createdBrand: StoreBrand = await createResponse.json();
  console.log(`   ✅ Created brand: ${createdBrand.name}`);
  return createdBrand;
}

async function findOrCreateStore(brandId: string): Promise<Store> {
  // Try to find existing store
  const storesResponse = await fetch(`${API_URL}/api/stores`);
  if (!storesResponse.ok) {
    throw new Error(`Failed to fetch stores: ${await storesResponse.text()}`);
  }

  const stores: Store[] = await storesResponse.json();
  const existingStore = stores.find((s) => s.name === TEST_STORE_NAME);

  if (existingStore) {
    console.log(`   ℹ️  Found existing store: ${existingStore.name}`);
    return existingStore;
  }

  // Create new store
  const newStore: NewStore = {
    brandId: brandId as NewStore["brandId"],
    name: TEST_STORE_NAME,
    address: "123 Test St",
    city: "Test City",
    state: "TS",
    zip: "12345",
    countryCode: "US",
    latitude: 40.7128,
    longitude: -74.006,
  };

  const createResponse = await fetch(`${API_URL}/api/stores`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(newStore),
  });

  if (!createResponse.ok) {
    throw new Error(`Failed to create store: ${await createResponse.text()}`);
  }

  const createdStore: Store = await createResponse.json();
  console.log(`   ✅ Created store: ${createdStore.name}`);
  return createdStore;
}

async function createEmployee(email: string, storeId: string) {
  const emailParts = email.split("@")[0]?.split(".") ?? [];
  const firstName = emailParts[0] ?? "Test";
  const lastName = emailParts[1] ?? "User";

  const capitalizeFirst = (str: string) =>
    str.charAt(0).toUpperCase() + str.slice(1);

  const newEmployee: NewEmployee & { password: string } = {
    email,
    password: DEFAULT_PASSWORD,
    name: `${capitalizeFirst(firstName)} ${capitalizeFirst(lastName)}`,
    firstName: capitalizeFirst(firstName),
    lastName: capitalizeFirst(lastName),
    role: "ADMIN",
    storeId: storeId as NewEmployee["storeId"],
    status: "ACTIVE",
  };

  const response = await fetch(`${API_URL}/api/employee-auth/sign-up/email`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(newEmployee),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Failed to create employee: ${errorText}`);
  }

  return response.json();
}

async function promptEmail(): Promise<string> {
  process.stdout.write("\n📧 Enter employee email: ");

  for await (const line of console) {
    const email = line.trim();
    if (!email) {
      process.stdout.write("❌ Email cannot be empty. Try again: ");
      continue;
    }
    if (!email.includes("@")) {
      process.stdout.write("❌ Invalid email format. Try again: ");
      continue;
    }
    return email;
  }

  throw new Error("Failed to read email input");
}

async function main() {
  try {
    console.log("🚀 Creating test employee via API...\n");

    // Step 1: Find or create test brand
    console.log(`1️⃣  Setting up test brand "${TEST_BRAND_NAME}"...`);
    const brand = await findOrCreateBrand();
    console.log(`   Brand ID: ${brand.id}\n`);

    // Step 2: Find or create test store
    console.log(`2️⃣  Setting up test store "${TEST_STORE_NAME}"...`);
    const store = await findOrCreateStore(brand.id);
    console.log(`   Store ID: ${store.id}\n`);

    // Step 3: Get email input
    const email = await promptEmail();

    // Step 4: Create employee
    console.log(`\n3️⃣  Creating employee...`);
    const result = await createEmployee(email, store.id);
    console.log(`   ✅ Employee created: ${result.user.email}`);
    console.log(`   User ID: ${result.user.id}\n`);

    console.log("✨ Success!");
    console.log("\n📝 Login credentials:");
    console.log(`   Email:    ${email}`);
    console.log(`   Password: ${DEFAULT_PASSWORD}`);
  } catch (error) {
    console.error(
      "\n❌ Error:",
      error instanceof Error ? error.message : error,
    );
    process.exit(1);
  }
}

main();
