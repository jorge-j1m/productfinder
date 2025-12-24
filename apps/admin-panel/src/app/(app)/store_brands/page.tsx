"use client";

import * as React from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import type { StoreBrand } from "@repo/database/types";
import { orpc } from "#/lib/query/orpc";
import { DataTable } from "./data-table";
import { createColumns } from "./columns";
import { BrandDialog } from "./brand-dialog";
import { DeleteDialog } from "./delete-dialog";
import { toast } from "sonner";
import { isDefinedError } from "@orpc/client";

export default function StoreBrandsPage() {
  const queryClient = useQueryClient();

  // State for pagination, sorting, and filtering
  const [page, setPage] = React.useState(1);
  const [pageSize, setPageSize] = React.useState(10);
  const [search, setSearch] = React.useState("");
  const [sortBy, setSortBy] = React.useState<"name" | "id">("name");
  const [sortOrder, setSortOrder] = React.useState<"asc" | "desc">("asc");

  // Dialog states
  const [brandDialogOpen, setBrandDialogOpen] = React.useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = React.useState(false);
  const [selectedBrand, setSelectedBrand] = React.useState<StoreBrand | null>(
    null,
  );

  // Fetch store brands with oRPC
  const { data, isLoading, isError, error } = useQuery(
    orpc.storeBrands.getAll.queryOptions({
      input: {
        page,
        pageSize,
        search: search || undefined,
        sortBy,
        sortOrder,
      },
    }),
  );

  // Create mutation
  const createMutation = useMutation(
    orpc.storeBrands.create.mutationOptions({
      onSuccess: () => {
        queryClient.invalidateQueries({
          queryKey: orpc.storeBrands.getAll.key(),
        });
        toast.success("Store brand created successfully");
        setBrandDialogOpen(false);
        setSelectedBrand(null);
      },
      onError: (error) => {
        if (isDefinedError(error)) {
          toast.error(error.message);
        } else {
          toast.error("Failed to create store brand");
        }
      },
    }),
  );

  // Update mutation
  const updateMutation = useMutation(
    orpc.storeBrands.update.mutationOptions({
      onSuccess: () => {
        queryClient.invalidateQueries({
          queryKey: orpc.storeBrands.getAll.key(),
        });
        toast.success("Store brand updated successfully");
        setBrandDialogOpen(false);
        setSelectedBrand(null);
      },
      onError: (error) => {
        if (isDefinedError(error)) {
          toast.error(error.message);
        } else {
          toast.error("Failed to update store brand");
        }
      },
    }),
  );

  // Delete mutation
  const deleteMutation = useMutation(
    orpc.storeBrands.delete.mutationOptions({
      onSuccess: () => {
        queryClient.invalidateQueries({
          queryKey: orpc.storeBrands.getAll.key(),
        });
        toast.success("Store brand deleted successfully");
        setDeleteDialogOpen(false);
        setSelectedBrand(null);
      },
      onError: (error) => {
        if (isDefinedError(error)) {
          toast.error(error.message);
        } else {
          toast.error("Failed to delete store brand");
        }
      },
    }),
  );

  // Destructure mutation functions for stable references
  const { mutate: createBrand } = createMutation;
  const { mutate: updateBrand } = updateMutation;
  const { mutate: deleteBrand } = deleteMutation;

  // Handlers
  const handleCreateNew = React.useCallback(() => {
    setSelectedBrand(null);
    setBrandDialogOpen(true);
  }, []);

  const handleEdit = React.useCallback((brand: StoreBrand) => {
    setSelectedBrand(brand);
    setBrandDialogOpen(true);
  }, []);

  const handleDelete = React.useCallback((brand: StoreBrand) => {
    setSelectedBrand(brand);
    setDeleteDialogOpen(true);
  }, []);

  const handleBrandSubmit = React.useCallback(
    (formData: { name: string; logo: string }) => {
      if (selectedBrand) {
        // Update existing brand
        updateBrand({
          id: selectedBrand.id,
          data: formData,
        });
      } else {
        // Create new brand
        createBrand(formData);
      }
    },
    [selectedBrand, updateBrand, createBrand],
  );

  const handleDeleteConfirm = React.useCallback(() => {
    if (selectedBrand) {
      deleteBrand({ id: selectedBrand.id });
    }
  }, [selectedBrand, deleteBrand]);

  const handleSortChange = React.useCallback(
    (field: string, order: "asc" | "desc") => {
      setSortBy(field as "name" | "id");
      setSortOrder(order);
    },
    [],
  );

  const handleSearchChange = React.useCallback((search: string) => {
    setSearch(search);
    setPage(1); // Reset to first page when searching
  }, []);

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
          <h1 className="text-3xl font-bold">Store Brands</h1>
          <p className="text-muted-foreground mt-2">Manage your store brands</p>
        </div>
        <div className="rounded-lg border border-destructive bg-destructive/10 p-4">
          <p className="text-destructive">
            {isDefinedError(error)
              ? error.message
              : "Failed to load store brands. Please try again later."}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Store Brands</h1>
        <p className="text-muted-foreground mt-2">
          Manage your store brands for South Florida locations
        </p>
      </div>

      <DataTable<StoreBrand, unknown>
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
          setPage(1); // Reset to first page when changing page size
        }}
        onSearchChange={handleSearchChange}
        onSortChange={handleSortChange}
        onCreateNew={handleCreateNew}
        isLoading={isLoading}
      />

      <BrandDialog
        open={brandDialogOpen}
        onOpenChange={setBrandDialogOpen}
        brand={selectedBrand}
        onSubmit={handleBrandSubmit}
        isPending={createMutation.isPending || updateMutation.isPending}
      />

      <DeleteDialog
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
        brand={selectedBrand}
        onConfirm={handleDeleteConfirm}
        isPending={deleteMutation.isPending}
      />
    </div>
  );
}
