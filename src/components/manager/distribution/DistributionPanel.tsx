"use client";

import React, { useState } from "react";
import { Package, Loader2 } from "lucide-react";
import { useProductionBatches } from "@/hooks/useProductionBatches";

interface DistributionPanelProps {
  onSuccess: () => void;
}

export const DistributionPanel = ({ onSuccess }: DistributionPanelProps) => {
  const [rawCups, setRawCups] = useState<string>("");
  const { submitNewBatch, submitting } = useProductionBatches(50);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleQuickAdd = (amount: number) => {
    setRawCups((prev) => {
      const current = parseInt(prev || "0", 10);
      return (current + amount).toString();
    });
  };

  const handleSubmit = async () => {
    const qty = parseInt(rawCups, 10);
    
    if (isNaN(qty) || qty <= 0) {
      setErrorMsg("Jumlah cup mentah harus lebih dari 0.");
      return;
    }
    
    setErrorMsg(null);
    const result = await submitNewBatch(qty);
    
    if (result.success) {
      setRawCups("");
      onSuccess();
    } else {
      setErrorMsg(result.error || "Gagal membuat sesi produksi.");
    }
  };

  return (
    <div className="bg-[#111111] border border-white/5 rounded-3xl p-6 md:p-8 flex flex-col h-full shadow-2xl relative overflow-hidden">
      {/* Decorative Blur */}
      <div className="absolute top-[-20%] right-[-10%] w-[50%] h-[50%] bg-[#F97316]/10 rounded-full blur-[100px] pointer-events-none" />

      <div className="mb-8 relative z-10">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-10 h-10 rounded-xl bg-orange-500/10 border border-orange-500/20 flex items-center justify-center">
            <Package className="w-5 h-5 text-orange-500" />
          </div>
          <h2 className="text-xl font-black text-white">Distribusi Gelas Mentah</h2>
        </div>
        <p className="text-sm text-neutral-400 font-medium">Membuat sesi produksi baru.</p>
        <p className="text-xs text-neutral-500 mt-2 leading-relaxed">
          Gelas mentah yang dialokasikan akan menjadi modal utama Barista untuk produksi.
        </p>
      </div>

      <div className="space-y-6 flex-1 relative z-10">
        {/* Input Form */}
        <div>
          <label className="text-xs font-bold text-neutral-400 uppercase tracking-widest block mb-2">
            Jumlah Gelas Mentah
          </label>
          <div className="relative">
            <input
              type="number"
              min="1"
              value={rawCups}
              onChange={(e) => setRawCups(e.target.value)}
              placeholder="Contoh: 500"
              className="w-full bg-[#1A1A1A] border border-white/10 rounded-2xl py-4 px-5 text-2xl font-black font-mono text-white placeholder:text-neutral-700 focus:outline-none focus:border-orange-500/50 transition-colors"
            />
            <span className="absolute right-5 top-1/2 -translate-y-1/2 text-sm font-bold text-neutral-500 uppercase tracking-widest">
              Cups
            </span>
          </div>
        </div>

        {/* Quick Add Buttons */}
        <div className="grid grid-cols-4 gap-2">
          {[100, 200, 300, 500].map((amount) => (
            <button
              key={amount}
              type="button"
              onClick={() => handleQuickAdd(amount)}
              className="py-2.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/5 hover:border-white/10 text-xs font-bold text-neutral-300 transition-all active:scale-95"
            >
              +{amount}
            </button>
          ))}
        </div>

        {/* Error Message */}
        {errorMsg && (
          <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-xs font-medium text-red-400 leading-relaxed">
            {errorMsg}
          </div>
        )}
      </div>

      <button
        onClick={handleSubmit}
        disabled={submitting || !rawCups || parseInt(rawCups, 10) <= 0}
        className="w-full py-4 mt-8 rounded-2xl font-black text-sm text-white bg-gradient-to-br from-[#F97316] to-orange-600 hover:from-orange-500 hover:to-orange-700 transition-all active:scale-[0.98] disabled:opacity-50 flex items-center justify-center gap-2 shadow-xl shadow-orange-500/20 relative z-10"
      >
        {submitting ? (
          <>
            <Loader2 className="w-5 h-5 animate-spin" />
            <span>Memvalidasi Sesi...</span>
          </>
        ) : (
          <span>Alokasikan & Buat Batch</span>
        )}
      </button>
    </div>
  );
};
