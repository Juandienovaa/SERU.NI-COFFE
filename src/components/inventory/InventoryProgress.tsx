"use client";

import React from "react";
import { motion } from "motion/react";
import { InventoryStatusType } from "@/types/inventory";

interface InventoryProgressProps {
  currentStock: number;
  maximumStock: number;
  progressPercentage: number;
  statusLevel: InventoryStatusType;
}

export const InventoryProgress: React.FC<InventoryProgressProps> = ({
  currentStock,
  maximumStock,
  progressPercentage,
  statusLevel
}) => {
  const getGradientClass = () => {
    switch (statusLevel) {
      case "OUT_OF_STOCK":
        return "from-rose-600 via-red-500 to-rose-400 shadow-[0_0_12px_rgba(244,63,94,0.6)]";
      case "LOW_STOCK":
        return "from-orange-600 via-amber-500 to-orange-400 shadow-[0_0_12px_rgba(249,115,22,0.6)]";
      case "MEDIUM":
        return "from-amber-600 via-yellow-500 to-amber-400 shadow-[0_0_12px_rgba(245,158,11,0.5)]";
      case "OVERSTOCK":
        return "from-sky-600 via-blue-500 to-sky-400 shadow-[0_0_12px_rgba(14,165,233,0.5)]";
      case "HEALTHY":
      default:
        return "from-emerald-600 via-teal-500 to-emerald-400 shadow-[0_0_12px_rgba(16,185,129,0.5)]";
    }
  };

  return (
    <div className="space-y-1.5 w-full">
      <div className="flex items-center justify-between text-[11px] font-mono">
        <span className="text-neutral-400">Capacity Saturation</span>
        <span className="font-bold text-neutral-300">
          {currentStock} / {maximumStock} <span className="text-neutral-500 text-[10px]">CUP</span> ({progressPercentage}%)
        </span>
      </div>

      <div className="w-full h-2.5 rounded-full bg-[#111113] border border-white/[0.06] overflow-hidden p-0.5 shadow-inner">
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${progressPercentage}%` }}
          transition={{ duration: 0.6, ease: "easeOut" }}
          className={`h-full rounded-full bg-gradient-to-r ${getGradientClass()}`}
        />
      </div>
    </div>
  );
};
