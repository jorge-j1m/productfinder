"use client";

import * as React from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import type { Employee, Store } from "@repo/database/types";
import { asStoreId } from "@repo/database";
import { orpc } from "#/lib/query/orpc";
import { DataTable } from "./data-table";
import { createColumns } from "./columns";
import { EmployeeDialog } from "./employee-dialog";
import { DeleteDialog } from "./delete-dialog";
import { toast } from "sonner";
import { isDefinedError } from "@orpc/client";

type EmployeeWithStore = Employee & { store: Store };

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
  const [employeeDialogOpen, setEmployeeDialogOpen] = React.useState(false);
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

  // Create mutation
  const createMutation = useMutation(
    orpc.employees.create.mutationOptions({
      onSuccess: () => {
        queryClient.invalidateQueries({
          queryKey: orpc.employees.getAll.key(),
        });
        toast.success("Employee created successfully");
        setEmployeeDialogOpen(false);
        setSelectedEmployee(null);
      },
      onError: (error) => {
        if (isDefinedError(error)) {
          toast.error(error.message);
        } else {
          toast.error("Failed to create employee");
        }
      },
    }),
  );

  // Update mutation
  const updateMutation = useMutation(
    orpc.employees.update.mutationOptions({
      onSuccess: () => {
        queryClient.invalidateQueries({
          queryKey: orpc.employees.getAll.key(),
        });
        toast.success("Employee updated successfully");
        setEmployeeDialogOpen(false);
        setSelectedEmployee(null);
      },
      onError: (error) => {
        if (isDefinedError(error)) {
          toast.error(error.message);
        } else {
          toast.error("Failed to update employee");
        }
      },
    }),
  );

  // Delete mutation
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
          toast.error(error.message);
        } else {
          toast.error("Failed to delete employee");
        }
      },
    }),
  );

  // Destructure mutation functions for stable references
  const { mutate: createEmployee } = createMutation;
  const { mutate: updateEmployee } = updateMutation;
  const { mutate: deleteEmployee } = deleteMutation;

  // Handlers
  const handleCreateNew = React.useCallback(() => {
    setSelectedEmployee(null);
    setEmployeeDialogOpen(true);
  }, []);

  const handleEdit = React.useCallback((employee: EmployeeWithStore) => {
    setSelectedEmployee(employee);
    setEmployeeDialogOpen(true);
  }, []);

  const handleDelete = React.useCallback((employee: EmployeeWithStore) => {
    setSelectedEmployee(employee);
    setDeleteDialogOpen(true);
  }, []);

  const handleEmployeeSubmit = React.useCallback(
    (formData: {
      storeId: string;
      name: string;
      firstName: string;
      lastName: string;
      email: string;
      role: "STAFF" | "MANAGER" | "ADMIN";
      status: "ACTIVE" | "SUSPENDED";
    }) => {
      if (selectedEmployee) {
        // Update existing employee (exclude storeId and email)
        const { storeId: _storeId, email: _email, ...updateData } = formData;
        updateEmployee({
          id: selectedEmployee.id,
          data: updateData,
        });
      } else {
        // Create new employee
        createEmployee({
          ...formData,
          storeId: asStoreId(formData.storeId),
          emailVerified: false,
        });
      }
    },
    [selectedEmployee, updateEmployee, createEmployee],
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
          <p className="text-muted-foreground mt-2">
            Manage your team members
          </p>
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

      <EmployeeDialog
        open={employeeDialogOpen}
        onOpenChange={setEmployeeDialogOpen}
        employee={selectedEmployee}
        stores={storesData?.data ?? []}
        onSubmit={handleEmployeeSubmit}
        isPending={createMutation.isPending || updateMutation.isPending}
      />

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
