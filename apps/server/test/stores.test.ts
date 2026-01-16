import { describe, test, expect, beforeAll } from "bun:test";
import { createApp } from "../src/app";
import { testDb } from "./setup";
import {
  createTestBrand,
  createTestStore,
  createTestDataChain,
} from "./helpers/test_factories";

describe("Stores CRUD", () => {
  let app: ReturnType<typeof createApp>;

  beforeAll(() => {
    app = createApp(testDb);
  });

  // ==================== GET ALL ====================
  describe("GET /rpc/stores (getAll)", () => {
    test("returns empty array when no stores exist", async () => {
      const response = await app.request("/rpc/stores", {
        method: "GET",
      });

      expect(response.status).toBe(200);
      const data = await response.json();

      expect(data).toHaveProperty("data");
      expect(data).toHaveProperty("pagination");
      expect(data.data).toEqual([]);
      expect(data.pagination.total).toBe(0);
    });

    test("returns stores with brand relation", async () => {
      const { brand, store } = await createTestDataChain();

      const response = await app.request("/rpc/stores", {
        method: "GET",
      });

      expect(response.status).toBe(200);
      const data = await response.json();

      expect(data.data).toHaveLength(1);
      expect(data.data[0]).toHaveProperty("brand");
      expect(data.data[0].brand.id).toBe(brand.id);
      expect(data.data[0].id).toBe(store.id);
    });

    test("respects custom page and pageSize", async () => {
      const brand = await createTestBrand();
      // Create 15 stores
      for (let i = 0; i < 15; i++) {
        await createTestStore(brand.id, {
          name: `Store ${i.toString().padStart(2, "0")}`,
        });
      }

      const response = await app.request("/rpc/stores?page=2&pageSize=5", {
        method: "GET",
      });

      expect(response.status).toBe(200);
      const data = await response.json();

      expect(data.data).toHaveLength(5);
      expect(data.pagination.page).toBe(2);
      expect(data.pagination.pageSize).toBe(5);
      expect(data.pagination.total).toBe(15);
      expect(data.pagination.totalPages).toBe(3);
    });

    test("filters by name (ilike)", async () => {
      const brand = await createTestBrand();
      await createTestStore(brand.id, { name: "Downtown Store" });
      await createTestStore(brand.id, { name: "Uptown Store" });
      await createTestStore(brand.id, { name: "Airport Location" });

      const response = await app.request("/rpc/stores?name=store", {
        method: "GET",
      });

      expect(response.status).toBe(200);
      const data = await response.json();

      expect(data.data).toHaveLength(2);
      expect(
        data.data.every((s: { name: string }) =>
          s.name.toLowerCase().includes("store"),
        ),
      ).toBe(true);
    });

    test("filters by city (ilike)", async () => {
      const brand = await createTestBrand();
      await createTestStore(brand.id, { city: "Chicago" });
      await createTestStore(brand.id, { city: "New York" });
      await createTestStore(brand.id, { city: "Chicago Heights" });

      const response = await app.request("/rpc/stores?city=chicago", {
        method: "GET",
      });

      expect(response.status).toBe(200);
      const data = await response.json();

      expect(data.data).toHaveLength(2);
      expect(
        data.data.every((s: { city: string }) =>
          s.city.toLowerCase().includes("chicago"),
        ),
      ).toBe(true);
    });

    test("filters by state (ilike)", async () => {
      const brand = await createTestBrand();
      await createTestStore(brand.id, { state: "FL" });
      await createTestStore(brand.id, { state: "NY" });
      await createTestStore(brand.id, { state: "FL" });

      const response = await app.request("/rpc/stores?state=FL", {
        method: "GET",
      });

      expect(response.status).toBe(200);
      const data = await response.json();

      expect(data.data).toHaveLength(2);
      expect(data.data.every((s: { state: string }) => s.state === "FL")).toBe(
        true,
      );
    });

    test("filters by zip (ilike)", async () => {
      const brand = await createTestBrand();
      await createTestStore(brand.id, { zip: "33101" });
      await createTestStore(brand.id, { zip: "33102" });
      await createTestStore(brand.id, { zip: "10001" });

      const response = await app.request("/rpc/stores?zip=331", {
        method: "GET",
      });

      expect(response.status).toBe(200);
      const data = await response.json();

      expect(data.data).toHaveLength(2);
      expect(
        data.data.every((s: { zip: string }) => s.zip.startsWith("331")),
      ).toBe(true);
    });

    test("filters by multiple fields combined", async () => {
      const brand = await createTestBrand();
      await createTestStore(brand.id, { city: "Miami", state: "FL" });
      await createTestStore(brand.id, { city: "Miami", state: "OH" });
      await createTestStore(brand.id, { city: "Orlando", state: "FL" });

      const response = await app.request("/rpc/stores?city=Miami&state=FL", {
        method: "GET",
      });

      expect(response.status).toBe(200);
      const data = await response.json();

      expect(data.data).toHaveLength(1);
      expect(data.data[0].city).toBe("Miami");
      expect(data.data[0].state).toBe("FL");
    });

    test("sorts by name ascending (default)", async () => {
      const brand = await createTestBrand();
      await createTestStore(brand.id, { name: "Zeta Store" });
      await createTestStore(brand.id, { name: "Alpha Store" });
      await createTestStore(brand.id, { name: "Beta Store" });

      const response = await app.request(
        "/rpc/stores?sortBy=name&sortOrder=asc",
        { method: "GET" },
      );

      expect(response.status).toBe(200);
      const data = await response.json();

      expect(data.data[0].name).toBe("Alpha Store");
      expect(data.data[1].name).toBe("Beta Store");
      expect(data.data[2].name).toBe("Zeta Store");
    });

    test("sorts by name descending", async () => {
      const brand = await createTestBrand();
      await createTestStore(brand.id, { name: "Alpha Store" });
      await createTestStore(brand.id, { name: "Zeta Store" });
      await createTestStore(brand.id, { name: "Beta Store" });

      const response = await app.request(
        "/rpc/stores?sortBy=name&sortOrder=desc",
        { method: "GET" },
      );

      expect(response.status).toBe(200);
      const data = await response.json();

      expect(data.data[0].name).toBe("Zeta Store");
      expect(data.data[1].name).toBe("Beta Store");
      expect(data.data[2].name).toBe("Alpha Store");
    });

    test("sorts by city", async () => {
      const brand = await createTestBrand();
      await createTestStore(brand.id, { city: "Zebra City" });
      await createTestStore(brand.id, { city: "Alpha City" });

      const response = await app.request(
        "/rpc/stores?sortBy=city&sortOrder=asc",
        { method: "GET" },
      );

      expect(response.status).toBe(200);
      const data = await response.json();

      expect(data.data[0].city).toBe("Alpha City");
      expect(data.data[1].city).toBe("Zebra City");
    });

    test("sorts by id", async () => {
      const brand = await createTestBrand();
      const store1 = await createTestStore(brand.id, { name: "First" });
      const store2 = await createTestStore(brand.id, { name: "Second" });

      const response = await app.request(
        "/rpc/stores?sortBy=id&sortOrder=asc",
        { method: "GET" },
      );

      expect(response.status).toBe(200);
      const data = await response.json();

      expect(data.data[0].id).toBe(store1.id);
      expect(data.data[1].id).toBe(store2.id);
    });
  });

  // ==================== GET BY ID ====================
  describe("GET /rpc/stores/{id} (get)", () => {
    test("returns store with brand relation by valid ID", async () => {
      const { brand, store } = await createTestDataChain();

      const response = await app.request(`/rpc/stores/${store.id}`, {
        method: "GET",
      });

      expect(response.status).toBe(200);
      const data = await response.json();

      expect(data.id).toBe(store.id);
      expect(data.brandId).toBe(brand.id);
      expect(data).toHaveProperty("brand");
      expect(data.brand.id).toBe(brand.id);
    });

    test("returns 404 for non-existent ID", async () => {
      const response = await app.request(
        "/rpc/stores/store_00000000000000000000000000",
        { method: "GET" },
      );

      expect(response.status).toBe(404);
      const data = await response.json();
      expect(data.message).toBe("Store not found");
    });

    test("returns 400 for invalid ID format", async () => {
      const response = await app.request("/rpc/stores/invalid-id", {
        method: "GET",
      });

      expect(response.status).toBe(400);
    });
  });

  // ==================== CREATE ====================
  describe("POST /rpc/stores (create)", () => {
    test("creates store with brand relation successfully", async () => {
      const brand = await createTestBrand();

      const response = await app.request("/rpc/stores", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          brandId: brand.id,
          name: "New Store",
          address: "123 Main St",
          city: "Test City",
          state: "TC",
          zip: "12345",
          countryCode: "US",
          latitude: 40.7128,
          longitude: -74.006,
        }),
      });

      expect(response.status).toBe(201);
      const data = await response.json();

      expect(data.id).toBeDefined();
      expect(data.id).toMatch(/^store_/); // TypeID prefix check
      expect(data.name).toBe("New Store");
      expect(data.brandId).toBe(brand.id);
      expect(data).toHaveProperty("brand");
      expect(data.brand.id).toBe(brand.id);
    });

    test("returns 404 when brandId does not exist", async () => {
      const response = await app.request("/rpc/stores", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          brandId: "sb_00000000000000000000000000",
          name: "Test Store",
          address: "123 Main St",
          city: "Test City",
          state: "TC",
          zip: "12345",
          countryCode: "US",
          latitude: 40.7128,
          longitude: -74.006,
        }),
      });

      expect(response.status).toBe(404);
      const data = await response.json();
      expect(data.message).toBe("Store brand not found");
    });

    test("returns 409 for duplicate address+zip combination", async () => {
      const brand = await createTestBrand();
      await createTestStore(brand.id, { address: "123 Main St", zip: "12345" });

      const response = await app.request("/rpc/stores", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          brandId: brand.id,
          name: "Another Store",
          address: "123 Main St",
          city: "Different City",
          state: "DC",
          zip: "12345",
          countryCode: "US",
          latitude: 40.0,
          longitude: -74.0,
        }),
      });

      expect(response.status).toBe(409);
      const data = await response.json();
      expect(data.message).toBe(
        "Store with this address and ZIP already exists",
      );
    });

    test("validates required fields", async () => {
      const response = await app.request("/rpc/stores", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({}),
      });

      expect(response.status).toBe(400);
    });
  });

  // ==================== UPDATE ====================
  describe("PUT /rpc/stores/{id} (update)", () => {
    test("updates store fields successfully", async () => {
      const { store } = await createTestDataChain();

      const response = await app.request(`/rpc/stores/${store.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          data: { name: "Updated Store Name", city: "New City" },
        }),
      });

      expect(response.status).toBe(200);
      const data = await response.json();

      expect(data.id).toBe(store.id);
      expect(data.name).toBe("Updated Store Name");
      expect(data.city).toBe("New City");
    });

    test("updates with partial data (only name)", async () => {
      const { store } = await createTestDataChain();
      const originalCity = store.city;

      const response = await app.request(`/rpc/stores/${store.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          data: { name: "Only Name Changed" },
        }),
      });

      expect(response.status).toBe(200);
      const data = await response.json();

      expect(data.name).toBe("Only Name Changed");
      expect(data.city).toBe(originalCity);
    });

    test("returns 404 for non-existent ID", async () => {
      const response = await app.request(
        "/rpc/stores/store_00000000000000000000000000",
        {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ data: { name: "New Name" } }),
        },
      );

      expect(response.status).toBe(404);
    });

    test("returns 409 when changing to duplicate address+zip", async () => {
      const brand = await createTestBrand();
      await createTestStore(brand.id, {
        address: "Existing Address",
        zip: "11111",
      });
      const store2 = await createTestStore(brand.id, {
        address: "Other Address",
        zip: "22222",
      });

      const response = await app.request(`/rpc/stores/${store2.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          data: { address: "Existing Address", zip: "11111" },
        }),
      });

      expect(response.status).toBe(409);
    });

    test("allows same address+zip for same store (no change)", async () => {
      const { store } = await createTestDataChain();

      const response = await app.request(`/rpc/stores/${store.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          data: { name: "Same Address OK" },
        }),
      });

      expect(response.status).toBe(200);
      const data = await response.json();
      expect(data.name).toBe("Same Address OK");
    });
  });

  // ==================== DELETE ====================
  describe("DELETE /rpc/stores/{id} (delete)", () => {
    test("removes store successfully", async () => {
      const { store } = await createTestDataChain();

      const response = await app.request(`/rpc/stores/${store.id}`, {
        method: "DELETE",
      });

      expect(response.status).toBe(200);
      const data = await response.json();

      expect(data.success).toBe(true);
      expect(data.id).toBe(store.id);

      // Verify deletion
      const verifyResponse = await app.request(`/rpc/stores/${store.id}`, {
        method: "GET",
      });
      expect(verifyResponse.status).toBe(404);
    });

    test("returns 404 for non-existent ID", async () => {
      const response = await app.request(
        "/rpc/stores/store_00000000000000000000000000",
        { method: "DELETE" },
      );

      expect(response.status).toBe(404);
    });
  });
});
