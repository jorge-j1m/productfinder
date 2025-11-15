import { fromString } from "typeid-js";

// Entity ID branded types - these are strings with compile-time type branding
export type StoreBrandId = Brand<string, "StoreBrandId">;
export type StoreId = Brand<string, "StoreId">;
export type EmployeeId = Brand<string, "EmployeeId">;
export type EmployeeSessionId = Brand<string, "EmployeeSessionId">;
export type EmployeeAccountId = Brand<string, "EmployeeAccountId">;
export type EmployeeVerificationId = Brand<string, "EmployeeVerificationId">;

// Branded type utilities for type-safe entity IDs
export declare const __brand: unique symbol;
export type Brand<T, TBrand extends string> = T & { [__brand]: TBrand };

// Runtime validation functions with type predicates
export function isStoreBrandId(id: unknown): id is StoreBrandId {
  try {
    fromString(id as string, "sb");
    return true;
  } catch {
    return false;
  }
}

export function isStoreId(id: unknown): id is StoreId {
  try {
    fromString(id as string, "store");
    return true;
  } catch {
    return false;
  }
}

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

// Helper functions to cast strings to branded types, they will verify the string is valid
export const asStoreBrandId = (id: unknown): StoreBrandId => {
  if (!isStoreBrandId(id)) {
    throw new Error("Invalid StoreBrandId");
  }
  return id as StoreBrandId;
};
export const asStoreId = (id: unknown): StoreId => {
  if (!isStoreId(id)) {
    throw new Error("Invalid StoreId");
  }
  return id as StoreId;
};
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
