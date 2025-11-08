import { drizzle } from "drizzle-orm/node-postgres";
import * as schema from "./schemas";
import { Pool } from "pg";

export { employeeAuthConfig } from "./employee-auth";

export * from "./schemas";
export * from "./types";
export * from "./id";

const pool = new Pool({
  connectionString: "postgresql://postgres:postgres@127.0.0.1:5432/bun_pf",
  ssl: false,
});

export const _localDb = drizzle(pool, { schema });
export type DB = typeof _localDb;
