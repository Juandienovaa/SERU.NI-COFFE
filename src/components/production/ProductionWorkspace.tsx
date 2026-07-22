"use client";

import React, { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  ProductionBatch,
  ProductCounterItem,
  BalanceReconciliationResult,
  ProductionLockStatus
} from "@/types/production";
import { ProductCounterCard } from "./ProductCounterCard";
import { DefectCounterCard } from "./DefectCounterCard";
import { BalanceCard } from "./BalanceCard";
import { StickySubmitFooter } from "./StickySubmitFooter";
import { Plus, AlertCircle, Sparkles, Lock, X, ArrowLeft } from "lucide-react";

interface ProductionWorkspaceProps {
  batch: ProductionBatch;
  allocations: ProductCounterItem[];
  defectCups: number;
  balanceResult: BalanceReconciliationResult;
  progressPercentage: number;
  lockStatus: ProductionLockStatus;
  submitting: boolean;
  clampingToast: string | null;
  onChangeQuantity: (productId: string, quantity: number) => void;
  onIncrement: (productId: string, delta: number) => void;
  onChangeDefect: (quantity: number) => void;
  onAddCustomProduct: (productName: string, category?: "Coffee" | "Non-Coffee" | "Custom") => void;
  onPartialSubmit?: (productId: string) => Promise<any>;
  onExit: () => void;
  onSubmit: () => void;
}

