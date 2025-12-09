import { createInsertSchema, createSelectSchema } from "drizzle-zod";
import { storeBrands, stores, employees } from "./schemas";
import { z } from "zod";
import { storeBrandIdSchema, storeIdSchema, employeeIdSchema } from "./id";

export * from "./id";

export type StoreBrand = z.infer<typeof storeBrandSchema>;
export type Store = z.infer<typeof storeSchema>;
export type Employee = z.infer<typeof employeeSchema>;

export type NewStoreBrand = z.infer<typeof newStoreBrandSchema>;
export type NewStore = z.infer<typeof newStoreSchema>;
export type NewEmployee = z.infer<typeof newEmployeeSchema>;

// Create schemas with explicit branded ID types
export const storeBrandSchema = createSelectSchema(storeBrands, {
  id: storeBrandIdSchema,
});

export const storeSchema = createSelectSchema(stores, {
  id: storeIdSchema,
  brandId: storeBrandIdSchema,
});

export const employeeSchema = createSelectSchema(employees, {
  id: employeeIdSchema,
  storeId: storeIdSchema,
});

export const newStoreBrandSchema = createInsertSchema(storeBrands, {
  id: storeBrandIdSchema.optional(),
});

export const newStoreSchema = createInsertSchema(stores, {
  id: storeIdSchema.optional(),
  brandId: storeBrandIdSchema,
});

export const newEmployeeSchema = createInsertSchema(employees, {
  id: employeeIdSchema.optional(),
  storeId: storeIdSchema,
});
