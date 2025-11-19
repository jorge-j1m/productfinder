"use client";

import { useEmployeeSession, employeeSignOut } from "@repo/employee-auth";
import { useRouter } from "next/navigation";

export function AuthStatus() {
  const { data: session, isPending } = useEmployeeSession();
  const router = useRouter();

  const handleSignOut = async () => {
    await employeeSignOut();
    router.push("/login");
  };

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

  return (
    <div className="flex gap-4 items-center">
      <div className="text-sm">
        <div className="font-medium">{session.user.name}</div>
        <div className="text-gray-600">{session.user.email}</div>
      </div>
      <button
        onClick={handleSignOut}
        className="px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-50"
      >
        Sign Out
      </button>
    </div>
  );
}
