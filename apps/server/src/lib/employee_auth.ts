import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { db } from "../db";
import { employeeAuthConfig } from "@repo/database";
import type { DB } from "@repo/database";

/**
 * Creates a better-auth instance with the given database.
 * This allows us to inject different database connections for testing.
 */
export function createAuth(database: DB) {
  return betterAuth({
    // Spread the shared employee auth configuration
    // This includes: custom table names, employee fields, and ID generation
    ...employeeAuthConfig,

    // Solving prod problems
    advanced: {
      ...employeeAuthConfig.advanced,
      crossSubDomainCookies: {
        enabled: process.env.NODE_ENV === "production",
        domain: ".jorgejim.com",
      },
      cookiePrefix: "better-auth",
    },

    // Database adapter using Drizzle ORM with PostgreSQL
    database: drizzleAdapter(database, {
      provider: "pg",
    }),

    trustedOrigins: ["http://localhost:3000", process.env.ADMIN_CLIENT_URL || "http://localhost:3000"],

    // Base URL for the auth server
    // Used for generating callback URLs and handling redirects
    baseURL: process.env.ADMIN_CLIENT_URL || "http://localhost:3000",

    // Base path for auth endpoints
    // All auth routes will be prefixed with this path
    basePath: "/api/employee-auth",

    // Secret key for encryption and signing
    // MUST be set in production via environment variable
    secret: process.env.BETTER_AUTH_SECRET,
  });
}

// Production auth instance using the production database
export const auth = createAuth(db);
