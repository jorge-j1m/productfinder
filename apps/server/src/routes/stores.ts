import { Hono } from "hono";
import { stores, storeBrands } from "../db/schema";
import { eq } from "drizzle-orm";
import {
  asStoreId,
  asStoreBrandId,
  newStoreSchema,
  type Store,
} from "@repo/database";

const storesRouter = new Hono();

// GET all stores
storesRouter.get("/", async (c) => {
  try {
    const db = c.get("db");
    const allStores = await db.select().from(stores);
    return c.json(allStores);
  } catch {
    return c.json({ error: "Failed to fetch stores" }, 500);
  }
});

// GET a single store by ID
storesRouter.get("/:id", async (c) => {
  try {
    const db = c.get("db");
    const id = asStoreId(c.req.param("id"));
    const store = await db.select().from(stores).where(eq(stores.id, id));

    if (store.length === 0) {
      return c.json({ error: "Store not found" }, 404);
    }

    return c.json(store[0]);
  } catch (error) {
    if (error instanceof Error && error.message.includes("Invalid")) {
      return c.json({ error: "Invalid store ID" }, 400);
    }
    return c.json({ error: "Failed to fetch store" }, 500);
  }
});

// POST create a new store
storesRouter.post("/", async (c) => {
  try {
    const db = c.get("db");
    const body = await c.req.json();
    const validatedData = newStoreSchema.parse(body);
    const { id: _id, ...insertData } = validatedData;

    // Check if the brand exists
    const typedBrandId = asStoreBrandId(
      insertData.brandId as unknown as string,
    );
    const brand = await db
      .select()
      .from(storeBrands)
      .where(eq(storeBrands.id, typedBrandId));

    if (brand.length === 0) {
      return c.json({ error: "Store brand not found" }, 404);
    }

    const newStore = await db
      .insert(stores)
      .values({ ...insertData, brandId: typedBrandId })
      .returning();

    return c.json(newStore[0] as Store, 201);
  } catch (error) {
    if (error instanceof Error) {
      return c.json({ error: error.message }, 400);
    }
    return c.json({ error: "Failed to create store" }, 500);
  }
});

// PUT update a store
storesRouter.put("/:id", async (c) => {
  try {
    const db = c.get("db");
    const id = asStoreId(c.req.param("id"));
    const body = await c.req.json();
    const validatedData = newStoreSchema.parse(body);
    const { id: _storeId, ...updateData } = validatedData;

    // Check if the brand exists
    const typedBrandId = asStoreBrandId(
      updateData.brandId as unknown as string,
    );
    const brand = await db
      .select()
      .from(storeBrands)
      .where(eq(storeBrands.id, typedBrandId));

    if (brand.length === 0) {
      return c.json({ error: "Store brand not found" }, 404);
    }

    const updatedStore = await db
      .update(stores)
      .set({ ...updateData, brandId: typedBrandId })
      .where(eq(stores.id, id))
      .returning();

    if (updatedStore.length === 0) {
      return c.json({ error: "Store not found" }, 404);
    }

    return c.json(updatedStore[0] as Store);
  } catch (error) {
    if (error instanceof Error) {
      return c.json({ error: error.message }, 400);
    }
    return c.json({ error: "Failed to update store" }, 500);
  }
});

// DELETE a store
storesRouter.delete("/:id", async (c) => {
  try {
    const db = c.get("db");
    const id = asStoreId(c.req.param("id"));

    const deletedStore = await db
      .delete(stores)
      .where(eq(stores.id, id))
      .returning();

    if (deletedStore.length === 0) {
      return c.json({ error: "Store not found" }, 404);
    }

    return c.json({ message: "Store deleted successfully" });
  } catch (error) {
    if (error instanceof Error && error.message.includes("Invalid")) {
      return c.json({ error: "Invalid store ID" }, 400);
    }
    return c.json({ error: "Failed to delete store" }, 500);
  }
});

export default storesRouter;
