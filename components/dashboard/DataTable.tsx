"use client";

import { useState } from "react";
import { clsx } from "clsx";
import {
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  Search,
  Filter,
  Download,
  MoreHorizontal,
} from "lucide-react";

type Column<T> = {
  key: keyof T | string;
  header: string;
  render?: (item: T) => React.ReactNode;
  sortable?: boolean;
  width?: string;
};

type FilterOption = {
  label: string;
  key: string;
  options: { label: string; value: string }[];
};

type DataTableProps<T> = {
  data: T[];
  columns: Column<T>[];
  pageSize?: number;
  searchable?: boolean;
  searchPlaceholder?: string;
  onRowClick?: (item: T) => void;
  loading?: boolean;
  emptyMessage?: string;
  actions?: (item: T) => React.ReactNode;
  filters?: FilterOption[];
};

export function DataTable<T extends { id: string | number }>({
  data,
  columns,
  pageSize = 10,
  searchable = true,
  searchPlaceholder = "Search...",
  onRowClick,
  loading = false,
  emptyMessage = "No data available",
  actions,
  searchKey,
  filters,
}: DataTableProps<T> & { searchKey?: string }) {
  const [currentPage, setCurrentPage] = useState(1);
  const [searchQuery, setSearchQuery] = useState("");
  const [sortKey, setSortKey] = useState<string | null>(null);
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("asc");
  const [activeFilters, setActiveFilters] = useState<Record<string, string>>({});
  const [showFilterDropdown, setShowFilterDropdown] = useState(false);

  // Reset page when search or filters change
  const handleSearch = (query: string) => {
    setSearchQuery(query);
    setCurrentPage(1);
  };

  const handleFilterChange = (key: string, value: string) => {
    setActiveFilters((prev) => {
      const next = { ...prev };
      if (value === "") {
        delete next[key];
      } else {
        next[key] = value;
      }
      return next;
    });
    setCurrentPage(1);
    setShowFilterDropdown(false);
  };

  const getValue = (item: T, key: string): unknown => {
    return key.split(".").reduce((obj: unknown, k) => {
      if (obj && typeof obj === "object") {
        return (obj as Record<string, unknown>)[k];
      }
      return undefined;
    }, item);
  };

  // Filter data
  const filteredData = data.filter((item) => {
    // Apply active filters
    for (const [key, value] of Object.entries(activeFilters)) {
      const itemValue = getValue(item, key);
      if (String(itemValue) !== value) return false;
    }

    if (!searchQuery) return true;

    // If a specific key is provided, search only that field
    if (searchKey) {
      const value = getValue(item, searchKey);
      return String(value).toLowerCase().includes(searchQuery.toLowerCase());
    }

    // Default: Search across all visible values in the object
    return Object.values(item).some(
      (val) =>
        val &&
        typeof val !== "object" &&
        String(val).toLowerCase().includes(searchQuery.toLowerCase()),
    );
  });

  const totalPages = Math.ceil(filteredData.length / pageSize);
  const startIndex = (currentPage - 1) * pageSize;
  const endIndex = startIndex + pageSize;
  const currentData = filteredData.slice(startIndex, endIndex);

  const handleSort = (key: string) => {
    if (sortKey === key) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc");
    } else {
      setSortKey(key);
      setSortDirection("asc");
    }
  };



  if (loading) {
    return (
      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
        <div className="p-4 border-b border-slate-200">
          <div className="h-10 bg-slate-100 rounded animate-pulse" />
        </div>
        <div className="divide-y divide-slate-200">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="p-4">
              <div className="h-6 bg-slate-100 rounded animate-pulse" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl border border-slate-200 relative">
      {searchable && (
        <div className="p-4 border-b border-slate-200 flex items-center gap-3">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <input
              type="text"
              placeholder={searchPlaceholder}
              value={searchQuery}
              onChange={(e) => handleSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
            />
          </div>
          {filters && filters.length > 0 && (
            <div className="relative">
              <button
                onClick={() => setShowFilterDropdown(!showFilterDropdown)}
                className={clsx(
                  "flex items-center gap-2 px-3 py-2 border rounded-lg text-sm transition-colors",
                  Object.keys(activeFilters).length > 0
                    ? "border-primary-600 bg-primary-50 text-primary-700"
                    : "border-slate-200 text-slate-600 hover:bg-slate-50"
                )}
              >
                <Filter className="h-4 w-4" />
                Filter
                {Object.keys(activeFilters).length > 0 && (
                  <span className="bg-primary-600 text-white text-[10px] w-4 h-4 rounded-full flex items-center justify-center">
                    {Object.keys(activeFilters).length}
                  </span>
                )}
              </button>
              {showFilterDropdown && (
                <div className="absolute right-0 top-full mt-2 bg-white border border-slate-200 rounded-xl shadow-lg z-20 min-w-[200px] p-2">
                  {filters.map((filter) => (
                    <div key={filter.key} className="space-y-1">
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider px-2 pt-2">{filter.label}</p>
                      <button
                        onClick={() => handleFilterChange(filter.key, "")}
                        className={clsx(
                          "w-full text-left px-3 py-1.5 text-sm rounded-lg transition-colors",
                          !activeFilters[filter.key] ? "bg-primary-50 text-primary-700 font-medium" : "text-slate-600 hover:bg-slate-50"
                        )}
                      >
                        All
                      </button>
                      {filter.options.map((opt) => (
                        <button
                          key={opt.value}
                          onClick={() => handleFilterChange(filter.key, opt.value)}
                          className={clsx(
                            "w-full text-left px-3 py-1.5 text-sm rounded-lg transition-colors",
                            activeFilters[filter.key] === opt.value ? "bg-primary-50 text-primary-700 font-medium" : "text-slate-600 hover:bg-slate-50"
                          )}
                        >
                          {opt.label}
                        </button>
                      ))}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      )}

      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-slate-50 border-b border-slate-200">
            <tr>
              {columns.map((column) => (
                <th
                  key={String(column.key)}
                  className={clsx(
                    "px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider",
                    column.sortable && "cursor-pointer hover:bg-slate-100",
                    column.width,
                  )}
                  onClick={() =>
                    column.sortable && handleSort(String(column.key))
                  }
                >
                  {column.header}
                </th>
              ))}
              {actions && <th className="px-4 py-3 w-12" />}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200">
            {currentData.length === 0 ? (
              <tr>
                <td
                  colSpan={columns.length + (actions ? 1 : 0)}
                  className="px-4 py-12 text-center text-slate-500"
                >
                  {emptyMessage}
                </td>
              </tr>
            ) : (
              currentData.map((item) => (
                <tr
                  key={item.id || (item as any)._id}
                  className={clsx(
                    "hover:bg-slate-50 transition-colors",
                    onRowClick && "cursor-pointer",
                  )}
                  onClick={() => onRowClick?.(item)}
                >
                  {columns.map((column) => (
                    <td
                      key={String(column.key)}
                      className="px-4 py-4 text-sm text-slate-700"
                    >
                      {column.render
                        ? column.render(item)
                        : String(getValue(item, String(column.key)) ?? "-")}
                    </td>
                  ))}
                  {actions && (
                    <td
                      className="px-4 py-4"
                      onClick={(e) => e.stopPropagation()}
                    >
                      {actions(item)}
                    </td>
                  )}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {totalPages > 1 && (
        <div className="px-4 py-3 border-t border-slate-200 flex items-center justify-between">
          <p className="text-sm text-slate-600">
            Showing {startIndex + 1} to {Math.min(endIndex, filteredData.length)} of{" "}
            {filteredData.length} results
          </p>
          <div className="flex items-center gap-1">
            <button
              onClick={() => setCurrentPage(1)}
              disabled={currentPage === 1}
              className="p-2 rounded hover:bg-slate-100 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <ChevronsLeft className="h-4 w-4" />
            </button>
            <button
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              className="p-2 rounded hover:bg-slate-100 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            <span className="px-3 py-1 text-sm text-slate-600">
              Page {currentPage} of {totalPages}
            </span>
            <button
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
              className="p-2 rounded hover:bg-slate-100 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
            <button
              onClick={() => setCurrentPage(totalPages)}
              disabled={currentPage === totalPages}
              className="p-2 rounded hover:bg-slate-100 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <ChevronsRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
