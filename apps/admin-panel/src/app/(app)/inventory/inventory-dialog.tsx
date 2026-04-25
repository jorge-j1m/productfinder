"use client";

import * as React from "react";
import { useQuery } from "@tanstack/react-query";
import { isDefinedError } from "@orpc/client";
import { toast } from "sonner";
import { ScanBarcode, Search, Loader2, X } from "lucide-react";
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
import { orpc } from "#/lib/query/orpc";
import { client } from "#/lib/orpc";
import type { InventoryWithRelations } from "./columns";

interface StoreOption {
  id: string;
  name: string;
}

interface SelectedProductInfo {
  id: string;
  name: string;
  stockType: "WEIGHT" | "UNITS";
  sku?: string | null;
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
}

export function InventoryDialog({
  open,
  onOpenChange,
  inventory,
  onSubmit,
  isPending = false,
  serverError = null,
  stores,
}: InventoryDialogProps) {
  const [storeId, setStoreId] = React.useState("");
  const [selectedProduct, setSelectedProduct] =
    React.useState<SelectedProductInfo | null>(null);
  const [productSearch, setProductSearch] = React.useState("");
  const [debouncedSearch, setDebouncedSearch] = React.useState("");
  const [quantity, setQuantity] = React.useState("");
  const [regularPrice, setRegularPrice] = React.useState("");
  const [salePrice, setSalePrice] = React.useState("");
  const [saleStartDate, setSaleStartDate] = React.useState("");
  const [saleEndDate, setSaleEndDate] = React.useState("");
  const [errors, setErrors] = React.useState<Record<string, string>>({});
  const [scannerOpen, setScannerOpen] = React.useState(false);
  const [isLookingUpBarcode, setIsLookingUpBarcode] = React.useState(false);

  const isEditMode = !!inventory;

  React.useEffect(() => {
    if (open) {
      setStoreId(inventory?.storeId || "");
      setSelectedProduct(
        inventory?.product
          ? {
              id: inventory.product.id,
              name: inventory.product.name,
              stockType: inventory.product.stockType,
            }
          : null,
      );
      setProductSearch("");
      setDebouncedSearch("");
      setQuantity(inventory?.quantity?.toString() || "0");
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

  React.useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(productSearch);
    }, 300);
    return () => clearTimeout(timer);
  }, [productSearch]);

  const productSearchEnabled = open && !isEditMode && !selectedProduct;
  const { data: searchData, isFetching: isSearching } = useQuery(
    orpc.products.getAll.queryOptions({
      input: {
        page: 1,
        pageSize: 10,
        name: debouncedSearch || undefined,
        sortBy: "name",
        sortOrder: "asc",
      },
      enabled: productSearchEnabled,
    }),
  );

  const searchResults = searchData?.data || [];

  const handleSelectProduct = React.useCallback(
    (product: {
      id: string;
      name: string;
      stockType: "WEIGHT" | "UNITS";
      sku?: string | null;
    }) => {
      setSelectedProduct({
        id: product.id,
        name: product.name,
        stockType: product.stockType,
        sku: product.sku ?? null,
      });
      setProductSearch("");
      setDebouncedSearch("");
    },
    [],
  );

  const handleClearProduct = React.useCallback(() => {
    setSelectedProduct(null);
    setProductSearch("");
    setDebouncedSearch("");
  }, []);

  const handleBarcodeScan = React.useCallback(
    async (barcode: string) => {
      setIsLookingUpBarcode(true);
      try {
        const product = await client.products.getByBarcode({ barcode });
        handleSelectProduct({
          id: product.id,
          name: product.name,
          stockType: product.stockType,
          sku: product.sku,
        });
        toast.success(`Selected: ${product.name}`);
      } catch (error) {
        if (isDefinedError(error)) {
          toast.error(`No product found for barcode "${barcode}"`);
        } else {
          toast.error("Failed to look up barcode");
        }
      } finally {
        setIsLookingUpBarcode(false);
      }
    },
    [handleSelectProduct],
  );

  const validate = () => {
    const newErrors: Record<string, string> = {};

    if (!storeId) {
      newErrors.storeId = "Store is required";
    }

    if (!selectedProduct) {
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

    if (validate() && selectedProduct) {
      onSubmit({
        storeId,
        productId: selectedProduct.id,
        quantity: parseInt(quantity, 10),
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
              <Label htmlFor="product-search">
                Product <span className="text-destructive">*</span>
              </Label>

              {isEditMode || selectedProduct ? (
                <div className="flex items-center justify-between rounded-md border bg-muted/30 px-3 py-2">
                  <div className="flex flex-col min-w-0">
                    <span className="font-medium truncate">
                      {selectedProduct?.name || "Unknown Product"}
                    </span>
                    <span className="text-xs text-muted-foreground">
                      {selectedProduct?.stockType ?? ""}
                      {selectedProduct?.sku
                        ? ` • SKU: ${selectedProduct.sku}`
                        : ""}
                    </span>
                  </div>
                  {!isEditMode && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={handleClearProduct}
                      disabled={isPending}
                    >
                      <X className="h-4 w-4 mr-1" />
                      Change
                    </Button>
                  )}
                </div>
              ) : (
                <>
                  <div className="flex gap-2">
                    <div className="relative flex-1">
                      <Search className="absolute left-2 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                      <Input
                        id="product-search"
                        value={productSearch}
                        onChange={(e) => setProductSearch(e.target.value)}
                        placeholder="Search products by name..."
                        disabled={isPending || isLookingUpBarcode}
                        className="pl-8"
                        autoComplete="off"
                      />
                    </div>
                    <Button
                      type="button"
                      variant="outline"
                      size="icon"
                      onClick={() => setScannerOpen(true)}
                      disabled={isPending || isLookingUpBarcode}
                      title="Scan barcode"
                    >
                      {isLookingUpBarcode ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <ScanBarcode className="h-4 w-4" />
                      )}
                    </Button>
                  </div>

                  <div className="rounded-md border max-h-[220px] overflow-y-auto">
                    {isSearching ? (
                      <div className="flex items-center justify-center py-4 text-sm text-muted-foreground">
                        <Loader2 className="h-4 w-4 animate-spin mr-2" />
                        Searching...
                      </div>
                    ) : searchResults.length === 0 ? (
                      <div className="py-4 text-center text-sm text-muted-foreground">
                        {debouncedSearch
                          ? `No products found matching "${debouncedSearch}"`
                          : "No products available"}
                      </div>
                    ) : (
                      <ul className="divide-y">
                        {searchResults.map((product) => (
                          <li key={product.id}>
                            <button
                              type="button"
                              onClick={() =>
                                handleSelectProduct({
                                  id: product.id,
                                  name: product.name,
                                  stockType: product.stockType,
                                  sku: product.sku,
                                })
                              }
                              className="w-full text-left px-3 py-2 hover:bg-accent focus:bg-accent focus:outline-none transition-colors"
                            >
                              <div className="flex flex-col">
                                <span className="font-medium">
                                  {product.name}
                                </span>
                                <span className="text-xs text-muted-foreground">
                                  {product.stockType}
                                  {product.sku ? ` • SKU: ${product.sku}` : ""}
                                </span>
                              </div>
                            </button>
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                </>
              )}
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

      <BarcodeScanner
        open={scannerOpen}
        onOpenChange={setScannerOpen}
        onScan={handleBarcodeScan}
      />
    </Dialog>
  );
}
