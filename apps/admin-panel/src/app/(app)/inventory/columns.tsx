"use client";

import { ColumnDef } from "@tanstack/react-table";
import { Button } from "#/components/ui/button";
import {
  ArrowUpDown,
  Pencil,
  Trash2,
  PackagePlus,
  Tag,
} from "lucide-react";
import { Badge } from "#/components/ui/badge";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "#/components/ui/tooltip";

// Type for inventory with relations (matches backend output)
export interface InventoryWithRelations {
  id: string;
  storeId: string;
  productId: string;
  quantity: number;
  regularPrice: number;
  salePrice: number | null;
  saleStartDate: Date | null;
  saleEndDate: Date | null;
  store?: {
    id: string;
    name: string;
  };
  product?: {
    id: string;
    name: string;
    stockType: "WEIGHT" | "UNITS";
  };
}

type ColumnActionsProps = {
  onEdit: (inventory: InventoryWithRelations) => void;
  onDelete: (inventory: InventoryWithRelations) => void;
  onAdjustStock: (inventory: InventoryWithRelations) => void;
  onManageSale: (inventory: InventoryWithRelations) => void;
};

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

// Format quantity based on stock type
function formatQuantity(
  quantity: number,
  stockType: "WEIGHT" | "UNITS",
): string {
  if (stockType === "WEIGHT") {
    if (quantity >= 1000) {
      return `${(quantity / 1000).toFixed(2)} kg`;
    }
    return `${quantity} g`;
  }
  return `${quantity} units`;
}

export const createColumns = ({
  onEdit,
  onDelete,
  onAdjustStock,
  onManageSale,
}: ColumnActionsProps): ColumnDef<InventoryWithRelations>[] => [
  {
    accessorKey: "store.name",
    header: "Store",
    cell: ({ row }) => {
      const storeName = row.original.store?.name || "Unknown Store";
      return <span className="font-medium">{storeName}</span>;
    },
  },
  {
    accessorKey: "product.name",
    header: "Product",
    cell: ({ row }) => {
      const productName = row.original.product?.name || "Unknown Product";
      const stockType = row.original.product?.stockType || "UNITS";
      return (
        <div className="flex flex-col">
          <span className="font-medium">{productName}</span>
          <span className="text-xs text-muted-foreground">{stockType}</span>
        </div>
      );
    },
  },
  {
    accessorKey: "quantity",
    header: ({ column }) => {
      return (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        >
          Quantity
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      );
    },
    cell: ({ row }) => {
      const quantity = row.getValue("quantity") as number;
      const stockType = row.original.product?.stockType || "UNITS";
      const isOutOfStock = quantity === 0;
      const isLowStock = quantity > 0 && quantity < 10;

      return (
        <div className="flex items-center gap-2">
          <span
            className={
              isOutOfStock
                ? "text-destructive font-medium"
                : isLowStock
                  ? "text-amber-600 font-medium"
                  : ""
            }
          >
            {formatQuantity(quantity, stockType)}
          </span>
          {isOutOfStock && (
            <Badge variant="destructive" className="text-xs">
              Out of Stock
            </Badge>
          )}
          {isLowStock && !isOutOfStock && (
            <Badge
              variant="outline"
              className="text-xs text-amber-600 border-amber-600"
            >
              Low
            </Badge>
          )}
        </div>
      );
    },
  },
  {
    accessorKey: "regularPrice",
    header: ({ column }) => {
      return (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        >
          Price
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      );
    },
    cell: ({ row }) => {
      const regularPrice = row.getValue("regularPrice") as number;
      const salePrice = row.original.salePrice;
      const isOnSale = isSaleActive(row.original);
      const stockType = row.original.product?.stockType || "UNITS";
      const priceUnit = stockType === "WEIGHT" ? "/g" : "/unit";

      return (
        <div className="flex flex-col">
          {isOnSale && salePrice !== null ? (
            <>
              <span className="font-medium text-green-600">
                {formatPrice(salePrice)}
                {priceUnit}
              </span>
              <span className="text-xs text-muted-foreground line-through">
                {formatPrice(regularPrice)}
                {priceUnit}
              </span>
            </>
          ) : (
            <span>
              {formatPrice(regularPrice)}
              {priceUnit}
            </span>
          )}
        </div>
      );
    },
  },
  {
    id: "saleStatus",
    header: "Sale Status",
    cell: ({ row }) => {
      const isOnSale = isSaleActive(row.original);
      const hasSalePrice = row.original.salePrice !== null;

      if (!hasSalePrice) {
        return <span className="text-muted-foreground text-sm">No sale</span>;
      }

      if (isOnSale) {
        return (
          <Badge className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300">
            On Sale
          </Badge>
        );
      }

      // Has sale price but not active (scheduled or ended)
      const now = new Date();
      if (
        row.original.saleStartDate &&
        now < new Date(row.original.saleStartDate)
      ) {
        return (
          <Badge className="bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300">
            Scheduled
          </Badge>
        );
      }

      return (
        <Badge variant="outline" className="text-muted-foreground">
          Ended
        </Badge>
      );
    },
  },
  {
    accessorKey: "id",
    header: "ID",
    cell: ({ row }) => {
      const id = row.getValue("id") as string;
      const prefix = id.split("_")[0];
      const lastFive = id.slice(-5);
      const displayId = `${prefix}_...${lastFive}`;

      return (
        <div className="flex items-center gap-2">
          <span className="font-mono text-xs text-muted-foreground">
            {displayId}
          </span>
          <TooltipProvider delayDuration={0}>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-6 w-6"
                  onClick={() => navigator.clipboard.writeText(id)}
                >
                  <svg
                    className="h-3 w-3"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"
                    />
                  </svg>
                  <span className="sr-only">Copy ID</span>
                </Button>
              </TooltipTrigger>
              <TooltipContent>Copy full ID</TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>
      );
    },
  },
  {
    id: "actions",
    header: () => <div className="text-right">Actions</div>,
    cell: ({ row }) => {
      const inventory = row.original;

      return (
        <div className="flex items-center justify-end gap-1">
          <TooltipProvider delayDuration={0}>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => onAdjustStock(inventory)}
                  className="h-8 w-8 text-muted-foreground hover:text-foreground"
                >
                  <PackagePlus className="h-4 w-4" />
                  <span className="sr-only">Adjust Stock</span>
                </Button>
              </TooltipTrigger>
              <TooltipContent>Adjust Stock</TooltipContent>
            </Tooltip>
          </TooltipProvider>

          <TooltipProvider delayDuration={0}>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => onManageSale(inventory)}
                  className="h-8 w-8 text-muted-foreground hover:text-foreground"
                >
                  <Tag className="h-4 w-4" />
                  <span className="sr-only">Manage Sale</span>
                </Button>
              </TooltipTrigger>
              <TooltipContent>Manage Sale</TooltipContent>
            </Tooltip>
          </TooltipProvider>

          <TooltipProvider delayDuration={0}>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => onEdit(inventory)}
                  className="h-8 w-8 text-muted-foreground hover:text-foreground"
                >
                  <Pencil className="h-4 w-4" />
                  <span className="sr-only">Edit</span>
                </Button>
              </TooltipTrigger>
              <TooltipContent>Edit</TooltipContent>
            </Tooltip>
          </TooltipProvider>

          <TooltipProvider delayDuration={0}>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => onDelete(inventory)}
                  className="h-8 w-8 text-muted-foreground hover:text-destructive"
                >
                  <Trash2 className="h-4 w-4" />
                  <span className="sr-only">Delete</span>
                </Button>
              </TooltipTrigger>
              <TooltipContent>Delete</TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>
      );
    },
  },
];
