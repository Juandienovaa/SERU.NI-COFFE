"use client";

import React from "react";
import { motion } from "motion/react";
import { ProductionBatch } from "@/types/productionBatch";
import StatusBadge from "./StatusBadge";
import { Eye, FileSpreadsheet } from "lucide-react";

interface BatchRowProps {
  batch: ProductionBatch;
  index: number;
  onSelect?: (id: string) => void;
  isSelected?: boolean;
}

/**
 * Komponen Baris Tabel (`BatchRow`) yang ter-memoize (`React.memo`) untuk mencegah re-render masif.
 * Dilengkapi dengan tombol "Lihat Audit" langsung dan animasi masuk Framer Motion.
 */
function BatchRowComponent({ batch, index, onSelect, isSelected = false }: BatchRowProps) {
  const dateObj = batch.created_at ? new Date(batch.created_at) : new Date();

  const dateStr = new Intl.DateTimeFormat("id-ID", {
    timeZone: "Asia/Jakarta",
    day: "2-digit",
    month: "short",
    year: "numeric"
  }).format(dateObj);

  const timeStr = new Intl.DateTimeFormat("id-ID", {
    timeZone: "Asia/Jakarta",
    hour: "2-digit",
    minute: "2-digit"
  }).format(dateObj).replace(".", ":") + " WIB";

  const formattedCups = new Intl.NumberFormat("id-ID").format(Number(batch.raw_cups_given) || 0);

  return (
    <motion.tr
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25, delay: Math.min(index * 0.04, 0.4) }}
      onClick={() => onSelect && onSelect(batch.id)}
      className={`border-b border-white/5 transition-all duration-200 cursor-pointer group ${
        isSelected
          ? "bg-[#F97316]/10 border-[#F97316]/30"
          : "hover:bg-white/[0.03] active:bg-white/[0.05]"
      }`}
    >
      {/* Kolom Tanggal */}
      <td className="px-5 py-4 text-xs font-bold text-neutral-300 whitespace-nowrap">
        {dateStr}
      </td>

      {/* Kolom Jam */}
      <td className="px-5 py-4 text-xs text-neutral-400 whitespace-nowrap">
        {timeStr}
      </td>

      {/* Kolom Batch Number (Mono Font) */}
      <td className="px-5 py-4 whitespace-nowrap">
        <span className="font-mono text-xs font-bold tracking-tight text-white bg-[#111113] group-hover:bg-[#18181B] px-2.5 py-1.5 rounded-lg border border-white/5 select-all transition-colors">
          {batch.batch_number}
        </span>
      </td>

      {/* Kolom Raw Cups */}
      <td className="px-5 py-4 whitespace-nowrap">
        <div className="flex items-baseline gap-1.5">
          <span className="text-sm font-black text-white font-mono">{formattedCups}</span>
          <span className="text-[10px] font-bold text-neutral-500 uppercase tracking-widest">Cup</span>
        </div>
      </td>

      {/* Kolom Status Badge */}
      <td className="px-5 py-4 whitespace-nowrap">
        <StatusBadge status={batch.status} />
      </td>

      {/* Kolom Action Detail */}
      <td className="px-5 py-4 whitespace-nowrap text-right">
        <button
          onClick={(e) => {
            e.stopPropagation();
            onSelect && onSelect(batch.id);
          }}
          className="px-3 py-1.5 rounded-xl bg-[#18181B] group-hover:bg-neutral-800 border border-white/[0.06] text-xs font-bold text-neutral-300 group-hover:text-white flex items-center gap-1.5 ml-auto transition-all active:scale-95 shadow-sm"
          title="Buka Laporan Intelijen Produksi"
        >
          <Eye className="w-3.5 h-3.5 text-[#F97316]" />
          <span>Lihat Laporan</span>
        </button>
      </td>
    </motion.tr>
  );
}

export default React.memo(BatchRowComponent);
