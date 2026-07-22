"use client";

import React from "react";
import { PartyPopper, AlertCircle, Sparkles, CheckCircle2 } from "lucide-react";
import { formatRupiah, BONUS_AMOUNT_IDR, TARGET_CUPS_BONUS } from "@/utils/financial";

interface BonusCardProps {
  bonusAchieved: boolean;
  totalCupsSold: number;
}

export default function BonusCard({ bonusAchieved, totalCupsSold }: BonusCardProps) {
  if (bonusAchieved) {
    return (
      <div className="bg-gradient-to-r from-emerald-950/80 via-emerald-900/40 to-neutral-900 border-2 border-emerald-500/60 rounded-2xl p-5 relative overflow-hidden shadow-[0_0_25px_rgba(16,185,129,0.15)] animate-pulse-slow">
        <div className="absolute -top-6 -right-6 w-32 h-32 bg-emerald-500/10 rounded-full blur-2xl pointer-events-none" />
        <div className="flex items-start gap-4">
          <div className="w-12 h-12 rounded-2xl bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center text-emerald-400 shrink-0 shadow-lg shadow-emerald-500/10">
            <PartyPopper className="w-6 h-6 animate-bounce" />
          </div>
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="inline-flex items-center gap-1 bg-emerald-500 text-black text-[10px] font-black px-2.5 py-0.5 rounded-full uppercase tracking-wider">
                <Sparkles className="w-3 h-3" />
                <span>Bonus Achieved</span>
              </span>
              <span className="text-xs font-bold text-emerald-400">Target {TARGET_CUPS_BONUS} Cup</span>
            </div>
            <h4 className="text-base sm:text-lg font-black text-white tracking-tight">
              🎉 Target {TARGET_CUPS_BONUS} Cup Tercapai ({totalCupsSold} Cup)
            </h4>
            <p className="text-xs sm:text-sm text-emerald-200/90 font-medium leading-relaxed">
              Crew berhak mengambil bonus <strong className="text-white font-black underline">{formatRupiah(BONUS_AMOUNT_IDR)}</strong> langsung dari uang tunai di laci kasir.
            </p>
          </div>
        </div>
      </div>
    );
  }

  const shortFall = Math.max(0, TARGET_CUPS_BONUS - totalCupsSold);

  return (
    <div className="bg-neutral-900/60 border border-neutral-800 rounded-2xl p-4 flex items-start gap-3">
      <div className="w-10 h-10 rounded-xl bg-neutral-800/80 border border-neutral-700/60 flex items-center justify-center text-neutral-400 shrink-0">
        <AlertCircle className="w-5 h-5 text-neutral-400" />
      </div>
      <div className="space-y-0.5">
        <h4 className="text-sm font-bold text-neutral-300">Target Belum Tercapai</h4>
        <p className="text-xs text-neutral-400 leading-relaxed">
          Sesi ini mencapai <strong className="text-white font-bold">{totalCupsSold} Cup</strong> (kurang <strong className="text-orange-400 font-bold">{shortFall} Cup</strong> lagi untuk mendapatkan bonus {formatRupiah(BONUS_AMOUNT_IDR)}). Setoran tunai tidak dipotong bonus.
        </p>
      </div>
    </div>
  );
}
