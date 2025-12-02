"use client";

import { useEmployeeSession } from "@repo/employee-auth";
import { useRouter } from "next/navigation";
import { LogoutButton } from "./logout-button";

export function AuthStatus() {
  const { data: session, isPending } = useEmployeeSession();
  const router = useRouter();

  if (isPending) {
    return <div className="text-gray-600">Loading...</div>;
  }

  if (!session) {
    return (
      <div className="flex gap-4 items-center">
        <span className="text-gray-600">Not signed in</span>
        <button
          onClick={() => router.push("/login")}
          className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
        >
          Sign In
        </button>
      </div>
    );
  }

  // Type-safe access to enum fields
  const roleDisplay =
    session.user.role === "ADMIN"
      ? "Administrator"
      : session.user.role === "MANAGER"
        ? "Manager"
        : "Staff";

  return (
    <div className="flex gap-4 items-center">
      <div className="text-sm">
        <div className="font-medium">{session.user.name}</div>
        <div className="text-gray-600">{session.user.email}</div>
        <div className="text-xs text-gray-500">{roleDisplay}</div>
      </div>
      <LogoutButton />
    </div>
  );
}
