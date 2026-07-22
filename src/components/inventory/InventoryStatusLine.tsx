"use client";

import React, { useState, useEffect } from "react";
import { motion } from "motion/react";

interface InventoryStatusLineProps {
  totalProducts: number;
  filteredProducts: number;
  lastUpdatedDate?: Date | null;
  isRealtimeConnected?: boolean;
}

export const InventoryStatusLine: React.FC<InventoryStatusLineProps> = ({
  totalProducts,
  filteredProducts,
  lastUpdatedDate,
  isRealtimeConnected = true
}) => {
  const [timeAgo, setTimeAgo] = useState<string>("beberapa detik yang lalu");

  useEffect(() => {
    const updateTimeAgo = () => {
      if (!lastUpdatedDate) {
        setTimeAgo("beberapa saat lalu");
        return;
      }
      const diffSec = Math.floor((Date.now() - lastUpdatedDate.getTime()) / 1000);
      if (diffSec < 5) {
        setTimeAgo("baru saja");
      } else if (diffSec < 60) {
        setTimeAgo(`${diffSec} detik yang lalu`);
      } else if (diffSec < 3600) {
        const diffMin = Math.floor(diffSec / 60);
        setTimeAgo(`${diffMin} menit yang lalu`);
      } else {
        const diffHour = Math.floor(diffSec / 3600);
        setTimeAgo(`${diffHour} jam yang lalu`);
      }
    };

    updateTimeAgo();
    const timer = setInterval(updateTimeAgo, 5000);
    return () => clearInterval(timer);
  }, [lastUpdatedDate]);

  return (
    <motion.div
      initial={{ opacity: 0, y: -4 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex flex-wrap items-center justify-between gap-3 px-2 py-1 select-none text-xs font-mono font-medium text-neutral-400"
    >
      {/* Left: Product Counts */}
      <div className="flex items-center gap-2">
        <span className="text-white font-bold tracking-tight">
          {filteredProducts === totalProducts
            ? `${totalProducts} Products`
            : `${filteredProducts} of ${totalProducts} Products`}
        </span>
        <span className="text-neutral-600">•</span>
        <span>Updated {timeAgo}</span>
      </div>

      {/* Right: Supabase Realtime Pulse Badge */}
      <div className="flex items-center gap-2 px-2.5 py-1 rounded-full bg-[#18181B] border border-white/[0.06]">
        <span className="relative flex h-2 w-2">
          {isRealtimeConnected && (
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
          )}
          <span
            className={`relative inline-flex rounded-full h-2 w-2 ${
              isRealtimeConnected ? "bg-emerald-400" : "bg-amber-400"
            }`}
          />
        </span>
        <span
          className={`text-[11px] font-semibold tracking-wide ${
            isRealtimeConnected ? "text-emerald-400" : "text-amber-400"
          }`}
        >
          {isRealtimeConnected ? "Realtime Connected" : "Syncing WMS..."}
        </span>
      </div>
    </motion.div>
  );
};
