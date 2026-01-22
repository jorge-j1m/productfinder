"use client";

import * as React from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import type { Product } from "@repo/database/types";
import { orpc } from "#/lib/query/orpc";
import { DataTable } from "./data-table";
import { createColumns } from "./columns";
import { ProductDialog } from "./product-dialog";
import { DeleteDialog } from "./delete-dialog";
import { toast } from "sonner";
import { isDefinedError } from "@orpc/client";

export default function ProductsPage() {
  const queryClient = useQueryClient();

  // State for pagination, sorting, and filtering
  const [page, setPage] = React.useState(1);
  const [pageSize, setPageSize] = React.useState(10);
  const [nameFilter, setNameFilter] = React.useState<string | undefined>(
    undefined,
  );
  const [skuFilter, setSkuFilter] = React.useState<string | undefined>(
    undefined,
  );
  const [stockTypeFilter, setStockTypeFilter] = React.useState<
    "WEIGHT" | "UNITS" | undefined
  >(undefined);
  const [sortBy, setSortBy] = React.useState<"name" | "id" | "sku">("name");
  const [sortOrder, setSortOrder] = React.useState<"asc" | "desc">("asc");

  // Dialog states
  const [productDialogOpen, setProductDialogOpen] = React.useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = React.useState(false);
  const [selectedProduct, setSelectedProduct] = React.useState<Product | null>(
    null,
  );

  // Fetch products with oRPC
  const { data, isLoading, isError, error } = useQuery(
    orpc.products.getAll.queryOptions({
      input: {
        page,
        pageSize,
        name: nameFilter,
        sku: skuFilter,
        stockType: stockTypeFilter,
        sortBy,
        sortOrder,
      },
    }),
  );

  // Create mutation
  const createMutation = useMutation(
    orpc.products.create.mutationOptions({
      onSuccess: () => {
        queryClient.invalidateQueries({
          queryKey: orpc.products.getAll.key(),
        });
        toast.success("Product created successfully");
        setProductDialogOpen(false);
        setSelectedProduct(null);
      },
      onError: (error) => {
        if (isDefinedError(error)) {
          toast.error(error.message);
        } else {
          toast.error("Failed to create product");
        }
      },
    }),
  );

  // Update mutation
  const updateMutation = useMutation(
    orpc.products.update.mutationOptions({
      onSuccess: () => {
        queryClient.invalidateQueries({
          queryKey: orpc.products.getAll.key(),
        });
        toast.success("Product updated successfully");
        setProductDialogOpen(false);
        setSelectedProduct(null);
      },
      onError: (error) => {
        if (isDefinedError(error)) {
          toast.error(error.message);
        } else {
          toast.error("Failed to update product");
        }
      },
    }),
  );

  // Delete mutation
  const deleteMutation = useMutation(
    orpc.products.delete.mutationOptions({
      onSuccess: () => {
        queryClient.invalidateQueries({
          queryKey: orpc.products.getAll.key(),
        });
        toast.success("Product deleted successfully");
        setDeleteDialogOpen(false);
        setSelectedProduct(null);
      },
      onError: (error) => {
        if (isDefinedError(error)) {
          toast.error(error.message);
        } else {
          toast.error("Failed to delete product");
        }
      },
    }),
  );

  // Destructure mutation functions for stable references
  const { mutate: createProduct } = createMutation;
  const { mutate: updateProduct } = updateMutation;
  const { mutate: deleteProduct } = deleteMutation;

  // Handlers
  const handleCreateNew = React.useCallback(() => {
    setSelectedProduct(null);
    setProductDialogOpen(true);
  }, []);

  const handleEdit = React.useCallback((product: Product) => {
    setSelectedProduct(product);
    setProductDialogOpen(true);
  }, []);

  const handleDelete = React.useCallback((product: Product) => {
    setSelectedProduct(product);
    setDeleteDialogOpen(true);
  }, []);

  const handleProductSubmit = React.useCallback(
    (formData: {
      name: string;
      description: string | null;
      sku: string;
      barcode: string | null;
      stockType: "WEIGHT" | "UNITS";
      image: string | null;
    }) => {
      if (selectedProduct) {
        // Update existing product
        updateProduct({
          id: selectedProduct.id,
          data: formData,
        });
      } else {
        // Create new product
        createProduct(formData);
      }
    },
    [selectedProduct, updateProduct, createProduct],
  );

  const handleDeleteConfirm = React.useCallback(() => {
    if (selectedProduct) {
      deleteProduct({ id: selectedProduct.id });
    }
  }, [selectedProduct, deleteProduct]);

  const handleSortChange = React.useCallback(
    (field: string, order: "asc" | "desc") => {
      setSortBy(field as "name" | "id" | "sku");
      setSortOrder(order);
    },
    [],
  );

  const handleFilterChange = React.useCallback(
    (filters: {
      name?: string;
      sku?: string;
      stockType?: "WEIGHT" | "UNITS";
    }) => {
      setNameFilter(filters.name);
      setSkuFilter(filters.sku);
      setStockTypeFilter(filters.stockType);
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
          <h1 className="text-3xl font-bold">Products</h1>
          <p className="text-muted-foreground mt-2">
            Manage your product catalog
          </p>
        </div>
        <div className="rounded-lg border border-destructive bg-destructive/10 p-4">
          <p className="text-destructive">
            {isDefinedError(error)
              ? error.message
              : "Failed to load products. Please try again later."}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Data Table */}
      <DataTable<Product, unknown>
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

      <ProductDialog
        open={productDialogOpen}
        onOpenChange={setProductDialogOpen}
        product={selectedProduct}
        onSubmit={handleProductSubmit}
        isPending={createMutation.isPending || updateMutation.isPending}
      />

      <DeleteDialog
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
        product={selectedProduct}
        onConfirm={handleDeleteConfirm}
        isPending={deleteMutation.isPending}
      />
    </div>
  );
}
