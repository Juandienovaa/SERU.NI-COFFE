"use client";

import React, { useEffect, useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { InventorySummary } from "./InventorySummary";
import { InventoryTable } from "./InventoryTable";
import { useInventory } from "@/hooks/useInventory";
import { useProductionBatches } from "@/hooks/useProductionBatches";
import { DistributionPanel } from "@/components/manager/distribution/DistributionPanel";
import { ProductionHistoryTable } from "@/components/manager/distribution/ProductionHistoryTable";
import { AuditModal } from "@/components/manager/distribution/AuditModal";
import { ProductionBatch } from "@/types/productionBatch";
import { Loader2 } from "lucide-react";

export const StockManagement = () => {
  // 1. Data Fetching via Hook (Single Source of Truth)
  // useInventory includes Supabase Realtime under the hood
  const { items, loading, errorMsg, refreshInventory } = useInventory();
  
  // Production Batches for History Table
  const { batches, loading: loadingBatches, loadBatches } = useProductionBatches(10);
  const [selectedBatch, setSelectedBatch] = useState<ProductionBatch | null>(null);

  // Local state to prevent SSR hydration mismatch for client-only rendering
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  if (!isMounted) return null; // Avoid Hydration Mismatch

  return (
    <div className="w-full max-w-7xl mx-auto px-6 py-8 md:px-12 md:py-12 min-h-screen">
      {/* Page Header */}
      <header className="mb-12">
        <h1 className="text-4xl md:text-5xl font-black text-white tracking-tighter mb-4">
          Stock Management
        </h1>
        <p className="text-neutral-400 text-sm md:text-base max-w-2xl leading-relaxed">
          Warehouse Control Center. Kelola input bahan baku, pantau ketersediaan stok barang jadi, dan optimalkan keputusan produksi (MRP) secara real-time.
        </p>
      </header>

      {errorMsg && (
        <div className="mb-8 p-4 bg-rose-500/10 border border-rose-500/20 rounded-xl">
          <p className="text-sm font-bold text-rose-400">{errorMsg}</p>
        </div>
      )}

      <div className="space-y-12">
        
        {/* TOP ROW: Raw Material Distribution & History */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* LEFT PANEL: Distribution Card (4 cols) */}
          <section className="lg:col-span-4 lg:sticky lg:top-28">
            <DistributionPanel onSuccess={loadBatches} />
          </section>

          {/* RIGHT PANEL: Production Batch History (8 cols) */}
          <section className="lg:col-span-8">
            <div className="h-full min-h-[500px]">
              <ProductionHistoryTable 
                batches={batches}
                loading={loadingBatches}
                onAuditClick={(batch: ProductionBatch) => setSelectedBatch(batch)}
                onRefresh={loadBatches}
              />
            </div>
          </section>
        </div>

        {/* Section: Live Master Inventory */}
        <section>
          <div className="mb-6 flex items-end justify-between">
            <div>
              <h2 className="text-sm font-bold uppercase tracking-widest text-neutral-500">Live Master Inventory (Finished Goods)</h2>
            </div>
            <button
              onClick={() => refreshInventory(false)}
              className="text-xs font-bold text-orange-500 hover:text-orange-400 transition-colors bg-orange-500/10 px-3 py-1.5 rounded-lg"
            >
              Force Sync
            </button>
          </div>

          <AnimatePresence mode="wait">
            {loading ? (
              <motion.div
                key="loading-inventory"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="w-full h-64 flex flex-col items-center justify-center border border-white/5 bg-[#18181B] rounded-[24px]"
              >
                <Loader2 className="w-8 h-8 animate-spin text-neutral-500 mb-4" />
                <p className="text-sm font-medium text-neutral-500 tracking-wide">Sinkronisasi Master Inventory...</p>
              </motion.div>
            ) : (
              <motion.div
                key="inventory-content"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
                className="space-y-8"
              >
                {/* Summary Metrics */}
                <InventorySummary items={items} />

                {/* Data Table */}
                <InventoryTable items={items} />
              </motion.div>
            )}
          </AnimatePresence>
        </section>
      </div>

      <AuditModal 
        batch={selectedBatch} 
        isOpen={!!selectedBatch} 
        onClose={() => setSelectedBatch(null)} 
      />
    </div>
  );
};
