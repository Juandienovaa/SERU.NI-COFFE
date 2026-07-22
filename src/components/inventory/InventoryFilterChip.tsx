"use client";

import React from "react";
import { motion } from "motion/react";

export interface InventoryFilterChipProps {
  id: string;
  label: string;
  count?: number;
  dotColor?: string; // e.g. "bg-rose-500", "bg-orange-500", "bg-emerald-500", "bg-blue-500", "bg-white"
  isActive: boolean;
  onClick: (id: string) => void;
}

export const InventoryFilterChip: React.FC<InventoryFilterChipProps> = ({
  id,
  label,
  count,
  dotColor,
  isActive,
  onClick
}) => {
  return (
    <motion.button
      type="button"
      whileHover={{ scale: 1.03 }}
      whileTap={{ scale: 0.96 }}
      onClick={() => onClick(id)}
      className={`group relative flex items-center gap-2.5 px-4 py-2 rounded-2xl text-xs font-semibold border transition-all select-none shrink-0 ${
        isActive
          ? "bg-white text-black border-white shadow-lg shadow-white/10 font-bold"
          : "bg-[#131316]/80 text-neutral-300 border-white/[0.08] hover:border-white/[0.22] hover:text-white hover:bg-[#18181B]"
      }`}
    >
      {/* Colored Dot Indicator */}
      {dotColor && (
        <span
          className={`w-2 h-2 rounded-full shrink-0 ${
            isActive ? "bg-black" : dotColor
          } transition-colors`}
        />
      )}

      {/* Label */}
      <span className="tracking-tight">{label}</span>

      {/* Live Count Badge */}
      {count !== undefined && (
        <span
          className={`px-2 py-0.5 rounded-lg text-[11px] font-mono font-bold ${
            isActive
              ? "bg-black/10 text-black"
              : "bg-white/[0.06] text-neutral-400 group-hover:text-white group-hover:bg-white/10"
          } transition-colors`}
        >
          {count}
        </span>
      )}
    </motion.button>
  );
};
