"use client";

import React from "react";
import { motion } from "motion/react";
import { ProductionBatch } from "@/types/production";
import { Clock, ArrowRight } from "lucide-react";

interface BatchCardProps {
  batch: ProductionBatch;
  onStartProduction: (batch: ProductionBatch) => void;
}

export const BatchCard: React.FC<BatchCardProps> = ({ batch, onStartProduction }) => {
  const isInProgress = batch.status === "IN_PROGRESS" || Boolean(batch.locked_at) || Boolean(batch.locked_by);
  const formattedTime = batch.created_at
    ? new Date(batch.created_at).toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" }) + " WIB"
    : "Baru saja";

  return (
    <motion.div
      whileHover={{ y: -3, scale: 1.006 }}
      whileTap={{ scale: 0.994 }}
      className="group relative overflow-hidden rounded-3xl bg-[#18181B] hover:bg-[#18181B]/95 border border-white/[0.06] hover:border-white/[0.15] p-7 sm:p-8 shadow-2xl backdrop-blur-2xl transition-all flex flex-col justify-between gap-8"
    >
      {/* Top Bar: Batch Number & Status Badge */}
      <div className="flex items-center justify-between gap-4">
        <h3 className="text-lg sm:text-xl font-bold font-mono tracking-tight text-neutral-300 group-hover:text-white transition-colors">
          {batch.batch_number}
        </h3>

        {isInProgress ? (
          <div className="px-3 py-1 rounded-full bg-sky-500/15 border border-sky-500/30 flex items-center gap-1.5 text-xs font-semibold text-sky-400">
            <span className="w-1.5 h-1.5 rounded-full bg-sky-400 animate-pulse" />
            <span>Sedang Dikerjakan</span>
          </div>
        ) : (
          <div className="px-3 py-1 rounded-full bg-emerald-500/15 border border-emerald-500/30 flex items-center gap-1.5 text-xs font-semibold text-emerald-400">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
            <span>Menunggu Barista</span>
          </div>
        )}
      </div>

      {/* Hero Visual Focus: Quantity */}
      <div className="py-2">
        <div className="flex items-baseline gap-2.5">
          <span className="text-4xl sm:text-5xl font-black tracking-tight font-mono text-white">
            {batch.raw_cups_given}
          </span>
          <span className="text-lg sm:text-xl font-semibold text-neutral-400 tracking-wide">
            Cups
          </span>
        </div>
      </div>

      {/* Bottom Bar: Created Time & Primary CTA */}
      <div className="flex items-center justify-between pt-4 border-t border-white/[0.06] gap-4">
        <div className="flex items-center gap-2 text-xs text-neutral-400 font-medium">
          <Clock className="w-4 h-4 text-neutral-500" />
          <span>{formattedTime}</span>
        </div>

        <button
          type="button"
          onClick={() => onStartProduction(batch)}
          disabled={false}
          className={`px-6 py-3 rounded-2xl font-bold text-sm flex items-center gap-2.5 transition-all active:scale-95 ${
            isInProgress
              ? "bg-white/[0.08] hover:bg-white/[0.18] border border-white/20 text-white shadow-lg group-hover:translate-x-0.5"
              : "bg-[#F97316] hover:bg-[#EA580C] text-white shadow-lg shadow-orange-500/20 hover:shadow-orange-500/30 group-hover:translate-x-0.5"
          }`}
        >
          <span>{isInProgress ? "Lanjutkan" : "Mulai Produksi"}</span>
          <ArrowRight className="w-4 h-4 text-white group-hover:translate-x-1 transition-transform" />
        </button>
      </div>
    </motion.div>
  );
};
