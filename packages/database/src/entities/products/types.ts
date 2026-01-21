import { createInsertSchema, createSelectSchema } from "drizzle-zod";
import { z } from "zod";
import { products } from "./schema";
import { productIdSchema } from "./id";

// Inferred types from database schema
export type Product = z.infer<typeof productSchema>;
export type NewProduct = z.infer<typeof newProductSchema>;

// Zod schemas with explicit branded ID types
export const productSchema = createSelectSchema(products, {
  id: productIdSchema,
});

export const newProductSchema = createInsertSchema(products, {
  id: productIdSchema.optional(),
});
