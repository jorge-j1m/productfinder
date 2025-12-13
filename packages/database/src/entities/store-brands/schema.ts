import { text, pgTable, varchar } from "drizzle-orm/pg-core";
import { typeid } from "typeid-js";
import { StoreBrandId } from "./id";

export const storeBrands = pgTable("store_brands", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => typeid("sb").toString())
    .$type<StoreBrandId>(),
  name: varchar({ length: 255 }).notNull().unique(),
  logo: varchar({ length: 255 }).notNull(),
});
