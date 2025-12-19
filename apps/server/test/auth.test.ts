import { describe, test, expect } from "bun:test";
import { auth } from "../src/lib/employee_auth";

describe("Auth Instance", () => {
  test("should instantiate without errors", () => {
    // Verify the auth instance is created successfully
    expect(auth).toBeDefined();
    expect(auth).toHaveProperty("handler");
    expect(auth).toHaveProperty("api");
  });

  test("should have required API methods", () => {
    // Verify core auth methods exist
    expect(auth.api).toHaveProperty("signInEmail");
    expect(auth.api).toHaveProperty("signUpEmail");
    expect(auth.api).toHaveProperty("signOut");
    expect(auth.api).toHaveProperty("getSession");
  });

  test("should use correct configuration", () => {
    // Verify the configuration is properly applied
    expect(auth.options).toBeDefined();
    expect(auth.options.emailAndPassword).toBeDefined();
    expect(auth.options.emailAndPassword?.enabled).toBe(true);
  });
});
