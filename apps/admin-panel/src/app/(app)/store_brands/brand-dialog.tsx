"use client";

import * as React from "react";
import type { StoreBrand } from "@repo/database/types";
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

interface BrandDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  brand?: StoreBrand | null;
  onSubmit: (data: { name: string; logo: string }) => void;
  isPending?: boolean;
}

export function BrandDialog({
  open,
  onOpenChange,
  brand,
  onSubmit,
  isPending = false,
}: BrandDialogProps) {
  const [name, setName] = React.useState("");
  const [logo, setLogo] = React.useState("");
  const [errors, setErrors] = React.useState<{
    name?: string;
    logo?: string;
  }>({});

  // Reset form when dialog opens/closes or brand changes
  React.useEffect(() => {
    if (open) {
      setName(brand?.name || "");
      setLogo(brand?.logo || "");
      setErrors({});
    }
  }, [open, brand]);

  const validate = () => {
    const newErrors: { name?: string; logo?: string } = {};

    if (!name.trim()) {
      newErrors.name = "Name is required";
    }

    if (!logo.trim()) {
      newErrors.logo = "Logo URL is required";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (validate()) {
      onSubmit({ name: name.trim(), logo: logo.trim() });
    }
  };

  const isEditMode = !!brand;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>
            {isEditMode ? "Edit Store Brand" : "Create Store Brand"}
          </DialogTitle>
          <DialogDescription>
            {isEditMode
              ? "Update the store brand details below."
              : "Add a new store brand to your system."}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="name">Name</Label>
              <Input
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g., Publix, Fresco, Sedanos"
                disabled={isPending}
              />
              {errors.name && (
                <p className="text-sm text-destructive">{errors.name}</p>
              )}
            </div>
            <div className="grid gap-2">
              <Label htmlFor="logo">Logo URL</Label>
              <Input
                id="logo"
                value={logo}
                onChange={(e) => setLogo(e.target.value)}
                placeholder="https://example.com/logo.png"
                disabled={isPending}
              />
              {errors.logo && (
                <p className="text-sm text-destructive">{errors.logo}</p>
              )}
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
