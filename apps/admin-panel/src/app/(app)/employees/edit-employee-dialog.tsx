"use client";

import * as React from "react";
import type { Employee, Store } from "@repo/database/types";
import { Button } from "#/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "#/components/ui/dialog";
import { Input } from "#/components/ui/input";
import { Label } from "#/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "#/components/ui/select";
import { Badge } from "#/components/ui/badge";
import { Mail } from "lucide-react";

type EmployeeWithStore = Employee & { store: Store };

export interface UpdateEmployeeData {
  name: string;
  firstName: string;
  lastName: string;
  role: "STAFF" | "MANAGER" | "ADMIN";
  status: "ACTIVE" | "SUSPENDED";
}

interface EditEmployeeDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  employee: EmployeeWithStore;
  onSubmit: (data: UpdateEmployeeData) => void;
  onSendPasswordReset: (email: string) => void;
  isPending?: boolean;
  isResettingPassword?: boolean;
}

export function EditEmployeeDialog({
  open,
  onOpenChange,
  employee,
  onSubmit,
  onSendPasswordReset,
  isPending = false,
  isResettingPassword = false,
}: EditEmployeeDialogProps) {
  const [firstName, setFirstName] = React.useState("");
  const [lastName, setLastName] = React.useState("");
  const [role, setRole] = React.useState<"STAFF" | "MANAGER" | "ADMIN">("STAFF");
  const [status, setStatus] = React.useState<"ACTIVE" | "SUSPENDED">("ACTIVE");
  const [errors, setErrors] = React.useState<Record<string, string>>({});

  // Initialize form with employee data when dialog opens
  React.useEffect(() => {
    if (open && employee) {
      setFirstName(employee.firstName);
      setLastName(employee.lastName);
      setRole(employee.role);
      setStatus(employee.status);
      setErrors({});
    }
  }, [open, employee]);

  const fullName = `${firstName.trim()} ${lastName.trim()}`.trim();

  const validate = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!firstName.trim()) newErrors.firstName = "First name is required";
    if (!lastName.trim()) newErrors.lastName = "Last name is required";

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!validate()) return;

    onSubmit({
      name: fullName,
      firstName: firstName.trim(),
      lastName: lastName.trim(),
      role,
      status,
    });
  };

  const handlePasswordReset = () => {
    onSendPasswordReset(employee.email);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Edit Employee</DialogTitle>
          <DialogDescription>
            Update employee information. Email and store assignment cannot be changed for security and data integrity reasons.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="grid gap-4 py-4">
            {/* Store (Read-only) */}
            <div className="grid gap-2">
              <Label>Store</Label>
              <div className="rounded-md border bg-muted px-3 py-2">
                <p className="font-medium">{employee.store.name}</p>
                <p className="text-sm text-muted-foreground">
                  {employee.store.city}, {employee.store.state}
                </p>
              </div>
              <p className="text-xs text-muted-foreground">
                Store assignment cannot be changed after creation
              </p>
            </div>

            {/* Email (Read-only) */}
            <div className="grid gap-2">
              <Label>Email</Label>
              <div className="rounded-md border bg-muted px-3 py-2">
                <p className="font-medium">{employee.email}</p>
              </div>
              <p className="text-xs text-muted-foreground">
                Email cannot be changed after creation
              </p>
            </div>

            {/* First Name */}
            <div className="grid gap-2">
              <Label htmlFor="firstName">
                First Name <span className="text-destructive">*</span>
              </Label>
              <Input
                id="firstName"
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                placeholder="e.g., John"
                disabled={isPending}
                autoComplete="given-name"
              />
              {errors.firstName && (
                <p className="text-sm text-destructive">{errors.firstName}</p>
              )}
            </div>

            {/* Last Name */}
            <div className="grid gap-2">
              <Label htmlFor="lastName">
                Last Name <span className="text-destructive">*</span>
              </Label>
              <Input
                id="lastName"
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                placeholder="e.g., Doe"
                disabled={isPending}
                autoComplete="family-name"
              />
              {errors.lastName && (
                <p className="text-sm text-destructive">{errors.lastName}</p>
              )}
            </div>

            {/* Full Name Preview */}
            {fullName && (
              <div className="rounded-md bg-muted px-3 py-2">
                <p className="text-sm text-muted-foreground">Full name:</p>
                <p className="font-medium">{fullName}</p>
              </div>
            )}

            {/* Role */}
            <div className="grid gap-2">
              <Label htmlFor="role">
                Role <span className="text-destructive">*</span>
              </Label>
              <Select
                value={role}
                onValueChange={(value) =>
                  setRole(value as "STAFF" | "MANAGER" | "ADMIN")
                }
                disabled={isPending}
              >
                <SelectTrigger id="role">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="STAFF">
                    <div className="flex items-center gap-2">
                      <Badge variant="outline">STAFF</Badge>
                      <span className="text-sm text-muted-foreground">
                        Standard access
                      </span>
                    </div>
                  </SelectItem>
                  <SelectItem value="MANAGER">
                    <div className="flex items-center gap-2">
                      <Badge variant="secondary">MANAGER</Badge>
                      <span className="text-sm text-muted-foreground">
                        Elevated access
                      </span>
                    </div>
                  </SelectItem>
                  <SelectItem value="ADMIN">
                    <div className="flex items-center gap-2">
                      <Badge variant="default">ADMIN</Badge>
                      <span className="text-sm text-muted-foreground">
                        Full access
                      </span>
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Status */}
            <div className="grid gap-2">
              <Label htmlFor="status">
                Status <span className="text-destructive">*</span>
              </Label>
              <Select
                value={status}
                onValueChange={(value) =>
                  setStatus(value as "ACTIVE" | "SUSPENDED")
                }
                disabled={isPending}
              >
                <SelectTrigger id="status">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ACTIVE">
                    <div className="flex items-center gap-2">
                      <div className="h-2 w-2 rounded-full bg-green-500" />
                      Active
                    </div>
                  </SelectItem>
                  <SelectItem value="SUSPENDED">
                    <div className="flex items-center gap-2">
                      <div className="h-2 w-2 rounded-full bg-red-500" />
                      Suspended
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Password Reset Section */}
            <div className="rounded-md border border-amber-200 bg-amber-50 dark:border-amber-900 dark:bg-amber-950 p-4">
              <div className="flex items-start gap-3">
                <Mail className="h-5 w-5 text-amber-600 dark:text-amber-400 mt-0.5" />
                <div className="flex-1 space-y-2">
                  <p className="text-sm font-medium text-amber-900 dark:text-amber-100">
                    Password Management
                  </p>
                  <p className="text-sm text-amber-700 dark:text-amber-300">
                    Send a password reset email to allow the employee to set a new password securely.
                  </p>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={handlePasswordReset}
                    disabled={isPending || isResettingPassword}
                    className="mt-2"
                  >
                    {isResettingPassword
                      ? "Sending..."
                      : "Send Password Reset Email"}
                  </Button>
                </div>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isPending}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isPending}>
              {isPending ? "Updating..." : "Update Employee"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
