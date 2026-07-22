"use client";

import React from "react";
import { motion } from "motion/react";
import { RefreshCw, PackageOpen, Layers } from "lucide-react";
import { ProductionBatchStage2 } from "@/types/productionStage2";
import BatchCard from "./BatchCard";

interface ProductionQueueProps {
  batches: ProductionBatchStage2[];
  selectedBatch: ProductionBatchStage2 | null;
  loading: boolean;
  onSelectBatch: (batch: ProductionBatchStage2) => void;
  onRefresh: () => void;
}

/**
 * Komponen Panel Kiri (`ProductionQueue`) untuk Stage 2.
 * Menampilkan seluruh antrean tiket sesi produksi yang berstatus `PENDING_BARISTA`,
 * diurutkan dari yang terbaru (Newest First) beserta penanganan loading & empty state.
 */
export default function ProductionQueue({
  batches,
  selectedBatch,
  loading,
  onSelectBatch,
  onRefresh
}: ProductionQueueProps) {
  return (
    <div className="bg-[#111111]/95 backdrop-blur-xl border border-white/10 rounded-3xl p-5 sm:p-6 shadow-2xl flex flex-col h-full min-h-[520px]">
      {/* Header Panel */}
      <div className="flex items-center justify-between pb-5 border-b border-white/10 mb-4">
        <div>
          <h3 className="text-base font-black text-white tracking-tight flex items-center gap-2">
            <Layers className="w-5 h-5 text-[#EA580C]" />
            <span>Antrean Tiket Produksi</span>
          </h3>
          <p className="text-xs text-neutral-400 mt-0.5">
            Tiket masuk dari manajer yang menunggu pengerjaan barista.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-[11px] font-bold px-2.5 py-1 rounded-full bg-neutral-900 text-neutral-300 border border-white/10">
            {batches.length} Sesi
          </span>
          <button
            onClick={onRefresh}
            disabled={loading}
            className="p-2 rounded-xl bg-neutral-900 hover:bg-neutral-800 border border-white/10 text-neutral-400 hover:text-white transition-all active:scale-95 disabled:opacity-50"
            title="Muat Ulang Antrean"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin text-[#EA580C]" : ""}`} />
          </button>
        </div>
      </div>

      {/* Queue List Container */}
      <div className="flex-1 overflow-y-auto pr-1 space-y-3 min-h-0">
        {/* 1. STATE LOADING (Skeleton Shimmer) */}
        {loading && batches.length === 0 && (
          <div className="space-y-3">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="p-5 rounded-2xl bg-[#161616] border border-white/5 animate-pulse space-y-3">
                <div className="flex justify-between items-center">
                  <div className="h-4 w-24 bg-neutral-800 rounded-md"></div>
                  <div className="h-5 w-20 bg-neutral-800 rounded-full"></div>
                </div>
                <div className="h-6 w-36 bg-neutral-800 rounded-lg"></div>
                <div className="pt-2 flex justify-between">
                  <div className="h-3 w-28 bg-neutral-800 rounded-md"></div>
                  <div className="h-4 w-16 bg-neutral-800 rounded-md"></div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* 2. STATE EMPTY (No Pending Sessions) */}
        {!loading && batches.length === 0 && (
          <motion.div
            initial={{ opacity: 0, scale: 0.96 }}
            animate={{ opacity: 1, scale: 1 }}
            className="py-16 px-4 text-center flex flex-col items-center justify-center my-auto"
          >
            <div className="w-16 h-16 rounded-3xl bg-neutral-900 border border-white/5 flex items-center justify-center text-neutral-600 mb-4 shadow-inner">
              <PackageOpen className="w-8 h-8 text-neutral-500" />
            </div>
            <h4 className="text-sm font-bold text-white mb-1">
              No pending production sessions.
            </h4>
            <p className="text-xs text-neutral-500 max-w-xs leading-relaxed">
              Seluruh distribusi gelas mentah dari manajer telah selesai dipertanggungjawabkan atau belum ada sesi baru yang dikirimkan.
            </p>
          </motion.div>
        )}

        {/* 3. STATE BERISI (Queue Cards) */}
        {batches.map((batch, idx) => (
          <BatchCard
            key={batch.id || batch.batch_number}
            batch={batch}
            position={idx + 1}
            isSelected={selectedBatch?.id === batch.id}
            onSelect={onSelectBatch}
          />
        ))}
      </div>

      {/* Footer Info */}
      <div className="pt-4 mt-4 border-t border-white/10 text-[10px] text-neutral-500 flex items-center justify-between">
        <span>Urutan: <strong className="text-neutral-400">Newest First</strong></span>
        <span>Pilih tiket untuk memproses</span>
      </div>
    </div>
  );
}
