/**
 * Re-export employee types from @repo/database
 * This package now depends on the database package for type definitions
 * to maintain a single source of truth.
 */

export {
  type EmployeeAuthUser as Employee,
  type EmployeeSession,
  type EmployeeRole,
  type EmployeeStatus,
  EmployeeAuthUserSchema as EmployeeSchema,
  EmployeeSessionSchema,
  EmployeeExtension,
  EmployeeRoleEnum,
  EmployeeStatusEnum,
} from "@repo/database";