export const ProductionWorkspace: React.FC<ProductionWorkspaceProps> = ({
  batch,
  allocations,
  defectCups,
  balanceResult,
  progressPercentage,
  lockStatus,
  submitting,
  clampingToast,
  onChangeQuantity,
  onIncrement,
  onChangeDefect,
  onAddCustomProduct,
  onPartialSubmit,
  onExit,
  onSubmit
}) => {
  const [isAddingCustom, setIsAddingCustom] = useState<boolean>(false);
  const [customName, setCustomName] = useState<string>("");
  const [customCategory, setCustomCategory] = useState<"Coffee" | "Non-Coffee" | "Custom">("Coffee");

  const canIncrement = balanceResult.remaining > 0 && !lockStatus.isLockedByOther;

  const handleAddCustomSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customName.trim()) return;
    onAddCustomProduct(customName, customCategory);
    setCustomName("");
    setIsAddingCustom(false);
  };

  return (
    <div className="w-full pb-28">
      {/* Top Bar: Clean Minimalist Workspace Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-8 pb-6 border-b border-white/[0.06]">
        <div className="flex items-center gap-4">
          <button
            onClick={onExit}
            className="p-3 rounded-2xl bg-[#18181B] hover:bg-neutral-800 border border-white/[0.06] text-neutral-300 hover:text-white transition-all active:scale-95 shrink-0 shadow-lg"
            title="Kembali ke antrean"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold font-mono text-[#F97316]">
                Batch {batch.batch_number}
              </span>
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
            </div>
            <h2 className="text-2xl sm:text-3xl font-black text-white tracking-tight mt-0.5">
              Ruang Racik Produksi
            </h2>
          </div>
        </div>

        {/* Add Custom Product Button */}
        {!lockStatus.isLockedByOther && (
          <button
            onClick={() => setIsAddingCustom(true)}
            className="px-5 py-3 rounded-2xl bg-[#18181B] hover:bg-neutral-800 border border-white/[0.06] text-xs font-bold text-neutral-300 hover:text-white transition-all flex items-center gap-2.5 active:scale-95 shadow-lg shrink-0"
          >
            <Plus className="w-4 h-4 text-[#F97316]" />
            <span>Tambah Menu Varian</span>
          </button>
        )}
      </div>

      {/* Clamping Toast Alert */}
      <AnimatePresence>
        {clampingToast && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="mb-6 p-4 rounded-2xl bg-amber-950/90 border border-amber-500/50 text-amber-200 text-xs sm:text-sm flex items-center gap-3 shadow-lg"
          >
            <AlertCircle className="w-5 h-5 text-amber-400 shrink-0" />
            <span className="font-semibold">{clampingToast}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Lock Status Banner */}
      {lockStatus.isLockedByOther && (
        <div className="mb-8 p-6 rounded-3xl bg-rose-950/80 border border-rose-500/50 text-rose-200 flex items-start gap-4 backdrop-blur-xl shadow-2xl">
          <Lock className="w-6 h-6 text-rose-400 shrink-0 mt-0.5" />
          <div>
            <h4 className="text-base font-black text-white">Ruang Racik Terkunci oleh Barista Lain</h4>
            <p className="text-xs sm:text-sm text-rose-200/80 mt-1 leading-relaxed">
              {lockStatus.message || "Anda hanya dapat melihat data alokasi tanpa mengubah angka."}
            </p>
          </div>
        </div>
      )}

      {/* Custom Product Add Modal */}
      <AnimatePresence>
        {isAddingCustom && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="w-full max-w-md rounded-3xl bg-[#111113] border border-white/[0.08] p-7 shadow-2xl"
            >
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-bold text-white">Tambah Menu Varian</h3>
                <button
                  onClick={() => setIsAddingCustom(false)}
                  className="p-1.5 rounded-xl bg-white/5 hover:bg-white/10 text-neutral-400 hover:text-white"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleAddCustomSubmit} className="space-y-5">
                <div>
                  <label className="text-xs font-bold text-neutral-400 block mb-2">
                    Nama Menu / Varian
                  </label>
                  <input
                    type="text"
                    placeholder="Contoh: Kopi Susu Aren Gula Pisah"
                    value={customName}
                    onChange={(e) => setCustomName(e.target.value)}
                    className="w-full bg-[#18181B] border border-white/[0.08] rounded-2xl px-4 py-3.5 text-sm text-white focus:outline-none focus:border-[#F97316] transition-colors"
                    autoFocus
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-neutral-400 block mb-2">
                    Kategori Menu
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    {(["Coffee", "Non-Coffee"] as const).map((cat) => (
                      <button
                        type="button"
                        key={cat}
                        onClick={() => setCustomCategory(cat)}
                        className={`py-3 rounded-2xl text-xs font-bold border transition-all ${
                          customCategory === cat
                            ? "bg-[#F97316] border-[#F97316] text-white font-black shadow-lg shadow-[#F97316]/20"
                            : "bg-[#18181B] border-white/[0.06] text-neutral-400 hover:text-white"
                        }`}
                      >
                        {cat}
                      </button>
                    ))}
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={!customName.trim()}
                  className="w-full py-4 rounded-2xl bg-white hover:bg-neutral-100 disabled:opacity-30 text-black font-black text-sm mt-3 transition-all shadow-lg"
                >
                  Tambahkan Menu
                </button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Main Content Layout Stack */}
      <div className="space-y-8">
        {/* 1. Live Reconciliation Card */}
        <BalanceCard balance={balanceResult} progressPercentage={progressPercentage} />

        {/* 2. Product Counter Grid */}
        <div>
          <div className="flex items-center justify-between mb-5">
            <h3 className="text-lg font-black text-white flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-[#F97316]" />
              <span>Katalog Resmi POS • Alokasi Menu</span>
            </h3>
            <span className="text-xs font-mono font-semibold text-neutral-400 px-3 py-1 rounded-full bg-[#18181B] border border-white/[0.06]">
              {allocations.length} Item Katalog
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {allocations.map((item) => (
              <ProductCounterCard
                key={item.id}
                item={item}
                canIncrement={canIncrement}
                onChangeQuantity={onChangeQuantity}
                onIncrement={onIncrement}
                onPartialSubmit={onPartialSubmit}
              />
            ))}
          </div>
        </div>

        {/* 3. Defect Section */}
        <DefectCounterCard
          defectCups={defectCups}
          canIncrement={canIncrement}
          onChangeDefect={onChangeDefect}
        />
      </div>

      {/* 4. Sticky Guardrail Footer */}
      <StickySubmitFooter
        balance={balanceResult}
        submitting={submitting}
        onSubmit={onSubmit}
        onExit={onExit}
      />
    </div>
  );
};
