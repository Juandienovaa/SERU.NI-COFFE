"use client";

import React from "react";
import { motion } from "motion/react";
import { ProductionBatchStage2 } from "@/types/productionStage2";
import StatusBadgeStage2 from "./StatusBadgeStage2";
import { Clock, PackageCheck } from "lucide-react";

interface BatchCardProps {
  batch: ProductionBatchStage2;
  position: number;
  isSelected: boolean;
  onSelect: (batch: ProductionBatchStage2) => void;
}

/**
 * Komponen Tiket Produksi (`BatchCard`) untuk Left Panel (Queue).
 * Mengadopsi desain tiket MES dengan animasi Framer Motion, indikator posisi antrean (#1),
 * dan highlight ring aktif saat dipilih.
 */
export default function BatchCard({
  batch,
  position,
  isSelected,
  onSelect
}: BatchCardProps) {
  const dateObj = batch.created_at ? new Date(batch.created_at) : new Date();

  const timeStr = new Intl.DateTimeFormat("id-ID", {
    timeZone: "Asia/Jakarta",
    hour: "2-digit",
    minute: "2-digit"
  }).format(dateObj).replace(".", ":") + " WIB";

  const dateStr = new Intl.DateTimeFormat("id-ID", {
    timeZone: "Asia/Jakarta",
    day: "2-digit",
    month: "short"
  }).format(dateObj);

  const formattedCups = new Intl.NumberFormat("id-ID").format(Number(batch.raw_cups_given) || 0);

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.96, y: 10 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      transition={{ duration: 0.2, delay: Math.min(position * 0.05, 0.3) }}
      onClick={() => onSelect(batch)}
      className={`p-4 sm:p-5 rounded-2xl border transition-all duration-200 cursor-pointer relative overflow-hidden group select-none ${
        isSelected
          ? "bg-[#1A1614] border-[#EA580C] shadow-[0_4px_25px_rgba(234,88,12,0.2)] ring-1 ring-[#EA580C]/50"
          : "bg-[#111111] border-white/5 hover:border-white/15 hover:bg-white/[0.03] active:scale-[0.99]"
      }`}
    >
      {/* Accent Glow saat dipilih */}
      {isSelected && (
        <div className="absolute -right-8 -top-8 w-24 h-24 bg-[#EA580C]/20 rounded-full blur-xl pointer-events-none" />
      )}

      {/* Header Baris 1: Posisi Antrean & Badge */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <span
            className={`w-6 h-6 rounded-lg flex items-center justify-center font-black text-xs ${
              isSelected
                ? "bg-[#EA580C] text-white shadow-md shadow-[#EA580C]/30"
                : "bg-neutral-800 text-neutral-400 group-hover:text-white"
            }`}
          >
            #{position}
          </span>
          <span className="text-[11px] font-bold text-neutral-400 group-hover:text-neutral-300 transition-colors flex items-center gap-1">
            <Clock className="w-3 h-3 text-neutral-500" />
            <span>{dateStr}, {timeStr}</span>
          </span>
        </div>
        <StatusBadgeStage2 status={batch.status} />
      </div>

      {/* Baris 2: Batch Number (Mono Font) */}
      <div className="mb-3">
        <span className="font-mono text-xs sm:text-sm font-bold tracking-tight text-white bg-black/60 px-2.5 py-1 rounded-lg border border-white/5 block w-fit">
          {batch.batch_number}
        </span>
      </div>

      {/* Baris 3: Raw Cups Summary */}
      <div className="pt-3 border-t border-white/5 flex items-center justify-between text-xs">
        <span className="text-neutral-400 font-medium">Bahan Mentah Diterima:</span>
        <div className="flex items-center gap-1.5 font-black text-white text-sm">
          <PackageCheck className="w-4 h-4 text-[#EA580C]" />
          <span>{formattedCups}</span>
          <span className="text-[10px] text-neutral-500 font-bold uppercase tracking-wider">Cup</span>
        </div>
      </div>
    </motion.div>
  );
}
