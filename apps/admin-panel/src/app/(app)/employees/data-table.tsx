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
import { ChevronLeft, ChevronRight, Plus, Search, Filter } from "lucide-react";
import { Skeleton } from "#/components/ui/skeleton";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "#/components/ui/popover";
import { Badge } from "#/components/ui/badge";

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
    email?: string;
    role?: string;
    status?: string;
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
  const [searchValue, setSearchValue] = React.useState("");
  const [emailFilter, setEmailFilter] = React.useState("");
  const [roleFilter, setRoleFilter] = React.useState<string>("");
  const [statusFilter, setStatusFilter] = React.useState<string>("");

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
        name: searchValue || undefined,
        email: emailFilter || undefined,
        role: roleFilter || undefined,
        status: statusFilter || undefined,
      });
    }, 300);

    return () => clearTimeout(timer);
  }, [searchValue, emailFilter, roleFilter, statusFilter]);

  // Handle sorting changes
  React.useEffect(() => {
    if (sorting.length > 0 && sorting[0]) {
      const { id, desc } = sorting[0];
      onSortChangeRef.current(id, desc ? "desc" : "asc");
    }
  }, [sorting]);

  // Count active filters
  const activeFiltersCount = [
    searchValue,
    emailFilter,
    roleFilter,
    statusFilter,
  ].filter(Boolean).length;

  const clearFilters = () => {
    setSearchValue("");
    setEmailFilter("");
    setRoleFilter("");
    setStatusFilter("");
  };

  return (
    <div className="space-y-4">
      {/* Enhanced Toolbar */}
      <div className="flex items-center justify-between gap-4">
        <div className="flex flex-1 items-center gap-2">
          {/* Search by name */}
          <div className="relative flex-1 max-w-xs">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search by name..."
              value={searchValue}
              onChange={(e) => setSearchValue(e.target.value)}
              className="pl-9"
            />
          </div>

          {/* Advanced Filters Popover */}
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="outline" size="sm" className="h-10 gap-2">
                <Filter className="h-4 w-4" />
                Filters
                {activeFiltersCount > 0 && (
                  <Badge
                    variant="secondary"
                    className="ml-1 h-5 w-5 rounded-full p-0 flex items-center justify-center text-xs"
                  >
                    {activeFiltersCount}
                  </Badge>
                )}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-80" align="start">
              <div className="space-y-4">
                <div className="space-y-2">
                  <h4 className="font-medium leading-none">Advanced Filters</h4>
                  <p className="text-sm text-muted-foreground">
                    Apply additional filters to refine your search
                  </p>
                </div>

                <div className="space-y-3">
                  {/* Email filter */}
                  <div className="space-y-1">
                    <label className="text-sm font-medium">Email</label>
                    <Input
                      placeholder="Filter by email..."
                      value={emailFilter}
                      onChange={(e) => setEmailFilter(e.target.value)}
                    />
                  </div>

                  {/* Role filter */}
                  <div className="space-y-1">
                    <label className="text-sm font-medium">Role</label>
                    <Select value={roleFilter} onValueChange={setRoleFilter}>
                      <SelectTrigger>
                        <SelectValue placeholder="All roles" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value=" ">All roles</SelectItem>
                        <SelectItem value="STAFF">Staff</SelectItem>
                        <SelectItem value="MANAGER">Manager</SelectItem>
                        <SelectItem value="ADMIN">Admin</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Status filter */}
                  <div className="space-y-1">
                    <label className="text-sm font-medium">Status</label>
                    <Select
                      value={statusFilter}
                      onValueChange={setStatusFilter}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="All statuses" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value=" ">All statuses</SelectItem>
                        <SelectItem value="ACTIVE">Active</SelectItem>
                        <SelectItem value="SUSPENDED">Suspended</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                {activeFiltersCount > 0 && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={clearFilters}
                    className="w-full"
                  >
                    Clear all filters
                  </Button>
                )}
              </div>
            </PopoverContent>
          </Popover>
        </div>

        <Button onClick={onCreateNew} className="gap-2">
          <Plus className="h-4 w-4" />
          New Employee
        </Button>
      </div>

      {/* Table */}
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id}>
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
              // Loading skeleton
              Array.from({ length: pagination.pageSize }).map((_, index) => (
                <TableRow key={index}>
                  {columns.map((_, cellIndex) => (
                    <TableCell key={cellIndex}>
                      <Skeleton className="h-6 w-full" />
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : table.getRowModel().rows?.length ? (
              table.getRowModel().rows.map((row) => (
                <TableRow key={row.id}>
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
                  className="h-24 text-center"
                >
                  No employees found.
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
