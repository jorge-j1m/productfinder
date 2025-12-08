"use client";

import { useEmployeeSession } from "@repo/employee-auth";

export default function DashboardPage() {
  const { data: session, isPending } = useEmployeeSession();
  const user = session?.user;

  if (isPending) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="animate-pulse text-lg">Loading...</div>
        </div>
      </div>
    );
  }

  if (!session) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <h1 className="text-2xl font-bold">Not Authenticated</h1>
          <p className="text-muted-foreground mt-2">
            Please <a href="/login">login</a> to access the dashboard.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Welcome to the Dashboard</h1>
        <p className="text-muted-foreground mt-2">
          This is a simplified dashboard for testing the auth system.
        </p>
      </div>

      {user && (
        <div className="bg-muted/50 rounded-lg p-6">
          <h2 className="text-xl font-semibold mb-4">User Information</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <div className="text-sm font-medium text-muted-foreground">
                ID
              </div>
              <p className="font-mono text-sm">{user.id}</p>
            </div>
            <div>
              <div className="text-sm font-medium text-muted-foreground">
                Email
              </div>
              <p>{user.email}</p>
            </div>
            <div>
              <div className="text-sm font-medium text-muted-foreground">
                Name
              </div>
              <p>
                {user.firstName} {user.lastName}
              </p>
            </div>
            <div>
              <div className="text-sm font-medium text-muted-foreground">
                Role
              </div>
              <p className="font-semibold">{user.role}</p>
            </div>
            <div>
              <div className="text-sm font-medium text-muted-foreground">
                Store ID
              </div>
              <p className="font-mono text-sm">{user.storeId}</p>
            </div>
            <div>
              <div className="text-sm font-medium text-muted-foreground">
                Session ID
              </div>
              <p className="font-mono text-sm truncate">{session.session.id}</p>
            </div>
          </div>
        </div>
      )}

      <div className="bg-green-50 border border-green-200 rounded-lg p-4">
        <h3 className="text-lg font-semibold text-green-800">
          Auth System Status
        </h3>
        <p className="text-green-700 mt-1">
          Authentication is working correctly! The simplified navbar and layout
          are functional.
        </p>
      </div>
    </div>
  );
}
