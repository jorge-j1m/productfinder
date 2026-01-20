import { fromString } from "typeid-js";
import { z } from "zod";
import { Brand } from "../../brand";

// ProductId branded type
export type ProductId = Brand<string, "ProductId">;

// Runtime validation function with type predicate
export function isProductId(id: unknown): id is ProductId {
  try {
    fromString(id as string, "prod");
    return true;
  } catch {
    return false;
  }
}

// Helper function to cast strings to branded type with validation
export const asProductId = (id: unknown): ProductId => {
  if (!isProductId(id)) {
    throw new Error("Invalid ProductId");
  }
  return id as ProductId;
};

// Branded ID schema with proper output type
export const productIdSchema = z.custom<ProductId>((val) => isProductId(val), {
  message: "Invalid ProductId format",
});
