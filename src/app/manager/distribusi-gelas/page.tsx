"use client";

import React, { useState } from "react";
import { motion } from "motion/react";
import { Clock, CheckCircle, Package, ArrowLeft, LogOut } from "lucide-react";
import { useRouter } from "next/navigation";
import { useProductionBatches } from "@/hooks/useProductionBatches";
import { DistributionPanel } from "@/components/manager/distribution/DistributionPanel";
import { ProductionHistoryTable } from "@/components/manager/distribution/ProductionHistoryTable";
import { AuditModal } from "@/components/manager/distribution/AuditModal";
import { ProductionBatch } from "@/types/productionBatch";

export default function DistribusiGelasPage() {
  const router = useRouter();
  const {
    batches,
    loading,
    stats,
    loadBatches
  } = useProductionBatches(50);

  const [selectedBatch, setSelectedBatch] = useState<ProductionBatch | null>(null);

  const handleAuditClick = (batch: ProductionBatch) => {
    setSelectedBatch(batch);
  };

  return (
    <div className="min-h-screen bg-[#0A0A0A] bg-[linear-gradient(to_right,#ffffff03_1px,transparent_1px),linear-gradient(to_bottom,#ffffff03_1px,transparent_1px)] bg-[size:32px_32px] text-neutral-200 font-sans pb-20 selection:bg-[#F97316] selection:text-white overflow-x-hidden">
      {/* Top Executive Navigation */}
      <header className="sticky top-0 z-40 bg-[#0A0A0A]/85 backdrop-blur-xl border-b border-white/5 px-4 sm:px-8 py-4 flex justify-between items-center">
        <div className="flex items-center gap-3 sm:gap-4">
          <button
            onClick={() => router.push("/manager/dashboard")}
            className="p-2 rounded-xl bg-neutral-900/80 border border-white/5 text-neutral-400 hover:text-white hover:bg-neutral-800 transition-colors"
            title="Kembali ke Dashboard Utama"
          >
            <ArrowLeft className="w-4.5 h-4.5" />
          </button>
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-[#F97316] to-orange-600 flex items-center justify-center font-black text-black text-sm shadow-lg shadow-[#F97316]/20">
              MGR
            </div>
            <div>
              <h1 className="font-bold text-sm sm:text-base tracking-tight text-white flex items-center gap-2">
                <span>Seru.ni Manager Portal</span>
                <span className="text-[10px] font-black uppercase tracking-widest bg-[#F97316]/10 text-[#F97316] px-2 py-0.5 rounded-md border border-[#F97316]/20">
                  Stage 1
                </span>
              </h1>
              <p className="text-[11px] text-neutral-500 hidden sm:block">
                Production Lifecycle • Independent Batch Capital
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <div className="text-right hidden sm:block">
            <p className="text-xs font-bold text-white">Production Manager</p>
            <p className="text-[10px] text-neutral-500 font-mono">ID: MGR-ACTIVE</p>
          </div>
          <button
            onClick={() => router.push("/login")}
            className="p-2.5 rounded-xl bg-neutral-900 hover:bg-red-500/10 border border-white/5 text-neutral-400 hover:text-red-500 transition-colors"
            title="Keluar Sesi"
          >
            <LogOut className="w-4.5 h-4.5" />
          </button>
        </div>
      </header>

      {/* Main Content Layout */}
      <main className="max-w-[1500px] mx-auto p-4 sm:p-6 lg:p-8 mt-4">
        {/* SECTION A: Top KPI Cards */}
        <motion.div
          initial={{ opacity: 0, y: -15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8"
        >
          {/* Card 1: PENDING BARISTA */}
          <div className="bg-[#111111] border border-white/5 rounded-2xl p-5 flex items-center gap-4 shadow-xl relative overflow-hidden">
            <div className="w-12 h-12 rounded-2xl bg-orange-500/10 border border-orange-500/20 flex items-center justify-center text-orange-400 shrink-0">
              <Clock className="w-6 h-6" />
            </div>
            <div>
              <p className="text-[11px] font-bold text-neutral-500 uppercase tracking-widest mb-0.5">
                Pending Barista
              </p>
              <p className="text-2xl font-black text-white font-mono">
                {stats.totalPending} <span className="text-xs text-neutral-500 font-sans font-medium">Sesi</span>
              </p>
            </div>
          </div>

          {/* Card 2: COMPLETED */}
          <div className="bg-[#111111] border border-white/5 rounded-2xl p-5 flex items-center gap-4 shadow-xl relative overflow-hidden">
            <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 shrink-0">
              <CheckCircle className="w-6 h-6" />
            </div>
            <div>
              <p className="text-[11px] font-bold text-neutral-500 uppercase tracking-widest mb-0.5">
                Completed
              </p>
              <p className="text-2xl font-black text-white font-mono">
                {stats.totalCompleted} <span className="text-xs text-neutral-500 font-sans font-medium">Sesi</span>
              </p>
            </div>
          </div>

          {/* Card 3: DISTRIBUSI GELAS HARI INI */}
          <div className="bg-[#111111] border border-white/5 rounded-2xl p-5 flex items-center gap-4 shadow-xl relative overflow-hidden">
            <div className="w-12 h-12 rounded-2xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-400 shrink-0">
              <Package className="w-6 h-6" />
            </div>
            <div>
              <p className="text-[11px] font-bold text-neutral-500 uppercase tracking-widest mb-0.5">
                Distribusi Gelas Hari Ini
              </p>
              <p className="text-2xl font-black text-white font-mono">
                {new Intl.NumberFormat("id-ID").format(stats.totalCupsToday)}{" "}
                <span className="text-xs text-neutral-500 font-sans font-medium">Cup</span>
              </p>
            </div>
          </div>
        </motion.div>

        {/* SECTION B & C: Left and Right Panels */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* SECTION B: Left Panel (Distribution Form) */}
          <div className="lg:col-span-4 sticky top-28">
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.4, delay: 0.1 }}
            >
              <DistributionPanel onSuccess={loadBatches} />
            </motion.div>
          </div>

          {/* SECTION C: Right Panel (Production History Table) */}
          <div className="lg:col-span-8">
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.4, delay: 0.2 }}
            >
              <ProductionHistoryTable 
                batches={batches} 
                loading={loading} 
                onAuditClick={handleAuditClick} 
              />
            </motion.div>
          </div>
        </div>
      </main>

      {/* MODAL AUDIT */}
      <AuditModal 
        batch={selectedBatch} 
        isOpen={!!selectedBatch} 
        onClose={() => setSelectedBatch(null)} 
      />
    </div>
  );
}
