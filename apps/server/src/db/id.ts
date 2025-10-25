import { fromString } from "typeid-js";

// Entity ID branded types - these are strings with compile-time type branding
export type StoreBrandId = Brand<string, 'StoreBrandId'>;
export type StoreId = Brand<string, 'StoreId'>;
export type EmployeeId = Brand<string, 'EmployeeId'>;
export type EmployeeSessionId = Brand<string, 'EmployeeSessionId'>;
export type EmployeeAccountId = Brand<string, 'EmployeeAccountId'>;
export type EmployeeVerificationId = Brand<string, 'EmployeeVerificationId'>;

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

export function isEmployeeVerificationId(id: string): id is EmployeeVerificationId {
  try {
    fromString(id, "evfn");
    return true;
  } catch {
    return false;
  }
}

// Helper functions to cast validated strings to branded types (use with caution)
export const asStoreBrandId = (id: string): StoreBrandId => id as StoreBrandId;
export const asStoreId = (id: string): StoreId => id as StoreId;
export const asEmployeeId = (id: string): EmployeeId => id as EmployeeId;
export const asEmployeeSessionId = (id: string): EmployeeSessionId => id as EmployeeSessionId;
export const asEmployeeAccountId = (id: string): EmployeeAccountId => id as EmployeeAccountId;
export const asEmployeeVerificationId = (id: string): EmployeeVerificationId => id as EmployeeVerificationId;
