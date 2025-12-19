import { typeid } from "typeid-js";
import { EmployeeExtension } from "./auth_types";

/**
 * Better-auth configuration for employee authentication
 * This configuration is used to set up authentication for employees
 */
export const employeeAuthConfig = {
  telemetry: { enabled: false },
  advanced: {
    database: {
      generateId: ({ model }: { model: string }) => {
        // This runs before the model name is modified, so we need to use the original name
        const prefixMap: Record<string, string> = {
          user: "emp",
          session: "esess",
          account: "eacc",
          verification: "evfn",
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
};

// Uncomment below if you need to run npm run employee-auth

// export const auth: Auth = betterAuth({
//   ...employeeAuthConfig,
//   database: drizzleAdapter(_localDb, {
//     provider: "pg",
//   }),
// });
