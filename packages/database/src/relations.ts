import { relations } from "drizzle-orm";
import { storeBrands } from "./entities/store-brands/schema";
import { stores } from "./entities/stores/schema";
import {
  employees,
  employee_sessions,
  employee_accounts,
} from "./entities/employees/schema";
import { products } from "./entities/products/schema";

/**
 * Central relations file for all database entities
 * This defines how tables are related for nested queries
 */

// Store Brands relations
export const storeBrandsRelations = relations(storeBrands, ({ many }) => ({
  stores: many(stores),
}));

// Stores relations
export const storesRelations = relations(stores, ({ one, many }) => ({
  brand: one(storeBrands, {
    fields: [stores.brandId],
    references: [storeBrands.id],
  }),
  employees: many(employees),
}));

// Employees relations
export const employeesRelations = relations(employees, ({ one, many }) => ({
  store: one(stores, {
    fields: [employees.storeId],
    references: [stores.id],
  }),
  sessions: many(employee_sessions),
  accounts: many(employee_accounts),
}));

// Employee Sessions relations
export const employeeSessionsRelations = relations(
  employee_sessions,
  ({ one }) => ({
    employee: one(employees, {
      fields: [employee_sessions.userId],
      references: [employees.id],
    }),
  }),
);

// Employee Accounts relations
export const employeeAccountsRelations = relations(
  employee_accounts,
  ({ one }) => ({
    employee: one(employees, {
      fields: [employee_accounts.userId],
      references: [employees.id],
    }),
  }),
);

// Products relations (standalone entity, relations will be added with inventory)
export const productsRelations = relations(products, ({}) => ({}));
