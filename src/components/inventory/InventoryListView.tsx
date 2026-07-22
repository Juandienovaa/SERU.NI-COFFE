"use client";

import React from "react";
import { motion } from "motion/react";
import { ProductInventoryItem } from "@/types/inventory";
import { Coffee, Sparkles, Zap, AlertTriangle } from "lucide-react";

interface InventoryListViewProps {
  items: ProductInventoryItem[];
  onQuickProduce?: (item: ProductInventoryItem) => void;
  className?: string;
}

export const InventoryListView: React.FC<InventoryListViewProps> = ({
  items,
  onQuickProduce,
  className = ""
}) => {
  const renderStatusChip = (status: ProductInventoryItem["statusLevel"]) => {
    switch (status) {
      case "OUT_OF_STOCK":
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-rose-500/10 border border-rose-500/30 text-rose-400 text-[11px] font-bold font-mono">
            <span className="w-1.5 h-1.5 rounded-full bg-rose-500 animate-pulse" />
            <span>OUT OF STOCK</span>
          </span>
        );
      case "LOW_STOCK":
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-orange-500/10 border border-orange-500/30 text-orange-400 text-[11px] font-bold font-mono">
            <span className="w-1.5 h-1.5 rounded-full bg-orange-500" />
            <span>LOW STOCK</span>
          </span>
        );
      case "MEDIUM":
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-400 text-[11px] font-bold font-mono">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
            <span>MEDIUM ZONE</span>
          </span>
        );
      case "OVERSTOCK":
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-500/10 border border-blue-500/30 text-blue-400 text-[11px] font-bold font-mono">
            <span className="w-1.5 h-1.5 rounded-full bg-blue-500" />
            <span>OVERSTOCK</span>
          </span>
        );
      case "HEALTHY":
      default:
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-[11px] font-bold font-mono">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
            <span>HEALTHY</span>
          </span>
        );
    }
  };

  const getProgressColor = (status: ProductInventoryItem["statusLevel"]) => {
    switch (status) {
      case "OUT_OF_STOCK":
        return "bg-rose-500";
      case "LOW_STOCK":
        return "bg-orange-500";
      case "MEDIUM":
        return "bg-amber-500";
      case "OVERSTOCK":
        return "bg-blue-500";
      case "HEALTHY":
      default:
        return "bg-emerald-500";
    }
  };

  return (
    <div
      className={`w-full rounded-[24px] bg-[#18181B]/70 backdrop-blur-2xl border border-white/[0.06] overflow-hidden shadow-2xl ${className}`}
    >
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse select-none">
          <thead>
            <tr className="border-b border-white/[0.06] bg-[#131316]/80 text-[10px] font-mono font-bold text-neutral-400 uppercase tracking-widest">
              <th className="py-4 pl-6 pr-4">Produk / Menu</th>
              <th className="py-4 px-4 text-center">SKU / Kategori</th>
              <th className="py-4 px-4 text-center">Status</th>
              <th className="py-4 px-4 text-right">Stok Fisik</th>
              <th className="py-4 pl-4 pr-6 text-right">Tindakan Cepat</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/[0.04]">
            {items.map((item) => {
              const currentStock = item.current_stock || 0;
              const maxThreshold = item.maximum_stock || 100;
              const progressPct = Math.min(
                100,
                Math.max(2, (currentStock / maxThreshold) * 100)
              );

              return (
                <motion.tr
                  key={item.product_id}
                  whileHover={{ backgroundColor: "rgba(255, 255, 255, 0.02)" }}
                  className="group transition-colors"
                >
                  {/* Col 1: Product Title & Icon */}
                  <td className="py-4 pl-6 pr-4">
                    <div className="flex items-center gap-3.5">
                      <div className="w-10 h-10 rounded-xl bg-[#131316] border border-white/[0.08] flex items-center justify-center shrink-0 shadow-sm group-hover:border-[#F97316]/30 transition-colors">
                        {item.category === "Non-Coffee" ? (
                          <Sparkles className="w-4 h-4 text-[#F97316]" />
                        ) : (
                          <Coffee className="w-4 h-4 text-[#F97316]" />
                        )}
                      </div>
                      <div className="min-w-0">
                        <h4 className="text-sm font-bold text-white tracking-tight break-words">
                          {item.product_name}
                        </h4>
                        {item.updated_at && (
                          <span className="text-[10px] font-mono text-neutral-500 block mt-0.5">
                            Pembaruan: {new Date(item.updated_at).toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" })} WIB
                          </span>
                        )}
                      </div>
                    </div>
                  </td>

                  {/* Col 2: SKU & Category */}
                  <td className="py-4 px-4 text-center whitespace-nowrap">
                    <span className="text-xs font-mono font-semibold text-neutral-300 block">
                      {item.sku || `SRN-${item.product_id}`}
                    </span>
                    <span className="text-[10px] font-bold text-neutral-500 uppercase tracking-widest">
                      {item.category || "Coffee"}
                    </span>
                  </td>

                  {/* Col 3: Status Badge */}
                  <td className="py-4 px-4 text-center whitespace-nowrap">
                    {renderStatusChip(item.statusLevel)}
                  </td>

                  {/* Col 4: Physical Stock Digit & Bar */}
                  <td className="py-4 px-4 text-right whitespace-nowrap">
                    <div className="inline-flex flex-col items-end gap-1.5 w-32">
                      <div className="flex items-baseline gap-1.5">
                        <span className="text-xl font-black font-mono text-white">
                          {currentStock}
                        </span>
                        <span className="text-[10px] font-bold font-mono text-neutral-400 uppercase">
                          {item.unit || "Cup"}
                        </span>
                      </div>
                      <div className="w-full h-1.5 rounded-full bg-[#131316] overflow-hidden border border-white/[0.04]">
                        <motion.div
                          initial={{ width: 0 }}
                          animate={{ width: `${progressPct}%` }}
                          transition={{ duration: 0.5, ease: "easeOut" }}
                          className={`h-full rounded-full ${getProgressColor(item.statusLevel)}`}
                        />
                      </div>
                    </div>
                  </td>

                  {/* Col 5: Quick Actions */}
                  <td className="py-4 pl-4 pr-6 text-right whitespace-nowrap">
                    {onQuickProduce ? (
                      <button
                        type="button"
                        onClick={() => onQuickProduce(item)}
                        className={`inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-mono font-bold transition-all active:scale-95 shadow-md ${
                          currentStock === 0
                            ? "bg-[#F97316] hover:bg-[#EA580C] text-white shadow-orange-500/20"
                            : "bg-white/[0.06] hover:bg-white/[0.14] text-neutral-200 hover:text-white border border-white/[0.08]"
                        }`}
                      >
                        <Zap className="w-3 h-3 text-[#F97316]" />
                        <span>Racik +100</span>
                      </button>
                    ) : (
                      <span className="text-xs text-neutral-600 font-mono">-</span>
                    )}
                  </td>
                </motion.tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};
