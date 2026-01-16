import { describe, test, expect, beforeAll } from "bun:test";
import { createApp } from "../src/app";
import { testDb } from "./setup";
import { createTestBrand } from "./helpers/test_factories";

describe("Store Brands CRUD", () => {
  let app: ReturnType<typeof createApp>;

  beforeAll(() => {
    app = createApp(testDb);
  });

  // ==================== GET ALL ====================
  describe("GET /rpc/store-brands (getAll)", () => {
    test("returns empty array when no brands exist", async () => {
      const response = await app.request("/rpc/store-brands", {
        method: "GET",
      });

      expect(response.status).toBe(200);
      const data = await response.json();

      expect(data).toHaveProperty("data");
      expect(data).toHaveProperty("pagination");
      expect(data.data).toEqual([]);
      expect(data.pagination).toEqual({
        page: 1,
        pageSize: 10,
        total: 0,
        totalPages: 0,
      });
    });

    test("returns paginated results with default pagination", async () => {
      await createTestBrand({ name: "Brand A" });
      await createTestBrand({ name: "Brand B" });

      const response = await app.request("/rpc/store-brands", {
        method: "GET",
      });

      expect(response.status).toBe(200);
      const data = await response.json();

      expect(data.data).toHaveLength(2);
      expect(data.pagination.total).toBe(2);
      expect(data.pagination.page).toBe(1);
      expect(data.pagination.pageSize).toBe(10);
    });

    test("respects custom page and pageSize", async () => {
      // Create 15 brands
      for (let i = 0; i < 15; i++) {
        await createTestBrand({
          name: `Brand ${i.toString().padStart(2, "0")}`,
        });
      }

      const response = await app.request(
        "/rpc/store-brands?page=2&pageSize=5",
        { method: "GET" },
      );

      expect(response.status).toBe(200);
      const data = await response.json();

      expect(data.data).toHaveLength(5);
      expect(data.pagination.page).toBe(2);
      expect(data.pagination.pageSize).toBe(5);
      expect(data.pagination.total).toBe(15);
      expect(data.pagination.totalPages).toBe(3);
    });

    test("filters by search term (case insensitive)", async () => {
      await createTestBrand({ name: "Acme Corporation" });
      await createTestBrand({ name: "ACME Industries" });
      await createTestBrand({ name: "Other Brand" });

      const response = await app.request("/rpc/store-brands?search=acme", {
        method: "GET",
      });

      expect(response.status).toBe(200);
      const data = await response.json();

      expect(data.data).toHaveLength(2);
      expect(
        data.data.every((b: { name: string }) =>
          b.name.toLowerCase().includes("acme"),
        ),
      ).toBe(true);
    });

    test("sorts by name ascending (default)", async () => {
      await createTestBrand({ name: "Zeta Brand" });
      await createTestBrand({ name: "Alpha Brand" });
      await createTestBrand({ name: "Beta Brand" });

      const response = await app.request(
        "/rpc/store-brands?sortBy=name&sortOrder=asc",
        { method: "GET" },
      );

      expect(response.status).toBe(200);
      const data = await response.json();

      expect(data.data[0].name).toBe("Alpha Brand");
      expect(data.data[1].name).toBe("Beta Brand");
      expect(data.data[2].name).toBe("Zeta Brand");
    });

    test("sorts by name descending", async () => {
      await createTestBrand({ name: "Alpha Brand" });
      await createTestBrand({ name: "Zeta Brand" });
      await createTestBrand({ name: "Beta Brand" });

      const response = await app.request(
        "/rpc/store-brands?sortBy=name&sortOrder=desc",
        { method: "GET" },
      );

      expect(response.status).toBe(200);
      const data = await response.json();

      expect(data.data[0].name).toBe("Zeta Brand");
      expect(data.data[1].name).toBe("Beta Brand");
      expect(data.data[2].name).toBe("Alpha Brand");
    });

    test("sorts by id", async () => {
      const brand1 = await createTestBrand({ name: "First Created" });
      const brand2 = await createTestBrand({ name: "Second Created" });

      const response = await app.request(
        "/rpc/store-brands?sortBy=id&sortOrder=asc",
        { method: "GET" },
      );

      expect(response.status).toBe(200);
      const data = await response.json();

      // TypeIDs are sortable, so first created should come first
      expect(data.data[0].id).toBe(brand1.id);
      expect(data.data[1].id).toBe(brand2.id);
    });
  });

  // ==================== GET BY ID ====================
  describe("GET /rpc/store-brands/{id} (get)", () => {
    test("returns brand by valid ID", async () => {
      const brand = await createTestBrand({
        name: "Test Brand",
        logo: "https://example.com/logo.png",
      });

      const response = await app.request(`/rpc/store-brands/${brand.id}`, {
        method: "GET",
      });

      expect(response.status).toBe(200);
      const data = await response.json();

      expect(data.id).toBe(brand.id);
      expect(data.name).toBe("Test Brand");
      expect(data.logo).toBe("https://example.com/logo.png");
    });

    test("returns 404 for non-existent ID", async () => {
      const response = await app.request(
        "/rpc/store-brands/sb_00000000000000000000000000",
        { method: "GET" },
      );

      expect(response.status).toBe(404);
      const data = await response.json();
      expect(data.message).toBe("Store brand not found");
    });

    test("returns 400 for invalid ID format", async () => {
      const response = await app.request("/rpc/store-brands/invalid-id", {
        method: "GET",
      });

      expect(response.status).toBe(400);
    });
  });

  // ==================== CREATE ====================
  describe("POST /rpc/store-brands (create)", () => {
    test("creates new brand successfully", async () => {
      const response = await app.request("/rpc/store-brands", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: "New Brand",
          logo: "https://example.com/new-logo.png",
        }),
      });

      expect(response.status).toBe(201);
      const data = await response.json();

      expect(data.id).toBeDefined();
      expect(data.id).toMatch(/^sb_/); // TypeID prefix check
      expect(data.name).toBe("New Brand");
      expect(data.logo).toBe("https://example.com/new-logo.png");
    });

    test("returns 409 for duplicate name", async () => {
      await createTestBrand({ name: "Duplicate Name" });

      const response = await app.request("/rpc/store-brands", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: "Duplicate Name",
          logo: "https://example.com/logo.png",
        }),
      });

      expect(response.status).toBe(409);
      const data = await response.json();
      expect(data.message).toBe("Store brand with this name already exists");
    });

    test("validates required fields", async () => {
      const response = await app.request("/rpc/store-brands", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({}),
      });

      expect(response.status).toBe(400);
    });
  });

  // ==================== UPDATE ====================
  describe("PUT /rpc/store-brands/{id} (update)", () => {
    test("updates brand name successfully", async () => {
      const brand = await createTestBrand({ name: "Original Name" });

      const response = await app.request(`/rpc/store-brands/${brand.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          data: { name: "Updated Name" },
        }),
      });

      expect(response.status).toBe(200);
      const data = await response.json();

      expect(data.id).toBe(brand.id);
      expect(data.name).toBe("Updated Name");
    });

    test("updates brand logo successfully", async () => {
      const brand = await createTestBrand({
        name: "Keep Name",
        logo: "https://old.com/logo.png",
      });

      const response = await app.request(`/rpc/store-brands/${brand.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          data: { logo: "https://new.com/logo.png" },
        }),
      });

      expect(response.status).toBe(200);
      const data = await response.json();

      expect(data.name).toBe("Keep Name");
      expect(data.logo).toBe("https://new.com/logo.png");
    });

    test("updates with partial data (only name)", async () => {
      const brand = await createTestBrand({
        name: "Old Name",
        logo: "https://keep.com/logo.png",
      });

      const response = await app.request(`/rpc/store-brands/${brand.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          data: { name: "New Name" },
        }),
      });

      expect(response.status).toBe(200);
      const data = await response.json();

      expect(data.name).toBe("New Name");
      expect(data.logo).toBe("https://keep.com/logo.png");
    });

    test("returns 404 for non-existent ID", async () => {
      const response = await app.request(
        "/rpc/store-brands/sb_00000000000000000000000000",
        {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ data: { name: "New Name" } }),
        },
      );

      expect(response.status).toBe(404);
    });

    test("returns 409 when changing to duplicate name", async () => {
      await createTestBrand({ name: "Existing Name" });
      const brand2 = await createTestBrand({ name: "Brand Two" });

      const response = await app.request(`/rpc/store-brands/${brand2.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ data: { name: "Existing Name" } }),
      });

      expect(response.status).toBe(409);
    });
  });

  // ==================== DELETE ====================
  describe("DELETE /rpc/store-brands/{id} (delete)", () => {
    test("removes brand successfully", async () => {
      const brand = await createTestBrand({ name: "To Be Deleted" });

      const response = await app.request(`/rpc/store-brands/${brand.id}`, {
        method: "DELETE",
      });

      expect(response.status).toBe(200);
      const data = await response.json();

      expect(data.success).toBe(true);
      expect(data.id).toBe(brand.id);

      // Verify deletion
      const verifyResponse = await app.request(
        `/rpc/store-brands/${brand.id}`,
        { method: "GET" },
      );
      expect(verifyResponse.status).toBe(404);
    });

    test("returns 404 for non-existent ID", async () => {
      const response = await app.request(
        "/rpc/store-brands/sb_00000000000000000000000000",
        { method: "DELETE" },
      );

      expect(response.status).toBe(404);
    });
  });
});
