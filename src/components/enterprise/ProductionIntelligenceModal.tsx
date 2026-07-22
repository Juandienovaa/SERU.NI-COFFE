"use client";

import React, { useState, useEffect } from "react";
import { motion } from "motion/react";
import { AppModal } from "@/components/ui/AppModal";
import { ProductionBatch } from "@/types/productionBatch";
import { ProductionIntelligenceData } from "@/types/productionIntelligence";
import { fetchBatchIntelligence } from "@/services/productionIntelligenceService";
import {
  X,
  PackageOpen,
  PlayCircle,
  Coffee,
  AlertTriangle,
  CheckCircle2,
  ShieldCheck,
  Microscope,
  Scale,
  Award,
  Sparkles,
  Zap,
  Clock,
  MapPin,
  User,
  FileText,
  Camera,
  PenTool,
  CheckSquare,
  Printer,
  ChevronDown,
  ChevronUp
} from "lucide-react";

interface ProductionIntelligenceModalProps {
  batch: ProductionBatch | null;
  isOpen: boolean;
  onClose: () => void;
}

export const ProductionIntelligenceModal: React.FC<ProductionIntelligenceModalProps> = ({
  batch,
  isOpen,
  onClose
}) => {
  const [data, setData] = useState<ProductionIntelligenceData | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [activeSectionTab, setActiveSectionTab] = useState<
    "all" | "timeline" | "output" | "stats" | "quality" | "expansion"
  >("all");
  const [supervisorChecked, setSupervisorChecked] = useState<boolean>(false);
  const [qcNotes, setQcNotes] = useState<string>("");
  const [signedByManager, setSignedByManager] = useState<boolean>(false);
  const [showExpansionDetails, setShowExpansionDetails] = useState<boolean>(true);

  useEffect(() => {
    if (!isOpen || !batch) {
      setData(null);
      return;
    }

    let isMounted = true;
    setLoading(true);

    fetchBatchIntelligence(batch).then((result) => {
      if (isMounted) {
        setData(result);
        setLoading(false);
        setSupervisorChecked(batch.status === "COMPLETED");
      }
    });

    return () => {
      isMounted = false;
    };
  }, [isOpen, batch]);

  if (!isOpen) return null;

  const getTimelineIcon = (type: string) => {
    switch (type) {
      case "Create":
        return <PackageOpen className="w-4 h-4 text-[#F97316]" />;
      case "Start":
        return <PlayCircle className="w-4 h-4 text-sky-400" />;
      case "Produce":
        return <Coffee className="w-4 h-4 text-emerald-400" />;
      case "Defect":
        return <AlertTriangle className="w-4 h-4 text-rose-400" />;
      case "Complete":
        return <CheckCircle2 className="w-4 h-4 text-emerald-400" />;
      case "Supervisor":
        return <ShieldCheck className="w-4 h-4 text-purple-400" />;
      case "Quality":
        return <Microscope className="w-4 h-4 text-amber-400" />;
      default:
        return <Sparkles className="w-4 h-4 text-neutral-400" />;
    }
  };

  const handlePrintReport = () => {
    window.print();
  };

  return (
  const modalTitle = (
    <div className="flex items-center gap-3.5">
      <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-[#F97316] to-orange-600 flex items-center justify-center text-black font-black shadow-lg shadow-[#F97316]/20 shrink-0">
        <Award className="w-6 h-6 text-black" />
      </div>
      <div>
        <div className="flex items-center gap-2">
          <span className="text-[10px] font-mono font-extrabold uppercase tracking-widest text-[#F97316] bg-[#F97316]/10 px-2 py-0.5 rounded border border-[#F97316]/30">
            Production Intelligence Panel
          </span>
          {data && (
            <span className="text-[10px] font-mono text-neutral-400">
              • ID: {data.batch.batch_number}
            </span>
          )}
        </div>
        <h2 className="text-lg sm:text-xl font-black text-white tracking-tight mt-0.5">
          Laporan Audit & Analitik Sesi Manufaktur
        </h2>
      </div>
    </div>
  );

  const printAction = (
    <button
      onClick={handlePrintReport}
      className="hidden sm:flex items-center gap-2 px-3.5 py-2 rounded-xl bg-[#18181B] hover:bg-neutral-800 border border-white/[0.06] text-xs font-bold text-neutral-300 hover:text-white transition-all active:scale-95 shadow-md"
      title="Cetak Laporan Audit"
    >
      <Printer className="w-3.5 h-3.5 text-neutral-400" />
      <span>Cetak Laporan</span>
    </button>
  );

  const appModalFooter = (
    <>
      <div className="flex flex-1 items-center gap-2 text-xs text-neutral-400">
        <CheckSquare className="w-4 h-4 text-emerald-400" />
        <span>Sesi terarsip di Supabase • 100% Auditable</span>
      </div>
      <button
        onClick={onClose}
        className="px-6 py-2.5 rounded-xl bg-white text-black hover:bg-neutral-200 font-black text-xs transition-all active:scale-95 shadow-lg w-full sm:w-auto mt-3 sm:mt-0"
      >
        Tutup Laporan
      </button>
    </>
  );

  return (
    <AppModal
      open={isOpen}
      onClose={onClose}
      size="xl"
      title={modalTitle}
      actionGroup={printAction}
      loading={loading}
      footer={appModalFooter}
    >
      <div className="flex flex-col h-full space-y-8">
        {/* Quick Jump Navigation Tabs */}
        <div className="-mt-6 -mx-6 md:-mx-8 px-6 md:px-8 py-3 bg-[#111113]/90 border-b border-white/[0.06] flex items-center gap-2 overflow-x-auto whitespace-nowrap scrollbar-hide shrink-0 text-xs font-bold sticky top-0 z-10">
          {(
            [
              { id: "all", label: "Semua Laporan (8 Sections)" },
              { id: "stats", label: "KPI & Audit Matematis" },
              { id: "timeline", label: "Timeline Kronologis" },
              { id: "output", label: "Output Inventaris" },
              { id: "quality", label: "Skor Kualitas & AI Insight" },
              { id: "expansion", label: "Persetujuan Anda" }
            ] as const
          ).map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveSectionTab(tab.id)}
              className={`px-3.5 py-1.5 rounded-xl border whitespace-nowrap shrink-0 transition-all ${
                activeSectionTab === tab.id
                  ? "bg-[#18181B] border-[#F97316] text-white font-black shadow-md shadow-[#F97316]/10"
                  : "bg-transparent border-transparent text-neutral-400 hover:text-neutral-200 hover:bg-white/[0.03]"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Content Container */}
        <div className="w-full">
            {loading ? (
              /* Shimmer Skeleton Loading State */
              <div className="space-y-6 py-6">
                <div className="h-28 rounded-3xl bg-[#18181B]/80 border border-white/[0.06] skeleton-shimmer" />
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {[1, 2, 3].map((n) => (
                    <div
                      key={n}
                      className="h-24 rounded-2xl bg-[#18181B]/80 border border-white/[0.06] skeleton-shimmer"
                    />
                  ))}
                </div>
                <div className="h-64 rounded-3xl bg-[#18181B]/80 border border-white/[0.06] skeleton-shimmer" />
              </div>
            ) : !data ? (
              <div className="py-20 text-center text-neutral-500 font-mono">
                Gagal memuat data intelijen untuk batch ini.
              </div>
            ) : (
              <>
                {/* ==================================================
                    SECTION 1: BATCH OVERVIEW
                ================================================== */}
                {(activeSectionTab === "all" || activeSectionTab === "stats") && (
                  <section className="rounded-3xl bg-[#18181B] border border-white/[0.06] p-6 sm:p-7 shadow-xl">
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6 pb-5 border-b border-white/[0.06]">
                      <div>
                        <span className="text-[10px] font-mono font-bold uppercase tracking-widest text-neutral-400 block">
                          Section 1 • Executive Metadata
                        </span>
                        <h3 className="text-xl font-black text-white tracking-tight mt-0.5 flex items-center gap-3">
                          <span>Batch Overview • {data.batch.batch_number}</span>
                          <span
                            className={`text-xs px-3 py-1 rounded-full font-bold uppercase tracking-wider border ${
                              data.batch.status === "COMPLETED"
                                ? "bg-emerald-500/15 border-emerald-500/30 text-emerald-400"
                                : "bg-amber-500/15 border-amber-500/30 text-amber-400"
                            }`}
                          >
                            {data.batch.status}
                          </span>
                        </h3>
                      </div>

                      <div className="flex items-center gap-2.5 px-3.5 py-2 rounded-2xl bg-[#111113] border border-white/[0.06] text-xs font-semibold text-neutral-300">
                        <MapPin className="w-4 h-4 text-[#F97316]" />
                        <span>{data.location}</span>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                      <div className="p-3.5 rounded-2xl bg-[#111113] border border-white/[0.06]">
                        <div className="flex items-center gap-1.5 text-neutral-400 text-xs mb-1">
                          <User className="w-3.5 h-3.5 text-neutral-500" />
                          <span>Operator Barista</span>
                        </div>
                        <p className="text-sm sm:text-base font-bold text-white truncate font-mono">
                          {data.batch.locked_by || "Barista Shift POS"}
                        </p>
                      </div>

                      <div className="p-3.5 rounded-2xl bg-[#111113] border border-white/[0.06]">
                        <div className="flex items-center gap-1.5 text-neutral-400 text-xs mb-1">
                          <Clock className="w-3.5 h-3.5 text-neutral-500" />
                          <span>Started At</span>
                        </div>
                        <p className="text-sm sm:text-base font-bold text-white font-mono">
                          {data.batch.created_at
                            ? new Date(data.batch.created_at).toLocaleTimeString("id-ID", {
                                hour: "2-digit",
                                minute: "2-digit"
                              }) + " WIB"
                            : "08:15 WIB"}
                        </p>
                      </div>

                      <div className="p-3.5 rounded-2xl bg-[#111113] border border-white/[0.06]">
                        <div className="flex items-center gap-1.5 text-neutral-400 text-xs mb-1">
                          <Clock className="w-3.5 h-3.5 text-neutral-500" />
                          <span>Completed At</span>
                        </div>
                        <p className="text-sm sm:text-base font-bold text-white font-mono">
                          {data.batch.status === "COMPLETED"
                            ? new Date(
                                new Date(data.batch.created_at || Date.now()).getTime() +
                                  data.durationMinutes * 60000
                              ).toLocaleTimeString("id-ID", {
                                hour: "2-digit",
                                minute: "2-digit"
                              }) + " WIB"
                            : "Dalam Proses"}
                        </p>
                      </div>

                      <div className="p-3.5 rounded-2xl bg-[#111113] border border-white/[0.06]">
                        <div className="flex items-center gap-1.5 text-neutral-400 text-xs mb-1">
                          <Zap className="w-3.5 h-3.5 text-[#F97316]" />
                          <span>Production Duration</span>
                        </div>
                        <p className="text-sm sm:text-base font-bold text-[#F97316] font-mono">
                          {data.durationMinutes} Menit
                        </p>
                      </div>
                    </div>

                    {/* Progress Produksi Bar */}
                    <div className="mt-6 pt-5 border-t border-white/[0.06]">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-xs font-bold text-neutral-400 uppercase tracking-widest">Progress Produksi</span>
                        <span className="text-xs font-bold font-mono text-white">
                          {Math.min(100, Math.round(((data.validation.finishedCups + data.validation.defectCups) / data.validation.rawCups) * 100))}%
                        </span>
                      </div>
                      <div className="w-full h-3 bg-[#111113] rounded-full overflow-hidden border border-white/[0.06] relative">
                        <div 
                          className="absolute top-0 left-0 h-full bg-gradient-to-r from-orange-500 to-amber-400 transition-all duration-1000"
                          style={{ width: `${Math.min(100, Math.round(((data.validation.finishedCups + data.validation.defectCups) / data.validation.rawCups) * 100))}%` }}
                        />
                      </div>
                      <div className="flex items-center justify-between mt-2 text-[10px] text-neutral-500 font-mono">
                        <span>0%</span>
                        <span>25%</span>
                        <span>50%</span>
                        <span>75%</span>
                        <span>100%</span>
                      </div>
                    </div>
                  </section>
                )}

                {/* ==================================================
                    SECTION 4 & 5: STATISTICS KPIs & VALIDATION AUDIT
                ================================================== */}
                {(activeSectionTab === "all" || activeSectionTab === "stats") && (
                  <section className="space-y-6">
                    {/* Section 4: KPI Cards */}
                    <div>
                      <div className="flex items-center justify-between mb-4">
                        <h4 className="text-base font-black text-white flex items-center gap-2">
                          <Zap className="w-4.5 h-4.5 text-[#F97316]" />
                          <span>Section 4 • Production Statistics</span>
                        </h4>
                        <span className="text-[10px] font-mono text-neutral-500">
                          Automated Yield Engine
                        </span>
                      </div>

                      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3.5">
                        <div className="p-4 rounded-2xl bg-[#18181B] border border-white/[0.06] flex flex-col justify-between">
                          <span className="text-[11px] font-semibold text-neutral-400 block mb-1">
                            Raw Cups
                          </span>
                          <span className="text-2xl sm:text-3xl font-black font-mono text-white">
                            {data.validation.rawCups}
                          </span>
                          <span className="text-[10px] text-neutral-500 mt-1 uppercase font-bold">
                            Modal Jatah
                          </span>
                        </div>

                        <div className="p-4 rounded-2xl bg-[#18181B] border border-white/[0.06] flex flex-col justify-between">
                          <span className="text-[11px] font-semibold text-neutral-400 block mb-1">
                            Finished Cups
                          </span>
                          <span className="text-2xl sm:text-3xl font-black font-mono text-emerald-400">
                            {data.validation.finishedCups}
                          </span>
                          <span className="text-[10px] text-neutral-500 mt-1 uppercase font-bold">
                            Produk Jadi
                          </span>
                        </div>

                        <div className="p-4 rounded-2xl bg-[#18181B] border border-white/[0.06] flex flex-col justify-between">
                          <span className="text-[11px] font-semibold text-neutral-400 block mb-1">
                            Defect Cups
                          </span>
                          <span className="text-2xl sm:text-3xl font-black font-mono text-rose-400">
                            {data.validation.defectCups}
                          </span>
                          <span className="text-[10px] text-neutral-500 mt-1 uppercase font-bold">
                            Rusak / Cacat
                          </span>
                        </div>

                        <div className="p-4 rounded-2xl bg-[#18181B] border border-white/[0.06] flex flex-col justify-between">
                          <span className="text-[11px] font-semibold text-neutral-400 block mb-1">
                            Yield %
                          </span>
                          <span className="text-2xl sm:text-3xl font-black font-mono text-cyan-400">
                            {data.quality.yieldPercentage}%
                          </span>
                          <span className="text-[10px] text-neutral-500 mt-1 uppercase font-bold">
                            Konversi Sukses
                          </span>
                        </div>

                        <div className="p-4 rounded-2xl bg-[#18181B] border border-white/[0.06] flex flex-col justify-between">
                          <span className="text-[11px] font-semibold text-neutral-400 block mb-1">
                            Duration
                          </span>
                          <span className="text-2xl sm:text-3xl font-black font-mono text-amber-400">
                            {data.durationMinutes}m
                          </span>
                          <span className="text-[10px] text-neutral-500 mt-1 uppercase font-bold">
                            Waktu Racik
                          </span>
                        </div>

                        <div className="p-4 rounded-2xl bg-[#18181B] border border-white/[0.06] flex flex-col justify-between">
                          <span className="text-[11px] font-semibold text-neutral-400 block mb-1">
                            Speed
                          </span>
                          <span className="text-2xl sm:text-3xl font-black font-mono text-purple-400">
                            {data.speedCupsPerMin}
                          </span>
                          <span className="text-[10px] text-neutral-500 mt-1 uppercase font-bold">
                            Cups / Menit
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Section 5: Mathematical Validation Box */}
                    <div
                      className={`p-5 sm:p-6 rounded-3xl border flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 transition-all shadow-xl ${
                        data.validation.isValid
                          ? "bg-emerald-950/40 border-emerald-500/40 text-emerald-200"
                          : "bg-rose-950/50 border-rose-500/60 text-rose-200 animate-pulse"
                      }`}
                    >
                      <div className="flex items-center gap-3.5">
                        <div
                          className={`w-12 h-12 rounded-2xl flex items-center justify-center font-black shrink-0 ${
                            data.validation.isValid
                              ? "bg-emerald-500/20 border border-emerald-500/40 text-emerald-400"
                              : "bg-rose-500/20 border border-rose-500/40 text-rose-400"
                          }`}
                        >
                          <Scale className="w-6 h-6" />
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-black uppercase tracking-wider font-mono">
                              Section 5 • Production Validation
                            </span>
                            <span
                              className={`px-2 py-0.5 rounded text-[10px] font-black uppercase ${
                                data.validation.isValid
                                  ? "bg-emerald-500/20 text-emerald-300"
                                  : "bg-rose-500/30 text-rose-300"
                              }`}
                            >
                              {data.validation.isValid
                                ? "🟢 Production Balanced"
                                : "🔴 Production Inconsistency Detected"}
                            </span>
                          </div>
                          <p className="text-xs sm:text-sm mt-1 font-light leading-relaxed">
                            {data.validation.isValid
                              ? "Akuntansi bahan baku dan produk jadi seimbang 100%. Tidak ada kebocoran stok atau selisih cup mentah."
                              : `Peringatan Audit: Terdapat selisih tidak wajar sebesar ${Math.abs(
                                  data.validation.variance
                                )} Cup antara modal awal dengan output konversi.`}
                          </p>
                        </div>
                      </div>

                      <div className="px-4 py-2.5 rounded-2xl bg-[#111113]/90 border border-white/[0.08] font-mono text-xs sm:text-sm font-bold text-white shrink-0 self-stretch sm:self-center flex items-center justify-center">
                        {data.validation.formulaText}
                      </div>
                    </div>
                  </section>
                )}

                {/* ==================================================
                    SECTION 2: PRODUCTION TIMELINE
                ================================================== */}
                {(activeSectionTab === "all" || activeSectionTab === "timeline") && (
                  <section className="rounded-3xl bg-[#18181B] border border-white/[0.06] p-6 sm:p-7 shadow-xl">
                    <div className="flex items-center justify-between mb-6 pb-4 border-b border-white/[0.06]">
                      <div>
                        <span className="text-[10px] font-mono font-bold uppercase tracking-widest text-neutral-400 block">
                          Section 2 • Event Log Audit
                        </span>
                        <h4 className="text-lg font-black text-white tracking-tight mt-0.5">
                          Production Timeline
                        </h4>
                      </div>
                      <span className="text-xs font-mono text-neutral-400 px-3 py-1 rounded-full bg-[#111113] border border-white/[0.06]">
                        {data.timeline.length} Events Logged
                      </span>
                    </div>

                    <div className="relative pl-6 space-y-6 before:absolute before:left-2.5 before:top-3 before:bottom-3 before:w-0.5 before:bg-white/[0.08]">
                      {data.timeline.map((event, idx) => {
                        const isCompleted = event.status === "completed";
                        const isInProgress = event.status === "in-progress";

                        return (
                          <div key={event.id} className="relative flex items-start gap-4 group">
                            <div
                              className={`absolute -left-6 top-0 w-6 h-6 rounded-full flex items-center justify-center border transition-transform group-hover:scale-110 shadow-md ${
                                isCompleted
                                  ? "bg-[#111113] border-white/[0.2]"
                                  : isInProgress
                                  ? "bg-[#F97316]/20 border-[#F97316] animate-pulse"
                                  : "bg-[#111113] border-white/[0.06] opacity-50"
                              }`}
                            >
                              {getTimelineIcon(event.iconType)}
                            </div>

                            <div className="flex-1 bg-[#111113] border border-white/[0.06] rounded-2xl p-4 transition-colors group-hover:border-white/[0.12]">
                              <div className="flex items-center justify-between gap-2">
                                <h5 className="text-sm font-bold text-white flex items-center gap-2">
                                  <span>{event.title}</span>
                                  {isInProgress && (
                                    <span className="text-[9px] px-2 py-0.5 rounded bg-[#F97316]/20 text-[#F97316] font-mono uppercase">
                                      Active Now
                                    </span>
                                  )}
                                </h5>
                                <span className="text-xs font-mono text-neutral-400">
                                  {event.timestamp}
                                </span>
                              </div>
                              {event.subtitle && (
                                <p className="text-xs text-neutral-400 font-light mt-1">
                                  {event.subtitle}
                                </p>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </section>
                )}

                {/* ==================================================
                    SECTION 3: PRODUCTION OUTPUT
                ================================================== */}
                {(activeSectionTab === "all" || activeSectionTab === "output") && (
                  <section className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <span className="text-[10px] font-mono font-bold uppercase tracking-widest text-neutral-400 block">
                          Section 3 • Inventory Reconciliation
                        </span>
                        <h4 className="text-lg font-black text-white tracking-tight mt-0.5">
                          Production Output Cards
                        </h4>
                      </div>
                      <span className="text-xs font-mono text-emerald-400 px-3 py-1 rounded-full bg-emerald-500/15 border border-emerald-500/30">
                        {data.items.length} Menu Dikonversi
                      </span>
                    </div>

                    {data.items.length === 0 ? (
                      <div className="p-8 rounded-3xl bg-[#18181B] border border-white/[0.06] text-center text-neutral-400 text-sm">
                        Belum ada item produk jadi yang dicatat untuk sesi produksi ini.
                      </div>
                    ) : (
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        {data.items.map((item) => (
                          <div
                            key={item.id}
                            className="p-5 rounded-2xl bg-[#18181B] hover:bg-[#18181B]/90 border border-white/[0.06] hover:border-white/[0.15] flex items-center justify-between gap-4 transition-all shadow-md"
                          >
                            <div className="flex items-center gap-3.5 min-w-0">
                              <div className="w-12 h-12 rounded-xl bg-[#111113] border border-white/[0.06] flex items-center justify-center text-[#F97316] font-black shrink-0">
                                <Coffee className="w-5 h-5" />
                              </div>
                              <div className="min-w-0">
                                <h5 className="text-base font-bold text-white truncate">
                                  {item.product_name}
                                </h5>
                                <div className="flex items-center gap-2 mt-1">
                                  <span className="text-[10px] font-mono text-emerald-400 bg-emerald-500/15 px-2 py-0.5 rounded border border-emerald-500/30 font-bold">
                                    {item.status || "✔ Added to Inventory"}
                                  </span>
                                  <span className="text-[10px] text-neutral-400">
                                    • {item.health || "Healthy"}
                                  </span>
                                </div>
                              </div>
                            </div>

                            <div className="text-right shrink-0">
                              <span className="text-2xl font-black font-mono text-white">
                                {item.quantity_produced}
                              </span>
                              <span className="text-[10px] font-bold text-neutral-500 uppercase block">
                                Cups Jadi
                              </span>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </section>
                )}

                {/* ==================================================
                    SECTION 6 & 7: QUALITY SCORE & MANAGER INSIGHT
                ================================================== */}
                {(activeSectionTab === "all" || activeSectionTab === "quality") && (
                  <section className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                    {/* Section 6: Quality Score Box (5 cols) */}
                    <div className="lg:col-span-5 rounded-3xl bg-[#18181B] border border-white/[0.06] p-6 sm:p-7 flex flex-col justify-between shadow-xl">
                      <div>
                        <span className="text-[10px] font-mono font-bold uppercase tracking-widest text-neutral-400 block">
                          Section 6 • Grading Engine
                        </span>
                        <h4 className="text-lg font-black text-white tracking-tight mt-0.5">
                          Production Quality Score
                        </h4>

                        <div className="mt-6 flex items-center gap-4">
                          <div
                            className={`w-20 h-20 rounded-3xl flex items-center justify-center border font-mono font-black text-3xl shadow-xl ${
                              data.quality.statusLevel === "Excellent"
                                ? "bg-emerald-500/20 border-emerald-500/40 text-emerald-400"
                                : data.quality.statusLevel === "Good"
                                ? "bg-amber-500/20 border-amber-500/40 text-amber-400"
                                : "bg-rose-500/20 border-rose-500/40 text-rose-400"
                            }`}
                          >
                            {data.quality.qualityScore}
                          </div>
                          <div>
                            <span
                              className={`text-xs px-2.5 py-1 rounded-full font-bold uppercase tracking-wider inline-block mb-1 border ${
                                data.quality.statusLevel === "Excellent"
                                  ? "bg-emerald-500/15 border-emerald-500/30 text-emerald-400"
                                  : data.quality.statusLevel === "Good"
                                  ? "bg-amber-500/15 border-amber-500/30 text-amber-400"
                                  : "bg-rose-500/15 border-rose-500/30 text-rose-400"
                              }`}
                            >
                              {data.quality.statusLevel === "Excellent"
                                ? "🟢 Excellent"
                                : data.quality.statusLevel === "Good"
                                ? "🟡 Good"
                                : "🔴 Needs Attention"}
                            </span>
                            <p className="text-xs text-neutral-400 font-light leading-relaxed">
                              Diberikan berdasarkan rasio yield ({data.quality.yieldPercentage}%) dan tingkat kehilangan cacat ({data.quality.lossPercentage}%).
                            </p>
                          </div>
                        </div>
                      </div>

                      <div className="mt-6 pt-5 border-t border-white/[0.06] grid grid-cols-2 gap-3 text-xs">
                        <div className="p-3 rounded-xl bg-[#111113] border border-white/[0.06]">
                          <span className="text-neutral-500 block font-mono">Efficiency Score</span>
                          <span className="text-base font-black text-white font-mono">
                            {data.quality.efficiencyScore} / 100
                          </span>
                        </div>
                        <div className="p-3 rounded-xl bg-[#111113] border border-white/[0.06]">
                          <span className="text-neutral-500 block font-mono">Loss Percentage</span>
                          <span className="text-base font-black text-rose-400 font-mono">
                            {data.quality.lossPercentage}%
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Section 7: Manager Insights Box (7 cols) */}
                    <div className="lg:col-span-7 rounded-3xl bg-[#18181B] border border-white/[0.06] p-6 sm:p-7 flex flex-col justify-between shadow-xl">
                      <div>
                        <div className="flex items-center justify-between mb-4">
                          <div>
                            <span className="text-[10px] font-mono font-bold uppercase tracking-widest text-neutral-400 block">
                              Section 7 • Dynamic Recommendations
                            </span>
                            <h4 className="text-lg font-black text-white tracking-tight mt-0.5 flex items-center gap-2">
                              <Sparkles className="w-5 h-5 text-[#F97316]" />
                              <span>Operational Manager Insight</span>
                            </h4>
                          </div>
                          <span className="text-[10px] font-mono text-neutral-400 bg-[#111113] px-2.5 py-1 rounded border border-white/[0.06]">
                            Auto-Generated
                          </span>
                        </div>

                        <div className="space-y-3">
                          {data.insights.map((ins) => (
                            <div
                              key={ins.id}
                              className={`p-4 rounded-2xl border text-xs sm:text-sm font-medium flex items-start gap-3 transition-colors ${
                                ins.type === "positive"
                                  ? "bg-emerald-950/40 border-emerald-500/30 text-emerald-200"
                                  : ins.type === "warning"
                                  ? "bg-rose-950/40 border-rose-500/30 text-rose-200"
                                  : ins.type === "recommendation"
                                  ? "bg-amber-950/40 border-amber-500/30 text-amber-200"
                                  : "bg-[#111113] border-white/[0.06] text-neutral-300"
                              }`}
                            >
                              <div className="shrink-0 mt-0.5">
                                {ins.type === "positive" && <CheckCircle2 className="w-4 h-4 text-emerald-400" />}
                                {ins.type === "warning" && <AlertTriangle className="w-4 h-4 text-rose-400" />}
                                {ins.type === "recommendation" && <Sparkles className="w-4 h-4 text-amber-400" />}
                                {ins.type === "neutral" && <FileText className="w-4 h-4 text-neutral-400" />}
                              </div>
                              <span className="leading-relaxed flex-1">{ins.text}</span>
                            </div>
                          ))}
                        </div>
                      </div>

                      <div className="mt-6 pt-4 border-t border-white/[0.06] text-[11px] text-neutral-500 flex items-center justify-between">
                        <span>Algoritma wawasan mempertimbangkan ambang batas stok POS.</span>
                        <span className="font-mono">Ready for AI Recommendations</span>
                      </div>
                    </div>
                  </section>
                )}

                {/* ==================================================
                    SECTION 8: FUTURE EXPANSION & APPROVALS
                ================================================== */}
                {(activeSectionTab === "all" || activeSectionTab === "expansion") && (
                  <section className="rounded-3xl bg-[#18181B] border border-white/[0.06] p-6 sm:p-7 shadow-xl">
                    <div className="flex items-center justify-between mb-6 pb-4 border-b border-white/[0.06]">
                      <div>
                        <span className="text-[10px] font-mono font-bold uppercase tracking-widest text-neutral-400 block">
                          Section 8 • Extensible Architecture
                        </span>
                        <h4 className="text-lg font-black text-white tracking-tight mt-0.5 flex items-center gap-2">
                          <span>Future Expansion & Manager Approvals</span>
                        </h4>
                      </div>

                      <button
                        onClick={() => setShowExpansionDetails(!showExpansionDetails)}
                        className="p-2 rounded-xl bg-[#111113] hover:bg-neutral-800 border border-white/[0.06] text-neutral-400 hover:text-white transition-colors"
                      >
                        {showExpansionDetails ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                      </button>
                    </div>

                    <AnimatePresence>
                      {showExpansionDetails && (
                        <motion.div
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: "auto" }}
                          exit={{ opacity: 0, height: 0 }}
                          className="grid grid-cols-1 md:grid-cols-2 gap-6"
                        >
                          {/* 1. Supervisor Check & QC Notes */}
                          <div className="space-y-4">
                            <label className="flex items-center gap-3 p-4 rounded-2xl bg-[#111113] border border-white/[0.06] cursor-pointer hover:border-white/[0.15] transition-all">
                              <input
                                type="checkbox"
                                checked={supervisorChecked}
                                onChange={(e) => setSupervisorChecked(e.target.checked)}
                                className="w-5 h-5 rounded border-white/[0.2] bg-neutral-900 text-[#F97316] focus:ring-0"
                              />
                              <div className="flex-1">
                                <span className="text-xs font-bold text-white block">
                                  Supervisor Shift Approval
                                </span>
                                <span className="text-[11px] text-neutral-400">
                                  Verifikasi silang fisik gelas mentah dan produk jadi selesai.
                                </span>
                              </div>
                            </label>

                            <div>
                              <label className="text-xs font-bold text-neutral-400 block mb-2">
                                Quality Control Notes (Opsional)
                              </label>
                              <textarea
                                rows={3}
                                placeholder="Tuliskan catatan inspeksi rasa, suhu, atau kerapian kemasan..."
                                value={qcNotes}
                                onChange={(e) => setQcNotes(e.target.value)}
                                className="w-full bg-[#111113] border border-white/[0.08] rounded-2xl p-3.5 text-xs text-white focus:outline-none focus:border-[#F97316] transition-colors"
                              />
                            </div>
                          </div>

                          {/* 2. Photos & Digital Signature */}
                          <div className="space-y-4 flex flex-col justify-between">
                            <div className="p-5 rounded-2xl border border-dashed border-white/[0.12] bg-[#111113]/50 flex flex-col items-center justify-center text-center py-6 cursor-pointer hover:border-white/[0.25] transition-colors">
                              <Camera className="w-6 h-6 text-neutral-400 mb-2" />
                              <span className="text-xs font-bold text-neutral-300">
                                Unggah Foto Bukti Produksi
                              </span>
                              <span className="text-[10px] text-neutral-500 mt-0.5">
                                JPG/PNG up to 10MB (Attachment Stub)
                              </span>
                            </div>

                            <div className="p-4 rounded-2xl bg-[#111113] border border-white/[0.06] flex items-center justify-between gap-4">
                              <div className="flex items-center gap-3">
                                <PenTool className="w-5 h-5 text-[#F97316]" />
                                <div>
                                  <span className="text-xs font-bold text-white block">
                                    Manager Digital Signature
                                  </span>
                                  <span className="text-[10px] text-neutral-400 font-mono">
                                    {signedByManager
                                      ? "Signed by MGR-ACTIVE • Immutable"
                                      : "Belum Divalidasi Manajer"}
                                  </span>
                                </div>
                              </div>

                              <button
                                onClick={() => setSignedByManager(!signedByManager)}
                                className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                                  signedByManager
                                    ? "bg-emerald-500/20 border border-emerald-500/40 text-emerald-400"
                                    : "bg-white text-black hover:bg-neutral-200 shadow-md"
                                }`}
                              >
                                {signedByManager ? "✓ Tanda Tangani" : "Tanda Tangani"}
                              </button>
                            </div>
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </section>
                )}
              </>
            )}
          </div>
        </div>
      </div>
    </AppModal>
  );
};
