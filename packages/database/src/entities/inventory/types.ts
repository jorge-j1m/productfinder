import { createInsertSchema, createSelectSchema } from "drizzle-zod";
import { z } from "zod";
import { inventory } from "./schema";
import { inventoryIdSchema } from "./id";
import { storeIdSchema } from "../stores/id";
import { productIdSchema } from "../products/id";

// Inferred types from database schema
export type Inventory = z.infer<typeof inventorySchema>;
export type NewInventory = z.infer<typeof newInventorySchema>;

// Zod schemas with explicit branded ID types
export const inventorySchema = createSelectSchema(inventory, {
  id: inventoryIdSchema,
  storeId: storeIdSchema,
  productId: productIdSchema,
});

export const newInventorySchema = createInsertSchema(inventory, {
  id: inventoryIdSchema.optional(),
  storeId: storeIdSchema,
  productId: productIdSchema,
});
