"use client";

import React from "react";
import { motion, AnimatePresence } from "motion/react";
import { BalanceCalculationResult } from "@/types/productionStage2";
import { AlertTriangle, AlertCircle, CheckCircle2, ShieldAlert } from "lucide-react";

interface BalanceIndicatorProps {
  balance: BalanceCalculationResult;
}

/**
 * Komponen Banner Pertanggungjawaban Real-Time (`BalanceIndicator`).
 * Menampilkan kalkulator langsung dan validasi visual yang mustahil diabaikan:
 * - Warning (Merah/Oranye): Masih ada sisa kuota gelas yang belum dialokasikan.
 * - Danger (Merah Terang): Alokasi melebihi modal gelas yang diterima dari manajer.
 * - Success (Hijau Terang): Persamaan seimbang sempurna, siap dikunci & disimpan.
 */
export default function BalanceIndicator({ balance }: BalanceIndicatorProps) {
  const { rawReceived, totalProduced, defectCups, remaining, statusType, message } = balance;

  const getCardStyle = () => {
    if (statusType === "danger") {
      return {
        bg: "bg-red-500/15 border-red-500/50 text-red-300 shadow-[0_0_30px_rgba(239,68,68,0.25)]",
        icon: <ShieldAlert className="w-6 h-6 text-red-500 shrink-0 animate-bounce" />,
        badge: "bg-red-500 text-black font-black"
      };
    }
    if (statusType === "warning") {
      return {
        bg: "bg-amber-500/15 border-amber-500/40 text-amber-300 shadow-[0_0_25px_rgba(245,158,11,0.15)]",
        icon: <AlertTriangle className="w-6 h-6 text-amber-400 shrink-0 animate-pulse" />,
        badge: "bg-amber-500 text-black font-black"
      };
    }
    return {
      bg: "bg-emerald-500/15 border-emerald-500/50 text-emerald-300 shadow-[0_0_30px_rgba(16,185,129,0.25)]",
      icon: <CheckCircle2 className="w-6 h-6 text-emerald-400 shrink-0" />,
      badge: "bg-emerald-500 text-black font-black"
    };
  };

  const style = getCardStyle();

  return (
    <motion.div
      key={statusType + remaining}
      initial={{ opacity: 0, scale: 0.98, y: -5 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      transition={{ duration: 0.25 }}
      className={`p-4 sm:p-5 rounded-2xl border transition-all duration-300 ${style.bg} relative overflow-hidden`}
    >
      {/* Baris 1: Status Banner & Icon */}
      <div className="flex items-start gap-3.5 mb-4">
        {style.icon}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <span className={`text-[10px] uppercase tracking-widest px-2 py-0.5 rounded ${style.badge}`}>
              {statusType === "success" ? "BALANCED" : statusType === "danger" ? "DEFICIT / EXCESS" : "UNBALANCED"}
            </span>
            <span className="text-xs font-bold text-white/70">
              Accountability Engine
            </span>
          </div>
          <p className="text-sm sm:text-base font-black text-white leading-snug">
            {message}
          </p>
        </div>
      </div>

      {/* Baris 2: Equation Ledger Breakdown */}
      <div className="pt-3 border-t border-white/10 grid grid-cols-4 gap-2 text-center">
        <div className="bg-black/40 rounded-xl p-2 border border-white/5">
          <p className="text-[10px] font-bold text-neutral-400 uppercase tracking-wider">Received</p>
          <p className="text-base sm:text-lg font-black text-white font-mono mt-0.5">{rawReceived}</p>
        </div>

        <div className="bg-black/40 rounded-xl p-2 border border-white/5">
          <p className="text-[10px] font-bold text-neutral-400 uppercase tracking-wider">Produced</p>
          <p className="text-base sm:text-lg font-black text-blue-400 font-mono mt-0.5">{totalProduced}</p>
        </div>

        <div className="bg-black/40 rounded-xl p-2 border border-white/5">
          <p className="text-[10px] font-bold text-neutral-400 uppercase tracking-wider">Defects</p>
          <p className="text-base sm:text-lg font-black text-orange-400 font-mono mt-0.5">{defectCups}</p>
        </div>

        <div className={`rounded-xl p-2 border ${statusType === "success" ? "bg-emerald-950/80 border-emerald-500/40" : "bg-black/60 border-white/10"}`}>
          <p className="text-[10px] font-bold text-neutral-400 uppercase tracking-wider">Remaining</p>
          <p className={`text-base sm:text-lg font-black font-mono mt-0.5 ${statusType === "success" ? "text-emerald-400" : statusType === "danger" ? "text-red-400" : "text-amber-400"}`}>
            {remaining}
          </p>
        </div>
      </div>
    </motion.div>
  );
}
