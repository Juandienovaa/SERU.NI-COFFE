"use client";

import React from "react";
import { Banknote, QrCode, TrendingUp, Wallet } from "lucide-react";
import { formatRupiah } from "@/utils/financial";

interface RevenueSummaryProps {
  cashRevenue: number;
  qrisRevenue: number;
  totalRevenue: number;
}

export default function RevenueSummary({
  cashRevenue,
  qrisRevenue,
  totalRevenue,
}: RevenueSummaryProps) {
  const cashPercentage = totalRevenue > 0 ? Math.round((cashRevenue / totalRevenue) * 100) : 0;
  const qrisPercentage = totalRevenue > 0 ? Math.round((qrisRevenue / totalRevenue) * 100) : 0;

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between px-1">
        <h4 className="text-xs font-black uppercase tracking-wider text-neutral-400 flex items-center gap-1.5">
          <TrendingUp className="w-3.5 h-3.5 text-orange-400" />
          <span>Ringkasan Omset Penjualan</span>
        </h4>
        <span className="text-[11px] font-bold text-neutral-500">Real-time Calculation</span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        {/* Kartu 1: Omset Tunai (Cash) */}
        <div className="bg-gradient-to-b from-neutral-900 to-neutral-950 border border-neutral-800 rounded-2xl p-4.5 relative overflow-hidden group hover:border-amber-500/30 transition-all">
          <div className="absolute top-0 right-0 w-24 h-24 bg-amber-500/5 rounded-full blur-2xl -mr-6 -mt-6 pointer-events-none" />
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <div className="w-9 h-9 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-500">
                <Banknote className="w-4.5 h-4.5" />
              </div>
              <div>
                <p className="text-xs font-bold text-neutral-400">Omset Tunai (Cash)</p>
                <p className="text-[10px] font-semibold text-neutral-500">{cashPercentage}% dari total</p>
              </div>
            </div>
          </div>
          <p className="text-xl md:text-2xl font-black text-amber-400 tracking-tight font-mono">
            {formatRupiah(cashRevenue)}
          </p>
        </div>

        {/* Kartu 2: Omset QRIS */}
        <div className="bg-gradient-to-b from-neutral-900 to-neutral-950 border border-neutral-800 rounded-2xl p-4.5 relative overflow-hidden group hover:border-blue-500/30 transition-all">
          <div className="absolute top-0 right-0 w-24 h-24 bg-blue-500/5 rounded-full blur-2xl -mr-6 -mt-6 pointer-events-none" />
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <div className="w-9 h-9 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-400">
                <QrCode className="w-4.5 h-4.5" />
              </div>
              <div>
                <p className="text-xs font-bold text-neutral-400">Omset QRIS</p>
                <p className="text-[10px] font-semibold text-neutral-500">{qrisPercentage}% dari total</p>
              </div>
            </div>
          </div>
          <p className="text-xl md:text-2xl font-black text-blue-400 tracking-tight font-mono">
            {formatRupiah(qrisRevenue)}
          </p>
        </div>

        {/* Kartu 3: Total Omset */}
        <div className="bg-gradient-to-b from-orange-500/10 via-neutral-900 to-neutral-950 border border-orange-500/30 rounded-2xl p-4.5 relative overflow-hidden group hover:border-orange-500/50 transition-all shadow-lg shadow-orange-500/5">
          <div className="absolute top-0 right-0 w-28 h-28 bg-orange-500/10 rounded-full blur-2xl -mr-6 -mt-6 pointer-events-none" />
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <div className="w-9 h-9 rounded-xl bg-orange-500/20 border border-orange-500/30 flex items-center justify-center text-orange-400">
                <Wallet className="w-4.5 h-4.5" />
              </div>
              <div>
                <p className="text-xs font-bold text-neutral-300">Total Omset Sesi</p>
                <p className="text-[10px] font-semibold text-orange-400/80">Kombinasi Tunai & QRIS</p>
              </div>
            </div>
          </div>
          <p className="text-2xl md:text-3xl font-black text-white tracking-tight font-mono">
            {formatRupiah(totalRevenue)}
          </p>
        </div>
      </div>
    </div>
  );
}
