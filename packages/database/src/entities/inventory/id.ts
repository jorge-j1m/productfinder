import { fromString } from "typeid-js";
import { z } from "zod";
import { Brand } from "../../brand";

// InventoryId branded type
export type InventoryId = Brand<string, "InventoryId">;

// Runtime validation function with type predicate
export function isInventoryId(id: unknown): id is InventoryId {
  try {
    fromString(id as string, "inv");
    return true;
  } catch {
    return false;
  }
}

// Helper function to cast strings to branded type with validation
export const asInventoryId = (id: unknown): InventoryId => {
  if (!isInventoryId(id)) {
    throw new Error("Invalid InventoryId");
  }
  return id as InventoryId;
};

// Branded ID schema with proper output type
export const inventoryIdSchema = z.custom<InventoryId>(
  (val) => isInventoryId(val),
  {
    message: "Invalid InventoryId format",
  },
);
