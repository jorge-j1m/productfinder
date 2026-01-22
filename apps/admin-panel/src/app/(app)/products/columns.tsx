"use client";

import { ColumnDef } from "@tanstack/react-table";
import { Button } from "#/components/ui/button";
import { ArrowUpDown, Pencil, Trash2 } from "lucide-react";
import type { Product } from "@repo/database/types";
import Image from "next/image";
import { Badge } from "#/components/ui/badge";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "#/components/ui/tooltip";

type ColumnActionsProps = {
  onEdit: (product: Product) => void;
  onDelete: (product: Product) => void;
};

const getStockTypeBadgeVariant = (stockType: "WEIGHT" | "UNITS") => {
  switch (stockType) {
    case "WEIGHT":
      return "bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-300";
    case "UNITS":
      return "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300";
    default:
      return "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300";
  }
};

export const createColumns = ({
  onEdit,
  onDelete,
}: ColumnActionsProps): ColumnDef<Product>[] => [
  {
    accessorKey: "image",
    header: "Image",
    cell: ({ row }) => {
      const image = row.getValue("image") as string | null;
      const name = row.original.name;
      return (
        <div className="flex items-center">
          <div className="relative h-10 w-10 overflow-hidden rounded-md border bg-muted">
            {image ? (
              <Image
                src={image}
                alt={`${name} image`}
                fill
                className="object-contain p-1"
                sizes="40px"
                unoptimized
              />
            ) : (
              <div className="flex h-full w-full items-center justify-center text-xs text-muted-foreground">
                N/A
              </div>
            )}
          </div>
        </div>
      );
    },
  },
  {
    accessorKey: "name",
    header: ({ column }) => {
      return (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        >
          Name
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      );
    },
    cell: ({ row }) => {
      const name = row.getValue("name") as string;
      const description = row.original.description;
      return (
        <div className="flex flex-col">
          <span className="font-medium">{name}</span>
          {description && (
            <span className="text-xs text-muted-foreground line-clamp-1 max-w-[250px]">
              {description}
            </span>
          )}
        </div>
      );
    },
  },
  {
    accessorKey: "sku",
    header: ({ column }) => {
      return (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        >
          SKU
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      );
    },
    cell: ({ row }) => {
      const sku = row.getValue("sku") as string;
      return <div className="font-mono text-sm">{sku}</div>;
    },
  },
  {
    accessorKey: "stockType",
    header: "Stock Type",
    cell: ({ row }) => {
      const stockType = row.getValue("stockType") as "WEIGHT" | "UNITS";
      return (
        <Badge
          className={getStockTypeBadgeVariant(stockType)}
          variant="outline"
        >
          {stockType}
        </Badge>
      );
    },
  },
  {
    accessorKey: "barcode",
    header: "Barcode",
    cell: ({ row }) => {
      const barcode = row.getValue("barcode") as string | null;
      return (
        <div className="font-mono text-xs text-muted-foreground">
          {barcode || "—"}
        </div>
      );
    },
  },
  {
    accessorKey: "id",
    header: "ID",
    cell: ({ row }) => {
      const id = row.getValue("id") as string;
      // Extract prefix and last 5 characters
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
      const product = row.original;

      return (
        <div className="flex items-center justify-end gap-1">
          <TooltipProvider delayDuration={0}>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => onEdit(product)}
                  className="h-8 w-8 text-muted-foreground hover:text-foreground"
                >
                  <Pencil className="h-4 w-4" />
                  <span className="sr-only">Edit</span>
                </Button>
              </TooltipTrigger>
              <TooltipContent>Edit product</TooltipContent>
            </Tooltip>
          </TooltipProvider>

          <TooltipProvider delayDuration={0}>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => onDelete(product)}
                  className="h-8 w-8 text-muted-foreground hover:text-destructive"
                >
                  <Trash2 className="h-4 w-4" />
                  <span className="sr-only">Delete</span>
                </Button>
              </TooltipTrigger>
              <TooltipContent>Delete product</TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>
      );
    },
  },
];
