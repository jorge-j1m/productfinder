import { createAuthClient } from "better-auth/react";
import { inferAdditionalFields } from "better-auth/client/plugins";
import { EmployeeExtension } from "./types";

export const employeeAuthClient = createAuthClient({
  baseURL: process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000",
  basePath: "/api/employee-auth",

  plugins: [
    inferAdditionalFields({
      user: EmployeeExtension,
    }),
  ],
});

// Re-export hooks for convenience
export const {
  useSession: useEmployeeSession,
  signIn: employeeSignIn,
  signOut: employeeSignOut,
} = employeeAuthClient;
