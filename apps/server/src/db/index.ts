import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";
import * as schema from "./schema";
import { type DB } from "@repo/database";

const pool = new Pool({
  connectionString:
    process.env.DATABASE_URL! ||
    "postgres://postgres:postgres@localhost:5432/productfinder",
  ssl: false,
});

export const db: DB = drizzle(pool, { schema });

export async function shutdownDb(db: DB) {
  await db.$client.end();
}
