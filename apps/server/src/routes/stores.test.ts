import { describe, test, expect, beforeEach } from "bun:test";
import { testDb } from "../../test/setup";
import { createApp } from "../app";
import { stores, storeBrands } from "../db/schema";
import type { StoreBrandId } from "@repo/database";

describe("Stores API", () => {
  let app: ReturnType<typeof createApp>;
  let testBrandId: StoreBrandId;

  beforeEach(async () => {
    app = createApp(testDb);

    // Create a test brand for stores to reference
    const [brand] = await testDb
      .insert(storeBrands)
      .values({
        name: "Test Store Brand " + Date.now(),
        logo: "https://example.com/test-logo.png",
      })
      .returning();

    testBrandId = brand!.id;
  });

  describe("GET /api/stores", () => {
    test("returns empty array when no stores exist", async () => {
      const res = await app.request("/api/stores");

      expect(res.status).toBe(200);
      const data = await res.json();
      expect(data).toEqual([]);
    });

    test("returns all stores", async () => {
      // Seed test data
      await testDb.insert(stores).values([
        {
          brandId: testBrandId,
          name: "Store A",
          address: "123 Main St",
          city: "New York",
          state: "NY",
          zip: "10001",
          countryCode: "US",
          latitude: 40.7128,
          longitude: -74.006,
        },
        {
          brandId: testBrandId,
          name: "Store B",
          address: "456 Elm St",
          city: "Los Angeles",
          state: "CA",
          zip: "90001",
          countryCode: "US",
          latitude: 34.0522,
          longitude: -118.2437,
        },
      ]);

      const res = await app.request("/api/stores");

      expect(res.status).toBe(200);
      const data = await res.json();
      expect(data).toHaveLength(2);
      expect(data[0].name).toBe("Store A");
    });
  });

  describe("GET /api/stores/:id", () => {
    test("returns 404 when store doesn't exist", async () => {
      const res = await app.request(
        "/api/stores/store_01jafake000000000000000000",
      );

      expect(res.status).toBe(404);
      const data = await res.json();
      expect(data.error).toBe("Store not found");
    });

    test("returns 400 for invalid ID format", async () => {
      const res = await app.request("/api/stores/invalid-id");

      expect(res.status).toBe(400);
      const data = await res.json();
      expect(data.error).toBe("Invalid store ID");
    });

    test("returns store when found", async () => {
      const [store] = await testDb
        .insert(stores)
        .values({
          brandId: testBrandId,
          name: "Test Store",
          address: "789 Oak St",
          city: "Chicago",
          state: "IL",
          zip: "60601",
          countryCode: "US",
          latitude: 41.8781,
          longitude: -87.6298,
        })
        .returning();

      const res = await app.request(`/api/stores/${store!.id}`);

      expect(res.status).toBe(200);
      const data = await res.json();
      expect(data.id).toBe(store!.id);
      expect(data.name).toBe("Test Store");
    });
  });

  describe("POST /api/stores", () => {
    test("creates a new store successfully", async () => {
      const res = await app.request("/api/stores", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          brandId: testBrandId,
          name: "New Store",
          address: "321 Pine St",
          city: "Boston",
          state: "MA",
          zip: "02101",
          countryCode: "US",
          latitude: 42.3601,
          longitude: -71.0589,
        }),
      });

      expect(res.status).toBe(201);
      const data = await res.json();
      expect(data.name).toBe("New Store");
      expect(data.id).toBeDefined();

      // Verify it was saved to DB
      const allStores = await testDb.select().from(stores);
      expect(allStores).toHaveLength(1);
    });

    test("returns 404 for non-existent brand ID", async () => {
      const res = await app.request("/api/stores", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          brandId: "sb_01jafake000000000000000000",
          name: "Store",
          address: "123 St",
          city: "City",
          state: "CA",
          zip: "90001",
          countryCode: "US",
          latitude: 0,
          longitude: 0,
        }),
      });

      expect(res.status).toBe(404);
      const data = await res.json();
      expect(data.error).toBe("Store brand not found");
    });

    test("returns 400 for invalid data", async () => {
      const res = await app.request("/api/stores", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: "" }), // Invalid: missing required fields
      });

      expect(res.status).toBe(400);
      const data = await res.json();
      expect(data.error).toBeDefined();
    });
  });

  describe("PUT /api/stores/:id", () => {
    test("updates store successfully", async () => {
      const [store] = await testDb
        .insert(stores)
        .values({
          brandId: testBrandId,
          name: "Old Name",
          address: "Old Address",
          city: "Old City",
          state: "CA",
          zip: "90001",
          countryCode: "US",
          latitude: 0,
          longitude: 0,
        })
        .returning();

      const res = await app.request(`/api/stores/${store!.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          brandId: testBrandId,
          name: "Updated Name",
          address: "Updated Address",
          city: "Updated City",
          state: "NY",
          zip: "10001",
          countryCode: "US",
          latitude: 40.7128,
          longitude: -74.006,
        }),
      });

      expect(res.status).toBe(200);
      const data = await res.json();
      expect(data.name).toBe("Updated Name");
    });

    test("returns 404 when updating non-existent store", async () => {
      const res = await app.request(
        "/api/stores/store_01jafake000000000000000000",
        {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            brandId: testBrandId,
            name: "Name",
            address: "Address",
            city: "City",
            state: "CA",
            zip: "90001",
            countryCode: "US",
            latitude: 0,
            longitude: 0,
          }),
        },
      );

      expect(res.status).toBe(404);
    });

    test("returns 400 for invalid store ID", async () => {
      const res = await app.request("/api/stores/invalid-id", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          brandId: testBrandId,
          name: "Name",
          address: "Address",
          city: "City",
          state: "CA",
          zip: "90001",
          countryCode: "US",
          latitude: 0,
          longitude: 0,
        }),
      });

      expect(res.status).toBe(400);
    });
  });

  describe("DELETE /api/stores/:id", () => {
    test("deletes store successfully", async () => {
      const [store] = await testDb
        .insert(stores)
        .values({
          brandId: testBrandId,
          name: "To Delete",
          address: "Delete St",
          city: "Delete City",
          state: "CA",
          zip: "90001",
          countryCode: "US",
          latitude: 0,
          longitude: 0,
        })
        .returning();

      const res = await app.request(`/api/stores/${store!.id}`, {
        method: "DELETE",
      });

      expect(res.status).toBe(200);
      const data = await res.json();
      expect(data.message).toBe("Store deleted successfully");

      // Verify deletion
      const allStores = await testDb.select().from(stores);
      expect(allStores).toHaveLength(0);
    });

    test("returns 404 when deleting non-existent store", async () => {
      const res = await app.request(
        "/api/stores/store_01jafake000000000000000000",
        {
          method: "DELETE",
        },
      );

      expect(res.status).toBe(404);
    });

    test("returns 400 for invalid store ID", async () => {
      const res = await app.request("/api/stores/invalid-id", {
        method: "DELETE",
      });

      expect(res.status).toBe(400);
    });
  });
});
