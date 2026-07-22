import React from "react";
import { motion, AnimatePresence } from "motion/react";
import { CheckCircle2, Clock, AlertCircle, ChevronRight, FileText, Globe } from "lucide-react";
import { OfflineLedgerItem, OnlineLedgerItem } from "@/services/financialService";

const getStatusConfig = (status: string) => {
  switch (status.toUpperCase()) {
    case "APPROVED":
    case "PAID":
    case "COMPLETED":
      return { icon: CheckCircle2, color: "text-emerald-400", bg: "bg-emerald-500/10 border-emerald-500/20", label: status };
    case "SETTLED":
      return { icon: CheckCircle2, color: "text-emerald-400", bg: "bg-emerald-500/10 border-emerald-500/20", label: "BERHASIL" };
    case "REJECTED":
      return { icon: AlertCircle, color: "text-rose-400", bg: "bg-rose-500/10 border-rose-500/20", label: status };
    default:
      return { icon: Clock, color: "text-amber-400", bg: "bg-amber-500/10 border-amber-500/20", label: status };
  }
};

export const LedgerTableOffline: React.FC<{ data: OfflineLedgerItem[], onViewDetail: (item: OfflineLedgerItem) => void }> = ({ data, onViewDetail }) => {
  return (
    <div className="w-full bg-[#18181B] border border-white/[0.05] rounded-[24px] overflow-hidden">
      <div className="p-6 md:p-8 border-b border-white/[0.05] flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-white/[0.03] border border-white/[0.05] flex items-center justify-center">
            <FileText className="w-5 h-5 text-neutral-400" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-white tracking-tight">Offline POS Ledger</h3>
            <p className="text-xs text-neutral-500">Rekapitulasi setoran kasir per shift.</p>
          </div>
        </div>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse min-w-[1000px]">
          <thead>
            <tr className="bg-white/[0.01] border-b border-white/[0.05]">
              <th className="py-4 px-6 text-xs font-bold uppercase tracking-widest text-neutral-500">Tanggal</th>
              <th className="py-4 px-6 text-xs font-bold uppercase tracking-widest text-neutral-500">Gerobak & Crew</th>
              <th className="py-4 px-6 text-xs font-bold uppercase tracking-widest text-neutral-500 text-center">Cup</th>
              <th className="py-4 px-6 text-xs font-bold uppercase tracking-widest text-neutral-500 text-right">Cash (Gross)</th>
              <th className="py-4 px-6 text-xs font-bold uppercase tracking-widest text-neutral-500 text-right">QRIS</th>
              <th className="py-4 px-6 text-xs font-bold uppercase tracking-widest text-neutral-500 text-right">Bonus</th>
              <th className="py-4 px-6 text-xs font-bold uppercase tracking-widest text-neutral-500 text-right">Net Cash</th>
              <th className="py-4 px-6 text-xs font-bold uppercase tracking-widest text-neutral-500 text-center">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/[0.02]">
            <AnimatePresence>
              {data.map((item, index) => {
                const statusConfig = getStatusConfig(item.status);
                const StatusIcon = statusConfig.icon;
                return (
                  <motion.tr
                    key={item.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.4, delay: index * 0.05, ease: [0.22, 1, 0.36, 1] }}
                    className="group hover:bg-white/[0.05] transition-colors cursor-pointer"
                    onClick={() => onViewDetail(item)}
                  >
                    <td className="py-4 px-6 text-sm text-neutral-400 font-mono">{item.date}</td>
                    <td className="py-4 px-6">
                      <p className="text-sm font-bold text-white">{item.outlet}</p>
                      <p className="text-xs text-neutral-500 font-mono mt-0.5">{item.shift} • {item.crewName}</p>
                    </td>
                    <td className="py-4 px-6 text-sm font-mono text-white text-center font-bold">{item.cupSold}</td>
                    <td className="py-4 px-6 text-sm font-mono text-neutral-300 text-right">Rp {item.cash.toLocaleString("id-ID")}</td>
                    <td className="py-4 px-6 text-sm font-mono text-cyan-400 text-right">Rp {item.qris.toLocaleString("id-ID")}</td>
                    <td className="py-4 px-6 text-sm font-mono text-amber-400 text-right">Rp {item.bonus.toLocaleString("id-ID")}</td>
                    <td className="py-4 px-6 text-sm font-bold font-mono text-emerald-400 text-right">Rp {item.netCash.toLocaleString("id-ID")}</td>
                    <td className="py-4 px-6 text-center">
                      <div className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg border ${statusConfig.bg}`}>
                        <StatusIcon className={`w-3.5 h-3.5 ${statusConfig.color}`} />
                        <span className={`text-[10px] font-bold uppercase tracking-wider ${statusConfig.color}`}>{statusConfig.label}</span>
                      </div>
                    </td>
                  </motion.tr>
                );
              })}
            </AnimatePresence>
            {data.length === 0 && (
              <tr><td colSpan={8} className="py-12 text-center text-neutral-500 text-sm">Tidak ada transaksi offline.</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export const LedgerTableOnline: React.FC<{ data: OnlineLedgerItem[] }> = ({ data }) => {
  return (
    <div className="w-full bg-[#18181B] border border-white/[0.05] rounded-[24px] overflow-hidden">
      <div className="p-6 md:p-8 border-b border-white/[0.05] flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-orange-500/10 border border-orange-500/20 flex items-center justify-center">
            <Globe className="w-5 h-5 text-orange-500" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-white tracking-tight">Online Order Ledger</h3>
            <p className="text-xs text-neutral-500">Daftar transaksi pesanan online.</p>
          </div>
        </div>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse min-w-[1000px]">
          <thead>
            <tr className="bg-white/[0.01] border-b border-white/[0.05]">
              <th className="py-4 px-6 text-xs font-bold uppercase tracking-widest text-neutral-500">Tgl & Invoice</th>
              <th className="py-4 px-6 text-xs font-bold uppercase tracking-widest text-neutral-500">Customer</th>
              <th className="py-4 px-6 text-xs font-bold uppercase tracking-widest text-neutral-500 text-right">Delivery Fee</th>
              <th className="py-4 px-6 text-xs font-bold uppercase tracking-widest text-neutral-500 text-right">Grand Total</th>
              <th className="py-4 px-6 text-xs font-bold uppercase tracking-widest text-neutral-500 text-center">Payment</th>
              <th className="py-4 px-6 text-xs font-bold uppercase tracking-widest text-neutral-500 text-center">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/[0.02]">
            <AnimatePresence>
              {data.map((item, index) => {
                const statusConfig = getStatusConfig(item.status);
                const StatusIcon = statusConfig.icon;
                return (
                  <motion.tr
                    key={item.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.4, delay: index * 0.05, ease: [0.22, 1, 0.36, 1] }}
                    className="group hover:bg-white/[0.02] transition-colors"
                  >
                    <td className="py-4 px-6">
                      <p className="text-sm font-bold text-white">{item.invoice}</p>
                      <p className="text-xs text-neutral-500 font-mono mt-0.5">{item.date}</p>
                    </td>
                    <td className="py-4 px-6 text-sm text-neutral-300 font-bold">{item.customerName}</td>
                    <td className="py-4 px-6 text-sm font-mono text-neutral-400 text-right">
                      {item.deliveryFee === 0 ? <span className="text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded text-[10px] uppercase font-bold">Free Ongkir</span> : `Rp ${item.deliveryFee.toLocaleString("id-ID")}`}
                    </td>
                    <td className="py-4 px-6 text-sm font-bold font-mono text-white text-right">Rp {item.grandTotal.toLocaleString("id-ID")}</td>
                    <td className="py-4 px-6 text-sm font-mono text-cyan-400 text-center font-bold">{item.paymentMethod}</td>
                    <td className="py-4 px-6 text-center">
                      <div className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg border ${statusConfig.bg}`}>
                        <StatusIcon className={`w-3.5 h-3.5 ${statusConfig.color}`} />
                        <span className={`text-[10px] font-bold uppercase tracking-wider ${statusConfig.color}`}>{statusConfig.label}</span>
                      </div>
                    </td>
                  </motion.tr>
                );
              })}
            </AnimatePresence>
            {data.length === 0 && (
              <tr><td colSpan={6} className="py-12 text-center text-neutral-500 text-sm">Tidak ada pesanan online.</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};
