"use client";

import React, { useState, useEffect } from "react";
import { AllocationItem } from "@/types/productionStage2";
import { Coffee, CupSoda, Sparkles, Plus, Minus } from "lucide-react";

interface AllocationRowProps {
  item: AllocationItem;
  disabled?: boolean;
  onChangeQty: (id: string, newQty: number) => void;
}

/**
 * Komponen Baris Alokasi Produk (`AllocationRow`) untuk Stage 2.
 * Menampilkan input angka besar bergaya POS modern, dilengkapi tombol step cepat (+1, +5, +10)
 * untuk efisiensi operasional layar sentuh barista/kasir.
 */
function AllocationRowComponent({ item, disabled = false, onChangeQty }: AllocationRowProps) {
  const [localVal, setLocalVal] = useState<string>(String(item.quantity || 0));

  useEffect(() => {
    setLocalVal(String(item.quantity || 0));
  }, [item.quantity]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value.replace(/\D/g, "").replace(/^0+/, "");
    const formatted = raw === "" ? "0" : raw;
    setLocalVal(formatted);
    const num = parseInt(formatted, 10);
    onChangeQty(item.id, isNaN(num) ? 0 : Math.max(0, num));
  };

  const handleStep = (delta: number) => {
    if (disabled) return;
    const current = parseInt(localVal, 10) || 0;
    const next = Math.max(0, current + delta);
    setLocalVal(String(next));
    onChangeQty(item.id, next);
  };

  const getCategoryBadge = () => {
    if (item.category === "Coffee") {
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-amber-500/10 border border-amber-500/20 text-amber-400 text-[10px] font-bold uppercase tracking-wider">
          <Coffee className="w-3 h-3" />
          <span>Coffee</span>
        </span>
      );
    }
    if (item.category === "Non-Coffee") {
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-rose-500/10 border border-rose-500/20 text-rose-400 text-[10px] font-bold uppercase tracking-wider">
          <CupSoda className="w-3 h-3" />
          <span>Non-Coffee</span>
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-purple-500/10 border border-purple-500/20 text-purple-400 text-[10px] font-bold uppercase tracking-wider">
        <Sparkles className="w-3 h-3" />
        <span>Custom Menu</span>
      </span>
    );
  };

  const isAllocated = Number(item.quantity) > 0;

  return (
    <div
      className={`p-3.5 sm:p-4 rounded-2xl border transition-all duration-200 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 ${
        isAllocated
          ? "bg-[#181614] border-[#EA580C]/40 shadow-lg shadow-[#EA580C]/5"
          : "bg-[#141414] border-white/5 hover:border-white/10"
      }`}
    >
      {/* Kiri: Info Produk */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-1">
          {getCategoryBadge()}
          {isAllocated && (
            <span className="text-[10px] font-black uppercase text-emerald-400 bg-emerald-500/10 px-1.5 py-0.5 rounded border border-emerald-500/20">
              ✓ Allocated
            </span>
          )}
        </div>
        <h4 className="text-sm sm:text-base font-black text-white tracking-tight truncate">
          {item.productName}
        </h4>
      </div>

      {/* Kanan: Input Control & Step Buttons */}
      <div className="flex items-center gap-1.5 sm:gap-2 w-full sm:w-auto justify-end">
        {/* Tombol Min (-1) */}
        <button
          type="button"
          disabled={disabled || Number(item.quantity) <= 0}
          onClick={() => handleStep(-1)}
          className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-neutral-900 border border-white/10 flex items-center justify-center text-neutral-400 hover:text-white hover:bg-neutral-800 transition-all active:scale-95 disabled:opacity-30 disabled:pointer-events-none shrink-0"
          title="Kurangi 1 Cup"
        >
          <Minus className="w-4 h-4" />
        </button>

        {/* Input Angka Besar */}
        <div className="relative w-24 sm:w-28">
          <input
            type="text"
            inputMode="numeric"
            pattern="[0-9]*"
            value={localVal}
            onChange={handleInputChange}
            disabled={disabled}
            className={`w-full py-2 px-3 text-lg sm:text-xl font-black text-center rounded-xl border outline-none transition-all ${
              isAllocated
                ? "bg-black/80 text-white border-[#EA580C] shadow-inner"
                : "bg-black/60 text-neutral-400 border-white/10 focus:border-neutral-500 focus:text-white"
            } disabled:opacity-50`}
          />
        </div>

        {/* Tombol Plus (+1, +5, +10) */}
        <div className="flex items-center gap-1 shrink-0">
          <button
            type="button"
            disabled={disabled}
            onClick={() => handleStep(1)}
            className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-neutral-900 border border-white/10 flex items-center justify-center text-neutral-300 hover:text-white hover:bg-neutral-800 transition-all active:scale-95 disabled:opacity-40"
            title="Tambah 1 Cup"
          >
            <Plus className="w-4 h-4" />
          </button>
          <button
            type="button"
            disabled={disabled}
            onClick={() => handleStep(5)}
            className="px-2.5 h-9 sm:h-10 rounded-xl bg-neutral-900/80 border border-white/5 font-black text-xs text-neutral-400 hover:text-white hover:bg-neutral-800 transition-all active:scale-95 disabled:opacity-40"
            title="Tambah 5 Cup"
          >
            +5
          </button>
          <button
            type="button"
            disabled={disabled}
            onClick={() => handleStep(10)}
            className="px-2.5 h-9 sm:h-10 rounded-xl bg-neutral-900/80 border border-white/5 font-black text-xs text-neutral-400 hover:text-white hover:bg-neutral-800 transition-all active:scale-95 disabled:opacity-40 hidden xs:block sm:block"
            title="Tambah 10 Cup"
          >
            +10
          </button>
        </div>
      </div>
    </div>
  );
}

export default React.memo(AllocationRowComponent);
