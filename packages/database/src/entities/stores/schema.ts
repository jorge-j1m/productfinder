import { text, pgTable, varchar, doublePrecision } from "drizzle-orm/pg-core";
import { typeid } from "typeid-js";
import { StoreId } from "./id";
import { storeBrands } from "../store-brands/schema";
import { StoreBrandId } from "../store-brands/id";

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
