import { beforeAll, afterAll, beforeEach, afterEach, mock } from "bun:test";
import { PGlite } from "@electric-sql/pglite";
import { drizzle } from "drizzle-orm/pglite";
import { sql } from "drizzle-orm";
import type { DB } from "@repo/database";
import * as schema from "@repo/database/schema";

let client: PGlite;
export let testDb: DB;

beforeAll(async () => {
  client = new PGlite();

  // Apply schema using pushSchema from drizzle-kit
  // pushSchema expects a plain drizzle instance (no schema type parameter)
  const { pushSchema } = await import("drizzle-kit/api");
  const { apply } = await pushSchema(schema, drizzle(client));
  await apply();

  mock.module("@repo/database", () => ({
    EmployeeSessionSchema: {
      safeParse: () => ({
        data: { user: { status: "ACTIVE" } },
      }),
    },
  }));

  // Create the schema-aware instance for queries
  // Both drivers share the same query API, only the underlying client differs
  testDb = drizzle(client, { schema }) as unknown as DB;
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
