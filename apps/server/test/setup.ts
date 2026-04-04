import { beforeAll, afterAll, beforeEach, afterEach } from "bun:test";
import { PGlite } from "@electric-sql/pglite";
import { drizzle } from "drizzle-orm/pglite";
import { sql } from "drizzle-orm";
import type { DB } from "@repo/database";
import * as schema from "@repo/database/schema";

let client: PGlite;
export let testDb: DB;

beforeAll(async () => {
  client = new PGlite();
  const db = drizzle(client, { schema });

  // Apply schema using pushSchema from drizzle-kit
  const { pushSchema } = await import("drizzle-kit/api");
  const { apply } = await pushSchema(schema, db);
  await apply();

  // Both drivers share the same query API, only the underlying client differs
  testDb = db as unknown as DB;
});

beforeEach(async () => {
  await testDb.execute(sql`BEGIN`);
});

afterEach(async () => {
  await testDb.execute(sql`ROLLBACK`);
});

afterAll(async () => {
  await client.close();
});
