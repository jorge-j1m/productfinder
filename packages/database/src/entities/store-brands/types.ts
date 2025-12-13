import { createInsertSchema, createSelectSchema } from "drizzle-zod";
import { z } from "zod";
import { storeBrands } from "./schema";
import { storeBrandIdSchema } from "./id";

// Inferred types from database schema
export type StoreBrand = z.infer<typeof storeBrandSchema>;
export type NewStoreBrand = z.infer<typeof newStoreBrandSchema>;

// Zod schemas with explicit branded ID types
export const storeBrandSchema = createSelectSchema(storeBrands, {
  id: storeBrandIdSchema,
});

export const newStoreBrandSchema = createInsertSchema(storeBrands, {
  id: storeBrandIdSchema.optional(),
});
