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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "#/components/ui/select";
import type { InventoryWithRelations } from "./columns";

interface StoreOption {
  id: string;
  name: string;
}

interface ProductOption {
  id: string;
  name: string;
  stockType: "WEIGHT" | "UNITS";
}

interface InventoryDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  inventory?: InventoryWithRelations | null;
  onSubmit: (data: {
    storeId: string;
    productId: string;
    quantity: number;
    regularPrice: number;
    salePrice: number | null;
    saleStartDate: Date | null;
    saleEndDate: Date | null;
  }) => void;
  isPending?: boolean;
  serverError?: string | null;
  stores: StoreOption[];
  products: ProductOption[];
}

export function InventoryDialog({
  open,
  onOpenChange,
  inventory,
  onSubmit,
  isPending = false,
  serverError = null,
  stores,
  products,
}: InventoryDialogProps) {
  const [storeId, setStoreId] = React.useState("");
  const [productId, setProductId] = React.useState("");
  const [quantity, setQuantity] = React.useState("");
  const [regularPrice, setRegularPrice] = React.useState("");
  const [salePrice, setSalePrice] = React.useState("");
  const [saleStartDate, setSaleStartDate] = React.useState("");
  const [saleEndDate, setSaleEndDate] = React.useState("");
  const [errors, setErrors] = React.useState<Record<string, string>>({});

  // Get selected product to display unit hints
  const selectedProduct = React.useMemo(
    () => products.find((p) => p.id === productId),
    [products, productId],
  );

  const isEditMode = !!inventory;

  // Reset form when dialog opens/closes or inventory changes
  React.useEffect(() => {
    if (open) {
      setStoreId(inventory?.storeId || "");
      setProductId(inventory?.productId || "");
      setQuantity(inventory?.quantity?.toString() || "0");
      // Convert cents to dollars for display
      setRegularPrice(
        inventory?.regularPrice
          ? (inventory.regularPrice / 100).toFixed(2)
          : "",
      );
      setSalePrice(
        inventory?.salePrice ? (inventory.salePrice / 100).toFixed(2) : "",
      );
      setSaleStartDate(
        inventory?.saleStartDate
          ? new Date(inventory.saleStartDate).toISOString().slice(0, 16)
          : "",
      );
      setSaleEndDate(
        inventory?.saleEndDate
          ? new Date(inventory.saleEndDate).toISOString().slice(0, 16)
          : "",
      );
      setErrors({});
    }
  }, [open, inventory]);

  const validate = () => {
    const newErrors: Record<string, string> = {};

    if (!storeId) {
      newErrors.storeId = "Store is required";
    }

    if (!productId) {
      newErrors.productId = "Product is required";
    }

    const quantityNum = parseInt(quantity, 10);
    if (isNaN(quantityNum) || quantityNum < 0) {
      newErrors.quantity = "Quantity must be a non-negative integer";
    }

    const regularPriceNum = parseFloat(regularPrice);
    if (isNaN(regularPriceNum) || regularPriceNum <= 0) {
      newErrors.regularPrice = "Regular price must be a positive number";
    }

    if (salePrice) {
      const salePriceNum = parseFloat(salePrice);
      if (isNaN(salePriceNum) || salePriceNum <= 0) {
        newErrors.salePrice = "Sale price must be a positive number";
      } else if (salePriceNum >= regularPriceNum) {
        newErrors.salePrice = "Sale price must be less than regular price";
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (validate()) {
      onSubmit({
        storeId,
        productId,
        quantity: parseInt(quantity, 10),
        // Convert dollars to cents
        regularPrice: Math.round(parseFloat(regularPrice) * 100),
        salePrice: salePrice ? Math.round(parseFloat(salePrice) * 100) : null,
        saleStartDate: saleStartDate ? new Date(saleStartDate) : null,
        saleEndDate: saleEndDate ? new Date(saleEndDate) : null,
      });
    }
  };

  const quantityLabel =
    selectedProduct?.stockType === "WEIGHT" ? "grams" : "units";
  const priceLabel =
    selectedProduct?.stockType === "WEIGHT" ? "per gram" : "per unit";

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {isEditMode ? "Edit Inventory" : "Add Inventory"}
          </DialogTitle>
          <DialogDescription>
            {isEditMode
              ? "Update the inventory details below."
              : "Add a new inventory record for a product at a store."}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="grid gap-4 py-4">
            {/* Store Selection */}
            <div className="grid gap-2">
              <Label htmlFor="store">
                Store <span className="text-destructive">*</span>
              </Label>
              <Select
                value={storeId}
                onValueChange={setStoreId}
                disabled={isPending || isEditMode}
              >
                <SelectTrigger id="store">
                  <SelectValue placeholder="Select a store" />
                </SelectTrigger>
                <SelectContent>
                  {stores.map((store) => (
                    <SelectItem key={store.id} value={store.id}>
                      {store.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.storeId && (
                <p className="text-sm text-destructive">{errors.storeId}</p>
              )}
            </div>

            {/* Product Selection */}
            <div className="grid gap-2">
              <Label htmlFor="product">
                Product <span className="text-destructive">*</span>
              </Label>
              <Select
                value={productId}
                onValueChange={setProductId}
                disabled={isPending || isEditMode}
              >
                <SelectTrigger id="product">
                  <SelectValue placeholder="Select a product" />
                </SelectTrigger>
                <SelectContent>
                  {products.map((product) => (
                    <SelectItem key={product.id} value={product.id}>
                      {product.name} ({product.stockType})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.productId && (
                <p className="text-sm text-destructive">{errors.productId}</p>
              )}
              {serverError?.toLowerCase().includes("already exists") && (
                <p className="text-sm text-destructive">{serverError}</p>
              )}
            </div>

            {/* Quantity */}
            <div className="grid gap-2">
              <Label htmlFor="quantity">
                Quantity <span className="text-destructive">*</span>
              </Label>
              <div className="flex items-center gap-2">
                <Input
                  id="quantity"
                  type="number"
                  min="0"
                  step="1"
                  value={quantity}
                  onChange={(e) => setQuantity(e.target.value)}
                  placeholder="0"
                  disabled={isPending}
                  className="flex-1"
                />
                <span className="text-sm text-muted-foreground w-16">
                  {quantityLabel}
                </span>
              </div>
              {errors.quantity && (
                <p className="text-sm text-destructive">{errors.quantity}</p>
              )}
            </div>

            {/* Regular Price */}
            <div className="grid gap-2">
              <Label htmlFor="regularPrice">
                Regular Price <span className="text-destructive">*</span>
              </Label>
              <div className="flex items-center gap-2">
                <span className="text-sm text-muted-foreground">$</span>
                <Input
                  id="regularPrice"
                  type="number"
                  min="0.01"
                  step="0.01"
                  value={regularPrice}
                  onChange={(e) => setRegularPrice(e.target.value)}
                  placeholder="0.00"
                  disabled={isPending}
                  className="flex-1"
                />
                <span className="text-sm text-muted-foreground w-16">
                  {priceLabel}
                </span>
              </div>
              {errors.regularPrice && (
                <p className="text-sm text-destructive">
                  {errors.regularPrice}
                </p>
              )}
            </div>

            <div className="border-t pt-4 mt-2">
              <p className="text-sm font-medium mb-4">
                Sale Settings (Optional)
              </p>

              {/* Sale Price */}
              <div className="grid gap-2 mb-4">
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
                  />
                  <span className="text-sm text-muted-foreground w-16">
                    {priceLabel}
                  </span>
                </div>
                {errors.salePrice && (
                  <p className="text-sm text-destructive">{errors.salePrice}</p>
                )}
                {serverError?.toLowerCase().includes("sale price") && (
                  <p className="text-sm text-destructive">{serverError}</p>
                )}
              </div>

              {/* Sale Dates */}
              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="saleStartDate">Start Date</Label>
                  <Input
                    id="saleStartDate"
                    type="datetime-local"
                    value={saleStartDate}
                    onChange={(e) => setSaleStartDate(e.target.value)}
                    disabled={isPending}
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="saleEndDate">End Date</Label>
                  <Input
                    id="saleEndDate"
                    type="datetime-local"
                    value={saleEndDate}
                    onChange={(e) => setSaleEndDate(e.target.value)}
                    disabled={isPending}
                  />
                </div>
              </div>
              <p className="text-xs text-muted-foreground mt-2">
                Leave dates empty for a permanent sale (until manually cleared).
              </p>
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
