"use client";

import { ColumnDef } from "@tanstack/react-table";
import { Button } from "#/components/ui/button";
import { ArrowUpDown, Pencil, Trash2 } from "lucide-react";
import type { Store, StoreBrand } from "@repo/database/types";
import Image from "next/image";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "#/components/ui/tooltip";

type StoreWithBrand = Store & { brand: StoreBrand };

type ColumnActionsProps = {
  onEdit: (store: StoreWithBrand) => void;
  onDelete: (store: StoreWithBrand) => void;
};

export const createColumns = ({
  onEdit,
  onDelete,
}: ColumnActionsProps): ColumnDef<StoreWithBrand>[] => [
  {
    accessorKey: "name",
    header: ({ column }) => {
      return (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        >
          Store Name
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      );
    },
    cell: ({ row }) => {
      const name = row.getValue("name") as string;
      const brand = row.original.brand;
      return (
        <div className="flex items-center gap-3">
          <div className="relative h-10 w-10 overflow-hidden rounded-md border bg-muted flex-shrink-0">
            <Image
              src={brand.logo}
              alt={`${brand.name} logo`}
              fill
              className="object-contain p-1"
              sizes="40px"
              unoptimized
            />
          </div>
          <div className="font-medium">{name}</div>
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
    accessorKey: "city",
    header: ({ column }) => {
      return (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        >
          Location
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      );
    },
    cell: ({ row }) => {
      const city = row.getValue("city") as string;
      const state = row.original.state;
      const zip = row.original.zip;
      const address = row.original.address;
      return (
        <div>
          <div className="text-sm font-medium">
            {city}, {state} {zip}
          </div>
          <div className="text-xs text-muted-foreground">{address}</div>
        </div>
      );
    },
  },
  {
    id: "products",
    header: "Products",
    cell: () => {
      // Placeholder - random number between 50-500
      const count = Math.floor(Math.random() * 450) + 50;
      return <div className="text-sm text-muted-foreground">{count}</div>;
    },
  },
  {
    id: "employees",
    header: "Employees",
    cell: () => {
      // Placeholder - random number between 5-50
      const count = Math.floor(Math.random() * 45) + 5;
      return <div className="text-sm text-muted-foreground">{count}</div>;
    },
  },
  {
    id: "actions",
    header: () => <div className="text-right">Actions</div>,
    cell: ({ row }) => {
      const store = row.original;

      return (
        <div className="flex items-center justify-end gap-1">
          <TooltipProvider delayDuration={0}>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => onEdit(store)}
                  className="h-8 w-8 text-muted-foreground hover:text-foreground"
                >
                  <Pencil className="h-4 w-4" />
                  <span className="sr-only">Edit</span>
                </Button>
              </TooltipTrigger>
              <TooltipContent>Edit store</TooltipContent>
            </Tooltip>
          </TooltipProvider>

          <TooltipProvider delayDuration={0}>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => onDelete(store)}
                  className="h-8 w-8 text-muted-foreground hover:text-destructive"
                >
                  <Trash2 className="h-4 w-4" />
                  <span className="sr-only">Delete</span>
                </Button>
              </TooltipTrigger>
              <TooltipContent>Delete store</TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>
      );
    },
  },
];
