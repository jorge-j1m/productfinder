import { describe, test, expect, beforeAll } from "bun:test";
import { createApp } from "../src/app";
import { testDb } from "./setup";

describe("Auth Endpoints", () => {
  let app: ReturnType<typeof createApp>;

  beforeAll(() => {
    app = createApp(testDb);
  });

  test("should mount auth endpoints at /api/employee-auth", async () => {
    // Test that the auth endpoint exists and responds
    const response = await app.request("/api/employee-auth/get-session", {
      method: "GET",
    });

    // Should respond (not 404), even if session is null
    expect(response.status).not.toBe(404);
  });

  test("should handle GET requests to auth endpoints", async () => {
    const response = await app.request("/api/employee-auth/get-session", {
      method: "GET",
    });

    expect(response.status).toBe(200);
    const data = await response.json();
    
    // Better auth returns null when not authenticated
    expect(data).toBeNull();
  });

  test("should handle POST requests to auth endpoints", async () => {
    // Test sign-in endpoint exists (will fail with validation error, but that's expected)
    const response = await app.request("/api/employee-auth/sign-in/email", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        email: "test@example.com",
        password: "test123",
      }),
    });

    // Should not be 404 - endpoint exists
    expect(response.status).not.toBe(404);
  });

  test("should return CORS headers for auth endpoints", async () => {
    const response = await app.request("/api/employee-auth/get-session", {
      method: "GET",
      headers: {
        Origin: "http://localhost:3000",
      },
    });

    // Check CORS headers are present
    const corsHeader = response.headers.get("Access-Control-Allow-Origin");
    expect(corsHeader).toBeTruthy();
  });
});
