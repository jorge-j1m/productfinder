import { createAuthClient } from "better-auth/react";
import { inferAdditionalFields } from "better-auth/client/plugins";
import { EmployeeExtension, type Employee } from "./types";

export const employeeAuthClient = createAuthClient({
  baseURL: process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080",
  basePath: "/api/employee-auth",

  plugins: [
    inferAdditionalFields<{
      user: {
        firstName: { type: "string"; required: true };
        lastName: { type: "string"; required: true };
        role: { type: "string"; required: true };
        storeId: { type: "string"; required: true };
        status: { type: "string"; required: true };
      };
    }>({
      user: EmployeeExtension,
    }),
  ],
});

// Re-export hooks for convenience
export const { signIn: employeeSignIn, signOut: employeeSignOut } =
  employeeAuthClient;

// Export properly typed session
type BaseSession = typeof employeeAuthClient.$Infer.Session;

export type EmployeeAuthSession = Omit<BaseSession, "user"> & {
  user: Employee;
  session: BaseSession["session"];
};

// Create properly typed useSession hook
export function useEmployeeSession() {
  const result = employeeAuthClient.useSession();
  return result as Omit<typeof result, "data"> & {
    data: EmployeeAuthSession | null;
  };
}
