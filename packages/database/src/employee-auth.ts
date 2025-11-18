import { typeid } from "typeid-js";
import { EmployeeExtension } from "@repo/employee-auth/types";

export const employeeAuthConfig = {
  telemetry: { enabled: false },
  advanced: {
    database: {
      generateId: ({ model }: { model: string }) => {
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
};

// Uncomment below if you need to run npm run employee-auth

// export const auth: Auth = betterAuth({
//   ...employeeAuthConfig,
//   database: drizzleAdapter(_localDb, {
//     provider: "pg",
//   }),
// });
