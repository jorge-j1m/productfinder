import { fromString } from "typeid-js";

// Entity ID branded types - these are strings with compile-time type branding
export type StoreBrandId = Brand<string, "StoreBrandId">;
export type StoreId = Brand<string, "StoreId">;
export type EmployeeId = Brand<string, "EmployeeId">;
export type EmployeeSessionId = Brand<string, "EmployeeSessionId">;
export type EmployeeAccountId = Brand<string, "EmployeeAccountId">;
export type EmployeeVerificationId = Brand<string, "EmployeeVerificationId">;

// Branded type utilities for type-safe entity IDs
declare const __brand: unique symbol;
export type Brand<T, TBrand extends string> = T & { [__brand]: TBrand };

// Runtime validation functions with type predicates
export function isStoreBrandId(id: string): id is StoreBrandId {
  try {
    fromString(id, "sb");
    return true;
  } catch {
    return false;
  }
}

export function isStoreId(id: string): id is StoreId {
  try {
    fromString(id, "store");
    return true;
  } catch {
    return false;
  }
}

export function isEmployeeId(id: string): id is EmployeeId {
  try {
    fromString(id, "emp");
    return true;
  } catch {
    return false;
  }
}

export function isEmployeeSessionId(id: string): id is EmployeeSessionId {
  try {
    fromString(id, "esess");
    return true;
  } catch {
    return false;
  }
}

export function isEmployeeAccountId(id: string): id is EmployeeAccountId {
  try {
    fromString(id, "eacc");
    return true;
  } catch {
    return false;
  }
}

export function isEmployeeVerificationId(
  id: string,
): id is EmployeeVerificationId {
  try {
    fromString(id, "evfn");
    return true;
  } catch {
    return false;
  }
}

// Helper functions to cast strings to branded types, they will verify the string is valid
export const asStoreBrandId = (id: string): StoreBrandId => {
  if (!isStoreBrandId(id)) {
    throw new Error("Invalid StoreBrandId");
  }
  return id as StoreBrandId;
};
export const asStoreId = (id: string): StoreId => {
  if (!isStoreId(id)) {
    throw new Error("Invalid StoreId");
  }
  return id as StoreId;
};
export const asEmployeeId = (id: string): EmployeeId => {
  if (!isEmployeeId(id)) {
    throw new Error("Invalid EmployeeId");
  }
  return id as EmployeeId;
};
export const asEmployeeSessionId = (id: string): EmployeeSessionId => {
  if (!isEmployeeSessionId(id)) {
    throw new Error("Invalid EmployeeSessionId");
  }
  return id as EmployeeSessionId;
};
export const asEmployeeAccountId = (id: string): EmployeeAccountId => {
  if (!isEmployeeAccountId(id)) {
    throw new Error("Invalid EmployeeAccountId");
  }
  return id as EmployeeAccountId;
};
export const asEmployeeVerificationId = (
  id: string,
): EmployeeVerificationId => {
  if (!isEmployeeVerificationId(id)) {
    throw new Error("Invalid EmployeeVerificationId");
  }
  return id as EmployeeVerificationId;
};
