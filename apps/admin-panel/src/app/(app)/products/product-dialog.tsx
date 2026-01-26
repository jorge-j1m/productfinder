"use client";

import * as React from "react";
import type { Product } from "@repo/database/types";
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
import { BarcodeScanner } from "#/components/barcode-scanner";
import { ScanBarcode } from "lucide-react";

interface ProductDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  product?: Product | null;
  onSubmit: (data: {
    name: string;
    description: string | null;
    sku: string;
    barcode: string | null;
    stockType: "WEIGHT" | "UNITS";
    image: string | null;
  }) => void;
  isPending?: boolean;
}

export function ProductDialog({
  open,
  onOpenChange,
  product,
  onSubmit,
  isPending = false,
}: ProductDialogProps) {
  const [name, setName] = React.useState("");
  const [description, setDescription] = React.useState("");
  const [sku, setSku] = React.useState("");
  const [barcode, setBarcode] = React.useState("");
  const [stockType, setStockType] = React.useState<"WEIGHT" | "UNITS">("UNITS");
  const [image, setImage] = React.useState("");
  const [errors, setErrors] = React.useState<Record<string, string>>({});
  const [scannerOpen, setScannerOpen] = React.useState(false);

  // Reset form when dialog opens/closes or product changes
  React.useEffect(() => {
    if (open) {
      setName(product?.name || "");
      setDescription(product?.description || "");
      setSku(product?.sku || "");
      setBarcode(product?.barcode || "");
      setStockType(product?.stockType || "UNITS");
      setImage(product?.image || "");
      setErrors({});
    }
  }, [open, product]);

  const validate = () => {
    const newErrors: Record<string, string> = {};

    if (!name.trim()) {
      newErrors.name = "Name is required";
    } else if (name.length > 255) {
      newErrors.name = "Name must be 255 characters or less";
    }

    if (!sku.trim()) {
      newErrors.sku = "SKU is required";
    } else if (sku.length > 100) {
      newErrors.sku = "SKU must be 100 characters or less";
    }

    if (description && description.length > 1000) {
      newErrors.description = "Description must be 1000 characters or less";
    }

    if (image && image.length > 500) {
      newErrors.image = "Image URL must be 500 characters or less";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (validate()) {
      onSubmit({
        name: name.trim(),
        description: description.trim() || null,
        sku: sku.trim(),
        barcode: barcode.trim() || null,
        stockType,
        image: image.trim() || null,
      });
    }
  };

  const isEditMode = !!product;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {isEditMode ? "Edit Product" : "Create Product"}
          </DialogTitle>
          <DialogDescription>
            {isEditMode
              ? "Update the product details below."
              : "Add a new product to your catalog."}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="name">
                Name <span className="text-destructive">*</span>
              </Label>
              <Input
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g., Organic Bananas"
                disabled={isPending}
              />
              {errors.name && (
                <p className="text-sm text-destructive">{errors.name}</p>
              )}
            </div>

            <div className="grid gap-2">
              <Label htmlFor="sku">
                SKU <span className="text-destructive">*</span>
              </Label>
              <Input
                id="sku"
                value={sku}
                onChange={(e) => setSku(e.target.value)}
                placeholder="e.g., PROD-001"
                disabled={isPending}
                className="font-mono"
              />
              {errors.sku && (
                <p className="text-sm text-destructive">{errors.sku}</p>
              )}
            </div>

            <div className="grid gap-2">
              <Label htmlFor="stockType">
                Stock Type <span className="text-destructive">*</span>
              </Label>
              <Select
                value={stockType}
                onValueChange={(value) =>
                  setStockType(value as "WEIGHT" | "UNITS")
                }
                disabled={isPending}
              >
                <SelectTrigger id="stockType">
                  <SelectValue placeholder="Select stock type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="UNITS">
                    <div className="flex flex-col">
                      <span>Units</span>
                      <span className="text-xs text-muted-foreground">
                        Sold by discrete units (pieces, boxes, etc.)
                      </span>
                    </div>
                  </SelectItem>
                  <SelectItem value="WEIGHT">
                    <div className="flex flex-col">
                      <span>Weight</span>
                      <span className="text-xs text-muted-foreground">
                        Sold by weight (grams, kg, etc.)
                      </span>
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="grid gap-2">
              <Label htmlFor="barcode">Barcode</Label>
              <div className="flex gap-2">
                <Input
                  id="barcode"
                  value={barcode}
                  onChange={(e) => setBarcode(e.target.value)}
                  placeholder="e.g., 0123456789012"
                  disabled={isPending}
                  className="font-mono flex-1"
                />
                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  onClick={() => setScannerOpen(true)}
                  disabled={isPending}
                  title="Scan barcode"
                >
                  <ScanBarcode className="h-4 w-4" />
                </Button>
              </div>
              <p className="text-xs text-muted-foreground">
                Optional. Must be unique if provided.
              </p>
            </div>

            <div className="grid gap-2">
              <Label htmlFor="description">Description</Label>
              <Input
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Brief product description"
                disabled={isPending}
              />
              {errors.description && (
                <p className="text-sm text-destructive">{errors.description}</p>
              )}
              <p className="text-xs text-muted-foreground">
                Optional. Max 1000 characters.
              </p>
            </div>

            <div className="grid gap-2">
              <Label htmlFor="image">Image URL</Label>
              <Input
                id="image"
                value={image}
                onChange={(e) => setImage(e.target.value)}
                placeholder="https://example.com/image.png"
                disabled={isPending}
              />
              {errors.image && (
                <p className="text-sm text-destructive">{errors.image}</p>
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

      <BarcodeScanner
        open={scannerOpen}
        onOpenChange={setScannerOpen}
        onScan={(scannedBarcode) => setBarcode(scannedBarcode)}
      />
    </Dialog>
  );
}
