import { beforeAll, afterAll, beforeEach, afterEach } from "bun:test";
import { drizzle } from "drizzle-orm/node-postgres";
import { Client } from "pg";
import { sql } from "drizzle-orm";
import * as schema from "../src/db/schema";

// Separate test database in the same PostgreSQL instance
const TEST_DB_URL =
  process.env.TEST_DATABASE_URL || "postgres://localhost:5432/productfinder_test";

let client: Client;
export let testDb: ReturnType<typeof drizzle<typeof schema>>;

beforeAll(async () => {
  // Connect to test database
  client = new Client({ connectionString: TEST_DB_URL });
  await client.connect();
  testDb = drizzle(client, { schema });

  console.log("✓ Test database connected");
});

beforeEach(async () => {
  // Start transaction for each test - instant isolation!
  await testDb.execute(sql`BEGIN`);
});

afterEach(async () => {
  // Rollback - instant cleanup, no data persists!
  await testDb.execute(sql`ROLLBACK`);
});

afterAll(async () => {
  await client.end();
});
