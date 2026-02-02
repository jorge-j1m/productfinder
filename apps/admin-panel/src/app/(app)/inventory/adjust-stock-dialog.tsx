"use client";

import * as React from "react";
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
import { PackagePlus, PackageMinus } from "lucide-react";
import type { InventoryWithRelations } from "./columns";

interface AdjustStockDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  inventory: InventoryWithRelations | null;
  onSubmit: (inventoryId: string, delta: number) => void;
  isPending?: boolean;
  serverError?: string | null;
}

export function AdjustStockDialog({
  open,
  onOpenChange,
  inventory,
  onSubmit,
  isPending = false,
  serverError = null,
}: AdjustStockDialogProps) {
  const [delta, setDelta] = React.useState("");
  const [operation, setOperation] = React.useState<"add" | "remove">("add");
  const [errors, setErrors] = React.useState<Record<string, string>>({});

  const stockType = inventory?.product?.stockType || "UNITS";
  const currentQuantity = inventory?.quantity || 0;
  const quantityLabel = stockType === "WEIGHT" ? "grams" : "units";

  // Reset form when dialog opens
  React.useEffect(() => {
    if (open) {
      setDelta("");
      setOperation("add");
      setErrors({});
    }
  }, [open]);

  const validate = () => {
    const newErrors: Record<string, string> = {};

    const deltaNum = parseInt(delta, 10);
    if (isNaN(deltaNum) || deltaNum <= 0) {
      newErrors.delta = "Please enter a positive number";
    }

    // Check if removal would result in negative stock
    if (operation === "remove" && deltaNum > currentQuantity) {
      newErrors.delta = `Cannot remove more than current stock (${currentQuantity} ${quantityLabel})`;
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (validate() && inventory) {
      const deltaNum = parseInt(delta, 10);
      const adjustedDelta = operation === "add" ? deltaNum : -deltaNum;
      onSubmit(inventory.id, adjustedDelta);
    }
  };

  const newQuantity = React.useMemo(() => {
    const deltaNum = parseInt(delta, 10) || 0;
    return operation === "add"
      ? currentQuantity + deltaNum
      : currentQuantity - deltaNum;
  }, [delta, operation, currentQuantity]);

  if (!inventory) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[400px]">
        <DialogHeader>
          <DialogTitle>Adjust Stock</DialogTitle>
          <DialogDescription>
            Adjust the stock quantity for{" "}
            <strong>{inventory.product?.name || "this product"}</strong> at{" "}
            <strong>{inventory.store?.name || "this store"}</strong>.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="grid gap-4 py-4">
            {/* Current Stock Display */}
            <div className="bg-muted rounded-lg p-3">
              <p className="text-sm text-muted-foreground">Current Stock</p>
              <p className="text-2xl font-bold">
                {currentQuantity.toLocaleString()} {quantityLabel}
              </p>
            </div>

            {/* Operation Toggle */}
            <div className="grid gap-2">
              <Label>Operation</Label>
              <div className="flex gap-2">
                <Button
                  type="button"
                  variant={operation === "add" ? "default" : "outline"}
                  className="flex-1"
                  onClick={() => setOperation("add")}
                  disabled={isPending}
                >
                  <PackagePlus className="mr-2 h-4 w-4" />
                  Add Stock
                </Button>
                <Button
                  type="button"
                  variant={operation === "remove" ? "default" : "outline"}
                  className="flex-1"
                  onClick={() => setOperation("remove")}
                  disabled={isPending}
                >
                  <PackageMinus className="mr-2 h-4 w-4" />
                  Remove Stock
                </Button>
              </div>
            </div>

            {/* Amount Input */}
            <div className="grid gap-2">
              <Label htmlFor="delta">
                Amount to {operation === "add" ? "add" : "remove"}
              </Label>
              <div className="flex items-center gap-2">
                <Input
                  id="delta"
                  type="number"
                  min="1"
                  step="1"
                  value={delta}
                  onChange={(e) => setDelta(e.target.value)}
                  placeholder="0"
                  disabled={isPending}
                  className="flex-1"
                  autoFocus
                />
                <span className="text-sm text-muted-foreground w-16">
                  {quantityLabel}
                </span>
              </div>
              {errors.delta && (
                <p className="text-sm text-destructive">{errors.delta}</p>
              )}
              {serverError && (
                <p className="text-sm text-destructive">{serverError}</p>
              )}
            </div>

            {/* Preview */}
            {delta && !isNaN(parseInt(delta, 10)) && (
              <div className="bg-muted/50 rounded-lg p-3 border">
                <p className="text-sm text-muted-foreground">New Stock After</p>
                <p
                  className={`text-xl font-bold ${newQuantity < 0 ? "text-destructive" : newQuantity === 0 ? "text-amber-600" : ""}`}
                >
                  {newQuantity.toLocaleString()} {quantityLabel}
                </p>
              </div>
            )}
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
            <Button type="submit" disabled={isPending || !delta}>
              {isPending ? "Adjusting..." : "Adjust Stock"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
