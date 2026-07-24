"use client";

import React, { useState, useEffect, useTransition } from "react";
import { FinancialToolbar, PeriodType } from "./FinancialToolbar";
import { BarChart3, Loader2, Store, Search, Filter, AlertTriangle, CheckCircle2, FileText, Download, TrendingUp, Clock, Activity, Flame, ChevronDown, ChevronUp, Check } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { createPortal } from "react-dom";
import { supabase } from "@/lib/supabase";
import { getMasterAuditPayload } from "@/app/actions/financialAuditActions";
import { generateShiftAuditPDF } from "@/services/pdfShiftAuditGenerator";
import { generateCrewSettlementPDF } from "@/services/pdfCrewSettlementGenerator";
import { generateFinancialAuditPDF } from "@/services/pdfFinancialAuditGenerator";
import { ExportReportModal } from "./ExportReportModal";
import Swal from 'sweetalert2';
import withReactContent from 'sweetalert2-react-content';

const MySwal = withReactContent(Swal);

function formatRupiah(amount: number) {
  return new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", minimumFractionDigits: 0 }).format(amount);
}

export const ManagerFinancialAudit = () => {
  const [period, setPeriod] = useState<PeriodType>("today");
  const [isLoading, setIsLoading] = useState(true);
  const [payload, setPayload] = useState<any>(null);

  const [isExportModalOpen, setIsExportModalOpen] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [downloadingShiftId, setDownloadingShiftId] = useState<string | null>(null);
  const [expandedShiftId, setExpandedShiftId] = useState<string | null>(null);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);
  
  const [isPending, startTransition] = useTransition();

  const fetchFinancialData = async () => {
    setIsLoading(true);
    try {
      const res = await getMasterAuditPayload(period);
      if (res.success) {
        setPayload(res.data);
      } else {
        console.error("Error fetching master audit:", res.message);
      }
    } catch (error) {
      console.error("Failed to fetch financial data:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handlePeriodChange = (newPeriod: PeriodType) => {
    startTransition(async () => {
      setPeriod(newPeriod);
      const res = await getMasterAuditPayload(newPeriod);
      if (res.success) {
        setPayload(res.data);
      }
    });
  };

  useEffect(() => {
    fetchFinancialData();

    // SETUP REALTIME SUBSCRIPTION
    const channel = supabase.channel('financial_audit_realtime')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'transactions' },
        () => fetchFinancialData()
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'online_orders' },
        () => fetchFinancialData()
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'shifts' },
        () => fetchFinancialData()
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'operational_expenses' },
        () => fetchFinancialData()
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []); // Only run on mount, period updates handled manually

  const handleExportExcel = async () => {
    if (!payload) return;
    setIsExporting(true);
    try {
      const { generateEnterpriseExcel } = await import("@/lib/excelEnterpriseGenerator");
      generateEnterpriseExcel(payload);
    } catch (err) {
      console.error(err);
    } finally {
      setIsExporting(false);
    }
  };

  const handleExportPDF = async () => {
    try {
      MySwal.fire({
        title: 'Mempersiapkan PDF...',
        html: 'Mohon tunggu sebentar, sedang menyusun Laporan Audit Finansial.',
        allowOutsideClick: false,
        didOpen: () => {
          MySwal.showLoading();
        }
      });
      
      const periodLabel = period === 'today' ? 'Hari Ini' : period === 'month' ? 'Bulan Ini' : 'Tahun Ini';
      
      // Allow UI to update and render SweetAlert
      await new Promise(resolve => setTimeout(resolve, 500));
      
      generateFinancialAuditPDF(payload, periodLabel);
      
      MySwal.close();
      setShowSuccessModal(true);
    } catch (error) {
      console.error(error);
      MySwal.fire({
        icon: 'error',
        title: 'Gagal',
        text: 'Terjadi kesalahan saat membuat file PDF.',
        confirmButtonColor: '#ea580c'
      });
    }
  };

  const handleDownloadShift = async (shift: any) => {
    try {
      setDownloadingShiftId(shift.shift_id);
      const { data: expenses } = await supabase.from('operational_expenses').select('*').eq('shift_id', shift.shift_id);
      const { data: transactions } = await supabase.from('transactions').select('*').eq('shift_id', shift.shift_id).order('created_at', { ascending: false });
      
      const mappedShift = {
          ...shift,
          id: shift.shift_id,
          outlet_id: shift.outlet_id || shift.location || "Grobak/Outlet",
          created_at: shift.start_time,
          closed_at: shift.end_time,
          kas_fisik: shift.actual_cash,
          kas_seharusnya: shift.expected_cash,
          selisih: shift.cash_difference,
          audit_status: Number(shift.cash_difference) === 0 ? "SESUAI" : (Number(shift.cash_difference) < 0 ? "SHORTAGE" : "OVERAGE"),
          modal_awal: shift.starting_cash,
          omset_tunai: shift.cash_revenue,
          omset_qris: shift.qris_revenue,
          pengeluaran_operasional: shift.operational_expense
      };

      if (!shift.crew_name || shift.crew_name.toLowerCase() === 'system' || shift.crew_name.toLowerCase().includes('kasir pusat')) {
        generateShiftAuditPDF(mappedShift, expenses || [], transactions || []);
      } else {
        generateCrewSettlementPDF(mappedShift, expenses || [], transactions || []);
      }
    } catch (err) {
      console.error("Failed to download shift PDF:", err);
    } finally {
      setDownloadingShiftId(null);
    }
  };

  if (isLoading && !payload) {
    return (
      <div className="w-full h-screen flex flex-col items-center justify-center bg-black text-white/50">
        <Loader2 className="w-8 h-8 animate-spin mb-4 text-orange-500" />
        <p className="text-sm font-medium tracking-wide">Menarik Data Audit Enterprise dari Database...</p>
      </div>
    );
  }

  const kpi = payload?.kpi || {};
  const health = payload?.financialHealth || { score: 100, status: "Excellent" };

  return (
    <div className={`w-full max-w-7xl mx-auto px-6 py-8 md:px-12 md:py-12 min-h-screen font-sans text-white transition-opacity duration-300 ${isPending ? 'opacity-50 pointer-events-none' : 'opacity-100'}`}>
      <header className="mb-8">
        <div className="flex justify-between items-start flex-wrap gap-4">
          <div>
            <h1 className="text-4xl md:text-5xl font-black tracking-tighter mb-4 flex items-center gap-4">
              <BarChart3 className="w-10 h-10 text-orange-500" /> Master Financial Audit
            </h1>
            <p className="text-neutral-400 text-sm md:text-base max-w-2xl leading-relaxed">
              ERP-Grade Single Source of Truth. Seluruh kalkulasi dieksekusi oleh PostgreSQL. Semua panel bersifat Read-Only.
            </p>
          </div>
          <div className="flex flex-col items-end gap-2">
             <div className="text-right">
                <p className="text-xs text-neutral-500 uppercase tracking-wider mb-1">Financial Health Score</p>
                <div className="flex items-end gap-2">
                  <span className={`text-4xl font-black ${health.score >= 80 ? 'text-emerald-500' : health.score >= 60 ? 'text-yellow-500' : 'text-red-500'}`}>
                    {health.score}
                  </span>
                  <span className="text-lg text-neutral-500 mb-1">/ 100</span>
                </div>
                <p className={`text-sm font-bold uppercase tracking-wider mt-1 ${health.score >= 80 ? 'text-emerald-500' : health.score >= 60 ? 'text-yellow-500' : 'text-red-500'}`}>
                  {health.status}
                </p>
             </div>
          </div>
        </div>
      </header>

      <div className="mb-10 flex flex-wrap gap-4 items-center justify-between">
        <FinancialToolbar
          period={period}
          setPeriod={handlePeriodChange}
          onRefresh={fetchFinancialData}
          onExport={handleExportExcel}
          isPending={isPending}
        />
        
        <div className="flex items-center gap-3">
          <button onClick={handleExportExcel} disabled={isExporting} className="px-4 py-2 bg-emerald-600/20 text-emerald-400 hover:bg-emerald-600/30 border border-emerald-500/30 rounded-lg flex items-center gap-2 text-sm font-medium transition-colors">
            {isExporting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
            Export Excel
          </button>
          <button onClick={handleExportPDF} className="px-4 py-2 bg-orange-600/20 text-orange-400 hover:bg-orange-600/30 border border-orange-500/30 rounded-lg flex items-center gap-2 text-sm font-medium transition-colors">
            <FileText className="w-4 h-4" />
            Export Audit
          </button>
          <button onClick={() => setIsExportModalOpen(true)} className="px-4 py-2 bg-purple-600/20 text-purple-400 hover:bg-purple-600/30 border border-purple-500/30 rounded-lg flex items-center gap-2 text-sm font-medium transition-colors">
            <FileText className="w-4 h-4" />
            Export Eksekutif
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 mb-8">
        <div className="bg-[#111111] border border-white/5 p-6 rounded-2xl">
          <p className="text-xs text-neutral-500 uppercase tracking-widest mb-1">Offline POS (Tunai & QRIS)</p>
          <p className="text-2xl font-bold text-white mb-2">{formatRupiah(kpi.gross_revenue || 0)}</p>
          <div className="flex flex-col gap-1 mt-3">
             <div className="text-xs text-zinc-400 flex justify-between">Tunai: <span className="text-zinc-200">{formatRupiah(kpi.cash_revenue || 0)}</span></div>
             <div className="text-xs text-zinc-400 flex justify-between">QRIS: <span className="text-zinc-200">{formatRupiah(kpi.qris_revenue || 0)}</span></div>
          </div>
        </div>
        <div className="bg-[#111111] border border-sky-900/30 p-6 rounded-2xl relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-sky-500/5 rounded-full blur-2xl -mr-10 -mt-10"></div>
          <p className="text-xs text-sky-500/70 uppercase tracking-widest mb-1">Pesanan Online</p>
          <p className="text-2xl font-bold text-sky-400 mb-2">{formatRupiah(kpi.online_revenue || 0)}</p>
          <p className="text-xs text-zinc-500 mt-3 relative z-10">Total Omset dari Seru.ni App</p>
        </div>
        <div className="bg-[#111111] border border-emerald-900/30 p-6 rounded-2xl">
          <p className="text-xs text-emerald-500/70 uppercase tracking-widest mb-1">Pendapatan Bersih</p>
          <p className="text-2xl font-bold text-emerald-400 mb-2">{formatRupiah(kpi.net_revenue || 0)}</p>
          <p className="text-xs text-zinc-500 mt-3">(Offline + Online) - Pengeluaran</p>
        </div>
        <div className="bg-[#111111] border border-red-900/30 p-6 rounded-2xl">
          <p className="text-xs text-red-500/70 uppercase tracking-widest mb-1">Total Pengeluaran</p>
          <p className="text-2xl font-bold text-red-400 mb-2">{formatRupiah(kpi.operational_expense || 0)}</p>
          <p className="text-xs text-zinc-500 mt-3">Biaya Kasbon & Operasional</p>
        </div>
        <div className="bg-[#111111] border border-white/5 p-6 rounded-2xl">
          <p className="text-xs text-neutral-500 uppercase tracking-widest mb-1">Cup Terjual</p>
          <p className="text-2xl font-bold text-blue-400 mb-2">{kpi.total_cups || 0}</p>
          <p className="text-xs text-zinc-500 mt-3 block">dari {kpi.total_transactions || 0} Transaksi</p>
        </div>
      </div>

      {payload?.exceptions?.length > 0 && (
        <div className="bg-red-500/10 border border-red-500/20 p-6 rounded-2xl mb-8">
          <div className="flex items-center gap-3 mb-4">
            <AlertTriangle className="w-6 h-6 text-red-500" />
            <h2 className="text-xl font-bold text-red-400">Smart Exception Report</h2>
          </div>
          <div className="space-y-3">
            {payload.exceptions.map((ex: any, idx: number) => (
              <div key={idx} className="flex items-start gap-4 p-3 bg-black/40 rounded-xl border border-red-500/10">
                <span className={`px-2 py-1 text-[10px] font-bold uppercase rounded ${ex.exception_type === 'SHORTAGE' ? 'bg-red-500/20 text-red-400' : 'bg-yellow-500/20 text-yellow-400'}`}>
                  {ex.exception_type}
                </span>
                <div>
                  <p className="text-sm font-medium text-white">
                    {ex.exception_type === 'SHORTAGE' ? 'Kekurangan Kas' : 'Kelebihan Kas'} sebesar {formatRupiah(ex.amount)}
                  </p>
                  <p className="text-xs text-neutral-500 mt-1">Crew: {ex.crew_name} | Shift ditutup pada: {new Date(ex.end_time).toLocaleString('id-ID')}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* SHIFT SUMMARY TABLE */}
      <section className="space-y-6">
        <div className="flex items-center justify-between mb-6">
           <div className="flex items-center gap-3">
             <Store className="w-6 h-6 text-orange-500" />
             <h2 className="text-2xl font-black text-white uppercase tracking-widest">Shift Audit History</h2>
           </div>
        </div>

        <div className="bg-[#111111] border border-white/5 rounded-2xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-white/10 bg-black/50">
                  <th className="p-4 text-xs font-semibold text-neutral-400 uppercase tracking-wider">Shift Info</th>
                  <th className="p-4 text-xs font-semibold text-neutral-400 uppercase tracking-wider">Sales</th>
                  <th className="p-4 text-xs font-semibold text-neutral-400 uppercase tracking-wider">Expense</th>
                  <th className="p-4 text-xs font-semibold text-neutral-400 uppercase tracking-wider">Selisih Kas</th>
                  <th className="p-4 text-xs font-semibold text-neutral-400 uppercase tracking-wider">Score</th>
                </tr>
              </thead>
              <tbody>
                {payload?.shiftMaster?.map((shift: any) => {
                  const isKasirPusat = !shift.crew_name || shift.crew_name.toLowerCase() === 'system' || shift.crew_name.toLowerCase().includes('kasir pusat');
                  const isExpanded = expandedShiftId === shift.shift_id;
                  
                  return (
                  <React.Fragment key={shift.shift_id}>
                  <tr 
                    onClick={() => setExpandedShiftId(isExpanded ? null : shift.shift_id)}
                    className="border-b border-white/5 hover:bg-white/[0.05] transition-colors cursor-pointer"
                  >
                    <td className="p-4">
                      <div className="flex items-center gap-2 mb-1">
                        <p className="text-sm font-bold text-white">{shift.crew_name || 'System'}</p>
                        <span className={`text-[10px] px-1.5 py-0.5 rounded font-bold ${shift.shift_status === 'OPEN' ? 'bg-orange-500/20 text-orange-400' : 'bg-emerald-500/20 text-emerald-400'}`}>
                          {shift.shift_status}
                        </span>
                      </div>
                      <p className="text-[10px] font-medium text-orange-400/80 uppercase tracking-widest mb-1">
                        {shift.outlet_id || shift.location || "Grobak/Outlet"}
                      </p>
                      <p className="text-xs text-neutral-500">
                        {shift.shift_status === 'OPEN' ? '🟢 Sedang Berjalan' : new Date(shift.end_time).toLocaleString('id-ID')}
                      </p>
                    </td>
                    <td className="p-4">
                      <p className="text-sm font-medium text-white">{formatRupiah(shift.gross_revenue)}</p>
                      <p className="text-xs text-neutral-500 mt-1">{shift.total_cups} Cup</p>
                    </td>
                    <td className="p-4">
                      <p className="text-sm font-medium text-red-400">{formatRupiah(shift.operational_expense)}</p>
                    </td>
                    <td className="p-4">
                      {!isKasirPusat ? (
                        <p className="text-xs text-neutral-500 italic">Settlement Crew (N/A)</p>
                      ) : shift.shift_status === 'OPEN' ? (
                         <p className="text-xs text-neutral-500 italic">Menunggu Tutup Shift</p>
                      ) : (
                        <p className={`text-sm font-bold ${Number(shift.cash_difference) < 0 ? 'text-red-400' : Number(shift.cash_difference) > 0 ? 'text-yellow-400' : 'text-emerald-400'}`}>
                          {formatRupiah(Number(shift.cash_difference))}
                        </p>
                      )}
                    </td>
                    <td className="p-4 flex items-center justify-between">
                      {!isKasirPusat ? (
                        <span className="px-2 py-1 text-xs font-bold rounded bg-neutral-800 text-neutral-500">
                          -
                        </span>
                      ) : shift.shift_status === 'OPEN' ? (
                        <span className="px-2 py-1 text-xs font-bold rounded bg-neutral-800 text-neutral-500">
                          -
                        </span>
                      ) : (
                        <span className={`px-2 py-1 text-xs font-bold rounded ${shift.audit_score >= 80 ? 'bg-emerald-500/20 text-emerald-400' : 'bg-red-500/20 text-red-400'}`}>
                          {shift.audit_score}/100
                        </span>
                      )}
                      
                      <div className="flex items-center gap-2">
                        {shift.shift_status === 'CLOSED' && (
                          <button 
                            onClick={(e) => { e.stopPropagation(); handleDownloadShift(shift); }}
                            disabled={downloadingShiftId === shift.shift_id}
                            className="p-2 hover:bg-white/10 rounded-lg transition-colors disabled:opacity-50"
                            title="Download PDF"
                          >
                            {downloadingShiftId === shift.shift_id ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4 text-white/70" />}
                          </button>
                        )}
                        {isExpanded ? <ChevronUp className="w-5 h-5 text-neutral-500" /> : <ChevronDown className="w-5 h-5 text-neutral-500" />}
                      </div>
                    </td>
                  </tr>
                  {/* EXPANDED ROW FOR CREW GROBAK DETAILS */}
                  <AnimatePresence>
                    {isExpanded && (
                      <motion.tr
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        className="bg-black/20"
                      >
                        <td colSpan={5} className="p-0 border-b border-white/5 overflow-hidden">
                          <div className="p-4 flex flex-col md:flex-row gap-6 items-start justify-between border-l-2 border-orange-500 bg-white/[0.01]">
                            {!isKasirPusat ? (
                              <div className="w-full">
                                <h4 className="text-xs font-bold text-neutral-400 uppercase tracking-wider mb-4">Rincian Settlement Crew</h4>
                                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                  <div className="bg-white/5 rounded-xl p-4">
                                    <p className="text-xs text-neutral-400 mb-1">Total Cup Terjual</p>
                                    <p className="text-lg font-bold text-white">{shift.total_cups || 0} Cup</p>
                                  </div>
                                  <div className="bg-white/5 rounded-xl p-4">
                                    <p className="text-xs text-neutral-400 mb-1">Gross Cash (Fisik)</p>
                                    <p className="text-lg font-bold text-white">{formatRupiah(shift.cash_revenue)}</p>
                                  </div>
                                  <div className="bg-white/5 rounded-xl p-4">
                                    <p className="text-xs text-neutral-400 mb-1">Total QRIS</p>
                                    <p className="text-lg font-bold text-white">{formatRupiah(shift.qris_revenue)}</p>
                                  </div>
                                  <div className="bg-white/5 rounded-xl p-4">
                                    <p className="text-xs text-neutral-400 mb-1">Total Transaksi</p>
                                    <p className="text-lg font-bold text-white">{formatRupiah(shift.gross_revenue)}</p>
                                  </div>
                                </div>
                                <div className="mt-4 p-4 rounded-xl bg-orange-500/10 border border-orange-500/20 flex items-center justify-between">
                                  <div>
                                    <p className="text-sm font-medium text-orange-400">Bonus Crew (Target 100 Cup)</p>
                                    <p className="text-xs text-orange-400/60 mt-1">
                                      {shift.total_cups >= 100 ? "Mencapai target! Bonus Rp 50.000 diberikan." : `Belum capai target (kurang ${100 - (shift.total_cups || 0)} Cup).`}
                                    </p>
                                  </div>
                                  <div className="text-right">
                                    <p className="text-xs text-orange-400/80 mb-1">Potongan Bonus</p>
                                    <p className="text-lg font-bold text-orange-400">-{formatRupiah(shift.total_cups >= 100 ? 50000 : 0)}</p>
                                  </div>
                                </div>
                                <div className="mt-2 p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-between">
                                  <p className="text-sm font-bold text-emerald-400">Net Cash (Setoran Kasir)</p>
                                  <p className="text-xl font-black text-emerald-400">{formatRupiah(Math.max(0, shift.cash_revenue - (shift.total_cups >= 100 ? 50000 : 0)))}</p>
                                </div>
                              </div>
                            ) : (
                              <div className="w-full text-center py-4 text-neutral-500 text-sm">
                                Detail kasir pusat tidak memiliki rincian settlement (hanya berlaku untuk crew grobak).
                              </div>
                            )}
                          </div>
                        </td>
                      </motion.tr>
                    )}
                  </AnimatePresence>
                  </React.Fragment>
                )})}
                {(!payload?.shiftMaster || payload.shiftMaster.length === 0) && (
                  <tr>
                    <td colSpan={5} className="p-12 text-center text-neutral-500">
                      Tidak ada data shift yang ditutup pada periode ini.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {/* ADDITIONAL KPI & TIMELINE */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mt-8">
        
        <div className="lg:col-span-1 space-y-6">
           <div className="bg-[#111111] border border-white/5 rounded-2xl p-6">
             <h3 className="text-sm font-semibold text-white mb-5 flex items-center gap-2">
                <Flame className="w-4 h-4 text-orange-500" /> Best Selling Products
             </h3>
             <div className="space-y-4">
                {payload?.bestSelling?.length > 0 ? (
                  payload.bestSelling.map((item: any, idx: number) => (
                    <div key={item.product_id} className="flex items-center gap-3">
                      <div className="w-6 h-6 rounded-md bg-white/5 text-zinc-500 text-[10px] font-bold flex items-center justify-center shrink-0">#{idx + 1}</div>
                      <p className="text-xs font-semibold text-white flex-1 truncate">{item.product_name}</p>
                      <p className="text-xs font-bold text-emerald-400 font-mono">{item.total_sold} cup</p>
                    </div>
                  ))
                ) : (
                  <p className="text-xs text-neutral-500">Belum ada penjualan tercatat.</p>
                )}
             </div>
           </div>
        </div>

        <div className="lg:col-span-2">
           <div className="bg-[#111111] border border-white/5 rounded-2xl p-6 h-full">
             <h3 className="text-sm font-semibold text-white mb-5 flex items-center gap-2">
                <Activity className="w-4 h-4 text-blue-400" /> Enterprise Financial Timeline
             </h3>
             <div className="space-y-4 h-64 overflow-y-auto pr-2 custom-scrollbar">
                {payload?.timeline?.length > 0 ? (
                  payload.timeline.map((evt: any, idx: number) => (
                    <div key={idx} className="flex items-start gap-4 bg-black/20 p-3 rounded-xl border border-white/[0.02]">
                       <div className="w-1.5 h-1.5 mt-1.5 rounded-full shrink-0 bg-blue-500" />
                       <div className="flex-1">
                          <p className="text-xs font-semibold text-white">{evt.description}</p>
                          <p className="text-[10px] text-zinc-500 mt-1">{new Date(evt.event_time).toLocaleString('id-ID')} • {evt.event_type}</p>
                       </div>
                       {evt.amount !== 0 && (
                         <div className="text-right">
                           <p className={`text-xs font-bold font-mono ${evt.amount > 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                              {evt.amount > 0 ? '+' : ''}{formatRupiah(evt.amount)}
                           </p>
                         </div>
                       )}
                    </div>
                  ))
                ) : (
                  <p className="text-xs text-neutral-500">Belum ada aktivitas tercatat.</p>
                )}
             </div>
           </div>
        </div>
      </div>

      {/* Apple-style Success Modal */}
      {isMounted && typeof document !== "undefined" && createPortal(
        <AnimatePresence>
          {showSuccessModal && (
            <div className="fixed inset-0 z-[10000] flex items-center justify-center bg-black/40 backdrop-blur-sm transition-opacity">
              <motion.div 
                initial={{ opacity: 0, scale: 0.95, y: 10 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 10 }}
                className="relative w-full max-w-sm transform overflow-hidden rounded-[24px] bg-[#1c1c1e]/80 border border-white/10 p-8 text-center shadow-2xl backdrop-blur-xl transition-all"
              >
                <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-emerald-500/10 mb-6">
                  <Check className="h-8 w-8 text-emerald-500 stroke-[1.5]" />
                </div>
                <h3 className="mt-4 text-xl font-semibold tracking-tight text-white">Berhasil!</h3>
                <p className="mt-2 text-sm text-gray-300 font-medium">Laporan Audit PDF berhasil diunduh.</p>
                <button 
                  onClick={() => setShowSuccessModal(false)}
                  className="mt-8 w-full rounded-full bg-[#f97316] py-3 text-sm font-semibold text-white shadow-md transition-transform active:scale-95 hover:bg-[#ea580c]"
                >
                  OK
                </button>
              </motion.div>
            </div>
          )}
        </AnimatePresence>,
        document.body
      )}

      <ExportReportModal
        isOpen={isExportModalOpen}
        onClose={() => setIsExportModalOpen(false)}
        period={period}
      />

    </div>
  );
};
