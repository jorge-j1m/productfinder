import { createInsertSchema, createSelectSchema } from "drizzle-zod";
import { z } from "zod";
import { stores } from "./schema";
import { storeIdSchema } from "./id";
import { storeBrandIdSchema } from "../store-brands/id";

// Inferred types from database schema
export type Store = z.infer<typeof storeSchema>;
export type NewStore = z.infer<typeof newStoreSchema>;

// Zod schemas with explicit branded ID types
export const storeSchema = createSelectSchema(stores, {
  id: storeIdSchema,
  brandId: storeBrandIdSchema,
});

export const newStoreSchema = createInsertSchema(stores, {
  id: storeIdSchema.optional(),
  brandId: storeBrandIdSchema,
});
