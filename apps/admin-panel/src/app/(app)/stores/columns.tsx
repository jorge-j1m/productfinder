"use client";

import { ColumnDef } from "@tanstack/react-table";
import { Button } from "#/components/ui/button";
import { ArrowUpDown, Pencil, Trash2 } from "lucide-react";
import type { Store, StoreBrand } from "@repo/database/types";

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
    accessorKey: "brand",
    header: "Brand",
    cell: ({ row }) => {
      const brand = row.original.brand;
      return <div className="text-muted-foreground">{brand.name}</div>;
    },
  },
  {
    accessorKey: "address",
    header: "Address",
    cell: ({ row }) => {
      const address = row.getValue("address") as string;
      return <div className="text-sm">{address}</div>;
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
          City
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      );
    },
    cell: ({ row }) => {
      const city = row.getValue("city") as string;
      const state = row.original.state;
      const zip = row.original.zip;
      return (
        <div className="text-sm">
          {city}, {state} {zip}
        </div>
      );
    },
  },
  {
    accessorKey: "id",
    header: "ID",
    cell: ({ row }) => {
      const id = row.getValue("id") as string;
      return (
        <div className="font-mono text-xs text-muted-foreground">{id}</div>
      );
    },
  },
  {
    id: "actions",
    header: "Actions",
    cell: ({ row }) => {
      const store = row.original;

      return (
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onEdit(store)}
            className="h-8 px-2"
          >
            <Pencil className="mr-1 h-4 w-4" />
            Edit
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onDelete(store)}
            className="h-8 px-2 text-destructive hover:text-destructive hover:bg-destructive/10"
          >
            <Trash2 className="mr-1 h-4 w-4" />
            Delete
          </Button>
        </div>
      );
    },
  },
];
