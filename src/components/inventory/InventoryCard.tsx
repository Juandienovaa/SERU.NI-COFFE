"use client";

import React from "react";
import { motion } from "motion/react";
import { ProductInventoryItem } from "@/types/inventory";
import { Sparkles } from "lucide-react";

interface InventoryCardProps {
  item: ProductInventoryItem;
  onQuickProduce?: (item: ProductInventoryItem) => void;
}

export const InventoryCard: React.FC<InventoryCardProps> = ({ item, onQuickProduce }) => {
  const isCritical = item.statusLevel === "OUT_OF_STOCK" || item.statusLevel === "LOW_STOCK";

  const getStatusChip = () => {
    switch (item.statusLevel) {
      case "OUT_OF_STOCK":
        return {
          text: "🔴 Out of Stock",
          className: "text-rose-400 bg-rose-500/10 border-rose-500/20"
        };
      case "LOW_STOCK":
        return {
          text: "🟠 Low Stock",
          className: "text-orange-400 bg-orange-500/10 border-orange-500/20"
        };
      case "MEDIUM":
        return {
          text: "🟡 Medium",
          className: "text-amber-400 bg-amber-500/10 border-amber-500/20"
        };
      case "OVERSTOCK":
        return {
          text: "🔵 Overstock",
          className: "text-sky-400 bg-sky-500/10 border-sky-500/20"
        };
      case "HEALTHY":
      default:
        return {
          text: "🟢 Healthy",
          className: "text-emerald-400 bg-emerald-500/10 border-emerald-500/20"
        };
    }
  };

  const getMinimalRecommendationText = () => {
    const deficit = Math.max(0, item.maximum_stock - item.current_stock);
    if (item.statusLevel === "OUT_OF_STOCK") {
      return `⚡ Produce +${deficit} Cups`;
    }
    if (item.statusLevel === "LOW_STOCK") {
      return `🔥 Produce +${deficit} Cups`;
    }
    if (item.statusLevel === "MEDIUM") {
      return `ℹ Produce +${deficit} Cups`;
    }
    if (item.statusLevel === "OVERSTOCK") {
      return "🛑 Production Halted";
    }
    return "✔ Stock Healthy";
  };

  const getRecommendationStyle = () => {
    if (item.statusLevel === "OUT_OF_STOCK") {
      return "text-rose-300 bg-rose-500/15 border-rose-500/30 font-bold";
    }
    if (item.statusLevel === "LOW_STOCK") {
      return "text-orange-300 bg-orange-500/15 border-orange-500/30 font-bold";
    }
    if (item.statusLevel === "MEDIUM") {
      return "text-amber-300 bg-amber-500/15 border-amber-500/30";
    }
    if (item.statusLevel === "OVERSTOCK") {
      return "text-sky-300 bg-sky-500/15 border-sky-500/30";
    }
    return "text-emerald-300 bg-emerald-500/15 border-emerald-500/30";
  };

  const getProgressColor = () => {
    switch (item.statusLevel) {
      case "OUT_OF_STOCK":
        return "bg-rose-500";
      case "LOW_STOCK":
        return "bg-orange-500";
      case "MEDIUM":
        return "bg-amber-500";
      case "OVERSTOCK":
        return "bg-sky-500";
      case "HEALTHY":
      default:
        return "bg-emerald-500";
    }
  };

  const status = getStatusChip();

  return (
    <motion.div
      layout
      whileHover={{ y: -4, scale: 1.01 }}
      transition={{ type: "spring", stiffness: 400, damping: 30 }}
      className={`rounded-2xl p-6 bg-[#131316]/90 border transition-all flex flex-col justify-between gap-6 backdrop-blur-xl relative select-none ${
        isCritical
          ? "border-rose-500/30 shadow-[0_12px_40px_rgba(244,63,94,0.12)] hover:border-rose-500/50"
          : "border-white/[0.06] shadow-[0_10px_35px_rgba(0,0,0,0.5)] hover:border-white/[0.15]"
      }`}
    >
      {/* HEADER: Large Product Name & Compact Status Chip on one single clean layer */}
      <div className="flex items-start justify-between gap-3">
        <h3 className="text-lg font-bold text-white leading-snug tracking-tight">
          {item.product_name}
        </h3>
        <span
          className={`text-[11px] font-mono px-2.5 py-1 rounded-full border shrink-0 font-semibold ${status.className}`}
        >
          {status.text}
        </span>
      </div>

      {/* CENTER: Ultra-large single number & progress indicator */}
      <div className="space-y-4 my-2">
        <div className="flex items-baseline gap-2">
          <span
            className={`text-6xl font-extrabold font-mono tracking-tight leading-none ${
              item.statusLevel === "OUT_OF_STOCK"
                ? "text-rose-400"
                : item.statusLevel === "LOW_STOCK"
                ? "text-orange-400"
                : item.statusLevel === "OVERSTOCK"
                ? "text-sky-400"
                : item.statusLevel === "MEDIUM"
                ? "text-amber-400"
                : "text-emerald-400"
            }`}
          >
            {item.current_stock}
          </span>
          <span className="text-sm font-bold font-mono text-neutral-400 uppercase">
            {item.unit || "Cup"}
          </span>
        </div>

        {/* Minimal thin progress indicator without labels or percentages */}
        <div className="w-full h-1.5 rounded-full bg-white/[0.06] overflow-hidden">
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${item.progressPercentage}%` }}
            transition={{ duration: 0.5, ease: "easeOut" }}
            className={`h-full rounded-full ${getProgressColor()}`}
          />
        </div>
      </div>

      {/* BOTTOM: Compact recommendation chip & optional quick produce trigger */}
      <div className="flex items-center justify-between gap-2 pt-1">
        <span
          className={`text-xs font-mono px-3 py-1.5 rounded-xl border truncate inline-block ${getRecommendationStyle()}`}
        >
          {getMinimalRecommendationText()}
        </span>

        {onQuickProduce && isCritical && (
          <button
            type="button"
            onClick={() => onQuickProduce(item)}
            className="px-3.5 py-1.5 rounded-xl bg-white text-black hover:bg-neutral-200 font-bold text-xs transition-all active:scale-95 shadow-sm shrink-0 flex items-center gap-1.5"
          >
            <Sparkles className="w-3.5 h-3.5 text-[#F97316]" />
            <span>Racik</span>
          </button>
        )}
      </div>
    </motion.div>
  );
};
