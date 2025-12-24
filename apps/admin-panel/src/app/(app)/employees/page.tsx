"use client";

import * as React from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import type { Employee, Store } from "@repo/database/types";
import { asStoreId } from "@repo/database";
import { orpc } from "#/lib/query/orpc";
import { DataTable } from "./data-table";
import { createColumns } from "./columns";
import {
  CreateEmployeeDialog,
  type CreateEmployeeData,
} from "./create-employee-dialog";
import {
  EditEmployeeDialog,
  type UpdateEmployeeData,
} from "./edit-employee-dialog";
import { DeleteDialog } from "./delete-dialog";
import { toast } from "sonner";
import { isDefinedError } from "@orpc/client";

// Employee with store relation - follows same pattern as StoreWithBrand
type EmployeeWithStore = Employee & { store: Store };

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8080";

export default function EmployeesPage() {
  const queryClient = useQueryClient();

  // State for pagination, sorting, and filtering
  const [page, setPage] = React.useState(1);
  const [pageSize, setPageSize] = React.useState(10);
  const [filters, setFilters] = React.useState<{
    name?: string;
    email?: string;
    role?: string;
    status?: string;
  }>({});
  const [sortBy, setSortBy] = React.useState<"name" | "id" | "email" | "role">(
    "name",
  );
  const [sortOrder, setSortOrder] = React.useState<"asc" | "desc">("asc");

  // Dialog states
  const [createDialogOpen, setCreateDialogOpen] = React.useState(false);
  const [editDialogOpen, setEditDialogOpen] = React.useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = React.useState(false);
  const [selectedEmployee, setSelectedEmployee] =
    React.useState<EmployeeWithStore | null>(null);

  // Fetch employees with oRPC
  const { data, isLoading, isError, error } = useQuery(
    orpc.employees.getAll.queryOptions({
      input: {
        page,
        pageSize,
        name: filters.name,
        email: filters.email,
        role: filters.role as "STAFF" | "MANAGER" | "ADMIN" | undefined,
        status: filters.status as "ACTIVE" | "SUSPENDED" | undefined,
        sortBy,
        sortOrder,
      },
    }),
  );

  // Fetch all stores for the dropdown
  const { data: storesData } = useQuery(
    orpc.stores.getAll.queryOptions({
      input: {
        page: 1,
        pageSize: 100,
        sortBy: "name",
        sortOrder: "asc",
      },
    }),
  );

  // Create mutation using better-auth sign-up endpoint
  const createMutation = useMutation({
    mutationFn: async (data: CreateEmployeeData) => {
      const response = await fetch(
        `${API_URL}/api/employee-auth/sign-up/email`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(data),
        },
      );

      if (!response.ok) {
        const errorData = await response.json().catch(() => null);
        const errorMessage =
          errorData?.message || errorData?.error || "Failed to create employee";
        throw new Error(errorMessage);
      }

      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: orpc.employees.getAll.key(),
      });
      toast.success("Employee created successfully", {
        description: "Login credentials are now active",
      });
      setCreateDialogOpen(false);
    },
    onError: (error) => {
      toast.error("Failed to create employee", {
        description: error instanceof Error ? error.message : "Unknown error",
      });
    },
  });

  // Update mutation using oRPC
  const updateMutation = useMutation(
    orpc.employees.update.mutationOptions({
      onSuccess: () => {
        queryClient.invalidateQueries({
          queryKey: orpc.employees.getAll.key(),
        });
        toast.success("Employee updated successfully");
        setEditDialogOpen(false);
        setSelectedEmployee(null);
      },
      onError: (error) => {
        if (isDefinedError(error)) {
          toast.error("Failed to update employee", {
            description: error.message,
          });
        } else {
          toast.error("Failed to update employee");
        }
      },
    }),
  );

  // Delete mutation using oRPC
  const deleteMutation = useMutation(
    orpc.employees.delete.mutationOptions({
      onSuccess: () => {
        queryClient.invalidateQueries({
          queryKey: orpc.employees.getAll.key(),
        });
        toast.success("Employee deleted successfully");
        setDeleteDialogOpen(false);
        setSelectedEmployee(null);
      },
      onError: (error) => {
        if (isDefinedError(error)) {
          toast.error("Failed to delete employee", {
            description: error.message,
          });
        } else {
          toast.error("Failed to delete employee");
        }
      },
    }),
  );

  // Password reset mutation using better-auth
  const passwordResetMutation = useMutation({
    mutationFn: async (email: string) => {
      const response = await fetch(
        `${API_URL}/api/employee-auth/forget-password`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            email,
            redirectTo: `${window.location.origin}/reset-password`,
          }),
        },
      );

      if (!response.ok) {
        const errorData = await response.json().catch(() => null);
        const errorMessage =
          errorData?.message ||
          errorData?.error ||
          "Failed to send password reset email";
        throw new Error(errorMessage);
      }

      return response.json();
    },
    onSuccess: () => {
      toast.success("Password reset email sent", {
        description:
          "The employee will receive instructions to reset their password",
      });
    },
    onError: (error) => {
      toast.error("Failed to send password reset email", {
        description: error instanceof Error ? error.message : "Unknown error",
      });
    },
  });

  // Destructure mutation functions for stable references
  const { mutate: createEmployee } = createMutation;
  const { mutate: updateEmployee } = updateMutation;
  const { mutate: deleteEmployee } = deleteMutation;
  const { mutate: sendPasswordReset } = passwordResetMutation;

  // Handlers
  const handleCreateNew = React.useCallback(() => {
    setCreateDialogOpen(true);
  }, []);

  const handleEdit = React.useCallback((employee: EmployeeWithStore) => {
    setSelectedEmployee(employee);
    setEditDialogOpen(true);
  }, []);

  const handleDelete = React.useCallback((employee: EmployeeWithStore) => {
    setSelectedEmployee(employee);
    setDeleteDialogOpen(true);
  }, []);

  const handleCreateSubmit = React.useCallback(
    (formData: CreateEmployeeData) => {
      createEmployee({
        ...formData,
        storeId: asStoreId(formData.storeId),
      });
    },
    [createEmployee],
  );

  const handleEditSubmit = React.useCallback(
    (formData: UpdateEmployeeData) => {
      if (!selectedEmployee) return;

      updateEmployee({
        id: selectedEmployee.id,
        data: formData,
      });
    },
    [selectedEmployee, updateEmployee],
  );

  const handlePasswordReset = React.useCallback(
    (email: string) => {
      sendPasswordReset(email);
    },
    [sendPasswordReset],
  );

  const handleDeleteConfirm = React.useCallback(() => {
    if (selectedEmployee) {
      deleteEmployee({ id: selectedEmployee.id });
    }
  }, [selectedEmployee, deleteEmployee]);

  const handleSortChange = React.useCallback(
    (field: string, order: "asc" | "desc") => {
      setSortBy(field as "name" | "id" | "email" | "role");
      setSortOrder(order);
    },
    [],
  );

  const handleFilterChange = React.useCallback(
    (newFilters: {
      name?: string;
      email?: string;
      role?: string;
      status?: string;
    }) => {
      setFilters(newFilters);
      setPage(1); // Reset to first page when filtering
    },
    [],
  );

  const columns = React.useMemo(
    () =>
      createColumns({
        onEdit: handleEdit,
        onDelete: handleDelete,
      }),
    [handleEdit, handleDelete],
  );

  // Error state
  if (isError) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Employees</h1>
          <p className="text-muted-foreground mt-2">Manage your team members</p>
        </div>
        <div className="rounded-lg border border-destructive bg-destructive/10 p-4">
          <p className="text-destructive">
            {isDefinedError(error)
              ? error.message
              : "Failed to load employees. Please try again later."}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Employees</h1>
        <p className="text-muted-foreground mt-2">
          Manage your team members across all store locations
        </p>
      </div>

      <DataTable<EmployeeWithStore, unknown>
        columns={columns}
        data={data?.data ?? []}
        pagination={
          data?.pagination || {
            page: 1,
            pageSize: 10,
            total: 0,
            totalPages: 0,
          }
        }
        onPageChange={setPage}
        onPageSizeChange={(newPageSize) => {
          setPageSize(newPageSize);
          setPage(1);
        }}
        onFilterChange={handleFilterChange}
        onSortChange={handleSortChange}
        onCreateNew={handleCreateNew}
        isLoading={isLoading}
      />

      <CreateEmployeeDialog
        open={createDialogOpen}
        onOpenChange={setCreateDialogOpen}
        stores={storesData?.data ?? []}
        onSubmit={handleCreateSubmit}
        isPending={createMutation.isPending}
      />

      {selectedEmployee && (
        <EditEmployeeDialog
          open={editDialogOpen}
          onOpenChange={setEditDialogOpen}
          employee={selectedEmployee}
          onSubmit={handleEditSubmit}
          onSendPasswordReset={handlePasswordReset}
          isPending={updateMutation.isPending}
          isResettingPassword={passwordResetMutation.isPending}
        />
      )}

      <DeleteDialog
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
        employee={selectedEmployee}
        onConfirm={handleDeleteConfirm}
        isPending={deleteMutation.isPending}
      />
    </div>
  );
}
