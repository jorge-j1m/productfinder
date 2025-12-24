import { text, pgTable, boolean, timestamp, pgEnum } from "drizzle-orm/pg-core";
import { typeid } from "typeid-js";
import {
  EmployeeId,
  EmployeeSessionId,
  EmployeeAccountId,
  EmployeeVerificationId,
} from "./id";
import { stores } from "../stores/schema";
import { StoreId } from "../stores/id";

// Employee enums
export const employeeRoles = pgEnum("employee_roles", [
  "STAFF",
  "MANAGER",
  "ADMIN",
]);

export const employeeStatus = pgEnum("employee_status", [
  "ACTIVE",
  "SUSPENDED",
]);

// Employee table (main user table for better-auth)
export const employees = pgTable("employees", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => typeid("emp").toString())
    .$type<EmployeeId>(),
  name: text("name").notNull(),
  email: text("email").notNull().unique(),
  emailVerified: boolean("email_verified").default(false).notNull(),
  image: text("image"),
  createdAt: timestamp("created_at").defaultNow().notNull().$type<string>(),
  updatedAt: timestamp("updated_at")
    .defaultNow()
    .$onUpdate(() => /* @__PURE__ */ new Date())
    .notNull()
    .$type<string>(),
  firstName: text("first_name").notNull(),
  lastName: text("last_name").notNull(),
  role: employeeRoles().notNull(),
  storeId: text("store_id")
    .notNull()
    .references(() => stores.id, { onDelete: "cascade" })
    .$type<StoreId>(),
  status: employeeStatus().notNull(),
});

// Employee sessions table (better-auth)
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

// Employee accounts table (better-auth)
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

// Employee verifications table (better-auth)
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
