"use client";

import { Store, User } from "lucide-react";
import { useEmployeeSession } from "@repo/employee-auth";
import Link from "next/link";
import { LogoutButton } from "#/components/auth/logout-button";
import { Badge } from "#/components/ui/badge";
import { SidebarTrigger } from "#/components/ui/sidebar";

export function Navbar() {
  const { data: session, isPending } = useEmployeeSession();

  const user = session?.user;

  if (isPending) {
    return <div>Loading...</div>;
  }

  return (
    <header className="h-16 border-b flex items-center px-6 shrink-0">
      <div className="flex items-center gap-3 flex-1">
        <SidebarTrigger />
        <Link href="/dashboard" className="flex items-center gap-2">
          <div className="h-8 w-8 rounded-md bg-primary flex items-center justify-center">
            <Store className="h-4 w-4 text-primary-foreground" />
          </div>
          <span className="text-lg font-semibold">RetailAdmin</span>
        </Link>
      </div>

      <div className="flex items-center gap-2">
        {/* <Button
          variant="ghost"
          size="sm"
          onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
        >
          {mounted ? (
            theme === "dark" ? (
              <Sun className="h-4 w-4" />
            ) : (
              <Moon className="h-4 w-4" />
            )
          ) : (
            <Sun className="h-4 w-4" />
          )}
        </Button> */}

        {user && (
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2">
              <div className="h-8 w-8 rounded-full bg-muted flex items-center justify-center">
                <User className="h-4 w-4" />
              </div>
              <div className="hidden sm:block">
                <div className="text-sm font-medium">
                  {user.firstName} {user.lastName}
                </div>
                <Badge variant="secondary" className="text-xs">
                  {user.role.toUpperCase()}
                </Badge>
              </div>
            </div>
            <LogoutButton variant="outline" size="sm" showIcon={true} />
          </div>
        )}
      </div>
    </header>
  );
}
