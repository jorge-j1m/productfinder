"use client";

import { Loader2, LogOut } from "lucide-react";
import { useState } from "react";
import { Button } from "#/components/ui/button";
import { employeeSignOut } from "@repo/employee-auth";
import { useRouter } from "next/navigation";

interface LogoutButtonProps {
  variant?:
    | "default"
    | "destructive"
    | "outline"
    | "secondary"
    | "ghost"
    | "link";
  size?: "default" | "sm" | "lg" | "icon";
  className?: string;
  showIcon?: boolean;
  children?: React.ReactNode;
}

export function LogoutButton({
  variant = "outline",
  size = "sm",
  className,
  showIcon = true,
  children,
}: LogoutButtonProps) {
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();
  const handleLogout = async () => {
    setIsLoading(true);

    try {
      await employeeSignOut();
      router.push("/login");
    } catch (error) {
      console.error("Logout failed:", error);
      setIsLoading(false);
    }
  };

  return (
    <Button
      variant={variant}
      size={size}
      className={className}
      onClick={handleLogout}
      disabled={isLoading}
    >
      {isLoading ? (
        <Loader2 className="h-4 w-4 animate-spin" />
      ) : showIcon ? (
        <LogOut className="h-4 w-4" />
      ) : null}
      {children || "Logout"}
    </Button>
  );
}
