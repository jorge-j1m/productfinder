import {
  text,
  pgTable,
  doublePrecision,
  boolean,
  timestamp,
  varchar,
} from "drizzle-orm/pg-core";
import { typeid } from "typeid-js";

export const storeBrands = pgTable("store_brands", {
  id: text("id").primaryKey().$defaultFn(() => typeid("sb").toString()),
  name: varchar({ length: 255 }).notNull().unique(),
  logo: varchar({ length: 255 }).notNull(),
});

// const states = pgEnum("states", ["AL", "AK", "AZ", "AR", "CA", "CO", "CT", "DE", "FL", "GA", "HI", "ID", "IL", "IN", "IA", "KS", "KY", "LA", "ME", "MD", "MA", "MI", "MN", "MS", "MO", "MT", "NE", "NV", "NH", "NJ", "NM", "NY", "NC", "ND", "OH", "OK", "OR", "PA", "RI", "SC", "SD", "TN", "TX", "UT", "VT", "VA", "WA", "WV", "WI", "WY"]);

export const stores = pgTable("stores", {
  id: text("id").primaryKey().$defaultFn(() => typeid("store").toString()),
  brandId: text("brand_id")
    .notNull()
    .references(() => storeBrands.id),
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
  id: text("id").primaryKey().$defaultFn(() => typeid("emp").toString()),
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
  role: text("role").notNull(),
  storeId: text("store_id").notNull().references(() => stores.id, { onDelete: "cascade" }),
  status: text("status").notNull(),
});

export const employee_sessions = pgTable("employee_sessions", {
  id: text("id").primaryKey().$defaultFn(() => typeid("esess").toString()),
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
    .references(() => employees.id, { onDelete: "cascade" }),
});

export const employee_accounts = pgTable("employee_accounts", {
  id: text("id").primaryKey().$defaultFn(() => typeid("eacc").toString()),
  accountId: text("account_id").notNull(),
  providerId: text("provider_id").notNull(),
  userId: text("user_id")
    .notNull()
    .references(() => employees.id, { onDelete: "cascade" }),
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
  id: text("id").primaryKey().$defaultFn(() => typeid("evfn").toString()),
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
