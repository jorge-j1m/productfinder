import { beforeAll, afterAll, beforeEach, afterEach } from "bun:test";
import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";
import { sql } from "drizzle-orm";
import type { DB } from "@repo/database";
import * as schema from "@repo/database/schema";

const TEST_DB_URL =
  process.env.TEST_DATABASE_URL ||
  "postgres://postgres:postgres@127.0.0.1:5432/productfinder_test";

let pool: Pool;
export let testDb: DB;

beforeAll(async () => {
  pool = new Pool({ connectionString: TEST_DB_URL });
  testDb = drizzle(pool, { schema });
});

beforeEach(async () => {
  await testDb.execute(sql`BEGIN`);
});

afterEach(async () => {
  await testDb.execute(sql`ROLLBACK`);
});

afterAll(async () => {
  await pool.end();
});
