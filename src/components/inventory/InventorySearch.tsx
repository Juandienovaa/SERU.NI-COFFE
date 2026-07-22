"use client";

import React, { useRef } from "react";
import { Search, X } from "lucide-react";

interface InventorySearchProps {
  value: string;
  onChange: (query: string) => void;
  placeholder?: string;
  className?: string;
}

export const InventorySearch: React.FC<InventorySearchProps> = ({
  value,
  onChange,
  placeholder = "Cari produk by nama, SKU, atau kategori...",
  className = ""
}) => {
  const inputRef = useRef<HTMLInputElement>(null);

  const handleClear = () => {
    onChange("");
    inputRef.current?.focus();
  };

  return (
    <div
      className={`relative w-full lg:w-[44%] shrink-0 group transition-all duration-300 ${className}`}
    >
      {/* Search Icon */}
      <div className="absolute left-4 top-1/2 -translate-y-1/2 text-neutral-400 group-focus-within:text-[#F97316] transition-colors pointer-events-none flex items-center justify-center">
        <Search className="w-4 h-4 sm:w-5 sm:h-5" />
      </div>

      {/* Input Field */}
      <input
        ref={inputRef}
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full bg-[#131316]/90 border border-white/[0.08] hover:border-white/[0.16] focus:border-[#F97316]/60 focus:bg-[#131316] rounded-2xl pl-12 pr-11 py-3.5 text-xs sm:text-sm font-medium text-white placeholder:text-neutral-500 focus:outline-none transition-all shadow-inner focus:shadow-[0_0_25px_rgba(249,115,22,0.15)]"
      />

      {/* Clear Button */}
      {value.trim().length > 0 && (
        <button
          type="button"
          onClick={handleClear}
          aria-label="Bersihkan pencarian"
          className="absolute right-3.5 top-1/2 -translate-y-1/2 p-1.5 rounded-xl bg-white/[0.06] hover:bg-white/[0.15] text-neutral-400 hover:text-white transition-all active:scale-90"
        >
          <X className="w-3.5 h-3.5" />
        </button>
      )}
    </div>
  );
};
