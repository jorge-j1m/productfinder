import { fromString } from "typeid-js";
import { z } from "zod";
import { Brand } from "../../brand";

// Employee-related branded types
export type EmployeeId = Brand<string, "EmployeeId">;
export type EmployeeSessionId = Brand<string, "EmployeeSessionId">;
export type EmployeeAccountId = Brand<string, "EmployeeAccountId">;
export type EmployeeVerificationId = Brand<string, "EmployeeVerificationId">;

// Runtime validation functions with type predicates
export function isEmployeeId(id: unknown): id is EmployeeId {
  try {
    fromString(id as string, "emp");
    return true;
  } catch {
    return false;
  }
}

export function isEmployeeSessionId(id: unknown): id is EmployeeSessionId {
  try {
    fromString(id as string, "esess");
    return true;
  } catch {
    return false;
  }
}

export function isEmployeeAccountId(id: unknown): id is EmployeeAccountId {
  try {
    fromString(id as string, "eacc");
    return true;
  } catch {
    return false;
  }
}

export function isEmployeeVerificationId(
  id: unknown,
): id is EmployeeVerificationId {
  try {
    fromString(id as string, "evfn");
    return true;
  } catch {
    return false;
  }
}

// Helper functions to cast strings to branded types with validation
export const asEmployeeId = (id: unknown): EmployeeId => {
  if (!isEmployeeId(id)) {
    throw new Error("Invalid EmployeeId");
  }
  return id as EmployeeId;
};

export const asEmployeeSessionId = (id: unknown): EmployeeSessionId => {
  if (!isEmployeeSessionId(id)) {
    throw new Error("Invalid EmployeeSessionId");
  }
  return id as EmployeeSessionId;
};

export const asEmployeeAccountId = (id: unknown): EmployeeAccountId => {
  if (!isEmployeeAccountId(id)) {
    throw new Error("Invalid EmployeeAccountId");
  }
  return id as EmployeeAccountId;
};

export const asEmployeeVerificationId = (
  id: unknown,
): EmployeeVerificationId => {
  if (!isEmployeeVerificationId(id)) {
    throw new Error("Invalid EmployeeVerificationId");
  }
  return id as EmployeeVerificationId;
};

// Branded ID schemas with proper output types
export const employeeIdSchema = z.custom<EmployeeId>(
  (val) => isEmployeeId(val),
  { message: "Invalid EmployeeId format" },
);

export const employeeSessionIdSchema = z.custom<EmployeeSessionId>(
  (val) => isEmployeeSessionId(val),
  { message: "Invalid EmployeeSessionId format" },
);

export const employeeAccountIdSchema = z.custom<EmployeeAccountId>(
  (val) => isEmployeeAccountId(val),
  { message: "Invalid EmployeeAccountId format" },
);

export const employeeVerificationIdSchema = z.custom<EmployeeVerificationId>(
  (val) => isEmployeeVerificationId(val),
  { message: "Invalid EmployeeVerificationId format" },
);
