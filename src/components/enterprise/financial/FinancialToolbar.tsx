import React from "react";
import { Search, Download, Calendar, Filter, RefreshCw } from "lucide-react";
import { motion } from "motion/react";

export type PeriodType = "today" | "7days" | "month" | "year";

interface FinancialToolbarProps {
  period: PeriodType;
  setPeriod: (period: PeriodType) => void;
  onRefresh: () => void;
  onExport: () => void;
}

export const FinancialToolbar: React.FC<FinancialToolbarProps> = ({ period, setPeriod, onRefresh, onExport }) => {
  const periods: { value: PeriodType; label: string }[] = [
    { value: "today", label: "Hari Ini" },
    { value: "7days", label: "7 Hari" },
    { value: "month", label: "Bulan Ini" },
    { value: "year", label: "Tahun Ini" },
  ];

  return (
    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 w-full">
      {/* Left side: Search & Filter */}
      <div className="flex items-center gap-3 w-full md:w-auto">
        <div className="relative group flex-1 md:flex-none">
          <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
            <Search className="w-4 h-4 text-white/40 group-focus-within:text-orange-500 transition-colors" />
          </div>
          <input
            type="text"
            placeholder="Cari transaksi atau shift..."
            className="w-full md:w-64 bg-white/[0.03] border border-white/[0.08] text-white text-sm rounded-2xl pl-11 pr-4 py-3 focus:outline-none focus:border-orange-500/50 focus:bg-white/[0.05] transition-all placeholder:text-white/30"
          />
        </div>
        <button className="flex items-center justify-center w-12 h-12 bg-white/[0.03] border border-white/[0.08] hover:bg-white/[0.08] rounded-2xl transition-all shrink-0">
          <Filter className="w-4 h-4 text-white/70" />
        </button>
      </div>

      {/* Right side: Period Tabs & Actions */}
      <div className="flex items-center gap-3 overflow-x-auto pb-1 md:pb-0 scrollbar-hide w-full md:w-auto">
        <div className="flex p-1 bg-white/[0.03] border border-white/[0.08] rounded-2xl">
          {periods.map((p) => (
            <button
              key={p.value}
              onClick={() => setPeriod(p.value)}
              className="relative px-4 py-2 text-xs font-bold uppercase tracking-wider rounded-xl transition-all whitespace-nowrap"
            >
              {period === p.value && (
                <motion.div
                  layoutId="active-period"
                  className="absolute inset-0 bg-[#F97316] rounded-xl"
                  transition={{ type: "spring", stiffness: 400, damping: 30 }}
                />
              )}
              <span className={`relative z-10 ${period === p.value ? "text-white" : "text-white/40 hover:text-white/70"}`}>
                {p.label}
              </span>
            </button>
          ))}
        </div>

        <button
          onClick={onRefresh}
          className="flex items-center justify-center w-12 h-12 bg-white/[0.03] border border-white/[0.08] hover:bg-white/[0.08] rounded-2xl transition-all shrink-0 active:scale-95"
        >
          <RefreshCw className="w-4 h-4 text-white/70" />
        </button>
        <button 
          onClick={onExport}
          className="hidden md:flex items-center gap-2 px-4 py-3 bg-white text-black hover:bg-white/90 rounded-2xl font-bold text-sm transition-all active:scale-95 shrink-0"
        >
          <Download className="w-4 h-4" />
          <span>Export</span>
        </button>
      </div>
    </div>
  );
};
