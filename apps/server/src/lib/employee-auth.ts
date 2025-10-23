import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { db } from "../db";
import { typeid } from "typeid-js";
import { EmployeeExtension } from "@repo/employee-auth/types";

export const auth = betterAuth({
  database: drizzleAdapter(db, {
    provider: "pg",
  }),

  telemetry: { enabled: false },

  advanced: {
    database: {
      generateId: ({ model }) => {
        const prefixMap: Record<string, string> = {
          employees: "emp",
          employee_sessions: "esess",
          employee_accounts: "eacc",
          employee_verifications: "ever",
        };
        const prefix = prefixMap[model] || "id";
        return typeid(prefix).toString();
      },
    },
  },

  emailAndPassword: {
    enabled: true,
  },

  // Custom table names
  user: {
    modelName: "employees",
    additionalFields: EmployeeExtension,
  },

  session: {
    modelName: "employee_sessions",
  },

  account: {
    modelName: "employee_accounts",
  },

  verification: {
    modelName: "employee_verifications",
  },
});

export type Employee = typeof auth.$Infer.Session.user;
