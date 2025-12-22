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

type EmployeeWithStore = Employee & { store: Store };

interface EmployeeDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  employee?: EmployeeWithStore | null;
  stores: Store[];
  onSubmit: (data: {
    storeId: string;
    name: string;
    firstName: string;
    lastName: string;
    email: string;
    role: "STAFF" | "MANAGER" | "ADMIN";
    status: "ACTIVE" | "SUSPENDED";
  }) => void;
  isPending?: boolean;
}

export function EmployeeDialog({
  open,
  onOpenChange,
  employee,
  stores,
  onSubmit,
  isPending = false,
}: EmployeeDialogProps) {
  const [storeId, setStoreId] = React.useState("");
  const [firstName, setFirstName] = React.useState("");
  const [lastName, setLastName] = React.useState("");
  const [email, setEmail] = React.useState("");
  const [role, setRole] = React.useState<"STAFF" | "MANAGER" | "ADMIN">("STAFF");
  const [status, setStatus] = React.useState<"ACTIVE" | "SUSPENDED">("ACTIVE");
  const [errors, setErrors] = React.useState<Record<string, string>>({});

  // Reset form when dialog opens/closes or employee changes
  React.useEffect(() => {
    if (open) {
      setStoreId(employee?.storeId || "");
      setFirstName(employee?.firstName || "");
      setLastName(employee?.lastName || "");
      setEmail(employee?.email || "");
      setRole(employee?.role || "STAFF");
      setStatus(employee?.status || "ACTIVE");
      setErrors({});
    }
  }, [open, employee]);

  // Auto-generate full name
  const fullName = `${firstName.trim()} ${lastName.trim()}`.trim();

  const validate = () => {
    const newErrors: Record<string, string> = {};

    if (!storeId) newErrors.storeId = "Store is required";
    if (!firstName.trim()) newErrors.firstName = "First name is required";
    if (!lastName.trim()) newErrors.lastName = "Last name is required";
    if (!email.trim()) {
      newErrors.email = "Email is required";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      newErrors.email = "Invalid email format";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (validate()) {
      onSubmit({
        storeId,
        name: fullName,
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        email: email.trim().toLowerCase(),
        role,
        status,
      });
    }
  };

  const isEditMode = !!employee;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {isEditMode ? "Edit Employee" : "Create Employee"}
          </DialogTitle>
          <DialogDescription>
            {isEditMode
              ? "Update the employee details below."
              : "Add a new employee to your team. They will be associated with a specific store."}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="grid gap-4 py-4">
            {/* Store Selection */}
            <div className="grid gap-2">
              <Label htmlFor="storeId">
                Store <span className="text-destructive">*</span>
              </Label>
              <Select
                value={storeId}
                onValueChange={setStoreId}
                disabled={isPending || isEditMode}
              >
                <SelectTrigger id="storeId">
                  <SelectValue placeholder="Select a store" />
                </SelectTrigger>
                <SelectContent position="popper" className="max-h-[300px]">
                  {stores.map((store) => (
                    <SelectItem key={store.id} value={store.id}>
                      <div className="flex flex-col">
                        <span>{store.name}</span>
                        <span className="text-xs text-muted-foreground">
                          {store.city}, {store.state}
                        </span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.storeId && (
                <p className="text-sm text-destructive">{errors.storeId}</p>
              )}
              {isEditMode && (
                <p className="text-xs text-muted-foreground">
                  Store cannot be changed after creation
                </p>
              )}
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

            {/* Email */}
            <div className="grid gap-2">
              <Label htmlFor="email">
                Email <span className="text-destructive">*</span>
              </Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="e.g., john.doe@example.com"
                disabled={isPending || isEditMode}
              />
              {errors.email && (
                <p className="text-sm text-destructive">{errors.email}</p>
              )}
              {isEditMode && (
                <p className="text-xs text-muted-foreground">
                  Email cannot be changed after creation
                </p>
              )}
            </div>

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
              {isPending
                ? isEditMode
                  ? "Updating..."
                  : "Creating..."
                : isEditMode
                  ? "Update"
                  : "Create"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
