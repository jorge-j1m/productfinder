"use client";

import * as React from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import type { Store, StoreBrand } from "@repo/database/types";
import { asStoreBrandId } from "@repo/database";
import { orpc } from "#/lib/query/orpc";
import { DataTable } from "./data-table";
import { createColumns } from "./columns";
import { StoreDialog } from "./store-dialog";
import { DeleteDialog } from "./delete-dialog";
import { toast } from "sonner";
import { isDefinedError } from "@orpc/client";

type StoreWithBrand = Store & { brand: StoreBrand };

export default function StoresPage() {
  const queryClient = useQueryClient();

  // State for pagination, sorting, and filtering
  const [page, setPage] = React.useState(1);
  const [pageSize, setPageSize] = React.useState(10);
  const [filters, setFilters] = React.useState<{
    name?: string;
    city?: string;
    state?: string;
    zip?: string;
  }>({});
  const [sortBy, setSortBy] = React.useState<"name" | "id" | "city">("name");
  const [sortOrder, setSortOrder] = React.useState<"asc" | "desc">("asc");

  // Dialog states
  const [storeDialogOpen, setStoreDialogOpen] = React.useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = React.useState(false);
  const [selectedStore, setSelectedStore] =
    React.useState<StoreWithBrand | null>(null);

  // Fetch stores with oRPC
  const { data, isLoading, isError, error } = useQuery(
    orpc.stores.getAll.queryOptions({
      input: {
        page,
        pageSize,
        name: filters.name,
        city: filters.city,
        state: filters.state,
        zip: filters.zip,
        sortBy,
        sortOrder,
      },
    }),
  );

  // Fetch all brands for the dropdown
  const { data: brandsData } = useQuery(
    orpc.storeBrands.getAll.queryOptions({
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
    orpc.stores.create.mutationOptions({
      onSuccess: () => {
        queryClient.invalidateQueries({
          queryKey: orpc.stores.getAll.key(),
        });
        toast.success("Store created successfully");
        setStoreDialogOpen(false);
        setSelectedStore(null);
      },
      onError: (error) => {
        if (isDefinedError(error)) {
          toast.error(error.message);
        } else {
          toast.error("Failed to create store");
        }
      },
    }),
  );

  // Update mutation
  const updateMutation = useMutation(
    orpc.stores.update.mutationOptions({
      onSuccess: () => {
        queryClient.invalidateQueries({
          queryKey: orpc.stores.getAll.key(),
        });
        toast.success("Store updated successfully");
        setStoreDialogOpen(false);
        setSelectedStore(null);
      },
      onError: (error) => {
        if (isDefinedError(error)) {
          toast.error(error.message);
        } else {
          toast.error("Failed to update store");
        }
      },
    }),
  );

  // Delete mutation
  const deleteMutation = useMutation(
    orpc.stores.delete.mutationOptions({
      onSuccess: () => {
        queryClient.invalidateQueries({
          queryKey: orpc.stores.getAll.key(),
        });
        toast.success("Store deleted successfully");
        setDeleteDialogOpen(false);
        setSelectedStore(null);
      },
      onError: (error) => {
        if (isDefinedError(error)) {
          toast.error(error.message);
        } else {
          toast.error("Failed to delete store");
        }
      },
    }),
  );

  // Destructure mutation functions for stable references
  const { mutate: createStore } = createMutation;
  const { mutate: updateStore } = updateMutation;
  const { mutate: deleteStore } = deleteMutation;

  // Handlers
  const handleCreateNew = React.useCallback(() => {
    setSelectedStore(null);
    setStoreDialogOpen(true);
  }, []);

  const handleEdit = React.useCallback((store: StoreWithBrand) => {
    setSelectedStore(store);
    setStoreDialogOpen(true);
  }, []);

  const handleDelete = React.useCallback((store: StoreWithBrand) => {
    setSelectedStore(store);
    setDeleteDialogOpen(true);
  }, []);

  const handleStoreSubmit = React.useCallback(
    (formData: {
      brandId: string;
      name: string;
      address: string;
      city: string;
      state: string;
      zip: string;
      countryCode: string;
      latitude: number;
      longitude: number;
    }) => {
      if (selectedStore) {
        // Update existing store (exclude brandId)
        const { brandId: _brandId, ...updateData } = formData;
        updateStore({
          id: selectedStore.id,
          data: updateData,
        });
      } else {
        // Create new store
        createStore({
          ...formData,
          brandId: asStoreBrandId(formData.brandId),
        });
      }
    },
    [selectedStore, updateStore, createStore],
  );

  const handleDeleteConfirm = React.useCallback(() => {
    if (selectedStore) {
      deleteStore({ id: selectedStore.id });
    }
  }, [selectedStore, deleteStore]);

  const handleSortChange = React.useCallback(
    (field: string, order: "asc" | "desc") => {
      setSortBy(field as "name" | "id" | "city");
      setSortOrder(order);
    },
    [],
  );

  const handleFilterChange = React.useCallback(
    (newFilters: {
      name?: string;
      city?: string;
      state?: string;
      zip?: string;
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
          <h1 className="text-3xl font-bold">Stores</h1>
          <p className="text-muted-foreground mt-2">
            Manage your store locations
          </p>
        </div>
        <div className="rounded-lg border border-destructive bg-destructive/10 p-4">
          <p className="text-destructive">
            {isDefinedError(error)
              ? error.message
              : "Failed to load stores. Please try again later."}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Stores</h1>
        <p className="text-muted-foreground mt-2">
          Manage your store locations across South Florida
        </p>
      </div>

      {/* Data Table */}
      <DataTable<StoreWithBrand, unknown>
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

      <StoreDialog
        open={storeDialogOpen}
        onOpenChange={setStoreDialogOpen}
        store={selectedStore}
        brands={brandsData?.data ?? []}
        onSubmit={handleStoreSubmit}
        isPending={createMutation.isPending || updateMutation.isPending}
      />

      <DeleteDialog
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
        store={selectedStore}
        onConfirm={handleDeleteConfirm}
        isPending={deleteMutation.isPending}
      />
    </div>
  );
}
