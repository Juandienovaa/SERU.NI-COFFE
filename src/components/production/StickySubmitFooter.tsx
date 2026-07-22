"use client";

import React from "react";
import { motion } from "motion/react";
import { BalanceReconciliationResult } from "@/types/production";
import { CheckCircle2, AlertCircle, ArrowLeft, ShieldCheck, Loader2 } from "lucide-react";

interface StickySubmitFooterProps {
  balance: BalanceReconciliationResult;
  submitting: boolean;
  onSubmit: () => void;
  onExit: () => void;
}

export const StickySubmitFooter: React.FC<StickySubmitFooterProps> = ({
  balance,
  submitting,
  onSubmit,
  onExit
}) => {
  const isReady = balance.canSubmit && balance.isValid && balance.remaining === 0;
  const isDanger = balance.statusType === "danger";

  return (
    <div className="fixed bottom-0 left-0 right-0 z-40 bg-[#09090B]/90 backdrop-blur-2xl border-t border-white/[0.06] px-6 py-4 shadow-[0_-15px_40px_rgba(0,0,0,0.8)]">
      <div className="max-w-[1500px] mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
        {/* Status Indicator Left */}
        <div className="flex items-center gap-3.5 w-full sm:w-auto min-w-0">
          {isReady ? (
            <div className="w-11 h-11 rounded-2xl bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center text-emerald-400 shrink-0 shadow-md">
              <ShieldCheck className="w-6 h-6" />
            </div>
          ) : (
            <div
              className={`w-11 h-11 rounded-2xl flex items-center justify-center shrink-0 shadow-md ${
                isDanger
                  ? "bg-rose-500/15 border border-rose-500/30 text-rose-400"
                  : "bg-amber-500/15 border border-amber-500/30 text-amber-400"
              }`}
            >
              <AlertCircle className="w-6 h-6" />
            </div>
          )}

          <div className="flex-1 sm:flex-initial min-w-0">
            <span
              className={`text-xs font-bold block ${
                isReady ? "text-emerald-400" : isDanger ? "text-rose-400" : "text-amber-400"
              }`}
            >
              {isReady
                ? "Alokasi Seimbang. Seluruh gelas telah didata."
                : isDanger
                ? "Kelebihan Alokasi! Kurangi Cup agar sesuai jatah."
                : `Alokasi Belum Lengkap. Masih ada selisih ${balance.remaining} Cup.`}
            </span>
            <span className="text-[11px] text-neutral-400 font-light block truncate max-w-md">
              {balance.message || (isReady
                ? "Semua pertanggungjawaban stok presisi 0 Cup selisih."
                : `Masih ada selisih ${Math.abs(balance.remaining)} Cup yang harus dialokasikan.`)}
            </span>
          </div>
        </div>

        {/* Action Buttons Right */}
        <div className="flex items-center gap-3 w-full sm:w-auto justify-end shrink-0">
          <button
            type="button"
            onClick={onExit}
            disabled={submitting}
            className="px-5 py-3 rounded-2xl bg-[#18181B] hover:bg-neutral-800 border border-white/[0.06] text-xs font-bold text-neutral-300 hover:text-white transition-all active:scale-95 disabled:opacity-40"
          >
            <span>Kembali</span>
          </button>

          <button
            type="button"
            onClick={onSubmit}
            disabled={!isReady || submitting}
            className={`flex-1 sm:flex-initial px-8 py-3.5 rounded-2xl font-black text-sm flex items-center justify-center gap-2.5 transition-all active:scale-95 ${
              !isReady
                ? "bg-[#111113] border border-white/[0.06] text-neutral-500 cursor-not-allowed opacity-60"
                : "bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-black shadow-lg shadow-emerald-500/20"
            }`}
          >
            {submitting ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin text-black" />
                <span>Menyimpan ke Supabase...</span>
              </>
            ) : (
              <>
                <CheckCircle2 className="w-4 h-4 text-black" />
                <span>Kunci & Simpan Batch</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
