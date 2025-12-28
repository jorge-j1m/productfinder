"use client";

import { ColumnDef } from "@tanstack/react-table";
import { Button } from "#/components/ui/button";
import { ArrowUpDown, Pencil, Trash2 } from "lucide-react";
import type { StoreBrand } from "@repo/database/types";
import Image from "next/image";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "#/components/ui/tooltip";

type ColumnActionsProps = {
  onEdit: (brand: StoreBrand) => void;
  onDelete: (brand: StoreBrand) => void;
};

export const createColumns = ({
  onEdit,
  onDelete,
}: ColumnActionsProps): ColumnDef<StoreBrand>[] => [
  {
    accessorKey: "logo",
    header: "Logo",
    cell: ({ row }) => {
      const logo = row.getValue("logo") as string;
      const name = row.original.name;
      return (
        <div className="flex items-center">
          <div className="relative h-10 w-10 overflow-hidden rounded-md border bg-muted">
            <Image
              src={logo}
              alt={`${name} logo`}
              fill
              className="object-contain p-1"
              sizes="40px"
              unoptimized
            />
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
      return <div className="font-medium">{name}</div>;
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
    id: "stores",
    header: "Stores",
    cell: () => {
      // Placeholder - random number between 5-100
      const count = Math.floor(Math.random() * 95) + 5;
      return <div className="text-sm text-muted-foreground">{count}</div>;
    },
  },
  {
    id: "employees",
    header: "Employees",
    cell: () => {
      // Placeholder - random number between 50-1000
      const count = Math.floor(Math.random() * 950) + 50;
      return <div className="text-sm text-muted-foreground">{count}</div>;
    },
  },
  {
    id: "actions",
    header: () => <div className="text-right">Actions</div>,
    cell: ({ row }) => {
      const brand = row.original;

      return (
        <div className="flex items-center justify-end gap-1">
          <TooltipProvider delayDuration={0}>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => onEdit(brand)}
                  className="h-8 w-8 text-muted-foreground hover:text-foreground"
                >
                  <Pencil className="h-4 w-4" />
                  <span className="sr-only">Edit</span>
                </Button>
              </TooltipTrigger>
              <TooltipContent>Edit brand</TooltipContent>
            </Tooltip>
          </TooltipProvider>

          <TooltipProvider delayDuration={0}>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => onDelete(brand)}
                  className="h-8 w-8 text-muted-foreground hover:text-destructive"
                >
                  <Trash2 className="h-4 w-4" />
                  <span className="sr-only">Delete</span>
                </Button>
              </TooltipTrigger>
              <TooltipContent>Delete brand</TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>
      );
    },
  },
];
