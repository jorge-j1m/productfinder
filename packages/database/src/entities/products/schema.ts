import { text, pgTable, varchar, pgEnum } from "drizzle-orm/pg-core";
import { typeid } from "typeid-js";
import { ProductId } from "./id";

// Product stock type enum
export const stockType = pgEnum("stock_type", ["WEIGHT", "UNITS"]);

// Products table
export const products = pgTable("products", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => typeid("prod").toString())
    .$type<ProductId>(),
  name: varchar({ length: 255 }).notNull().unique(),
  description: varchar({ length: 1000 }),
  sku: varchar({ length: 100 }).notNull().unique(),
  barcode: varchar({ length: 255 }).unique(),
  stockType: stockType("stock_type").notNull(),
  image: varchar({ length: 500 }),
});
