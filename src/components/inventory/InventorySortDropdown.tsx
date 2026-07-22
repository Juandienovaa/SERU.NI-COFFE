"use client";

import React, { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { ArrowUpDown, Check, ChevronDown } from "lucide-react";

export type InventorySortOption = "PRIORITY" | "STOCK_ASC" | "STOCK_DESC" | "NAME_ASC";

interface SortItem {
  id: InventorySortOption;
  label: string;
  subLabel?: string;
}

const SORT_OPTIONS: SortItem[] = [
  { id: "PRIORITY", label: "Prioritas Tindakan", subLabel: "Kosong & Kritis Diatas" },
  { id: "STOCK_ASC", label: "Stok Terendah", subLabel: "0 Cup ➔ 100+ Cup" },
  { id: "STOCK_DESC", label: "Stok Tertinggi", subLabel: "100+ Cup ➔ 0 Cup" },
  { id: "NAME_ASC", label: "Nama Produk", subLabel: "Abjad A ➔ Z" }
];

interface InventorySortDropdownProps {
  value: InventorySortOption;
  onChange: (sort: InventorySortOption) => void;
  className?: string;
}

export const InventorySortDropdown: React.FC<InventorySortDropdownProps> = ({
  value,
  onChange,
  className = ""
}) => {
  const [isOpen, setIsOpen] = useState<boolean>(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const activeOption = SORT_OPTIONS.find((opt) => opt.id === value) || SORT_OPTIONS[0];

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div ref={dropdownRef} className={`relative shrink-0 ${className}`}>
      {/* Trigger Button */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2.5 px-4 py-3 rounded-2xl bg-[#131316]/90 hover:bg-[#18181B] border border-white/[0.08] hover:border-white/[0.2] text-xs font-semibold text-neutral-300 hover:text-white transition-all active:scale-96 shadow-inner select-none"
      >
        <ArrowUpDown className="w-3.5 h-3.5 text-[#F97316]" />
        <div className="flex items-center gap-1.5">
          <span className="text-neutral-500 font-mono text-[11px] uppercase tracking-wider hidden xl:inline">
            Urutan:
          </span>
          <span className="text-white font-bold">{activeOption.label}</span>
        </div>
        <ChevronDown
          className={`w-3.5 h-3.5 text-neutral-400 transition-transform duration-200 ${
            isOpen ? "rotate-180 text-white" : ""
          }`}
        />
      </button>

      {/* Floating Menu */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 6, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 4, scale: 0.96 }}
            transition={{ duration: 0.15 }}
            className="absolute right-0 top-full mt-2.5 w-60 rounded-2xl bg-[#18181B]/95 backdrop-blur-2xl border border-white/[0.12] p-2 shadow-2xl z-50 divide-y divide-white/[0.06]"
          >
            <div className="px-3 py-2 text-[10px] font-mono font-bold text-neutral-400 uppercase tracking-widest">
              Urutkan Daftar Stok
            </div>
            <div className="pt-1.5 space-y-1">
              {SORT_OPTIONS.map((opt) => {
                const isSelected = opt.id === value;
                return (
                  <button
                    key={opt.id}
                    type="button"
                    onClick={() => {
                      onChange(opt.id);
                      setIsOpen(false);
                    }}
                    className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-left transition-all ${
                      isSelected
                        ? "bg-[#F97316]/15 text-white font-bold"
                        : "text-neutral-300 hover:bg-white/[0.06] hover:text-white"
                    }`}
                  >
                    <div>
                      <div className="text-xs">{opt.label}</div>
                      {opt.subLabel && (
                        <div className="text-[10px] font-mono text-neutral-500 mt-0.5">
                          {opt.subLabel}
                        </div>
                      )}
                    </div>
                    {isSelected && <Check className="w-4 h-4 text-[#F97316] shrink-0" />}
                  </button>
                );
              })}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
