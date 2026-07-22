import React from "react";
import { motion } from "motion/react";
import { BarChart3 } from "lucide-react";

interface ChartDataPoint {
  label: string;
  cash: number;
  qris: number;
}

interface FinancialChartProps {
  data: ChartDataPoint[];
}

export const FinancialChart: React.FC<FinancialChartProps> = ({ data }) => {
  // Find max value for scaling
  const maxVal = Math.max(...data.map(d => Math.max(d.cash, d.qris, 1)));

  return (
    <div className="w-full bg-[#18181B] border border-white/[0.05] rounded-[24px] p-6 lg:p-8 relative group">
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-white/[0.03] border border-white/[0.05] flex items-center justify-center">
            <BarChart3 className="w-5 h-5 text-neutral-400" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-white tracking-tight">Tren Pendapatan</h3>
            <p className="text-xs text-neutral-500">Komparasi Cash vs QRIS</p>
          </div>
        </div>
        
        {/* Legend */}
        <div className="flex items-center gap-4 text-xs font-bold uppercase tracking-wider">
          <div className="flex items-center gap-2">
            <div className="w-2.5 h-2.5 rounded-full bg-[#10B981] shadow-[0_0_8px_rgba(16,185,129,0.5)]" />
            <span className="text-neutral-400">Cash</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-2.5 h-2.5 rounded-full bg-[#06B6D4] shadow-[0_0_8px_rgba(6,182,212,0.5)]" />
            <span className="text-neutral-400">QRIS</span>
          </div>
        </div>
      </div>

      {/* Minimalist Bar Chart */}
      <div className="h-64 w-full flex items-end justify-between gap-2 md:gap-4 mt-6">
        {data.map((item, i) => {
          const cashHeight = (item.cash / maxVal) * 100;
          const qrisHeight = (item.qris / maxVal) * 100;
          
          return (
            <div key={item.label} className="h-full flex-1 flex flex-col items-center gap-2 group/bar">
              {/* Tooltip (Hover) */}
              <div className="absolute top-1/4 opacity-0 group-hover/bar:opacity-100 transition-opacity bg-black/80 backdrop-blur-md border border-white/10 rounded-xl p-3 shadow-xl pointer-events-none z-10 w-40 text-center -ml-16">
                <p className="text-xs font-bold text-neutral-400 uppercase tracking-widest mb-2">{item.label}</p>
                <div className="flex justify-between items-center text-sm font-mono mb-1">
                  <span className="text-emerald-400">Cash</span>
                  <span className="text-white">Rp {(item.cash / 1000).toFixed(0)}k</span>
                </div>
                <div className="flex justify-between items-center text-sm font-mono">
                  <span className="text-cyan-400">QRIS</span>
                  <span className="text-white">Rp {(item.qris / 1000).toFixed(0)}k</span>
                </div>
              </div>

              <div className="w-full flex-1 flex items-end justify-center gap-1 relative">
                {/* Minimal Grid Line */}
                <div className="absolute top-0 bottom-0 left-1/2 w-px bg-white/[0.02] -z-10" />

                <motion.div
                  initial={{ height: 0 }}
                  animate={{ height: `${cashHeight}%` }}
                  transition={{ duration: 0.8, delay: i * 0.05, ease: [0.22, 1, 0.36, 1] }}
                  className="w-1/2 max-w-[16px] bg-gradient-to-t from-emerald-500/20 to-emerald-500/80 rounded-t-sm hover:brightness-125 transition-all"
                />
                <motion.div
                  initial={{ height: 0 }}
                  animate={{ height: `${qrisHeight}%` }}
                  transition={{ duration: 0.8, delay: i * 0.05 + 0.1, ease: [0.22, 1, 0.36, 1] }}
                  className="w-1/2 max-w-[16px] bg-gradient-to-t from-cyan-500/20 to-cyan-500/80 rounded-t-sm hover:brightness-125 transition-all"
                />
              </div>
              <span className="text-[10px] md:text-xs font-mono text-neutral-500 group-hover/bar:text-white transition-colors">
                {item.label}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
};
