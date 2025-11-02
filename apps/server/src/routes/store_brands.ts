import { Hono } from "hono";
import { db as defaultDb } from "../db";
import { storeBrands } from "../db/schema";
import { eq } from "drizzle-orm";
import {
  asStoreBrandId,
  newStoreBrandSchema,
  type StoreBrand,
} from "@repo/database";

const storeBrandsRouter = new Hono();

// GET all store brands
storeBrandsRouter.get("/", async (c) => {
  try {
    // Use injected db from context, fallback to default
    const db = c.get("db") || defaultDb;
    const brands = await db.select().from(storeBrands);
    return c.json(brands);
  } catch {
    return c.json({ error: "Failed to fetch store brands" }, 500);
  }
});

// GET a single store brand by ID
storeBrandsRouter.get("/:id", async (c) => {
  try {
    const db = c.get("db") || defaultDb;
    const id = asStoreBrandId(c.req.param("id"));
    const brand = await db
      .select()
      .from(storeBrands)
      .where(eq(storeBrands.id, id));

    if (brand.length === 0) {
      return c.json({ error: "Store brand not found" }, 404);
    }

    return c.json(brand[0]);
  } catch (error) {
    if (error instanceof Error && error.message.includes("Invalid")) {
      return c.json({ error: "Invalid store brand ID" }, 400);
    }
    return c.json({ error: "Failed to fetch store brand" }, 500);
  }
});

// POST create a new store brand
storeBrandsRouter.post("/", async (c) => {
  try {
    const db = c.get("db") || defaultDb;
    const body = await c.req.json();
    const validatedData = newStoreBrandSchema.parse(body);
    const { id: _id, ...insertData } = validatedData;

    const newBrand = await db
      .insert(storeBrands)
      .values(insertData)
      .returning();

    return c.json(newBrand[0] as StoreBrand, 201);
  } catch (error) {
    if (error instanceof Error) {
      return c.json({ error: error.message }, 400);
    }
    return c.json({ error: "Failed to create store brand" }, 500);
  }
});

// PUT update a store brand
storeBrandsRouter.put("/:id", async (c) => {
  try {
    const db = c.get("db") || defaultDb;
    const id = asStoreBrandId(c.req.param("id"));
    const body = await c.req.json();
    const validatedData = newStoreBrandSchema.parse(body);
    const { id: _brandId, ...updateData } = validatedData;

    const updatedBrand = await db
      .update(storeBrands)
      .set(updateData)
      .where(eq(storeBrands.id, id))
      .returning();

    if (updatedBrand.length === 0) {
      return c.json({ error: "Store brand not found" }, 404);
    }

    return c.json(updatedBrand[0] as StoreBrand);
  } catch (error) {
    if (error instanceof Error) {
      return c.json({ error: error.message }, 400);
    }
    return c.json({ error: "Failed to update store brand" }, 500);
  }
});

// DELETE a store brand
storeBrandsRouter.delete("/:id", async (c) => {
  try {
    const db = c.get("db") || defaultDb;
    const id = asStoreBrandId(c.req.param("id"));

    const deletedBrand = await db
      .delete(storeBrands)
      .where(eq(storeBrands.id, id))
      .returning();

    if (deletedBrand.length === 0) {
      return c.json({ error: "Store brand not found" }, 404);
    }

    return c.json({ message: "Store brand deleted successfully" });
  } catch (error) {
    if (error instanceof Error && error.message.includes("Invalid")) {
      return c.json({ error: "Invalid store brand ID" }, 400);
    }
    return c.json({ error: "Failed to delete store brand" }, 500);
  }
});

export default storeBrandsRouter;
