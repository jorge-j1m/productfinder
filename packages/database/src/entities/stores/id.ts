import { fromString } from "typeid-js";
import { z } from "zod";
import { Brand } from "../../brand";

// StoreId branded type
export type StoreId = Brand<string, "StoreId">;

// Runtime validation function with type predicate
export function isStoreId(id: unknown): id is StoreId {
  try {
    fromString(id as string, "store");
    return true;
  } catch {
    return false;
  }
}

// Helper function to cast strings to branded type with validation
export const asStoreId = (id: unknown): StoreId => {
  if (!isStoreId(id)) {
    throw new Error("Invalid StoreId");
  }
  return id as StoreId;
};

// Branded ID schema with proper output type
export const storeIdSchema = z.custom<StoreId>((val) => isStoreId(val), {
  message: "Invalid StoreId format",
});


