import { createInsertSchema, createSelectSchema } from "drizzle-zod";
import { z } from "zod";
import { employees } from "./schema";
import { employeeIdSchema } from "./id";
import { storeIdSchema } from "../stores/id";

// Inferred types from database schema
export type Employee = z.infer<typeof employeeSchema>;
export type NewEmployee = z.infer<typeof newEmployeeSchema>;

// Zod schemas with explicit branded ID types
export const employeeSchema = createSelectSchema(employees, {
  id: employeeIdSchema,
  storeId: storeIdSchema,
});

export const newEmployeeSchema = createInsertSchema(employees, {
  id: employeeIdSchema.optional(),
  storeId: storeIdSchema,
});
