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
import { Badge } from "#/components/ui/badge";
import type { InventoryWithRelations } from "./columns";

interface SaleDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  inventory: InventoryWithRelations | null;
  onSetSale: (
    inventoryId: string,
    salePrice: number,
    saleStartDate: Date | undefined,
    saleEndDate: Date | undefined,
  ) => void;
  onClearSale: (inventoryId: string) => void;
  isPending?: boolean;
  serverError?: string | null;
}

// Helper to check if sale is currently active
function isSaleActive(inventory: InventoryWithRelations): boolean {
  if (inventory.salePrice === null) return false;

  const now = new Date();
  if (inventory.saleStartDate && now < new Date(inventory.saleStartDate))
    return false;
  if (inventory.saleEndDate && now > new Date(inventory.saleEndDate))
    return false;

  return true;
}

// Format price in cents to display currency
function formatPrice(cents: number): string {
  return `$${(cents / 100).toFixed(2)}`;
}

export function SaleDialog({
  open,
  onOpenChange,
  inventory,
  onSetSale,
  onClearSale,
  isPending = false,
  serverError = null,
}: SaleDialogProps) {
  const [salePrice, setSalePrice] = React.useState("");
  const [saleStartDate, setSaleStartDate] = React.useState("");
  const [saleEndDate, setSaleEndDate] = React.useState("");
  const [errors, setErrors] = React.useState<Record<string, string>>({});

  const hasSale = inventory?.salePrice !== null;
  const isOnSale = inventory ? isSaleActive(inventory) : false;
  const stockType = inventory?.product?.stockType || "UNITS";
  const priceLabel = stockType === "WEIGHT" ? "per gram" : "per unit";
  const regularPrice = inventory?.regularPrice || 0;

  // Reset form when dialog opens
  React.useEffect(() => {
    if (open && inventory) {
      // Pre-fill with existing sale data if present
      setSalePrice(
        inventory.salePrice ? (inventory.salePrice / 100).toFixed(2) : "",
      );
      setSaleStartDate(
        inventory.saleStartDate
          ? new Date(inventory.saleStartDate).toISOString().slice(0, 16)
          : "",
      );
      setSaleEndDate(
        inventory.saleEndDate
          ? new Date(inventory.saleEndDate).toISOString().slice(0, 16)
          : "",
      );
      setErrors({});
    }
  }, [open, inventory]);

  const validate = () => {
    const newErrors: Record<string, string> = {};

    const salePriceNum = parseFloat(salePrice);
    if (isNaN(salePriceNum) || salePriceNum <= 0) {
      newErrors.salePrice = "Sale price must be a positive number";
    } else if (salePriceNum * 100 >= regularPrice) {
      newErrors.salePrice = `Sale price must be less than regular price (${formatPrice(regularPrice)})`;
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSetSale = (e: React.FormEvent) => {
    e.preventDefault();

    if (validate() && inventory) {
      onSetSale(
        inventory.id,
        Math.round(parseFloat(salePrice) * 100),
        saleStartDate ? new Date(saleStartDate) : undefined,
        saleEndDate ? new Date(saleEndDate) : undefined,
      );
    }
  };

  const handleClearSale = () => {
    if (inventory) {
      onClearSale(inventory.id);
    }
  };

  // Calculate discount percentage for preview
  const discountPercent = React.useMemo(() => {
    const salePriceNum = parseFloat(salePrice);
    if (isNaN(salePriceNum) || salePriceNum <= 0 || regularPrice <= 0)
      return null;
    const saleCents = salePriceNum * 100;
    if (saleCents >= regularPrice) return null;
    return Math.round(((regularPrice - saleCents) / regularPrice) * 100);
  }, [salePrice, regularPrice]);

  if (!inventory) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[450px]">
        <DialogHeader>
          <DialogTitle>Manage Sale</DialogTitle>
          <DialogDescription>
            Set or clear the sale price for{" "}
            <strong>{inventory.product?.name || "this product"}</strong> at{" "}
            <strong>{inventory.store?.name || "this store"}</strong>.
          </DialogDescription>
        </DialogHeader>

        {/* Current Status */}
        <div className="bg-muted rounded-lg p-4 space-y-2">
          <div className="flex justify-between items-center">
            <span className="text-sm text-muted-foreground">Regular Price</span>
            <span className="font-medium">
              {formatPrice(regularPrice)} {priceLabel}
            </span>
          </div>
          {hasSale && (
            <>
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">
                  Current Sale
                </span>
                <div className="flex items-center gap-2">
                  <span className="font-medium text-green-600">
                    {formatPrice(inventory.salePrice!)} {priceLabel}
                  </span>
                  {isOnSale ? (
                    <Badge className="bg-green-100 text-green-800">
                      Active
                    </Badge>
                  ) : (
                    <Badge variant="outline">Inactive</Badge>
                  )}
                </div>
              </div>
            </>
          )}
        </div>

        <form onSubmit={handleSetSale}>
          <div className="grid gap-4 py-4">
            {/* Sale Price */}
            <div className="grid gap-2">
              <Label htmlFor="salePrice">Sale Price</Label>
              <div className="flex items-center gap-2">
                <span className="text-sm text-muted-foreground">$</span>
                <Input
                  id="salePrice"
                  type="number"
                  min="0.01"
                  step="0.01"
                  value={salePrice}
                  onChange={(e) => setSalePrice(e.target.value)}
                  placeholder="0.00"
                  disabled={isPending}
                  className="flex-1"
                  autoFocus
                />
                <span className="text-sm text-muted-foreground w-16">
                  {priceLabel}
                </span>
              </div>
              {errors.salePrice && (
                <p className="text-sm text-destructive">{errors.salePrice}</p>
              )}
              {serverError && (
                <p className="text-sm text-destructive">{serverError}</p>
              )}
              {discountPercent !== null && (
                <p className="text-sm text-green-600">
                  {discountPercent}% discount from regular price
                </p>
              )}
            </div>

            {/* Sale Dates */}
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="saleStartDate">Start Date (Optional)</Label>
                <Input
                  id="saleStartDate"
                  type="datetime-local"
                  value={saleStartDate}
                  onChange={(e) => setSaleStartDate(e.target.value)}
                  disabled={isPending}
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="saleEndDate">End Date (Optional)</Label>
                <Input
                  id="saleEndDate"
                  type="datetime-local"
                  value={saleEndDate}
                  onChange={(e) => setSaleEndDate(e.target.value)}
                  disabled={isPending}
                />
              </div>
            </div>
            <p className="text-xs text-muted-foreground">
              Leave dates empty for a permanent sale until manually cleared.
            </p>
          </div>

          <DialogFooter className="flex gap-2 sm:gap-0">
            {hasSale && (
              <Button
                type="button"
                variant="destructive"
                onClick={handleClearSale}
                disabled={isPending}
                className="mr-auto"
              >
                {isPending ? "Clearing..." : "Clear Sale"}
              </Button>
            )}
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isPending}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isPending || !salePrice}>
              {isPending ? "Setting..." : hasSale ? "Update Sale" : "Set Sale"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
