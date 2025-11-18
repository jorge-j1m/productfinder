import { describe, test, expect, beforeAll } from "bun:test";
import { createApp } from "../src/app";
import { testDb } from "./setup";
import { storeBrands, stores } from "@repo/database/schema";
import type { NewEmployee, NewStore, NewStoreBrand } from "@repo/database";

describe("Auth Flow", () => {
  let app: ReturnType<typeof createApp>;

  beforeAll(() => {
    app = createApp(testDb);
  });

  // Helper to create test store and brand for each test
  async function createTestStore() {
    const newBrand: NewStoreBrand = {
      name: `Test Brand ${Date.now()}`,
      logo: "https://example.com/logo.png",
    };

    const [brand] = await testDb
      .insert(storeBrands)
      .values(newBrand)
      .returning();

    if (!brand) {
      throw new Error("Failed to create test brand");
    }

    const newStore: NewStore = {
      brandId: brand.id,
      name: `Test Store ${Date.now()}`,
      address: "123 Test St",
      city: "Test City",
      state: "TS",
      zip: "12345",
      countryCode: "US",
      latitude: 40.7128,
      longitude: -74.006,
    };

    const [store] = await testDb.insert(stores).values(newStore).returning();

    if (!store) {
      throw new Error("Failed to create test store");
    }

    return { storeId: store.id, brandId: brand.id };
  }

  test("should sign up a new employee", async () => {
    const { storeId } = await createTestStore();

    const newEmployee: NewEmployee & { password: string } = {
      email: "john.doe@test.com",
      password: "SecurePass123!",
      name: "John Doe",
      firstName: "John",
      lastName: "Doe",
      role: "STAFF",
      storeId,
      status: "ACTIVE",
    };

    const response = await app.request("/api/employee-auth/sign-up/email", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(newEmployee),
    });

    expect(response.status).toBe(200);
    const data = await response.json();

    expect(data.user).toBeDefined();
    expect(data.user.email).toBe("john.doe@test.com");
    expect(data.user.name).toBe("John Doe");

    // Should return a session token
    expect(data.token).toBeDefined();

    // Verify the employee was created in the database with custom fields
    const employee = await testDb.query.employees.findFirst({
      where: (employees, { eq }) => eq(employees.email, "john.doe@test.com"),
    });

    expect(employee).toBeDefined();
    if (!employee) {
      throw new Error("Employee not found");
    }
    expect(employee.firstName).toBe("John");
    expect(employee.lastName).toBe("Doe");
    expect(employee.role).toBe("STAFF");
    expect(employee.storeId).toBe(storeId);
    expect(employee.status).toBe("ACTIVE");
  });

  test("should sign in an existing employee", async () => {
    const { storeId } = await createTestStore();

    const newEmployee: NewEmployee & { password: string } = {
      email: "jane.doe@test.com",
      password: "SecurePass123!",
      name: "Jane Doe",
      firstName: "Jane",
      lastName: "Doe",
      role: "MANAGER",
      storeId,
      status: "ACTIVE",
    };

    // First, sign up
    await app.request("/api/employee-auth/sign-up/email", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(newEmployee),
    });

    // Then, sign in
    const response = await app.request("/api/employee-auth/sign-in/email", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        email: "jane.doe@test.com",
        password: "SecurePass123!",
      }),
    });

    expect(response.status).toBe(200);
    const data = await response.json();

    expect(data.user).toBeDefined();
    expect(data.user.email).toBe("jane.doe@test.com");
    expect(data.user.name).toBe("Jane Doe");

    expect(data.token).toBeDefined();
  });

  test("should reject sign-in with wrong password", async () => {
    const { storeId } = await createTestStore();

    const newEmployee: NewEmployee & { password: string } = {
      email: "bob@test.com",
      password: "CorrectPass123!",
      name: "Bob Smith",
      firstName: "Bob",
      lastName: "Smith",
      role: "STAFF",
      storeId,
      status: "ACTIVE",
    };

    // First, sign up
    await app.request("/api/employee-auth/sign-up/email", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(newEmployee),
    });

    // Try to sign in with wrong password
    const response = await app.request("/api/employee-auth/sign-in/email", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        email: "bob@test.com",
        password: "WrongPassword!",
      }),
    });

    expect(response.status).toBe(401);
    const data = await response.json();
    expect(data.code).toBe("INVALID_EMAIL_OR_PASSWORD");
  });

  test("should get session with valid session token", async () => {
    const { storeId } = await createTestStore();

    const newEmployee: NewEmployee & { password: string } = {
      email: "alice@test.com",
      password: "SecurePass123!",
      name: "Alice Johnson",
      firstName: "Alice",
      lastName: "Johnson",
      role: "ADMIN",
      storeId,
      status: "ACTIVE",
    };

    // Sign up and get session token
    const signUpResponse = await app.request(
      "/api/employee-auth/sign-up/email",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(newEmployee),
      }
    );

    const signUpData = await signUpResponse.json();
    const sessionToken = signUpData.token;

    // Extract session cookie from sign-up response
    const setCookie = signUpResponse.headers.get("set-cookie");

    // Get session using token
    const sessionResponse = await app.request(
      "/api/employee-auth/get-session",
      {
        method: "GET",
        headers: {
          Cookie: setCookie || `better-auth.session_token=${sessionToken}`,
        },
      }
    );

    expect(sessionResponse.status).toBe(200);
    const sessionData = await sessionResponse.json();

    expect(sessionData.user).toBeDefined();
    expect(sessionData.user.email).toBe("alice@test.com");
    expect(sessionData.user.firstName).toBe("Alice");
    expect(sessionData.user.lastName).toBe("Johnson");
    expect(sessionData.user.role).toBe("ADMIN");
    expect(sessionData.session).toBeDefined();
  });

  test("should sign out and invalidate session", async () => {
    const { storeId } = await createTestStore();

    const newEmployee: NewEmployee & { password: string } = {
      email: "charlie@test.com",
      password: "SecurePass123!",
      name: "Charlie Brown",
      firstName: "Charlie",
      lastName: "Brown",
      role: "STAFF",
      storeId,
      status: "ACTIVE",
    };

    // Sign up
    const signUpResponse = await app.request(
      "/api/employee-auth/sign-up/email",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(newEmployee),
      }
    );

    await signUpResponse.json();
    const setCookie = signUpResponse.headers.get("set-cookie");

    // Sign out
    const signOutResponse = await app.request("/api/employee-auth/sign-out", {
      method: "POST",
      headers: {
        Cookie: setCookie || "",
      },
    });

    expect(signOutResponse.status).toBe(200);

    // Try to get session with invalidated token
    const sessionResponse = await app.request(
      "/api/employee-auth/get-session",
      {
        method: "GET",
        headers: {
          Cookie: setCookie || "",
        },
      }
    );

    expect(sessionResponse.status).toBe(200);
    const sessionData = await sessionResponse.json();
    expect(sessionData).toBeNull();
  });

  test("should prevent duplicate email sign-up", async () => {
    const { storeId } = await createTestStore();

    const employeeData: NewEmployee & { password: string } = {
      email: "duplicate@test.com",
      password: "SecurePass123!",
      name: "Duplicate User",
      firstName: "Duplicate",
      lastName: "User",
      role: "STAFF",
      storeId,
      status: "ACTIVE",
    };

    // First sign-up should succeed
    const firstResponse = await app.request(
      "/api/employee-auth/sign-up/email",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(employeeData),
      }
    );

    expect(firstResponse.status).toBe(200);

    // Second sign-up with same email should fail
    const secondResponse = await app.request(
      "/api/employee-auth/sign-up/email",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(employeeData),
      }
    );

    expect(secondResponse.status).toBe(422);
    const data = await secondResponse.json();
    expect(data.message).toBeDefined();
  });
});
