"use client";

import * as React from "react";
import {
  ColumnDef,
  SortingState,
  flexRender,
  getCoreRowModel,
  getSortedRowModel,
  useReactTable,
} from "@tanstack/react-table";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "#/components/ui/table";
import { Button } from "#/components/ui/button";
import { Input } from "#/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "#/components/ui/select";
import { ChevronLeft, ChevronRight, Plus, Package } from "lucide-react";
import { Skeleton } from "#/components/ui/skeleton";

interface PaginationInfo {
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
}

interface DataTableProps<TData, TValue> {
  columns: ColumnDef<TData, TValue>[];
  data: TData[];
  pagination: PaginationInfo;
  onPageChange: (page: number) => void;
  onPageSizeChange: (pageSize: number) => void;
  onFilterChange: (filters: {
    name?: string;
    sku?: string;
    stockType?: "WEIGHT" | "UNITS";
  }) => void;
  onSortChange: (sortBy: string, sortOrder: "asc" | "desc") => void;
  onCreateNew: () => void;
  isLoading?: boolean;
}

export function DataTable<TData, TValue>({
  columns,
  data,
  pagination,
  onPageChange,
  onPageSizeChange,
  onFilterChange,
  onSortChange,
  onCreateNew,
  isLoading = false,
}: DataTableProps<TData, TValue>) {
  const [sorting, setSorting] = React.useState<SortingState>([]);
  const [nameFilter, setNameFilter] = React.useState("");
  const [skuFilter, setSkuFilter] = React.useState("");
  const [stockTypeFilter, setStockTypeFilter] = React.useState<string>("all");

  // Use refs to store latest callbacks to avoid effect re-runs
  const onFilterChangeRef = React.useRef(onFilterChange);
  const onSortChangeRef = React.useRef(onSortChange);

  React.useEffect(() => {
    onFilterChangeRef.current = onFilterChange;
  }, [onFilterChange]);

  React.useEffect(() => {
    onSortChangeRef.current = onSortChange;
  }, [onSortChange]);

  const table = useReactTable({
    data,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    onSortingChange: setSorting,
    state: {
      sorting,
    },
    manualSorting: true,
    manualPagination: true,
    pageCount: pagination.totalPages,
  });

  // Debounce filters
  React.useEffect(() => {
    const timer = setTimeout(() => {
      onFilterChangeRef.current({
        name: nameFilter || undefined,
        sku: skuFilter || undefined,
        stockType:
          stockTypeFilter === "all"
            ? undefined
            : (stockTypeFilter as "WEIGHT" | "UNITS"),
      });
    }, 300);

    return () => clearTimeout(timer);
  }, [nameFilter, skuFilter, stockTypeFilter]);

  // Handle sorting changes
  React.useEffect(() => {
    if (sorting.length > 0 && sorting[0]) {
      const { id, desc } = sorting[0];
      onSortChangeRef.current(id, desc ? "desc" : "asc");
    }
  }, [sorting]);

  return (
    <div className="space-y-4">
      {/* Toolbar */}
      <div className="flex items-center justify-between gap-4">
        <div className="flex flex-1 items-center gap-2">
          <h1 className="text-4xl font-bold tracking-tight ml-2 mr-8">
            Products
          </h1>
          <Input
            placeholder="Filter by name..."
            value={nameFilter}
            onChange={(e) => setNameFilter(e.target.value)}
            className="max-w-[200px]"
          />
          <Input
            placeholder="Filter by SKU..."
            value={skuFilter}
            onChange={(e) => setSkuFilter(e.target.value)}
            className="max-w-[150px]"
          />
          <Select value={stockTypeFilter} onValueChange={setStockTypeFilter}>
            <SelectTrigger className="w-[140px]">
              <SelectValue placeholder="Stock Type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Types</SelectItem>
              <SelectItem value="UNITS">Units</SelectItem>
              <SelectItem value="WEIGHT">Weight</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <Button onClick={onCreateNew}>
          <Plus className="mr-2 h-4 w-4" />
          New Product
        </Button>
      </div>

      {/* Table */}
      <div className="rounded-lg border bg-card shadow-sm">
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id} className="border-b bg-muted/50">
                {headerGroup.headers.map((header) => (
                  <TableHead key={header.id}>
                    {header.isPlaceholder
                      ? null
                      : flexRender(
                          header.column.columnDef.header,
                          header.getContext(),
                        )}
                  </TableHead>
                ))}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {isLoading ? (
              // Loading skeleton with shimmer animation
              Array.from({ length: pagination.pageSize }).map((_, index) => (
                <TableRow key={index}>
                  {columns.map((_, cellIndex) => (
                    <TableCell key={cellIndex}>
                      <Skeleton className="h-6 w-full animate-pulse" />
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : table.getRowModel().rows?.length ? (
              table.getRowModel().rows.map((row) => (
                <TableRow
                  key={row.id}
                  className="transition-colors hover:bg-muted/50"
                >
                  {row.getVisibleCells().map((cell) => (
                    <TableCell key={cell.id}>
                      {flexRender(
                        cell.column.columnDef.cell,
                        cell.getContext(),
                      )}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell
                  colSpan={columns.length}
                  className="h-48 text-center"
                >
                  <div className="flex flex-col items-center justify-center gap-3">
                    <div className="rounded-full bg-muted p-4">
                      <Package className="h-8 w-8 text-muted-foreground" />
                    </div>
                    <div>
                      <p className="text-sm font-medium">No products found</p>
                      <p className="text-xs text-muted-foreground mt-1">
                        Try adjusting your filters or create a new product
                      </p>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={onCreateNew}
                      className="mt-2"
                    >
                      <Plus className="mr-2 h-4 w-4" />
                      Create Product
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      {/* Pagination */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <p className="text-sm text-muted-foreground">Rows per page</p>
          <Select
            value={pagination.pageSize.toString()}
            onValueChange={(value) => onPageSizeChange(Number(value))}
          >
            <SelectTrigger className="w-[70px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="5">5</SelectItem>
              <SelectItem value="10">10</SelectItem>
              <SelectItem value="20">20</SelectItem>
              <SelectItem value="50">50</SelectItem>
              <SelectItem value="100">100</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="flex items-center gap-2">
          <p className="text-sm text-muted-foreground">
            Page {pagination.page} of {pagination.totalPages || 1} (
            {pagination.total} total)
          </p>
          <div className="flex gap-1">
            <Button
              variant="outline"
              size="sm"
              onClick={() => onPageChange(pagination.page - 1)}
              disabled={pagination.page === 1 || isLoading}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => onPageChange(pagination.page + 1)}
              disabled={pagination.page >= pagination.totalPages || isLoading}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
