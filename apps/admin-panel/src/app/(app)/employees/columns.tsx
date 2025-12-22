"use client";

import { ColumnDef } from "@tanstack/react-table";
import { Button } from "#/components/ui/button";
import { Badge } from "#/components/ui/badge";
import { ArrowUpDown, Pencil, Trash2, Mail, MapPin } from "lucide-react";
import type { Employee, Store } from "@repo/database/types";

type EmployeeWithStore = Employee & { store: Store };

type ColumnActionsProps = {
  onEdit: (employee: EmployeeWithStore) => void;
  onDelete: (employee: EmployeeWithStore) => void;
};

// Role badge colors
const getRoleBadgeVariant = (role: string) => {
  switch (role) {
    case "ADMIN":
      return "default"; // Blue/primary
    case "MANAGER":
      return "secondary"; // Purple/secondary
    case "STAFF":
      return "outline"; // Gray outline
    default:
      return "outline";
  }
};

// Status badge colors
const getStatusColor = (status: string) => {
  switch (status) {
    case "ACTIVE":
      return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300";
    case "SUSPENDED":
      return "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300";
    default:
      return "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300";
  }
};

export const createColumns = ({
  onEdit,
  onDelete,
}: ColumnActionsProps): ColumnDef<EmployeeWithStore>[] => [
  {
    accessorKey: "name",
    header: ({ column }) => {
      return (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        >
          Employee
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      );
    },
    cell: ({ row }) => {
      const name = row.getValue("name") as string;
      const email = row.original.email;
      const initials = name
        .split(" ")
        .map((n) => n[0])
        .join("")
        .toUpperCase()
        .slice(0, 2);

      return (
        <div className="flex items-center gap-3">
          {/* Avatar */}
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-blue-500 to-purple-600 text-sm font-semibold text-white">
            {initials}
          </div>
          <div className="flex flex-col">
            <span className="font-medium">{name}</span>
            <span className="flex items-center gap-1 text-xs text-muted-foreground">
              <Mail className="h-3 w-3" />
              {email}
            </span>
          </div>
        </div>
      );
    },
  },
  {
    accessorKey: "role",
    header: ({ column }) => {
      return (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        >
          Role
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      );
    },
    cell: ({ row }) => {
      const role = row.getValue("role") as string;
      return (
        <Badge variant={getRoleBadgeVariant(role)} className="font-medium">
          {role}
        </Badge>
      );
    },
  },
  {
    accessorKey: "status",
    header: "Status",
    cell: ({ row }) => {
      const status = row.getValue("status") as string;
      return (
        <Badge
          className={`${getStatusColor(status)} border-0 font-medium`}
          variant="outline"
        >
          {status}
        </Badge>
      );
    },
  },
  {
    accessorKey: "store",
    header: "Store",
    cell: ({ row }) => {
      const store = row.original.store;
      return (
        <div className="flex flex-col">
          <span className="font-medium text-sm">{store.name}</span>
          <span className="flex items-center gap-1 text-xs text-muted-foreground">
            <MapPin className="h-3 w-3" />
            {store.city}, {store.state}
          </span>
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
      const employee = row.original;

      return (
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onEdit(employee)}
            className="h-8 px-2"
          >
            <Pencil className="mr-1 h-4 w-4" />
            Edit
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onDelete(employee)}
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
