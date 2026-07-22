"use client";

import React from "react";
import { LayoutGrid, List } from "lucide-react";

export type InventoryViewMode = "GRID" | "LIST";

interface InventoryViewSwitcherProps {
  value: InventoryViewMode;
  onChange: (mode: InventoryViewMode) => void;
  className?: string;
}

export const InventoryViewSwitcher: React.FC<InventoryViewSwitcherProps> = ({
  value,
  onChange,
  className = ""
}) => {
  return (
    <div
      className={`flex items-center bg-[#131316]/90 border border-white/[0.08] rounded-2xl p-1 shrink-0 select-none ${className}`}
    >
      {/* Grid Mode Button */}
      <button
        type="button"
        onClick={() => onChange("GRID")}
        aria-label="Tampilan Kartu Grid"
        className={`flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold transition-all ${
          value === "GRID"
            ? "bg-white text-black shadow-md shadow-white/10"
            : "text-neutral-400 hover:text-white hover:bg-white/[0.06]"
        }`}
      >
        <LayoutGrid className="w-3.5 h-3.5" />
        <span className="hidden sm:inline">Grid</span>
      </button>

      {/* List Mode Button */}
      <button
        type="button"
        onClick={() => onChange("LIST")}
        aria-label="Tampilan Tabel Baris List"
        className={`flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold transition-all ${
          value === "LIST"
            ? "bg-white text-black shadow-md shadow-white/10"
            : "text-neutral-400 hover:text-white hover:bg-white/[0.06]"
        }`}
      >
        <List className="w-3.5 h-3.5" />
        <span className="hidden sm:inline">List</span>
      </button>
    </div>
  );
};
