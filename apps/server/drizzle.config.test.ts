import { defineConfig } from "drizzle-kit";

export default defineConfig({
  dialect: "postgresql",
  schema: "./src/db/schema.ts",
  dbCredentials: {
    url:
      process.env.TEST_DATABASE_URL ||
      "postgres://localhost:5432/productfinder_test",
  },
});
