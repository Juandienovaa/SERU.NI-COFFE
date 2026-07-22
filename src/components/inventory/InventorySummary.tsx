"use client";

import React from "react";
import { motion } from "motion/react";
import { InventorySummaryStats } from "@/types/inventory";
import { RefreshCw } from "lucide-react";

interface InventorySummaryProps {
  stats: InventorySummaryStats;
  loading: boolean;
  activeFilter: string;
  onSelectFilter: (filter: string) => void;
  onRefresh: () => void;
}

export const InventorySummary: React.FC<InventorySummaryProps> = ({
  stats,
  loading,
  activeFilter,
  onSelectFilter,
  onRefresh
}) => {
  return (
    <div className="space-y-6 select-none">
      {/* HEADER: Minimal title & subtitle with refresh trigger */}
      <div className="flex items-center justify-between gap-4 px-1">
        <div>
          <h2 className="text-2xl font-bold text-white tracking-tight">
            Master Inventory
          </h2>
          <p className="text-xs text-neutral-400 mt-0.5">
            Live Inventory Overview
          </p>
        </div>

        <button
          type="button"
          onClick={onRefresh}
          disabled={loading}
          className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-[#131316] hover:bg-neutral-800 border border-white/[0.06] text-xs font-semibold text-neutral-300 hover:text-white transition-all active:scale-95 disabled:opacity-50"
        >
          <RefreshCw className={`w-3.5 h-3.5 text-neutral-400 ${loading ? "animate-spin text-white" : ""}`} />
          <span className="hidden sm:inline">{loading ? "Menyinkronkan..." : "Segarkan"}</span>
        </button>
      </div>

      {/* SUMMARY CARDS: Desktop 4 Cards / Tablet 2 Cards / Mobile Horizontal Scroll */}
      <div className="flex sm:grid sm:grid-cols-2 lg:grid-cols-4 gap-4 overflow-x-auto sm:overflow-visible pb-2 sm:pb-0 scrollbar-hide">
        {/* Card 1: Total Stock */}
        <motion.div
          whileHover={{ y: -3 }}
          onClick={() => onSelectFilter("all")}
          className={`min-w-[150px] flex-1 p-6 rounded-2xl border cursor-pointer transition-all flex flex-col justify-between gap-3 ${
            activeFilter === "all"
              ? "bg-[#18181B] border-white text-white shadow-lg"
              : "bg-[#131316]/80 border-white/[0.06] hover:border-white/[0.15]"
          }`}
        >
          <span className="text-xs font-medium text-neutral-400">
            Total Finished Stock
          </span>
          <span className="text-4xl sm:text-5xl font-bold font-mono tracking-tight text-white">
            {stats.totalFinishedCups}
          </span>
        </motion.div>

        {/* Card 2: Out of Stock (Critical Red) */}
        <motion.div
          whileHover={{ y: -3 }}
          onClick={() => onSelectFilter("OUT_OF_STOCK")}
          className={`min-w-[150px] flex-1 p-6 rounded-2xl border cursor-pointer transition-all flex flex-col justify-between gap-3 ${
            activeFilter === "OUT_OF_STOCK"
              ? "bg-rose-950/30 border-rose-500 shadow-lg shadow-rose-500/10"
              : "bg-[#131316]/80 border-white/[0.06] hover:border-rose-500/40"
          }`}
        >
          <span className="text-xs font-medium text-rose-400">
            Out of Stock
          </span>
          <span className="text-4xl sm:text-5xl font-bold font-mono tracking-tight text-rose-400">
            {stats.outOfStockCount}
          </span>
        </motion.div>

        {/* Card 3: Low Stock Alert (Orange) */}
        <motion.div
          whileHover={{ y: -3 }}
          onClick={() => onSelectFilter("LOW_STOCK")}
          className={`min-w-[150px] flex-1 p-6 rounded-2xl border cursor-pointer transition-all flex flex-col justify-between gap-3 ${
            activeFilter === "LOW_STOCK"
              ? "bg-orange-950/30 border-orange-500 shadow-lg shadow-orange-500/10"
              : "bg-[#131316]/80 border-white/[0.06] hover:border-orange-500/40"
          }`}
        >
          <span className="text-xs font-medium text-orange-400">
            Low Stock
          </span>
          <span className="text-4xl sm:text-5xl font-bold font-mono tracking-tight text-orange-400">
            {stats.lowStockCount}
          </span>
        </motion.div>

        {/* Card 4: Healthy & Optimal (Green) */}
        <motion.div
          whileHover={{ y: -3 }}
          onClick={() => onSelectFilter("HEALTHY")}
          className={`min-w-[150px] flex-1 p-6 rounded-2xl border cursor-pointer transition-all flex flex-col justify-between gap-3 ${
            activeFilter === "HEALTHY"
              ? "bg-emerald-950/30 border-emerald-500 shadow-lg shadow-emerald-500/10"
              : "bg-[#131316]/80 border-white/[0.06] hover:border-emerald-500/40"
          }`}
        >
          <span className="text-xs font-medium text-emerald-400">
            Healthy Stock
          </span>
          <span className="text-4xl sm:text-5xl font-bold font-mono tracking-tight text-emerald-400">
            {stats.healthyCount + stats.mediumStockCount}
          </span>
        </motion.div>
      </div>
    </div>
  );
};
