import { DBFieldAttribute, userSchema, sessionSchema } from "better-auth/db";
import { z } from "zod";

/**
 * Employee types and schemas for better-auth integration
 * This is the single source of truth for employee field definitions
 */

// Zod enums matching the database pgEnum definitions
export const EmployeeRoleEnum = z.enum(["STAFF", "MANAGER", "ADMIN"]);
export const EmployeeStatusEnum = z.enum(["ACTIVE", "SUSPENDED"]);

export type EmployeeRole = z.infer<typeof EmployeeRoleEnum>;
export type EmployeeStatus = z.infer<typeof EmployeeStatusEnum>;

// Extended fields schema for employees
const ExtendedUserSchema = z.object({
  firstName: z.string(),
  lastName: z.string(),
  role: EmployeeRoleEnum,
  storeId: z.string(),
  status: EmployeeStatusEnum,
});

// Full employee schema combining better-auth user schema with our extensions
export const EmployeeAuthUserSchema = userSchema.and(ExtendedUserSchema);

export type EmployeeAuthUser = z.infer<typeof EmployeeAuthUserSchema>;

// Field attributes for better-auth additionalFields configuration
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
    // Note: Relation to stores table is managed by Drizzle, not better-auth
  },
  status: {
    type: "string",
    required: true,
  },
} as const satisfies Record<string, DBFieldAttribute>;

// Session schema for better-auth
export const EmployeeSessionSchema = z.object({
  user: EmployeeAuthUserSchema,
  session: sessionSchema,
});

export type EmployeeSession = z.infer<typeof EmployeeSessionSchema>;
