"use client";

import type { Store, StoreBrand } from "@repo/database/types";
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

type StoreWithBrand = Store & { brand: StoreBrand };

interface DeleteDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  store: StoreWithBrand | null;
  onConfirm: () => void;
  isPending?: boolean;
}

export function DeleteDialog({
  open,
  onOpenChange,
  store,
  onConfirm,
  isPending = false,
}: DeleteDialogProps) {
  if (!store) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <div className="flex items-center gap-2">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-destructive/10">
              <AlertTriangle className="h-5 w-5 text-destructive" />
            </div>
            <DialogTitle>Delete Store</DialogTitle>
          </div>
          <DialogDescription className="pt-2">
            Are you sure you want to delete <strong>{store.name}</strong> at{" "}
            {store.address}? This action cannot be undone and will remove all
            associated data.
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
