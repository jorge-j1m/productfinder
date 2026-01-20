import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";

// Import all schemas from entities
import { storeBrands } from "./entities/store-brands/schema";
import { stores } from "./entities/stores/schema";
import {
  employees,
  employee_sessions,
  employee_accounts,
  employee_verifications,
  employeeRoles,
  employeeStatus,
} from "./entities/employees/schema";
import { products, stockType } from "./entities/products/schema";

// Import all relations
import {
  storeBrandsRelations,
  storesRelations,
  employeesRelations,
  employeeSessionsRelations,
  employeeAccountsRelations,
  productsRelations,
} from "./relations";

// Combine all schemas and relations for Drizzle
const schema = {
  // Tables
  storeBrands,
  stores,
  employees,
  employee_sessions,
  employee_accounts,
  employee_verifications,
  products,
  // Enums
  employeeRoles,
  employeeStatus,
  stockType,
  // Relations
  storeBrandsRelations,
  storesRelations,
  employeesRelations,
  employeeSessionsRelations,
  employeeAccountsRelations,
  productsRelations,
};

const pool = new Pool({
  connectionString: "postgresql://postgres:postgres@127.0.0.1:5432/bun_pf",
  ssl: false,
});

export const _localDb = drizzle(pool, { schema });
export type DB = typeof _localDb;
