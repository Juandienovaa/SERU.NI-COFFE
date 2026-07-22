"use client";

import React from "react";
import { motion, AnimatePresence } from "motion/react";
import { ProductionBatch } from "@/types/production";
import { BatchCard } from "./BatchCard";
import { RefreshCw, Inbox, AlertCircle } from "lucide-react";
import { LiveInventoryWidget } from "@/components/inventory/LiveInventoryWidget";

interface ProductionQueueProps {
  batches: ProductionBatch[];
  loading: boolean;
  errorMsg?: string | null;
  onStartProduction: (batch: ProductionBatch) => void;
  onRefresh: () => void;
}

export const ProductionQueue: React.FC<ProductionQueueProps> = ({
  batches,
  loading,
  errorMsg,
  onStartProduction,
  onRefresh
}) => {
  return (
    <div className="w-full">
      {/* Minimal Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-10">
        <div>
          <h1 className="text-3xl sm:text-4xl font-black text-white tracking-tight">
            Antrean Produksi
          </h1>
          <p className="text-sm sm:text-base text-neutral-400 font-light mt-1.5">
            Pilih batch untuk mulai meracik.
          </p>
        </div>

        <button
          onClick={onRefresh}
          disabled={loading}
          className="flex items-center gap-2.5 px-5 py-3 rounded-2xl bg-[#18181B] hover:bg-neutral-800 border border-white/[0.06] text-xs font-bold text-neutral-300 hover:text-white transition-all active:scale-95 shadow-lg shrink-0 disabled:opacity-50"
        >
          <RefreshCw className={`w-4 h-4 text-neutral-400 ${loading ? "animate-spin text-white" : ""}`} />
          <span>{loading ? "Memperbarui..." : "Segarkan"}</span>
        </button>
      </div>

      {/* Error Banner */}
      {errorMsg && (
        <div className="mb-8 p-5 rounded-3xl bg-rose-950/80 border border-rose-500/40 text-rose-200 text-sm flex items-start gap-3.5 backdrop-blur-xl">
          <AlertCircle className="w-5 h-5 text-rose-400 shrink-0 mt-0.5" />
          <div className="flex-1">
            <strong className="font-bold block mb-0.5 text-white">Gagal Memuat Antrean</strong>
            <span>{errorMsg}</span>
          </div>
        </div>
      )}

      {/* Barista Smart Production Decision Assistant (WMS Inventory Widget) */}
      <LiveInventoryWidget className="mb-12" />

      {/* Shimmer Skeleton Grid */}
      {loading && batches.length === 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
          {[1, 2, 3].map((n) => (
            <div
              key={n}
              className="h-64 rounded-3xl bg-[#18181B]/80 border border-white/[0.06] p-7 flex flex-col justify-between overflow-hidden relative"
            >
              <div className="space-y-3">
                <div className="w-1/2 h-5 rounded-lg skeleton-shimmer" />
                <div className="w-1/3 h-12 rounded-2xl mt-4 skeleton-shimmer" />
              </div>
              <div className="h-12 rounded-2xl mt-6 skeleton-shimmer" />
            </div>
          ))}
        </div>
      ) : batches.length > 0 ? (
        /* Batch Card Grid */
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8"
        >
          <AnimatePresence>
            {batches.map((batch) => (
              <BatchCard key={batch.id} batch={batch} onStartProduction={onStartProduction} />
            ))}
          </AnimatePresence>
        </motion.div>
      ) : (
        /* Empty State */
        <motion.div
          initial={{ opacity: 0, scale: 0.98 }}
          animate={{ opacity: 1, scale: 1 }}
          className="py-24 px-6 rounded-3xl bg-[#18181B]/40 border border-dashed border-white/[0.08] flex flex-col items-center justify-center text-center max-w-lg mx-auto"
        >
          <div className="w-16 h-16 rounded-3xl bg-[#111113] border border-white/[0.06] flex items-center justify-center text-neutral-500 mb-5 shadow-xl">
            <Inbox className="w-7 h-7 text-neutral-400" />
          </div>
          <h3 className="text-xl font-bold text-white tracking-tight">
            Belum Ada Job Produksi
          </h3>
          <p className="text-sm text-neutral-400 font-light max-w-sm mt-1.5 leading-relaxed">
            Semua batch dari Manajer telah selesai diproses atau belum ada antrean baru saat ini.
          </p>
          <button
            onClick={onRefresh}
            className="mt-6 px-6 py-3 rounded-2xl bg-white hover:bg-neutral-100 text-black font-bold text-xs shadow-lg transition-all active:scale-95"
          >
            Cek Lagi
          </button>
        </motion.div>
      )}
    </div>
  );
};
