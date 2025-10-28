import { createInsertSchema } from "drizzle-zod";
import { storeBrands, stores, employees } from "./schemas";

export type StoreBrand = typeof storeBrands.$inferSelect;
export type Store = typeof stores.$inferSelect;
export type Employee = typeof employees.$inferSelect;

export type NewStoreBrand = typeof storeBrands.$inferInsert;
export type NewStore = typeof stores.$inferInsert;
export type NewEmployee = typeof employees.$inferInsert;

export const newStoreBrandSchema = createInsertSchema(storeBrands);
export const newStoreSchema = createInsertSchema(stores);
export const newEmployeeSchema = createInsertSchema(employees);
