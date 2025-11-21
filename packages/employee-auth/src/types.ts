import { DBFieldAttribute, userSchema, sessionSchema } from "better-auth/db";
import { z } from "zod";

const ExtendedUserSchema = z.object({
  firstName: z.string(),
  lastName: z.string(),
  role: z.enum(["STAFF", "MANAGER", "ADMIN"]),
  storeId: z.string(),
  status: z.enum(["active", "suspended"]),
});

export const EmployeeSchema = userSchema.and(ExtendedUserSchema);

export type Employee = z.infer<typeof EmployeeSchema>;

export const EmployeeExtension = {
  firstName: {
    type: "string",
    required: true,
  },
  lastName: {
    type: "string",
    required: true,
  },
  role: {
    type: "string",
    required: true,
  },
  storeId: {
    type: "string",
    required: true,
    references: { model: "stores", field: "id" },
  },
  status: {
    type: "string",
    required: true,
  },
} as const satisfies Record<string, DBFieldAttribute>;

export const EmployeeSessionSchema = z.object({
  user: EmployeeSchema,
  session: sessionSchema,
});

export type EmployeeSession = z.infer<typeof EmployeeSessionSchema>;
