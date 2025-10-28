import { drizzle } from "drizzle-orm/node-postgres";
import * as schema from "./schemas";

export { employeeAuthConfig } from "./employee-auth";

export * from "./schemas";

export * from "./types";
export * from "./id";

export const _localDb = drizzle({
  // Mock for local development
  connection: {
    // Hardcoded string, so not even by chance we touch prod
    connectionString: "postgresql://postgres:postgres@127.0.0.1:5432/bun_pf",
    ssl: false,
  },
  schema,
});
