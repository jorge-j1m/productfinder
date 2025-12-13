import {
  text,
  pgTable,
  doublePrecision,
  boolean,
  timestamp,
  varchar,
  pgEnum,
} from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import { typeid } from "typeid-js";
import {
  StoreBrandId,
  StoreId,
  EmployeeId,
  EmployeeSessionId,
  EmployeeAccountId,
  EmployeeVerificationId,
} from "./id";

export const employeeRoles = pgEnum("employee_roles", [
  "STAFF",
  "MANAGER",
  "ADMIN",
]);
export const employeeStatus = pgEnum("employee_status", [
  "ACTIVE",
  "SUSPENDED",
]);

export const storeBrands = pgTable("store_brands", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => typeid("sb").toString())
    .$type<StoreBrandId>(),
  name: varchar({ length: 255 }).notNull().unique(),
  logo: varchar({ length: 255 }).notNull(),
});

export const stores = pgTable("stores", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => typeid("store").toString())
    .$type<StoreId>(),
  brandId: text("brand_id")
    .notNull()
    .references(() => storeBrands.id)
    .$type<StoreBrandId>(),
  name: varchar({ length: 255 }).notNull(),
  address: varchar({ length: 255 }).notNull(),
  city: varchar({ length: 255 }).notNull(),
  state: varchar({ length: 2 }).notNull(),
  zip: varchar({ length: 10 }).notNull(),
  countryCode: varchar({ length: 2 }).notNull(),
  latitude: doublePrecision().notNull(),
  longitude: doublePrecision().notNull(),
});

// GENERATED TABLES FROM BETTER-AUTH
// Added relations manually (employee -> store_id)
// Added ID generation functions ($defaultFn)

export const employees = pgTable("employees", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => typeid("emp").toString())
    .$type<EmployeeId>(),
  name: text("name").notNull(),
  email: text("email").notNull().unique(),
  emailVerified: boolean("email_verified").default(false).notNull(),
  image: text("image"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at")
    .defaultNow()
    .$onUpdate(() => /* @__PURE__ */ new Date())
    .notNull(),
  firstName: text("first_name").notNull(),
  lastName: text("last_name").notNull(),
  role: employeeRoles().notNull(),
  storeId: text("store_id")
    .notNull()
    .references(() => stores.id, { onDelete: "cascade" })
    .$type<StoreId>(),
  status: employeeStatus().notNull(),
});

export const employee_sessions = pgTable("employee_sessions", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => typeid("esess").toString())
    .$type<EmployeeSessionId>(),
  expiresAt: timestamp("expires_at").notNull(),
  token: text("token").notNull().unique(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at")
    .$onUpdate(() => /* @__PURE__ */ new Date())
    .notNull(),
  ipAddress: text("ip_address"),
  userAgent: text("user_agent"),
  userId: text("user_id")
    .notNull()
    .references(() => employees.id, { onDelete: "cascade" })
    .$type<EmployeeId>(),
});

export const employee_accounts = pgTable("employee_accounts", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => typeid("eacc").toString())
    .$type<EmployeeAccountId>(),
  accountId: text("account_id").notNull(),
  providerId: text("provider_id").notNull(),
  userId: text("user_id")
    .notNull()
    .references(() => employees.id, { onDelete: "cascade" })
    .$type<EmployeeId>(),
  accessToken: text("access_token"),
  refreshToken: text("refresh_token"),
  idToken: text("id_token"),
  accessTokenExpiresAt: timestamp("access_token_expires_at"),
  refreshTokenExpiresAt: timestamp("refresh_token_expires_at"),
  scope: text("scope"),
  password: text("password"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at")
    .$onUpdate(() => /* @__PURE__ */ new Date())
    .notNull(),
});

export const employee_verifications = pgTable("employee_verifications", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => typeid("evfn").toString())
    .$type<EmployeeVerificationId>(),
  identifier: text("identifier").notNull(),
  value: text("value").notNull(),
  expiresAt: timestamp("expires_at").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at")
    .defaultNow()
    .$onUpdate(() => /* @__PURE__ */ new Date())
    .notNull(),
});

// END OF GENERATED TABLES FROM BETTER-AUTH

// RELATIONS for nested queries
export const storeBrandsRelations = relations(storeBrands, ({ many }) => ({
  stores: many(stores),
}));

export const storesRelations = relations(stores, ({ one, many }) => ({
  brand: one(storeBrands, {
    fields: [stores.brandId],
    references: [storeBrands.id],
  }),
  employees: many(employees),
}));

export const employeesRelations = relations(employees, ({ one, many }) => ({
  store: one(stores, {
    fields: [employees.storeId],
    references: [stores.id],
  }),
  sessions: many(employee_sessions),
  accounts: many(employee_accounts),
}));

export const employeeSessionsRelations = relations(
  employee_sessions,
  ({ one }) => ({
    employee: one(employees, {
      fields: [employee_sessions.userId],
      references: [employees.id],
    }),
  }),
);

export const employeeAccountsRelations = relations(
  employee_accounts,
  ({ one }) => ({
    employee: one(employees, {
      fields: [employee_accounts.userId],
      references: [employees.id],
    }),
  }),
);
