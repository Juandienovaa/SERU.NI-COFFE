"use client";

import React, { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  ProductionBatchStage2,
  AllocationItem,
  BalanceCalculationResult
} from "@/types/productionStage2";
import AllocationRow from "./AllocationRow";
import BalanceIndicator from "./BalanceIndicator";
import StatusBadgeStage2 from "./StatusBadgeStage2";
import {
  ArrowRight,
  Loader2,
  PackageCheck,
  AlertTriangle,
  PlusCircle,
  HelpCircle,
  Lock,
  Calendar,
  Layers
} from "lucide-react";

interface ProductionWorkspaceProps {
  batch: ProductionBatchStage2 | null;
  allocations: AllocationItem[];
  defectCups: number;
  balanceResult: BalanceCalculationResult;
  submitting: boolean;
  onChangeQuantity: (id: string, newQty: number) => void;
  onChangeDefect: (newQty: number) => void;
  onAddCustomProduct: (productName: string) => void;
  onSubmit: () => Promise<{ success: boolean; error?: string }>;
}

/**
 * Komponen Panel Kanan (`ProductionWorkspace`) untuk Stage 2 MES.
 * Tempat barista melakukan alokasi konversi produk jadi, mencatat gelas rusak (Defect Cups),
 * melihat indikator kekekalan gelas real-time, dan mengirimkan sesi dengan proteksi ketat.
 */
