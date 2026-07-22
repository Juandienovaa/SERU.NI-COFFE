"use client";

import React from "react";
import { DollarSign, ShieldAlert, CheckCircle2 } from "lucide-react";
import { formatRupiah } from "@/utils/financial";

interface FinancialSummaryFooterProps {
  cashRevenue: number;
  qrisRevenue: number;
  bonusAmount: number;
  cashDeposit: number;
  totalRevenue: number;
}

export default function FinancialSummaryFooter({
  cashRevenue,
  qrisRevenue,
  bonusAmount,
  cashDeposit,
  totalRevenue,
}: FinancialSummaryFooterProps) {
  return (
    <div className="bg-gradient-to-b from-[#141414] to-[#0D0D0D] border border-neutral-800 rounded-2xl p-5 space-y-4 shadow-2xl">
      <div className="flex items-center justify-between pb-3 border-b border-neutral-800">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
            <DollarSign className="w-4 h-4" />
          </div>
          <div>
            <h4 className="text-xs font-black uppercase tracking-wider text-neutral-300">
              Rekapitulasi Audit Finansial
            </h4>
            <p className="text-[11px] text-neutral-400">
              Ringkasan akhir setoran yang wajib diserahkan oleh kasir ke manajemen.
            </p>
          </div>
        </div>
        <span className="text-[11px] font-bold text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2.5 py-1 rounded-full">
          Siap Audit
        </span>
      </div>

      <div className="space-y-2.5 font-mono text-xs">
        <div className="flex justify-between items-center py-1.5 px-3 rounded-lg bg-black/40 border border-neutral-800/50">
          <span className="text-neutral-400 font-sans font-medium">Omset Tunai (Cash Revenue)</span>
          <span className="font-bold text-amber-400">{formatRupiah(cashRevenue)}</span>
        </div>

        {bonusAmount > 0 && (
          <div className="flex justify-between items-center py-1.5 px-3 rounded-lg bg-emerald-950/30 border border-emerald-500/30">
            <span className="text-emerald-300 font-sans font-medium flex items-center gap-1.5">
              <span>Potongan Bonus Crew (100 Cup Achieved)</span>
            </span>
            <span className="font-black text-emerald-400">- {formatRupiah(bonusAmount)}</span>
          </div>
        )}

        <div className="flex justify-between items-center py-1.5 px-3 rounded-lg bg-black/40 border border-neutral-800/50">
          <span className="text-neutral-400 font-sans font-medium">Omset QRIS (Masuk Rekening/Bank)</span>
          <span className="font-bold text-blue-400">{formatRupiah(qrisRevenue)}</span>
        </div>

        <div className="flex justify-between items-center py-2 px-3 border-t border-neutral-800 pt-3">
          <span className="text-neutral-300 font-sans font-bold">Total Penjualan Sesi</span>
          <span className="font-black text-white text-sm">{formatRupiah(totalRevenue)}</span>
        </div>
      </div>

      {/* Box Setoran Tunai (Cash Deposit) - Penekanan Visual Maksimal */}
      <div className="bg-gradient-to-r from-orange-600/20 via-orange-500/20 to-amber-500/20 border-2 border-orange-500 rounded-2xl p-4 flex flex-col sm:flex-row items-center justify-between gap-3 shadow-[0_0_30px_rgba(249,115,22,0.15)]">
        <div className="space-y-0.5 text-center sm:text-left">
          <div className="flex items-center justify-center sm:justify-start gap-1.5">
            <span className="text-xs font-black uppercase tracking-wider text-orange-400">
              Setoran Tunai Bersih (Cash Deposit)
            </span>
          </div>
          <p className="text-[11px] text-neutral-300">
            Uang fisik yang <strong className="text-white underline font-bold">wajib disetorkan</strong> dari laci kasir (Omset Tunai minus Bonus).
          </p>
        </div>
        <div className="text-right">
          <span className="text-2xl sm:text-3xl font-black text-white tracking-tight font-mono block drop-shadow-md">
            {formatRupiah(cashDeposit)}
          </span>
        </div>
      </div>
    </div>
  );
}
