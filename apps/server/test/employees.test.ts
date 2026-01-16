import { describe, test, expect, beforeAll } from "bun:test";
import { createApp } from "../src/app";
import { testDb } from "./setup";
import {
  createTestBrand,
  createTestStore,
  createTestEmployee,
  createTestDataChain,
} from "./helpers/test_factories";

describe("Employees CRUD", () => {
  let app: ReturnType<typeof createApp>;

  beforeAll(() => {
    app = createApp(testDb);
  });

  // ==================== GET ALL ====================
  describe("GET /rpc/employees (getAll)", () => {
    test("returns empty array when no employees exist", async () => {
      const response = await app.request("/rpc/employees", {
        method: "GET",
      });

      expect(response.status).toBe(200);
      const data = await response.json();

      expect(data).toHaveProperty("data");
      expect(data).toHaveProperty("pagination");
      expect(data.data).toEqual([]);
      expect(data.pagination.total).toBe(0);
    });

    test("returns employees with store relation", async () => {
      const { brand, store } = await createTestDataChain();
      const employee = await createTestEmployee(store.id);

      const response = await app.request("/rpc/employees", {
        method: "GET",
      });

      expect(response.status).toBe(200);
      const data = await response.json();

      expect(data.data).toHaveLength(1);
      expect(data.data[0]).toHaveProperty("store");
      expect(data.data[0].store.id).toBe(store.id);
      expect(data.data[0].id).toBe(employee.id);
    });

    test("respects custom page and pageSize", async () => {
      const { store } = await createTestDataChain();
      // Create 15 employees
      for (let i = 0; i < 15; i++) {
        await createTestEmployee(store.id, {
          name: `Employee ${i.toString().padStart(2, "0")}`,
        });
      }

      const response = await app.request("/rpc/employees?page=2&pageSize=5", {
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
      const { store } = await createTestDataChain();
      await createTestEmployee(store.id, { name: "John Smith" });
      await createTestEmployee(store.id, { name: "John Doe" });
      await createTestEmployee(store.id, { name: "Jane Smith" });

      const response = await app.request("/rpc/employees?name=john", {
        method: "GET",
      });

      expect(response.status).toBe(200);
      const data = await response.json();

      expect(data.data).toHaveLength(2);
      expect(
        data.data.every((e: { name: string }) =>
          e.name.toLowerCase().includes("john"),
        ),
      ).toBe(true);
    });

    test("filters by email (ilike)", async () => {
      const { store } = await createTestDataChain();
      await createTestEmployee(store.id, { email: "john@acme.com" });
      await createTestEmployee(store.id, { email: "jane@acme.com" });
      await createTestEmployee(store.id, { email: "bob@other.com" });

      const response = await app.request("/rpc/employees?email=acme", {
        method: "GET",
      });

      expect(response.status).toBe(200);
      const data = await response.json();

      expect(data.data).toHaveLength(2);
      expect(
        data.data.every((e: { email: string }) => e.email.includes("acme")),
      ).toBe(true);
    });

    test("filters by role (exact match STAFF)", async () => {
      const { store } = await createTestDataChain();
      await createTestEmployee(store.id, { role: "STAFF" });
      await createTestEmployee(store.id, { role: "MANAGER" });
      await createTestEmployee(store.id, { role: "ADMIN" });

      const response = await app.request("/rpc/employees?role=STAFF", {
        method: "GET",
      });

      expect(response.status).toBe(200);
      const data = await response.json();

      expect(data.data).toHaveLength(1);
      expect(data.data[0].role).toBe("STAFF");
    });

    test("filters by role (exact match MANAGER)", async () => {
      const { store } = await createTestDataChain();
      await createTestEmployee(store.id, { role: "STAFF" });
      await createTestEmployee(store.id, { role: "MANAGER" });
      await createTestEmployee(store.id, { role: "MANAGER" });

      const response = await app.request("/rpc/employees?role=MANAGER", {
        method: "GET",
      });

      expect(response.status).toBe(200);
      const data = await response.json();

      expect(data.data).toHaveLength(2);
      expect(
        data.data.every((e: { role: string }) => e.role === "MANAGER"),
      ).toBe(true);
    });

    test("filters by role (exact match ADMIN)", async () => {
      const { store } = await createTestDataChain();
      await createTestEmployee(store.id, { role: "STAFF" });
      await createTestEmployee(store.id, { role: "ADMIN" });

      const response = await app.request("/rpc/employees?role=ADMIN", {
        method: "GET",
      });

      expect(response.status).toBe(200);
      const data = await response.json();

      expect(data.data).toHaveLength(1);
      expect(data.data[0].role).toBe("ADMIN");
    });

    test("filters by status (ACTIVE)", async () => {
      const { store } = await createTestDataChain();
      await createTestEmployee(store.id, { status: "ACTIVE" });
      await createTestEmployee(store.id, { status: "ACTIVE" });
      await createTestEmployee(store.id, { status: "SUSPENDED" });

      const response = await app.request("/rpc/employees?status=ACTIVE", {
        method: "GET",
      });

      expect(response.status).toBe(200);
      const data = await response.json();

      expect(data.data).toHaveLength(2);
      expect(
        data.data.every((e: { status: string }) => e.status === "ACTIVE"),
      ).toBe(true);
    });

    test("filters by status (SUSPENDED)", async () => {
      const { store } = await createTestDataChain();
      await createTestEmployee(store.id, { status: "ACTIVE" });
      await createTestEmployee(store.id, { status: "SUSPENDED" });

      const response = await app.request("/rpc/employees?status=SUSPENDED", {
        method: "GET",
      });

      expect(response.status).toBe(200);
      const data = await response.json();

      expect(data.data).toHaveLength(1);
      expect(data.data[0].status).toBe("SUSPENDED");
    });

    test("filters by storeId", async () => {
      const brand = await createTestBrand();
      const store1 = await createTestStore(brand.id);
      const store2 = await createTestStore(brand.id);

      await createTestEmployee(store1.id);
      await createTestEmployee(store1.id);
      await createTestEmployee(store2.id);

      const response = await app.request(
        `/rpc/employees?storeId=${store1.id}`,
        { method: "GET" },
      );

      expect(response.status).toBe(200);
      const data = await response.json();

      expect(data.data).toHaveLength(2);
      expect(
        data.data.every((e: { storeId: string }) => e.storeId === store1.id),
      ).toBe(true);
    });

    test("filters by multiple fields combined", async () => {
      const { store } = await createTestDataChain();
      await createTestEmployee(store.id, { role: "STAFF", status: "ACTIVE" });
      await createTestEmployee(store.id, {
        role: "STAFF",
        status: "SUSPENDED",
      });
      await createTestEmployee(store.id, { role: "MANAGER", status: "ACTIVE" });

      const response = await app.request(
        "/rpc/employees?role=STAFF&status=ACTIVE",
        { method: "GET" },
      );

      expect(response.status).toBe(200);
      const data = await response.json();

      expect(data.data).toHaveLength(1);
      expect(data.data[0].role).toBe("STAFF");
      expect(data.data[0].status).toBe("ACTIVE");
    });

    test("sorts by name ascending (default)", async () => {
      const { store } = await createTestDataChain();
      await createTestEmployee(store.id, { name: "Zoe" });
      await createTestEmployee(store.id, { name: "Alice" });
      await createTestEmployee(store.id, { name: "Bob" });

      const response = await app.request(
        "/rpc/employees?sortBy=name&sortOrder=asc",
        { method: "GET" },
      );

      expect(response.status).toBe(200);
      const data = await response.json();

      expect(data.data[0].name).toBe("Alice");
      expect(data.data[1].name).toBe("Bob");
      expect(data.data[2].name).toBe("Zoe");
    });

    test("sorts by name descending", async () => {
      const { store } = await createTestDataChain();
      await createTestEmployee(store.id, { name: "Alice" });
      await createTestEmployee(store.id, { name: "Zoe" });
      await createTestEmployee(store.id, { name: "Bob" });

      const response = await app.request(
        "/rpc/employees?sortBy=name&sortOrder=desc",
        { method: "GET" },
      );

      expect(response.status).toBe(200);
      const data = await response.json();

      expect(data.data[0].name).toBe("Zoe");
      expect(data.data[1].name).toBe("Bob");
      expect(data.data[2].name).toBe("Alice");
    });

    test("sorts by email", async () => {
      const { store } = await createTestDataChain();
      await createTestEmployee(store.id, { email: "zoe@test.com" });
      await createTestEmployee(store.id, { email: "alice@test.com" });

      const response = await app.request(
        "/rpc/employees?sortBy=email&sortOrder=asc",
        { method: "GET" },
      );

      expect(response.status).toBe(200);
      const data = await response.json();

      expect(data.data[0].email).toBe("alice@test.com");
      expect(data.data[1].email).toBe("zoe@test.com");
    });

    test("sorts by role", async () => {
      const { store } = await createTestDataChain();
      await createTestEmployee(store.id, { role: "STAFF" });
      await createTestEmployee(store.id, { role: "ADMIN" });
      await createTestEmployee(store.id, { role: "MANAGER" });

      // Get ascending order
      const responseAsc = await app.request(
        "/rpc/employees?sortBy=role&sortOrder=asc",
        { method: "GET" },
      );
      expect(responseAsc.status).toBe(200);
      const dataAsc = await responseAsc.json();

      // Get descending order
      const responseDesc = await app.request(
        "/rpc/employees?sortBy=role&sortOrder=desc",
        { method: "GET" },
      );
      expect(responseDesc.status).toBe(200);
      const dataDesc = await responseDesc.json();

      // Verify sorting is applied (asc and desc should give different first items)
      expect(dataAsc.data).toHaveLength(3);
      expect(dataDesc.data).toHaveLength(3);

      // The first items should be different (opposite ends of the sort)
      const ascRoles = dataAsc.data.map((e: { role: string }) => e.role);
      const descRoles = dataDesc.data.map((e: { role: string }) => e.role);
      expect(ascRoles[0]).toBe(descRoles[2]);
      expect(ascRoles[2]).toBe(descRoles[0]);
    });

    test("sorts by id", async () => {
      const { store } = await createTestDataChain();
      const emp1 = await createTestEmployee(store.id, { name: "First" });
      const emp2 = await createTestEmployee(store.id, { name: "Second" });

      const response = await app.request(
        "/rpc/employees?sortBy=id&sortOrder=asc",
        { method: "GET" },
      );

      expect(response.status).toBe(200);
      const data = await response.json();

      expect(data.data[0].id).toBe(emp1.id);
      expect(data.data[1].id).toBe(emp2.id);
    });
  });

  // ==================== GET BY ID ====================
  describe("GET /rpc/employees/{id} (get)", () => {
    test("returns employee with store relation by valid ID", async () => {
      const { store } = await createTestDataChain();
      const employee = await createTestEmployee(store.id);

      const response = await app.request(`/rpc/employees/${employee.id}`, {
        method: "GET",
      });

      expect(response.status).toBe(200);
      const data = await response.json();

      expect(data.id).toBe(employee.id);
      expect(data.storeId).toBe(store.id);
      expect(data).toHaveProperty("store");
      expect(data.store.id).toBe(store.id);
    });

    test("returns 404 for non-existent ID", async () => {
      const response = await app.request(
        "/rpc/employees/emp_00000000000000000000000000",
        { method: "GET" },
      );

      expect(response.status).toBe(404);
      const data = await response.json();
      expect(data.message).toBe("Employee not found");
    });

    test("returns 400 for invalid ID format", async () => {
      const response = await app.request("/rpc/employees/invalid-id", {
        method: "GET",
      });

      expect(response.status).toBe(400);
    });
  });

  // ==================== CREATE ====================
  describe("POST /rpc/employees (create)", () => {
    test("creates employee with store relation successfully", async () => {
      const { store } = await createTestDataChain();

      const response = await app.request("/rpc/employees", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          storeId: store.id,
          name: "New Employee",
          email: "new.employee@test.com",
          firstName: "New",
          lastName: "Employee",
          role: "STAFF",
          status: "ACTIVE",
        }),
      });

      expect(response.status).toBe(201);
      const data = await response.json();

      expect(data.id).toBeDefined();
      expect(data.id).toMatch(/^emp_/); // TypeID prefix check
      expect(data.name).toBe("New Employee");
      expect(data.email).toBe("new.employee@test.com");
      expect(data.storeId).toBe(store.id);
      expect(data).toHaveProperty("store");
      expect(data.store.id).toBe(store.id);
    });

    test("returns 404 when storeId does not exist", async () => {
      const response = await app.request("/rpc/employees", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          storeId: "store_00000000000000000000000000",
          name: "Test Employee",
          email: "test@test.com",
          firstName: "Test",
          lastName: "Employee",
          role: "STAFF",
          status: "ACTIVE",
        }),
      });

      expect(response.status).toBe(404);
      const data = await response.json();
      expect(data.message).toBe("Store not found");
    });

    test("returns 409 for duplicate email", async () => {
      const { store } = await createTestDataChain();
      await createTestEmployee(store.id, { email: "duplicate@test.com" });

      const response = await app.request("/rpc/employees", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          storeId: store.id,
          name: "Another Employee",
          email: "duplicate@test.com",
          firstName: "Another",
          lastName: "Employee",
          role: "STAFF",
          status: "ACTIVE",
        }),
      });

      expect(response.status).toBe(409);
      const data = await response.json();
      expect(data.message).toBe("Employee with this email already exists");
    });

    test("validates required fields", async () => {
      const response = await app.request("/rpc/employees", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({}),
      });

      expect(response.status).toBe(400);
    });

    test("creates with different roles", async () => {
      const { store } = await createTestDataChain();

      // Create MANAGER
      const managerResponse = await app.request("/rpc/employees", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          storeId: store.id,
          name: "Manager Person",
          email: "manager@test.com",
          firstName: "Manager",
          lastName: "Person",
          role: "MANAGER",
          status: "ACTIVE",
        }),
      });

      expect(managerResponse.status).toBe(201);
      const managerData = await managerResponse.json();
      expect(managerData.role).toBe("MANAGER");

      // Create ADMIN
      const adminResponse = await app.request("/rpc/employees", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          storeId: store.id,
          name: "Admin Person",
          email: "admin@test.com",
          firstName: "Admin",
          lastName: "Person",
          role: "ADMIN",
          status: "ACTIVE",
        }),
      });

      expect(adminResponse.status).toBe(201);
      const adminData = await adminResponse.json();
      expect(adminData.role).toBe("ADMIN");
    });
  });

  // ==================== UPDATE ====================
  describe("PUT /rpc/employees/{id} (update)", () => {
    test("updates employee name successfully", async () => {
      const { store } = await createTestDataChain();
      const employee = await createTestEmployee(store.id, { name: "Old Name" });

      const response = await app.request(`/rpc/employees/${employee.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          data: { name: "New Name" },
        }),
      });

      expect(response.status).toBe(200);
      const data = await response.json();

      expect(data.id).toBe(employee.id);
      expect(data.name).toBe("New Name");
    });

    test("updates employee role successfully", async () => {
      const { store } = await createTestDataChain();
      const employee = await createTestEmployee(store.id, { role: "STAFF" });

      const response = await app.request(`/rpc/employees/${employee.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          data: { role: "MANAGER" },
        }),
      });

      expect(response.status).toBe(200);
      const data = await response.json();

      expect(data.role).toBe("MANAGER");
    });

    test("updates employee status successfully", async () => {
      const { store } = await createTestDataChain();
      const employee = await createTestEmployee(store.id, { status: "ACTIVE" });

      const response = await app.request(`/rpc/employees/${employee.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          data: { status: "SUSPENDED" },
        }),
      });

      expect(response.status).toBe(200);
      const data = await response.json();

      expect(data.status).toBe("SUSPENDED");
    });

    test("updates with partial data (only firstName)", async () => {
      const { store } = await createTestDataChain();
      const employee = await createTestEmployee(store.id, {
        firstName: "Old",
        lastName: "Name",
      });

      const response = await app.request(`/rpc/employees/${employee.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          data: { firstName: "New" },
        }),
      });

      expect(response.status).toBe(200);
      const data = await response.json();

      expect(data.firstName).toBe("New");
      expect(data.lastName).toBe("Name"); // Unchanged
    });

    test("returns 404 for non-existent ID", async () => {
      const response = await app.request(
        "/rpc/employees/emp_00000000000000000000000000",
        {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ data: { name: "New Name" } }),
        },
      );

      expect(response.status).toBe(404);
    });
  });

  // ==================== DELETE ====================
  describe("DELETE /rpc/employees/{id} (delete)", () => {
    test("removes employee successfully", async () => {
      const { store } = await createTestDataChain();
      const employee = await createTestEmployee(store.id);

      const response = await app.request(`/rpc/employees/${employee.id}`, {
        method: "DELETE",
      });

      expect(response.status).toBe(200);
      const data = await response.json();

      expect(data.success).toBe(true);
      expect(data.id).toBe(employee.id);

      // Verify deletion
      const verifyResponse = await app.request(
        `/rpc/employees/${employee.id}`,
        { method: "GET" },
      );
      expect(verifyResponse.status).toBe(404);
    });

    test("returns 404 for non-existent ID", async () => {
      const response = await app.request(
        "/rpc/employees/emp_00000000000000000000000000",
        { method: "DELETE" },
      );

      expect(response.status).toBe(404);
    });
  });
});