export default function ProductionWorkspace({
  batch,
  allocations,
  defectCups,
  balanceResult,
  submitting,
  onChangeQuantity,
  onChangeDefect,
  onAddCustomProduct,
  onSubmit
}: ProductionWorkspaceProps) {
  const [customInput, setCustomInput] = useState("");
  const [showTooltip, setShowTooltip] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  if (!batch) {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="bg-[#111111]/95 backdrop-blur-xl border border-white/10 rounded-3xl p-8 sm:p-12 shadow-2xl flex flex-col items-center justify-center min-h-[520px] text-center"
      >
        <div className="w-20 h-20 rounded-3xl bg-neutral-900 border border-white/10 flex items-center justify-center text-neutral-500 mb-6 shadow-inner">
          <Layers className="w-10 h-10 text-neutral-600 animate-pulse" />
        </div>
        <h3 className="text-lg sm:text-xl font-black text-white tracking-tight mb-2">
          Workspace Konversi Produksi
        </h3>
        <p className="text-xs sm:text-sm text-neutral-400 max-w-md leading-relaxed">
          Silakan pilih tiket sesi produksi yang berstatus <strong className="text-orange-400">PENDING_BARISTA</strong> pada antrean di panel kiri untuk mulai mengalokasikan hasil produksi dan gelas cacat.
        </p>
      </motion.div>
    );
  }

  const dateObj = batch.created_at ? new Date(batch.created_at) : new Date();
  const dateStr = new Intl.DateTimeFormat("id-ID", {
    timeZone: "Asia/Jakarta",
    day: "2-digit",
    month: "long",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit"
  }).format(dateObj).replace(".", ":") + " WIB";

  const handleAddCustom = (e: React.FormEvent) => {
    e.preventDefault();
    if (customInput.trim()) {
      onAddCustomProduct(customInput.trim());
      setCustomInput("");
    }
  };

  const handleFormSubmit = async () => {
    if (!balanceResult.isValid || submitting) return;
    setSubmitError(null);
    const res = await onSubmit();
    if (!res.success && res.error) {
      setSubmitError(res.error);
    }
  };

  const formattedRawCups = new Intl.NumberFormat("id-ID").format(Number(batch.raw_cups_given) || 0);

  return (
    <motion.div
      key={batch.id}
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.3 }}
      className="bg-[#111111]/95 backdrop-blur-xl border border-white/10 rounded-3xl p-5 sm:p-8 shadow-2xl flex flex-col justify-between space-y-6 relative overflow-hidden"
    >
      {/* Accent Glow Top Right */}
      <div className="absolute -top-32 -right-32 w-64 h-64 bg-[#EA580C]/10 rounded-full blur-3xl pointer-events-none" />

      {/* 1. SESSION INFORMATION CARDS */}
      <div>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-5 border-b border-white/10">
          <div>
            <div className="flex items-center gap-2.5 mb-1.5">
              <span className="font-mono text-xs sm:text-sm font-bold tracking-tight text-white bg-black/60 px-2.5 py-1 rounded-lg border border-white/10 select-all">
                {batch.batch_number}
              </span>
              <StatusBadgeStage2 status={batch.status} />
            </div>
            <p className="text-xs text-neutral-400 flex items-center gap-1.5">
              <Calendar className="w-3.5 h-3.5 text-neutral-500" />
              <span>Dibuat pada: <strong className="text-neutral-300">{dateStr}</strong></span>
            </p>
          </div>

          <div className="bg-[#1A1614] border border-[#EA580C]/30 rounded-2xl p-3.5 sm:p-4 flex items-center gap-3 shadow-lg">
            <div className="w-10 h-10 rounded-xl bg-[#EA580C]/10 border border-[#EA580C]/20 flex items-center justify-center text-[#EA580C] shrink-0">
              <PackageCheck className="w-5 h-5" />
            </div>
            <div>
              <p className="text-[10px] font-bold text-neutral-400 uppercase tracking-wider">
                Bahan Mentah Diterima
              </p>
              <p className="text-lg sm:text-xl font-black text-white font-mono">
                {formattedRawCups} <span className="text-xs text-neutral-400 font-sans font-bold uppercase">Cup</span>
              </p>
            </div>
          </div>
        </div>

        {/* 2. REAL-TIME ACCOUNTABILITY ENGINE INDICATOR */}
        <div className="mt-5">
          <BalanceIndicator balance={balanceResult} />
        </div>

        {/* Error Alert Box Jika Submit Gagal */}
        <AnimatePresence>
          {submitError && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="mt-4 bg-red-500/15 border border-red-500/40 text-red-300 p-4 rounded-2xl text-xs font-bold flex items-start gap-3 shadow-lg"
            >
              <AlertTriangle className="w-5 h-5 text-red-500 shrink-0 mt-0.5" />
              <div className="flex-1">
                <p className="font-black text-white mb-0.5">Transaksi Produksi Gagal</p>
                <p>{submitError}</p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* 3. PRODUCTION ALLOCATION WORKSPACE */}
        <div className="mt-8 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div>
              <h4 className="text-sm font-black text-white uppercase tracking-wider flex items-center gap-2">
                <span>Alokasi Produk Jadi (Finished Goods)</span>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-neutral-800 text-neutral-300 font-bold border border-white/10">
                  {allocations.length} Menu
                </span>
              </h4>
              <p className="text-xs text-neutral-400">
                Masukkan jumlah kuantitas yang diproduksi untuk setiap menu pada shift ini.
              </p>
            </div>
          </div>

          {/* Form Tambah Menu/Produk Custom */}
          <form onSubmit={handleAddCustom} className="flex gap-2 pt-1">
            <input
              type="text"
              placeholder="+ Tambah Menu / Produk Custom (Contoh: Americano Leci Musiman)..."
              value={customInput}
              onChange={(e) => setCustomInput(e.target.value)}
              disabled={submitting}
              className="flex-1 py-2.5 px-4 rounded-xl bg-black/60 border border-white/10 text-xs sm:text-sm font-medium text-white placeholder:text-neutral-500 outline-none focus:border-[#EA580C] transition-all disabled:opacity-50"
            />
            <button
              type="submit"
              disabled={!customInput.trim() || submitting}
              className="px-4 py-2.5 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-white font-bold text-xs uppercase tracking-wider flex items-center gap-1.5 transition-all disabled:opacity-40"
            >
              <PlusCircle className="w-4 h-4 text-[#EA580C]" />
              <span>Tambah</span>
            </button>
          </form>

          {/* Daftar Row Alokasi dengan Max-Height Scroll */}
          <div className="max-h-[380px] overflow-y-auto pr-1 space-y-2.5 pt-2">
            {allocations.map((item) => (
              <AllocationRow
                key={item.id}
                item={item}
                disabled={submitting}
                onChangeQty={onChangeQuantity}
              />
            ))}
          </div>
        </div>

        {/* 4. DEFECT TRACKING SECTION */}
        <div className="mt-8 pt-6 border-t border-white/10">
          <div className="bg-[#161211] border border-orange-500/30 rounded-2xl p-4 sm:p-5">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded bg-orange-500/20 text-orange-400 border border-orange-500/30">
                    Defect Tracking
                  </span>
                  <span className="text-xs font-bold text-white">Gelas Rusak / Cacat / Tumpah</span>
                </div>
                <p className="text-xs text-neutral-400 max-w-md leading-relaxed">
                  Catat gelas yang rusak saat pembuatan, tumpah, atau ditolak QC. Angka ini wajib dilaporkan untuk menyeimbangkan rumus kekekalan gelas.
                </p>
              </div>

              {/* Input Angka Cacat */}
              <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
                <button
                  type="button"
                  disabled={submitting || defectCups <= 0}
                  onClick={() => onChangeDefect(defectCups - 1)}
                  className="w-10 h-10 rounded-xl bg-neutral-900 border border-white/10 flex items-center justify-center text-neutral-400 hover:text-white transition-all disabled:opacity-30"
                  title="Kurangi 1"
                >
                  -
                </button>
                <div className="relative w-28">
                  <input
                    type="text"
                    inputMode="numeric"
                    pattern="[0-9]*"
                    value={defectCups}
                    onChange={(e) => {
                      const val = parseInt(e.target.value.replace(/\D/g, ""), 10);
                      onChangeDefect(isNaN(val) ? 0 : Math.max(0, val));
                    }}
                    disabled={submitting}
                    className="w-full py-2 px-3 text-xl font-black text-center text-orange-400 bg-black/80 rounded-xl border border-orange-500/40 outline-none transition-all disabled:opacity-50"
                  />
                </div>
                <button
                  type="button"
                  disabled={submitting}
                  onClick={() => onChangeDefect(defectCups + 1)}
                  className="w-10 h-10 rounded-xl bg-neutral-900 border border-white/10 flex items-center justify-center text-neutral-400 hover:text-white transition-all disabled:opacity-30"
                  title="Tambah 1"
                >
                  +
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 5. SUBMIT BUTTON GUARDRAIL */}
      <div className="pt-6 border-t border-white/10 relative">
        <div className="flex items-center justify-between gap-4">
          <div className="relative">
            <button
              type="button"
              onMouseEnter={() => setShowTooltip(true)}
              onMouseLeave={() => setShowTooltip(false)}
              className="text-neutral-500 hover:text-neutral-300 transition-colors p-1"
            >
              <HelpCircle className="w-5 h-5" />
            </button>
            {/* Tooltip Guardrail */}
            <AnimatePresence>
              {showTooltip && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 10 }}
                  className="absolute bottom-full left-0 mb-2 w-64 p-3 rounded-xl bg-neutral-900 border border-white/10 text-[11px] text-neutral-300 shadow-2xl z-50 pointer-events-none"
                >
                  <p className="font-bold text-white mb-1 flex items-center gap-1.5">
                    <Lock className="w-3.5 h-3.5 text-[#EA580C]" />
                    <span>Tombol Submit Dikunci Jika:</span>
                  </p>
                  <ul className="list-disc pl-4 space-y-0.5 text-neutral-400">
                    <li>Sisa alokasi (Remaining) tidak tepat = 0.</li>
                    <li>Belum ada minimal 1 produk/cacat yang dicatat.</li>
                    <li>Proses penyimpanan lain sedang berjalan.</li>
                  </ul>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          <button
            type="button"
            disabled={!balanceResult.isValid || submitting}
            onClick={handleFormSubmit}
            className="flex-1 sm:max-w-md py-4 sm:py-4.5 rounded-2xl bg-gradient-to-r from-[#EA580C] to-orange-600 hover:from-orange-600 hover:to-[#EA580C] text-white font-black text-sm uppercase tracking-wider shadow-xl shadow-[#EA580C]/25 flex items-center justify-center gap-2.5 transition-all duration-200 active:scale-[0.98] disabled:opacity-40 disabled:pointer-events-none disabled:shadow-none"
          >
            {submitting ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                <span>Memverifikasi & Menyimpan MES...</span>
              </>
            ) : (
              <>
                <span>Selesaikan Produksi & Kunci Sesi</span>
                <ArrowRight className="w-4.5 h-4.5" />
              </>
            )}
          </button>
        </div>
      </div>
    </motion.div>
  );
}
