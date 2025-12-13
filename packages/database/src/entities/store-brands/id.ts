import { fromString } from "typeid-js";
import { z } from "zod";
import { Brand } from "../../brand";

// StoreBrandId branded type
export type StoreBrandId = Brand<string, "StoreBrandId">;

// Runtime validation function with type predicate
export function isStoreBrandId(id: unknown): id is StoreBrandId {
  try {
    fromString(id as string, "sb");
    return true;
  } catch {
    return false;
  }
}

// Helper function to cast strings to branded type with validation
export const asStoreBrandId = (id: unknown): StoreBrandId => {
  if (!isStoreBrandId(id)) {
    throw new Error("Invalid StoreBrandId");
  }
  return id as StoreBrandId;
};

// Branded ID schema with proper output type
export const storeBrandIdSchema = z.custom<StoreBrandId>(
  (val) => isStoreBrandId(val),
  { message: "Invalid StoreBrandId format" },
);
