"use client";

import React from "react";
import { motion } from "motion/react";
import { BalanceReconciliationResult } from "@/types/production";
import { Scale, CheckCircle2, AlertTriangle, XCircle } from "lucide-react";

interface BalanceCardProps {
  balance: BalanceReconciliationResult;
  progressPercentage: number;
}

export const BalanceCard: React.FC<BalanceCardProps> = ({ balance, progressPercentage }) => {
  const isDanger = balance.statusType === "danger";
  const isSuccess = balance.statusType === "success";

  const renderBadge = () => {
    if (isSuccess) {
      return (
        <div className="px-3 py-1 rounded-full bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 font-bold text-xs flex items-center gap-1.5 shadow-md">
          <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          <span>{balance.statusText}</span>
        </div>
      );
    }
    if (isDanger) {
      return (
        <div className="px-3 py-1 rounded-full bg-rose-500/15 border border-rose-500/30 text-rose-400 font-bold text-xs flex items-center gap-1.5 animate-bounce shadow-md">
          <XCircle className="w-4 h-4 text-rose-400" />
          <span>{balance.statusText}</span>
        </div>
      );
    }
    return (
      <div className="px-3 py-1 rounded-full bg-amber-500/15 border border-amber-500/30 text-amber-400 font-bold text-xs flex items-center gap-1.5 shadow-md">
        <AlertTriangle className="w-4 h-4 text-amber-400" />
        <span>{balance.statusText}</span>
      </div>
    );
  };

  return (
    <motion.div
      layout
      className={`rounded-3xl p-6 sm:p-8 border transition-all shadow-2xl backdrop-blur-2xl flex flex-col gap-6 ${
        isSuccess
          ? "bg-[#18181B] border-emerald-500/40 shadow-[0_15px_50px_rgba(16,185,129,0.12)]"
          : isDanger
          ? "bg-[#18181B] border-rose-500/50 shadow-[0_15px_50px_rgba(244,63,94,0.12)]"
          : "bg-[#18181B] border-white/[0.06]"
      }`}
    >
      {/* Top Bar: Title & Status Badge */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <div
            className={`w-11 h-11 rounded-2xl flex items-center justify-center shadow-md ${
              isSuccess
                ? "bg-emerald-500/15 border border-emerald-500/30 text-emerald-400"
                : isDanger
                ? "bg-rose-500/15 border border-rose-500/30 text-rose-400"
                : "bg-[#F97316]/15 border border-[#F97316]/30 text-[#F97316]"
            }`}
          >
            <Scale className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[10px] font-mono font-bold uppercase tracking-widest text-neutral-400 block">
              Reconciliation Summary
            </span>
            <h3 className="text-xl sm:text-2xl font-black text-white tracking-tight mt-0.5">
              Akuntansi & Keseimbangan Stok
            </h3>
          </div>
        </div>

        {renderBadge()}
      </div>

      {/* Grid Numbers Summary */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {/* Total Raw Received */}
        <div className="rounded-2xl bg-[#111113] border border-white/[0.06] p-4 flex flex-col justify-between">
          <span className="text-xs font-semibold text-neutral-400 block mb-1.5">
            Raw Cups Received
          </span>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl sm:text-4xl font-black font-mono text-white tracking-tight">
              {balance.rawReceived}
            </span>
            <span className="text-xs font-bold text-neutral-500">CUP</span>
          </div>
          <span className="text-[10px] font-medium text-neutral-500 mt-1 block">
            Jatah awal dari Manajer
          </span>
        </div>

        {/* Total Allocated + Defect */}
        <div className="rounded-2xl bg-[#111113] border border-white/[0.06] p-4 flex flex-col justify-between">
          <span className="text-xs font-semibold text-neutral-400 block mb-1.5">
            Allocated + Defect Cups
          </span>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl sm:text-4xl font-black font-mono text-sky-400 tracking-tight">
              {balance.totalProduced + balance.defectCups}
            </span>
            <span className="text-xs font-bold text-neutral-500">CUP</span>
          </div>
          <span className="text-[10px] font-medium text-neutral-500 mt-1 block truncate">
            {balance.totalProduced} produk jadi + {balance.defectCups} cacat
          </span>
        </div>

        {/* Remaining Cups */}
        <div
          className={`rounded-2xl p-4 flex flex-col justify-between border transition-colors ${
            isSuccess
              ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-300"
              : isDanger
              ? "bg-rose-500/10 border-rose-500/30 text-rose-300"
              : "bg-amber-500/10 border-amber-500/30 text-amber-300"
          }`}
        >
          <span className="text-xs font-bold block mb-1.5 uppercase tracking-wider">
            Remaining Cups
          </span>
          <div className="flex items-baseline gap-2">
            <span
              className={`text-3xl sm:text-4xl font-black font-mono tracking-tight ${
                isSuccess ? "text-emerald-400" : isDanger ? "text-rose-400" : "text-amber-400"
              }`}
            >
              {balance.remaining}
            </span>
            <span className="text-xs font-black">CUP</span>
          </div>
          <span className="text-[10px] font-semibold mt-1 block">
            {isSuccess ? "Sempurna (0 Cup Sisa)" : isDanger ? "Surplus / Melebihi Batas!" : "Wajib Dialokasikan"}
          </span>
        </div>
      </div>

      {/* Progress Bar Container */}
      <div className="space-y-2">
        <div className="flex items-center justify-between text-xs font-bold">
          <span className="text-neutral-400">Progres Pertanggungjawaban Gelas</span>
          <span className={`font-mono ${isSuccess ? "text-emerald-400 font-black" : "text-white"}`}>
            {progressPercentage}%
          </span>
        </div>
        <div className="w-full h-3 bg-[#111113] rounded-full overflow-hidden p-0.5 border border-white/[0.06]">
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${progressPercentage}%` }}
            transition={{ duration: 0.5, ease: "easeOut" }}
            className={`h-full rounded-full ${
              isSuccess
                ? "bg-gradient-to-r from-emerald-500 to-teal-400 shadow-[0_0_15px_rgba(16,185,129,0.5)]"
                : isDanger
                ? "bg-gradient-to-r from-rose-600 to-red-500"
                : "bg-gradient-to-r from-[#F97316] to-amber-500"
            }`}
          />
        </div>
      </div>

      {/* Helper Explanation Message */}
      <div
        className={`p-4 rounded-2xl text-xs sm:text-sm font-medium flex items-center gap-3 ${
          isSuccess
            ? "bg-emerald-950/40 text-emerald-200 border border-emerald-500/30"
            : isDanger
            ? "bg-rose-950/40 text-rose-200 border border-rose-500/30"
            : "bg-[#111113] text-neutral-300 border border-white/[0.06]"
        }`}
      >
        <span>{balance.message}</span>
      </div>
    </motion.div>
  );
};
