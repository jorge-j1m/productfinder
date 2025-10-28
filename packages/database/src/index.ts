import { drizzle } from "drizzle-orm/node-postgres";

export { employeeAuthConfig } from "./employee-auth";

export {
  storeBrands,
  stores,
  employees,
  employee_sessions,
  employee_accounts,
  employee_verifications,
} from "./schemas";

export const _localDb = drizzle({
  // Mock for local development
  connection: {
    // Hardcoded string, so not even by chance we touch prod
    connectionString: "postgresql://postgres:postgres@127.0.0.1:5432/bun_pf",
    ssl: false,
  },
});
