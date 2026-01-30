import { text, pgTable, integer, timestamp, unique } from "drizzle-orm/pg-core";
import { typeid } from "typeid-js";
import { InventoryId } from "./id";
import { stores } from "../stores/schema";
import { StoreId } from "../stores/id";
import { products } from "../products/schema";
import { ProductId } from "../products/id";

export const inventory = pgTable(
  "inventory",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => typeid("inv").toString())
      .$type<InventoryId>(),
    storeId: text("store_id")
      .notNull()
      .references(() => stores.id, { onDelete: "cascade" })
      .$type<StoreId>(),
    productId: text("product_id")
      .notNull()
      .references(() => products.id, { onDelete: "cascade" })
      .$type<ProductId>(),
    // Stock - grams for WEIGHT, units for UNITS
    quantity: integer("quantity").notNull().default(0),
    // Pricing - all in cents
    regularPrice: integer("regular_price").notNull(),
    salePrice: integer("sale_price"),
    saleStartDate: timestamp("sale_start_date"),
    saleEndDate: timestamp("sale_end_date"),
  },
  (table) => [
    unique("inventory_store_product_unique").on(table.storeId, table.productId),
  ],
);
