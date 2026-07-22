import React from "react";
import { motion, AnimatePresence } from "motion/react";
import { ProductInventoryItem } from "@/types/inventory";
import { CheckCircle2, AlertTriangle, AlertCircle, RefreshCw } from "lucide-react";
import { EmptyInventoryState } from "./EmptyInventoryState";

interface InventoryTableProps {
  items: ProductInventoryItem[];
}

export const InventoryTable: React.FC<InventoryTableProps> = ({ items }) => {
  if (!items || items.length === 0) {
    return <EmptyInventoryState />;
  }

  return (
    <div className="w-full bg-[#18181B] border border-white/[0.05] rounded-[24px] overflow-hidden">
      <div className="p-6 md:p-8 border-b border-white/[0.05] flex items-center justify-between">
        <h3 className="text-lg font-bold text-white tracking-tight">Live Master Inventory</h3>
        <div className="flex items-center gap-2 text-xs text-neutral-500 font-mono">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
          Realtime Sync Active
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse min-w-[800px]">
          <thead>
            <tr className="bg-white/[0.01] border-b border-white/[0.05]">
              <th className="py-4 px-6 text-xs font-bold uppercase tracking-widest text-neutral-500">Produk</th>
              <th className="py-4 px-6 text-xs font-bold uppercase tracking-widest text-neutral-500 text-right">Current Stock</th>
              <th className="py-4 px-6 text-xs font-bold uppercase tracking-widest text-neutral-500 text-right">Minimum Stock</th>
              <th className="py-4 px-6 text-xs font-bold uppercase tracking-widest text-neutral-500 text-center">Smart Status</th>
              <th className="py-4 px-6 text-xs font-bold uppercase tracking-widest text-neutral-500 text-right">Last Updated</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/[0.02]">
            <AnimatePresence>
              {items.map((item, index) => (
                <InventoryRow key={item.product_id} item={item} index={index} />
              ))}
            </AnimatePresence>
          </tbody>
        </table>
      </div>
    </div>
  );
};

const InventoryRow: React.FC<{ item: ProductInventoryItem; index: number }> = ({ item, index }) => {
  const isOutOfStock = item.current_stock === 0;
  const isLowStock = !isOutOfStock && item.current_stock <= item.minimum_stock;
  const isHealthy = !isOutOfStock && !isLowStock;

  const StatusIcon = isHealthy ? CheckCircle2 : isOutOfStock ? AlertCircle : AlertTriangle;
  const statusColor = isHealthy ? "text-emerald-400" : isOutOfStock ? "text-rose-400" : "text-amber-400";
  const statusBg = isHealthy ? "bg-emerald-500/10 border-emerald-500/20" : isOutOfStock ? "bg-rose-500/10 border-rose-500/20" : "bg-amber-500/10 border-amber-500/20";
  const statusLabel = isHealthy ? "Healthy" : isOutOfStock ? "Kritis" : "Low Stock";

  // Format date if available
  const formattedDate = item.last_produced_at 
    ? new Date(item.last_produced_at).toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" }) 
    : "-";

  return (
    <motion.tr
      layout
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.95 }}
      transition={{ duration: 0.4, delay: index * 0.05, ease: [0.22, 1, 0.36, 1] }}
      className="group hover:bg-white/[0.02] transition-colors"
    >
      <td className="py-4 px-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center shrink-0 overflow-hidden">
            {item.image ? (
              <img src={item.image} alt={item.product_name} className="w-full h-full object-cover" />
            ) : (
              <span className="text-xs font-bold text-neutral-500">IMG</span>
            )}
          </div>
          <div>
            <p className="text-sm font-bold text-white">{item.product_name}</p>
            <p className="text-xs text-neutral-500 mt-0.5">{item.category}</p>
          </div>
        </div>
      </td>
      
      <td className="py-4 px-6 text-right">
        <span className={`text-lg font-black tracking-tighter ${isOutOfStock ? "text-rose-500" : "text-white"}`}>
          {item.current_stock}
        </span>
        <span className="text-xs text-neutral-500 ml-1">Cup</span>
      </td>

      <td className="py-4 px-6 text-right">
        <span className="text-sm font-bold text-neutral-400">{item.minimum_stock}</span>
        <span className="text-xs text-neutral-500 ml-1">Cup</span>
      </td>

      <td className="py-4 px-6 text-center">
        <div className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border ${statusBg}`}>
          <StatusIcon className={`w-3.5 h-3.5 ${statusColor}`} />
          <span className={`text-[10px] font-bold uppercase tracking-wider ${statusColor}`}>
            {statusLabel}
          </span>
        </div>
        {!isHealthy && (
          <p className="text-[10px] text-neutral-500 mt-1">Rec: Prod</p>
        )}
      </td>

      <td className="py-4 px-6 text-right text-xs font-mono text-neutral-500">
        {formattedDate !== "-" ? (
          <div className="flex items-center justify-end gap-1.5">
            <RefreshCw className="w-3 h-3 text-emerald-500/50" />
            {formattedDate}
          </div>
        ) : "-"}
      </td>
    </motion.tr>
  );
};
