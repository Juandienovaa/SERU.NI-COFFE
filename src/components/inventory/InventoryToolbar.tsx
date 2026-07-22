"use client";

import React from "react";
import { motion } from "motion/react";
import { RefreshCw } from "lucide-react";
import { InventorySearch } from "./InventorySearch";
import { InventoryFilterChip } from "./InventoryFilterChip";
import { InventorySortDropdown, InventorySortOption } from "./InventorySortDropdown";
import { InventoryViewSwitcher, InventoryViewMode } from "./InventoryViewSwitcher";

interface InventoryToolbarProps {
  searchQuery: string;
  onSearchChange: (query: string) => void;
  activeFilter: string;
  onFilterChange: (filter: string) => void;
  countsByStatus: Record<string, number>;
  sortOption: InventorySortOption;
  onSortChange: (sort: InventorySortOption) => void;
  viewMode: InventoryViewMode;
  onViewModeChange: (mode: InventoryViewMode) => void;
  onRefresh: () => void;
  loading: boolean;
  className?: string;
}

const FILTER_CATEGORIES = [
  { id: "all", label: "Semua SKU", dotColor: "bg-white" },
  { id: "OUT_OF_STOCK", label: "Out of Stock", dotColor: "bg-rose-500" },
  { id: "LOW_STOCK", label: "Low Stock", dotColor: "bg-orange-500" },
  { id: "MEDIUM", label: "Medium Zone", dotColor: "bg-amber-500" },
  { id: "HEALTHY", label: "Healthy", dotColor: "bg-emerald-500" },
  { id: "OVERSTOCK", label: "Overstock", dotColor: "bg-blue-500" }
] as const;

export const InventoryToolbar: React.FC<InventoryToolbarProps> = ({
  searchQuery,
  onSearchChange,
  activeFilter,
  onFilterChange,
  countsByStatus,
  sortOption,
  onSortChange,
  viewMode,
  onViewModeChange,
  onRefresh,
  loading,
  className = ""
}) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, ease: "easeOut" }}
      className={`w-full rounded-[24px] bg-[#18181B]/70 backdrop-blur-2xl border border-white/[0.05] p-5 sm:p-6 shadow-2xl flex flex-col gap-5 ${className}`}
    >
      {/* Top Deck: Search & Right Utility Actions (Sort, View Mode, Refresh) */}
      <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-4">
        {/* Search Input occupying 40-50% width on Desktop */}
        <InventorySearch
          value={searchQuery}
          onChange={onSearchChange}
        />

        {/* Right Actions Stack */}
        <div className="flex flex-wrap items-center justify-end gap-3 shrink-0">
          <InventorySortDropdown
            value={sortOption}
            onChange={onSortChange}
          />

          <InventoryViewSwitcher
            value={viewMode}
            onChange={onViewModeChange}
          />

          {/* Refresh Action Trigger */}
          <button
            type="button"
            onClick={onRefresh}
            disabled={loading}
            aria-label="Segarkan data sinkronisasi WMS"
            className="flex items-center justify-center p-3 sm:px-4 sm:py-3 rounded-2xl bg-[#131316]/90 hover:bg-[#18181B] border border-white/[0.08] hover:border-white/[0.2] text-xs font-semibold text-neutral-300 hover:text-white transition-all active:scale-95 disabled:opacity-50 shrink-0 shadow-inner"
          >
            <RefreshCw
              className={`w-4 h-4 text-neutral-400 ${
                loading ? "animate-spin text-[#F97316]" : ""
              }`}
            />
            <span className="hidden md:inline ml-2 text-xs font-mono">
              {loading ? "Syncing..." : "Segarkan"}
            </span>
          </button>
        </div>
      </div>

      {/* Bottom Deck: Scrollable Category Filter Pills with Live Count */}
      <div className="flex items-center gap-2.5 overflow-x-auto whitespace-nowrap scrollbar-hide pt-1 pb-1">
        {FILTER_CATEGORIES.map((cat) => {
          const count = countsByStatus[cat.id] ?? 0;
          return (
            <InventoryFilterChip
              key={cat.id}
              id={cat.id}
              label={cat.label}
              count={count}
              dotColor={cat.dotColor}
              isActive={activeFilter === cat.id}
              onClick={onFilterChange}
            />
          );
        })}
      </div>
    </motion.div>
  );
};
