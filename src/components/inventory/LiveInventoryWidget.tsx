"use client";

import React, { useState, useMemo } from "react";
import { motion, AnimatePresence } from "motion/react";
import { useInventory } from "@/hooks/useInventory";
import { ProductInventoryItem } from "@/types/inventory";
import { InventorySummary } from "./InventorySummary";
import { InventoryCard } from "./InventoryCard";
import { InventoryToolbar } from "./InventoryToolbar";
import { InventoryStatusLine } from "./InventoryStatusLine";
import { InventoryListView } from "./InventoryListView";
import { InventorySortOption } from "./InventorySortDropdown";
import { InventoryViewMode } from "./InventoryViewSwitcher";
import { Search, AlertCircle } from "lucide-react";

interface LiveInventoryWidgetProps {
  onQuickProduce?: (item: ProductInventoryItem) => void;
  className?: string;
}

export const LiveInventoryWidget: React.FC<LiveInventoryWidgetProps> = ({
  onQuickProduce,
  className = ""
}) => {
  const { items, summaryStats, loading, errorMsg, refreshInventory } = useInventory(15);
  const [activeFilter, setActiveFilter] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [sortOption, setSortOption] = useState<InventorySortOption>("PRIORITY");
  const [viewMode, setViewMode] = useState<InventoryViewMode>("GRID");

  // Calculate empirical counts for each status
  const countsByStatus = useMemo(() => {
    const counts: Record<string, number> = { all: items.length };
    items.forEach((item) => {
      const st = item.statusLevel || "HEALTHY";
      counts[st] = (counts[st] || 0) + 1;
    });
    return counts;
  }, [items]);

  // Filter & Sort Items
  const filteredAndSortedItems = useMemo(() => {
    const filtered = items.filter((item) => {
      const matchesFilter =
        activeFilter === "all" || item.statusLevel === activeFilter;
      const matchesSearch =
        !searchQuery.trim() ||
        item.product_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (item.category?.toLowerCase() || "").includes(searchQuery.toLowerCase()) ||
        (item.sku?.toLowerCase() || "").includes(searchQuery.toLowerCase());
      return matchesFilter && matchesSearch;
    });

    return [...filtered].sort((a, b) => {
      if (sortOption === "PRIORITY") {
        const priorityMap: Record<string, number> = {
          OUT_OF_STOCK: 1,
          LOW_STOCK: 2,
          MEDIUM: 3,
          HEALTHY: 4,
          OVERSTOCK: 5
        };
        return (priorityMap[a.statusLevel || "HEALTHY"] || 4) - (priorityMap[b.statusLevel || "HEALTHY"] || 4);
      } else if (sortOption === "STOCK_ASC") {
        return (a.current_stock || 0) - (b.current_stock || 0);
      } else if (sortOption === "STOCK_DESC") {
        return (b.current_stock || 0) - (a.current_stock || 0);
      } else if (sortOption === "NAME_ASC") {
        return a.product_name.localeCompare(b.product_name);
      }
      return 0;
    });
  }, [items, activeFilter, searchQuery, sortOption]);

  // Find latest update time across items
  const latestUpdatedDate = useMemo(() => {
    if (!items || items.length === 0) return null;
    let latest = 0;
    items.forEach((item) => {
      if (item.updated_at) {
        const t = new Date(item.updated_at).getTime();
        if (!isNaN(t) && t > latest) latest = t;
      }
    });
    return latest > 0 ? new Date(latest) : null;
  }, [items]);

  return (
    <section className={`w-full space-y-6 my-8 ${className}`}>
      {/* 1. Top KPI Summary */}
      <InventorySummary
        stats={summaryStats}
        loading={loading}
        activeFilter={activeFilter}
        onSelectFilter={setActiveFilter}
        onRefresh={() => refreshInventory(false)}
      />

      {/* 2. Compact Status Line & Master Command Toolbar */}
      <div className="space-y-2 pt-2">
        <InventoryStatusLine
          totalProducts={items.length}
          filteredProducts={filteredAndSortedItems.length}
          lastUpdatedDate={latestUpdatedDate}
          isRealtimeConnected={!errorMsg}
        />

        <InventoryToolbar
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          activeFilter={activeFilter}
          onFilterChange={setActiveFilter}
          countsByStatus={countsByStatus}
          sortOption={sortOption}
          onSortChange={setSortOption}
          viewMode={viewMode}
          onViewModeChange={setViewMode}
          onRefresh={() => refreshInventory(false)}
          loading={loading}
        />
      </div>

      {/* 3. Error State */}
      {errorMsg && (
        <div className="p-5 rounded-3xl bg-rose-950/80 border border-rose-500/40 text-rose-200 text-sm flex items-start gap-3.5 backdrop-blur-xl">
          <AlertCircle className="w-5 h-5 text-rose-400 shrink-0 mt-0.5" />
          <div>
            <span className="font-bold block">Peringatan Sinkronisasi WMS</span>
            <span className="text-xs font-light mt-0.5 block">{errorMsg}</span>
          </div>
        </div>
      )}

      {/* 4. Inventory Grid / List Container */}
      <AnimatePresence mode="wait">
        {loading && items.length === 0 ? (
          <motion.div
            key="skeleton"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6"
          >
            {[1, 2, 3, 4, 5, 6, 7, 8].map((n) => (
              <div
                key={n}
                className="h-80 rounded-3xl bg-[#18181B]/80 border border-white/[0.06] p-6 flex flex-col justify-between skeleton-shimmer"
              />
            ))}
          </motion.div>
        ) : items.length === 0 ? (
          <motion.div
            key="empty-db"
            initial={{ opacity: 0, scale: 0.96 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.96 }}
            className="p-16 rounded-3xl bg-[#18181B] border border-dashed border-white/[0.12] text-center space-y-3.5"
          >
            <div className="w-14 h-14 rounded-2xl bg-[#111113] border border-white/[0.06] flex items-center justify-center mx-auto text-neutral-500 shadow-inner">
              <AlertCircle className="w-6 h-6 text-amber-500" />
            </div>
            <h4 className="text-base font-bold text-white">
              Belum ada produk di database
            </h4>
            <p className="text-xs text-neutral-400 max-w-md mx-auto leading-relaxed">
              Sistem telah terhubung 100% ke Supabase (<code className="text-orange-400 font-mono">product_inventory</code>) tanpa data mock. Hubungi Manajer untuk melakukan inisialisasi master SKU atau setor dari sesi produksi Barista.
            </p>
            <button
              onClick={() => refreshInventory(false)}
              className="mt-2 px-5 py-2.5 rounded-xl bg-orange-500 text-black font-bold text-xs hover:bg-orange-400 active:scale-95 transition-all shadow-lg shadow-orange-500/20 font-mono"
            >
              🔄 Refresh Sinkronisasi DB
            </button>
          </motion.div>
        ) : filteredAndSortedItems.length === 0 ? (
          <motion.div
            key="empty-filter"
            initial={{ opacity: 0, scale: 0.96 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.96 }}
            className="p-16 rounded-3xl bg-[#18181B] border border-white/[0.06] text-center space-y-3"
          >
            <div className="w-14 h-14 rounded-2xl bg-[#111113] border border-white/[0.06] flex items-center justify-center mx-auto text-neutral-500">
              <Search className="w-6 h-6" />
            </div>
            <h4 className="text-base font-bold text-white">
              Tidak ada produk yang sesuai dengan filter/pencarian Anda.
            </h4>
            <p className="text-xs text-neutral-500 max-w-sm mx-auto">
              Coba atur ulang kata kunci pencarian atau ubah tab status di atas ke &quot;Semua SKU&quot;.
            </p>
            <button
              onClick={() => {
                setActiveFilter("all");
                setSearchQuery("");
              }}
              className="mt-2 px-5 py-2.5 rounded-xl bg-white text-black font-bold text-xs hover:bg-neutral-200 transition-all shadow-md"
            >
              Reset Filter
            </button>
          </motion.div>
        ) : viewMode === "LIST" ? (
          <motion.div
            key="list"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
          >
            <InventoryListView
              items={filteredAndSortedItems}
              onQuickProduce={onQuickProduce}
            />
          </motion.div>
        ) : (
          /* Desktop & Tablet 4-6 Col Grid / Mobile Snap Container */
          <motion.div
            key="grid"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6"
          >
            {filteredAndSortedItems.map((item) => (
              <InventoryCard
                key={item.product_id}
                item={item}
                onQuickProduce={onQuickProduce}
              />
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </section>
  );
};
