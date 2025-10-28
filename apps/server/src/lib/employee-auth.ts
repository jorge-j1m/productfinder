import { betterAuth, type Auth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { db } from "../db";
import { employeeAuthConfig } from "@repo/database";

export const auth: Auth = betterAuth({
  ...employeeAuthConfig,
  database: drizzleAdapter(db, {
    provider: "pg",
  }),
});
