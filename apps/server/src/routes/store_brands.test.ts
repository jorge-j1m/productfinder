import { describe, test, expect, beforeEach } from "bun:test";
import { testDb } from "../../test/setup";
import { createApp } from "../app";
import { storeBrands } from "../db/schema";

describe("Store Brands API", () => {
  let app: ReturnType<typeof createApp>;

  beforeEach(() => {
    app = createApp(testDb);
  });

  describe("GET /api/store-brands", () => {
    test("returns empty array when no brands exist", async () => {
      const res = await app.request("/api/store-brands");

      expect(res.status).toBe(200);
      const data = await res.json();
      expect(data).toEqual([]);
    });

    test("returns all store brands", async () => {
      // Seed test data
      await testDb.insert(storeBrands).values([
        { name: "Brand A", logo: "https://example.com/a.png" },
        { name: "Brand B", logo: "https://example.com/b.png" },
      ]);

      const res = await app.request("/api/store-brands");

      expect(res.status).toBe(200);
      const data = await res.json();
      expect(data).toHaveLength(2);
      expect(data[0].name).toBe("Brand A");
    });
  });

  describe("GET /api/store-brands/:id", () => {
    test("returns 404 when brand doesn't exist", async () => {
      const res = await app.request(
        "/api/store-brands/sb_01jafake000000000000000000",
      );

      expect(res.status).toBe(404);
      const data = await res.json();
      expect(data.error).toBe("Store brand not found");
    });

    test("returns 400 for invalid ID format", async () => {
      const res = await app.request("/api/store-brands/invalid-id");

      expect(res.status).toBe(400);
      const data = await res.json();
      expect(data.error).toBe("Invalid store brand ID");
    });

    test("returns brand when found", async () => {
      const [brand] = await testDb
        .insert(storeBrands)
        .values({ name: "Test Brand", logo: "https://example.com/test.png" })
        .returning();

      const res = await app.request(`/api/store-brands/${brand!.id}`);

      expect(res.status).toBe(200);
      const data = await res.json();
      expect(data.id).toBe(brand!.id);
      expect(data.name).toBe("Test Brand");
    });
  });

  describe("POST /api/store-brands", () => {
    test("creates a new brand successfully", async () => {
      const res = await app.request("/api/store-brands", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: "New Brand",
          logo: "https://example.com/new.png",
        }),
      });

      expect(res.status).toBe(201);
      const data = await res.json();
      expect(data.name).toBe("New Brand");
      expect(data.id).toBeDefined();

      // Verify it was saved to DB
      const brands = await testDb.select().from(storeBrands);
      expect(brands).toHaveLength(1);
    });

    test("returns 400 for invalid data", async () => {
      const res = await app.request("/api/store-brands", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: "" }), // Invalid: empty name
      });

      expect(res.status).toBe(400);
      const data = await res.json();
      expect(data.error).toBeDefined();
    });

    test("tests are isolated - no data from previous test", async () => {
      // This test runs after the successful create test above
      // but sees no data due to transaction rollback!
      const brands = await testDb.select().from(storeBrands);
      expect(brands).toHaveLength(0);
    });
  });

  describe("PUT /api/store-brands/:id", () => {
    test("updates brand successfully", async () => {
      const [brand] = await testDb
        .insert(storeBrands)
        .values({ name: "Old Name", logo: "https://example.com/old.png" })
        .returning();

      const res = await app.request(`/api/store-brands/${brand!.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: "Updated Name",
          logo: "https://example.com/updated.png",
        }),
      });

      expect(res.status).toBe(200);
      const data = await res.json();
      expect(data.name).toBe("Updated Name");
    });

    test("returns 404 when updating non-existent brand", async () => {
      const res = await app.request(
        "/api/store-brands/sb_01jafake000000000000000000",
        {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name: "New Name",
            logo: "https://example.com/new.png",
          }),
        },
      );

      expect(res.status).toBe(404);
    });

    test("returns 400 for invalid brand ID", async () => {
      const res = await app.request("/api/store-brands/invalid-id", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: "Test",
          logo: "https://example.com/test.png",
        }),
      });

      expect(res.status).toBe(400);
    });
  });

  describe("DELETE /api/store-brands/:id", () => {
    test("deletes brand successfully", async () => {
      const [brand] = await testDb
        .insert(storeBrands)
        .values({ name: "To Delete", logo: "https://example.com/delete.png" })
        .returning();

      const res = await app.request(`/api/store-brands/${brand!.id}`, {
        method: "DELETE",
      });

      expect(res.status).toBe(200);
      const data = await res.json();
      expect(data.message).toBe("Store brand deleted successfully");

      // Verify deletion
      const brands = await testDb.select().from(storeBrands);
      expect(brands).toHaveLength(0);
    });

    test("returns 404 when deleting non-existent brand", async () => {
      const res = await app.request(
        "/api/store-brands/sb_01jafake000000000000000000",
        {
          method: "DELETE",
        },
      );

      expect(res.status).toBe(404);
    });

    test("returns 400 for invalid brand ID", async () => {
      const res = await app.request("/api/store-brands/invalid-id", {
        method: "DELETE",
      });

      expect(res.status).toBe(400);
    });
  });
});
