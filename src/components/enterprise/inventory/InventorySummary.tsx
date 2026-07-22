import React, { useMemo } from "react";
import { ProductInventoryItem } from "@/types/inventory";
import { FinancialSummaryCard } from "../financial/FinancialSummaryCard";
import { Package, AlertTriangle, CheckCircle, XCircle } from "lucide-react";

interface InventorySummaryProps {
  items: ProductInventoryItem[];
}

export const InventorySummary: React.FC<InventorySummaryProps> = ({ items }) => {
  const stats = useMemo(() => {
    let total = 0;
    let outOfStock = 0;
    let lowStock = 0;
    let healthy = 0;

    items.forEach(item => {
      total += item.current_stock;
      if (item.current_stock === 0) outOfStock++;
      else if (item.current_stock <= item.minimum_stock) lowStock++;
      else healthy++;
    });

    return { total, outOfStock, lowStock, healthy };
  }, [items]);

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      <FinancialSummaryCard
        title="Total Finished Stock"
        subtitle="Akumulasi seluruh gerobak"
        value={stats.total}
        trend={0}
        accent="cyan"
        icon={<Package className="w-5 h-5" />}
        prefix=""
        suffix=" Cup"
      />
      <FinancialSummaryCard
        title="Out of Stock"
        subtitle="Produk habis (Kritis)"
        value={stats.outOfStock}
        trend={0}
        accent="orange"
        icon={<XCircle className="w-5 h-5" />}
        prefix=""
        suffix=" Item"
      />
      <FinancialSummaryCard
        title="Low Stock"
        subtitle="Di bawah batas minimum"
        value={stats.lowStock}
        trend={0}
        accent="orange" // Normally warning/amber, reusing orange for aesthetics
        icon={<AlertTriangle className="w-5 h-5" />}
        prefix=""
        suffix=" Item"
      />
      <FinancialSummaryCard
        title="Healthy Stock"
        subtitle="Kondisi optimal"
        value={stats.healthy}
        trend={0}
        accent="emerald"
        icon={<CheckCircle className="w-5 h-5" />}
        prefix=""
        suffix=" Item"
      />
    </div>
  );
};
