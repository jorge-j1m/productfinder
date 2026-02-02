"use client";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "#/components/ui/dialog";
import { Button } from "#/components/ui/button";
import { AlertTriangle } from "lucide-react";
import type { InventoryWithRelations } from "./columns";

interface DeleteDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  inventory: InventoryWithRelations | null;
  onConfirm: () => void;
  isPending?: boolean;
}

export function DeleteDialog({
  open,
  onOpenChange,
  inventory,
  onConfirm,
  isPending = false,
}: DeleteDialogProps) {
  if (!inventory) return null;

  const productName = inventory.product?.name || "this product";
  const storeName = inventory.store?.name || "this store";

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <div className="flex items-center gap-2">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-destructive/10">
              <AlertTriangle className="h-5 w-5 text-destructive" />
            </div>
            <DialogTitle>Delete Inventory</DialogTitle>
          </div>
          <DialogDescription className="pt-2">
            Are you sure you want to delete the inventory record for{" "}
            <strong>{productName}</strong> at <strong>{storeName}</strong>? This
            action cannot be undone.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isPending}
          >
            Cancel
          </Button>
          <Button
            type="button"
            variant="destructive"
            onClick={onConfirm}
            disabled={isPending}
          >
            {isPending ? "Deleting..." : "Delete"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
