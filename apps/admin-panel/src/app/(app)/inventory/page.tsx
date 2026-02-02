"use client";

import * as React from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { asStoreId, asProductId } from "@repo/database";
import { orpc } from "#/lib/query/orpc";
import { DataTable } from "./data-table";
import { createColumns, type InventoryWithRelations } from "./columns";
import { InventoryDialog } from "./inventory-dialog";
import { AdjustStockDialog } from "./adjust-stock-dialog";
import { SaleDialog } from "./sale-dialog";
import { DeleteDialog } from "./delete-dialog";
import { toast } from "sonner";
import { isDefinedError } from "@orpc/client";

export default function InventoryPage() {
  const queryClient = useQueryClient();

  // State for pagination, sorting, and filtering
  const [page, setPage] = React.useState(1);
  const [pageSize, setPageSize] = React.useState(10);
  const [storeFilter, setStoreFilter] = React.useState<string | undefined>(
    undefined,
  );
  const [productFilter, setProductFilter] = React.useState<string | undefined>(
    undefined,
  );
  const [sortBy, setSortBy] = React.useState<
    "quantity" | "regularPrice" | "salePrice" | "id"
  >("id");
  const [sortOrder, setSortOrder] = React.useState<"asc" | "desc">("asc");

  // Dialog states
  const [inventoryDialogOpen, setInventoryDialogOpen] = React.useState(false);
  const [adjustStockDialogOpen, setAdjustStockDialogOpen] =
    React.useState(false);
  const [saleDialogOpen, setSaleDialogOpen] = React.useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = React.useState(false);
  const [selectedInventory, setSelectedInventory] =
    React.useState<InventoryWithRelations | null>(null);
  const [dialogError, setDialogError] = React.useState<string | null>(null);

  // Fetch inventory with oRPC
  const { data, isLoading, isError, error } = useQuery(
    orpc.inventory.getAll.queryOptions({
      input: {
        page,
        pageSize,
        storeId: storeFilter,
        productId: productFilter,
        sortBy,
        sortOrder,
      },
    }),
  );

  // Fetch stores for filter dropdown
  const { data: storesData, isLoading: storesLoading } = useQuery(
    orpc.stores.getAll.queryOptions({
      input: { page: 1, pageSize: 100 },
    }),
  );

  // Fetch products for filter dropdown
  const { data: productsData, isLoading: productsLoading } = useQuery(
    orpc.products.getAll.queryOptions({
      input: { page: 1, pageSize: 100 },
    }),
  );

  // Map stores and products for dropdowns
  const stores = React.useMemo(
    () => storesData?.data.map((s) => ({ id: s.id, name: s.name })) || [],
    [storesData],
  );

  const products = React.useMemo(
    () =>
      productsData?.data.map((p) => ({
        id: p.id,
        name: p.name,
        stockType: p.stockType,
      })) || [],
    [productsData],
  );

  // Create mutation
  const createMutation = useMutation(
    orpc.inventory.create.mutationOptions({
      onSuccess: () => {
        queryClient.invalidateQueries({
          queryKey: orpc.inventory.getAll.key(),
        });
        toast.success("Inventory created successfully");
        setInventoryDialogOpen(false);
        setSelectedInventory(null);
        setDialogError(null);
      },
      onError: (error) => {
        if (isDefinedError(error)) {
          setDialogError(error.message);
        } else {
          toast.error("Failed to create inventory");
        }
      },
    }),
  );

  // Update mutation
  const updateMutation = useMutation(
    orpc.inventory.update.mutationOptions({
      onSuccess: () => {
        queryClient.invalidateQueries({
          queryKey: orpc.inventory.getAll.key(),
        });
        toast.success("Inventory updated successfully");
        setInventoryDialogOpen(false);
        setSelectedInventory(null);
        setDialogError(null);
      },
      onError: (error) => {
        if (isDefinedError(error)) {
          setDialogError(error.message);
        } else {
          toast.error("Failed to update inventory");
        }
      },
    }),
  );

  // Adjust stock mutation
  const adjustStockMutation = useMutation(
    orpc.inventory.adjustStock.mutationOptions({
      onSuccess: () => {
        queryClient.invalidateQueries({
          queryKey: orpc.inventory.getAll.key(),
        });
        toast.success("Stock adjusted successfully");
        setAdjustStockDialogOpen(false);
        setSelectedInventory(null);
        setDialogError(null);
      },
      onError: (error) => {
        if (isDefinedError(error)) {
          setDialogError(error.message);
        } else {
          toast.error("Failed to adjust stock");
        }
      },
    }),
  );

  // Set sale mutation
  const setSaleMutation = useMutation(
    orpc.inventory.setSale.mutationOptions({
      onSuccess: () => {
        queryClient.invalidateQueries({
          queryKey: orpc.inventory.getAll.key(),
        });
        toast.success("Sale set successfully");
        setSaleDialogOpen(false);
        setSelectedInventory(null);
        setDialogError(null);
      },
      onError: (error) => {
        if (isDefinedError(error)) {
          setDialogError(error.message);
        } else {
          toast.error("Failed to set sale");
        }
      },
    }),
  );

  // Clear sale mutation
  const clearSaleMutation = useMutation(
    orpc.inventory.clearSale.mutationOptions({
      onSuccess: () => {
        queryClient.invalidateQueries({
          queryKey: orpc.inventory.getAll.key(),
        });
        toast.success("Sale cleared successfully");
        setSaleDialogOpen(false);
        setSelectedInventory(null);
        setDialogError(null);
      },
      onError: (error) => {
        if (isDefinedError(error)) {
          toast.error(error.message);
        } else {
          toast.error("Failed to clear sale");
        }
      },
    }),
  );

  // Delete mutation
  const deleteMutation = useMutation(
    orpc.inventory.delete.mutationOptions({
      onSuccess: () => {
        queryClient.invalidateQueries({
          queryKey: orpc.inventory.getAll.key(),
        });
        toast.success("Inventory deleted successfully");
        setDeleteDialogOpen(false);
        setSelectedInventory(null);
      },
      onError: (error) => {
        if (isDefinedError(error)) {
          toast.error(error.message);
        } else {
          toast.error("Failed to delete inventory");
        }
      },
    }),
  );

  // Handlers
  const handleCreateNew = React.useCallback(() => {
    setSelectedInventory(null);
    setDialogError(null);
    setInventoryDialogOpen(true);
  }, []);

  const handleEdit = React.useCallback((inventory: InventoryWithRelations) => {
    setSelectedInventory(inventory);
    setDialogError(null);
    setInventoryDialogOpen(true);
  }, []);

  const handleDelete = React.useCallback(
    (inventory: InventoryWithRelations) => {
      setSelectedInventory(inventory);
      setDeleteDialogOpen(true);
    },
    [],
  );

  const handleAdjustStock = React.useCallback(
    (inventory: InventoryWithRelations) => {
      setSelectedInventory(inventory);
      setDialogError(null);
      setAdjustStockDialogOpen(true);
    },
    [],
  );

  const handleManageSale = React.useCallback(
    (inventory: InventoryWithRelations) => {
      setSelectedInventory(inventory);
      setDialogError(null);
      setSaleDialogOpen(true);
    },
    [],
  );

  const handleInventorySubmit = React.useCallback(
    (formData: {
      storeId: string;
      productId: string;
      quantity: number;
      regularPrice: number;
      salePrice: number | null;
      saleStartDate: Date | null;
      saleEndDate: Date | null;
    }) => {
      if (selectedInventory) {
        // Update existing - only send updatable fields
        updateMutation.mutate({
          id: selectedInventory.id,
          data: {
            quantity: formData.quantity,
            regularPrice: formData.regularPrice,
            salePrice: formData.salePrice,
            saleStartDate: formData.saleStartDate,
            saleEndDate: formData.saleEndDate,
          },
        });
      } else {
        // Create new - convert string IDs to branded types
        createMutation.mutate({
          ...formData,
          storeId: asStoreId(formData.storeId),
          productId: asProductId(formData.productId),
        });
      }
    },
    [selectedInventory, updateMutation, createMutation],
  );

  const handleAdjustStockSubmit = React.useCallback(
    (inventoryId: string, delta: number) => {
      adjustStockMutation.mutate({ id: inventoryId, delta });
    },
    [adjustStockMutation],
  );

  const handleSetSale = React.useCallback(
    (
      inventoryId: string,
      salePrice: number,
      saleStartDate: Date | undefined,
      saleEndDate: Date | undefined,
    ) => {
      setSaleMutation.mutate({
        id: inventoryId,
        salePrice,
        saleStartDate,
        saleEndDate,
      });
    },
    [setSaleMutation],
  );

  const handleClearSale = React.useCallback(
    (inventoryId: string) => {
      clearSaleMutation.mutate({ id: inventoryId });
    },
    [clearSaleMutation],
  );

  const handleDeleteConfirm = React.useCallback(() => {
    if (selectedInventory) {
      deleteMutation.mutate({ id: selectedInventory.id });
    }
  }, [selectedInventory, deleteMutation]);

  const handleSortChange = React.useCallback(
    (field: string, order: "asc" | "desc") => {
      setSortBy(field as "quantity" | "regularPrice" | "salePrice" | "id");
      setSortOrder(order);
    },
    [],
  );

  const handleFilterChange = React.useCallback(
    (filters: { storeId?: string; productId?: string }) => {
      setStoreFilter(filters.storeId);
      setProductFilter(filters.productId);
      setPage(1);
    },
    [],
  );

  const columns = React.useMemo(
    () =>
      createColumns({
        onEdit: handleEdit,
        onDelete: handleDelete,
        onAdjustStock: handleAdjustStock,
        onManageSale: handleManageSale,
      }),
    [handleEdit, handleDelete, handleAdjustStock, handleManageSale],
  );

  // Error state
  if (isError) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Inventory</h1>
          <p className="text-muted-foreground mt-2">
            Manage stock and pricing for products at stores
          </p>
        </div>
        <div className="rounded-lg border border-destructive bg-destructive/10 p-4">
          <p className="text-destructive">
            {isDefinedError(error)
              ? error.message
              : "Failed to load inventory. Please try again later."}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Data Table */}
      <DataTable<InventoryWithRelations, unknown>
        columns={columns}
        data={(data?.data as InventoryWithRelations[]) ?? []}
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
        stores={stores}
        products={products}
        storesLoading={storesLoading}
        productsLoading={productsLoading}
      />

      <InventoryDialog
        open={inventoryDialogOpen}
        onOpenChange={(open) => {
          setInventoryDialogOpen(open);
          if (!open) setDialogError(null);
        }}
        inventory={selectedInventory}
        onSubmit={handleInventorySubmit}
        isPending={createMutation.isPending || updateMutation.isPending}
        serverError={dialogError}
        stores={stores}
        products={products}
      />

      <AdjustStockDialog
        open={adjustStockDialogOpen}
        onOpenChange={(open) => {
          setAdjustStockDialogOpen(open);
          if (!open) setDialogError(null);
        }}
        inventory={selectedInventory}
        onSubmit={handleAdjustStockSubmit}
        isPending={adjustStockMutation.isPending}
        serverError={dialogError}
      />

      <SaleDialog
        open={saleDialogOpen}
        onOpenChange={(open) => {
          setSaleDialogOpen(open);
          if (!open) setDialogError(null);
        }}
        inventory={selectedInventory}
        onSetSale={handleSetSale}
        onClearSale={handleClearSale}
        isPending={setSaleMutation.isPending || clearSaleMutation.isPending}
        serverError={dialogError}
      />

      <DeleteDialog
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
        inventory={selectedInventory}
        onConfirm={handleDeleteConfirm}
        isPending={deleteMutation.isPending}
      />
    </div>
  );
}
