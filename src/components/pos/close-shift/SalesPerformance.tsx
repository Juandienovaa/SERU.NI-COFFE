"use client";

import React from "react";
import { Coffee, ShoppingBag, Target, Award } from "lucide-react";
import { formatRupiah, TARGET_CUPS_BONUS } from "@/utils/financial";

interface SalesPerformanceProps {
  totalCupsSold: number;
  totalTransactions: number;
  avgCupsPerTx: number;
  avgRevenuePerTx: number;
}

export default function SalesPerformance({
  totalCupsSold,
  totalTransactions,
  avgCupsPerTx,
  avgRevenuePerTx,
}: SalesPerformanceProps) {
  const progressPercent = Math.min(100, Math.round((totalCupsSold / TARGET_CUPS_BONUS) * 100));
  const isTargetMet = totalCupsSold >= TARGET_CUPS_BONUS;

  return (
    <div className="bg-neutral-900/90 border border-neutral-800 rounded-2xl p-5 space-y-4 shadow-inner">
      <div className="flex items-center justify-between pb-3 border-b border-neutral-800/80">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-orange-500/10 border border-orange-500/20 flex items-center justify-center text-orange-400">
            <Coffee className="w-4 h-4" />
          </div>
          <div>
            <h4 className="text-xs font-black uppercase tracking-wider text-neutral-400">
              Kinerja Penjualan Sesi Ini
            </h4>
            <p className="text-sm font-extrabold text-white">Target & Efisiensi Transaksi</p>
          </div>
        </div>
        <div className="flex items-center gap-1 text-xs font-bold px-3 py-1 rounded-full border bg-black/50 border-neutral-800 text-neutral-300">
          <Award className="w-3.5 h-3.5 text-amber-400" />
          <span>Target {TARGET_CUPS_BONUS} Cup</span>
        </div>
      </div>

      {/* Progress Bar Target 100 Cup */}
      <div className="bg-black/60 border border-neutral-800/60 rounded-xl p-3.5 space-y-2">
        <div className="flex justify-between items-center text-xs">
          <span className="font-bold text-neutral-400 flex items-center gap-1.5">
            <Target className="w-3.5 h-3.5 text-orange-400" />
            <span>Progress Pencapaian Target ({progressPercent}%)</span>
          </span>
          <span className={`font-black ${isTargetMet ? "text-emerald-400" : "text-orange-400"}`}>
            {totalCupsSold} / {TARGET_CUPS_BONUS} Cup
          </span>
        </div>
        <div className="w-full bg-neutral-800 h-2.5 rounded-full overflow-hidden p-0.5">
          <div
            className={`h-full rounded-full transition-all duration-700 ${
              isTargetMet
                ? "bg-gradient-to-r from-emerald-500 to-emerald-400 shadow-[0_0_12px_rgba(16,185,129,0.5)]"
                : "bg-gradient-to-r from-orange-600 to-orange-500"
            }`}
            style={{ width: `${progressPercent}%` }}
          />
        </div>
      </div>

      {/* Metrik Statistik */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
        <div className="bg-black/40 rounded-xl p-3 border border-neutral-800/50">
          <span className="text-neutral-500 font-bold block mb-1">Total Cup Terjual</span>
          <span className="text-lg font-black text-white font-mono">{totalCupsSold} Cup</span>
        </div>

        <div className="bg-black/40 rounded-xl p-3 border border-neutral-800/50">
          <span className="text-neutral-500 font-bold block mb-1">Total Transaksi</span>
          <span className="text-lg font-black text-white font-mono">{totalTransactions} Tx</span>
        </div>

        <div className="bg-black/40 rounded-xl p-3 border border-neutral-800/50">
          <span className="text-neutral-500 font-bold block mb-1">Rata-rata Cup / Tx</span>
          <span className="text-lg font-black text-amber-400 font-mono">{avgCupsPerTx} Cup</span>
        </div>

        <div className="bg-black/40 rounded-xl p-3 border border-neutral-800/50">
          <span className="text-neutral-500 font-bold block mb-1">Rata-rata Omset / Tx</span>
          <span className="text-base font-black text-emerald-400 font-mono truncate">
            {formatRupiah(avgRevenuePerTx)}
          </span>
        </div>
      </div>
    </div>
  );
}
