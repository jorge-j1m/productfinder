"use client";

import * as React from "react";
import type { Store } from "@repo/database/types";
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
import { Eye, EyeOff } from "lucide-react";

export interface CreateEmployeeData {
  storeId: string;
  name: string;
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  role: "STAFF" | "MANAGER" | "ADMIN";
  status: "ACTIVE" | "SUSPENDED";
}

interface CreateEmployeeDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  stores: Store[];
  onSubmit: (data: CreateEmployeeData) => void;
  isPending?: boolean;
}

export function CreateEmployeeDialog({
  open,
  onOpenChange,
  stores,
  onSubmit,
  isPending = false,
}: CreateEmployeeDialogProps) {
  const [storeId, setStoreId] = React.useState("");
  const [firstName, setFirstName] = React.useState("");
  const [lastName, setLastName] = React.useState("");
  const [email, setEmail] = React.useState("");
  const [password, setPassword] = React.useState("");
  const [confirmPassword, setConfirmPassword] = React.useState("");
  const [showPassword, setShowPassword] = React.useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = React.useState(false);
  const [role, setRole] = React.useState<"STAFF" | "MANAGER" | "ADMIN">("STAFF");
  const [status, setStatus] = React.useState<"ACTIVE" | "SUSPENDED">("ACTIVE");
  const [errors, setErrors] = React.useState<Record<string, string>>({});

  // Reset form when dialog opens/closes
  React.useEffect(() => {
    if (open) {
      setStoreId("");
      setFirstName("");
      setLastName("");
      setEmail("");
      setPassword("");
      setConfirmPassword("");
      setShowPassword(false);
      setShowConfirmPassword(false);
      setRole("STAFF");
      setStatus("ACTIVE");
      setErrors({});
    }
  }, [open]);

  const fullName = `${firstName.trim()} ${lastName.trim()}`.trim();

  const validate = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!storeId) newErrors.storeId = "Store is required";
    if (!firstName.trim()) newErrors.firstName = "First name is required";
    if (!lastName.trim()) newErrors.lastName = "Last name is required";

    if (!email.trim()) {
      newErrors.email = "Email is required";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      newErrors.email = "Invalid email format";
    }

    if (!password) {
      newErrors.password = "Password is required";
    } else if (password.length < 8) {
      newErrors.password = "Password must be at least 8 characters";
    } else if (password.length > 128) {
      newErrors.password = "Password must be less than 128 characters";
    }

    if (password !== confirmPassword) {
      newErrors.confirmPassword = "Passwords do not match";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!validate()) return;

    onSubmit({
      storeId,
      name: fullName,
      firstName: firstName.trim(),
      lastName: lastName.trim(),
      email: email.trim().toLowerCase(),
      password,
      role,
      status,
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[550px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Create New Employee</DialogTitle>
          <DialogDescription>
            Add a new employee to your team. They will receive login credentials and be able to access the system immediately.
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
                disabled={isPending}
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
                disabled={isPending}
                autoComplete="email"
              />
              {errors.email && (
                <p className="text-sm text-destructive">{errors.email}</p>
              )}
            </div>

            {/* Password */}
            <div className="grid gap-2">
              <Label htmlFor="password">
                Password <span className="text-destructive">*</span>
              </Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Minimum 8 characters"
                  disabled={isPending}
                  autoComplete="new-password"
                  className="pr-10"
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                  onClick={() => setShowPassword(!showPassword)}
                  disabled={isPending}
                >
                  {showPassword ? (
                    <EyeOff className="h-4 w-4 text-muted-foreground" />
                  ) : (
                    <Eye className="h-4 w-4 text-muted-foreground" />
                  )}
                </Button>
              </div>
              {errors.password && (
                <p className="text-sm text-destructive">{errors.password}</p>
              )}
            </div>

            {/* Confirm Password */}
            <div className="grid gap-2">
              <Label htmlFor="confirmPassword">
                Confirm Password <span className="text-destructive">*</span>
              </Label>
              <div className="relative">
                <Input
                  id="confirmPassword"
                  type={showConfirmPassword ? "text" : "password"}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Re-enter password"
                  disabled={isPending}
                  autoComplete="new-password"
                  className="pr-10"
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  disabled={isPending}
                >
                  {showConfirmPassword ? (
                    <EyeOff className="h-4 w-4 text-muted-foreground" />
                  ) : (
                    <Eye className="h-4 w-4 text-muted-foreground" />
                  )}
                </Button>
              </div>
              {errors.confirmPassword && (
                <p className="text-sm text-destructive">
                  {errors.confirmPassword}
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
              {isPending ? "Creating..." : "Create Employee"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
