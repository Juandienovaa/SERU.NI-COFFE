"use client";

import React, { useState, useEffect } from "react";
import { FinancialToolbar, PeriodType } from "./FinancialToolbar";
import { BarChart3, Loader2, Store, Search, Filter, AlertTriangle, CheckCircle2, FileText, Download, TrendingUp, Clock, Activity, Flame } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { supabase } from "@/lib/supabase";
import { getMasterAuditPayload } from "@/app/actions/financialAuditActions";

function formatRupiah(amount: number) {
  return new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", minimumFractionDigits: 0 }).format(amount);
}

export const ManagerFinancialAudit = () => {
  const [period, setPeriod] = useState<PeriodType>("today");
  const [isLoading, setIsLoading] = useState(true);
  const [payload, setPayload] = useState<any>(null);
  const [isExporting, setIsExporting] = useState(false);

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

  useEffect(() => {
    fetchFinancialData();
    
    // Realtime
    const channel = supabase.channel('manager-financial-audit')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'transactions' }, () => fetchFinancialData())
      .on('postgres_changes', { event: '*', schema: 'public', table: 'shifts' }, () => fetchFinancialData())
      .on('postgres_changes', { event: '*', schema: 'public', table: 'online_orders' }, () => fetchFinancialData())
      .on('postgres_changes', { event: '*', schema: 'public', table: 'operational_expenses' }, () => fetchFinancialData())
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [period]);

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
    alert("Enterprise PDF Generator logic (to be integrated)...");
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
    <div className="w-full max-w-7xl mx-auto px-6 py-8 md:px-12 md:py-12 min-h-screen font-sans text-white">
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
          setPeriod={setPeriod}
          onRefresh={fetchFinancialData}
          onExport={handleExportExcel} // override for now
        />
        
        <div className="flex items-center gap-3">
          <button onClick={handleExportExcel} disabled={isExporting} className="px-4 py-2 bg-emerald-600/20 text-emerald-400 hover:bg-emerald-600/30 border border-emerald-500/30 rounded-lg flex items-center gap-2 text-sm font-medium transition-colors">
            {isExporting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
            Export Excel
          </button>
          <button onClick={handleExportPDF} className="px-4 py-2 bg-orange-600/20 text-orange-400 hover:bg-orange-600/30 border border-orange-500/30 rounded-lg flex items-center gap-2 text-sm font-medium transition-colors">
            <FileText className="w-4 h-4" />
            Export PDF
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4 mb-8">
        <div className="bg-[#111111] border border-white/5 p-6 rounded-2xl col-span-1 sm:col-span-2 lg:col-span-2">
          <p className="text-xs text-neutral-500 uppercase tracking-widest mb-1">Gross Revenue</p>
          <p className="text-3xl font-bold text-white mb-2">{formatRupiah(kpi.gross_revenue || 0)}</p>
          <div className="flex gap-4">
             <div className="text-xs text-zinc-400">Offline POS: <span className="text-zinc-200">{formatRupiah((kpi.cash_revenue || 0) + (kpi.qris_revenue || 0))}</span></div>
             <div className="text-xs text-zinc-400">Online Order: <span className="text-sky-400">{formatRupiah(kpi.online_revenue || 0)}</span></div>
          </div>
        </div>
        <div className="bg-[#111111] border border-white/5 p-6 rounded-2xl">
          <p className="text-xs text-neutral-500 uppercase tracking-widest mb-1">Net Revenue</p>
          <p className="text-2xl font-bold text-emerald-400">{formatRupiah(kpi.net_revenue || 0)}</p>
        </div>
        <div className="bg-[#111111] border border-white/5 p-6 rounded-2xl">
          <p className="text-xs text-neutral-500 uppercase tracking-widest mb-1">Total Expense</p>
          <p className="text-2xl font-bold text-red-400">{formatRupiah(kpi.operational_expense || 0)}</p>
        </div>
        <div className="bg-[#111111] border border-white/5 p-6 rounded-2xl">
          <p className="text-xs text-neutral-500 uppercase tracking-widest mb-1">Cup Terjual</p>
          <p className="text-2xl font-bold text-blue-400">{kpi.total_cups || 0} <span className="text-sm font-normal text-zinc-500 block">dari {kpi.total_transactions || 0} Transaksi</span></p>
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
                    {ex.exception_type === 'SHORTAGE' ? 'Kekurangan Kas' : 'Kelebihan Kas'} sebesar {formatRupiah(Math.abs(ex.selisih_kas))}
                  </p>
                  <p className="text-xs text-neutral-500 mt-1">Crew: {ex.crew_name} | Shift ditutup pada: {new Date(ex.closed_at).toLocaleString('id-ID')}</p>
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
                {payload?.shiftMaster?.map((shift: any) => (
                  <tr key={shift.shift_id} className="border-b border-white/5 hover:bg-white/[0.02] transition-colors">
                    <td className="p-4">
                      <div className="flex items-center gap-2 mb-1">
                        <p className="text-sm font-bold text-white">{shift.crew_name || 'System'}</p>
                        <span className={`text-[10px] px-1.5 py-0.5 rounded font-bold ${shift.shift_status === 'OPEN' ? 'bg-orange-500/20 text-orange-400' : 'bg-emerald-500/20 text-emerald-400'}`}>
                          {shift.shift_status}
                        </span>
                      </div>
                      <p className="text-xs text-neutral-500">
                        {shift.shift_status === 'OPEN' ? '🟢 Sedang Berjalan' : new Date(shift.closed_at).toLocaleString('id-ID')}
                      </p>
                    </td>
                    <td className="p-4">
                      <p className="text-sm font-medium text-white">{formatRupiah(shift.gross_revenue)}</p>
                      <p className="text-xs text-neutral-500 mt-1">{shift.cup_terjual} Cup</p>
                    </td>
                    <td className="p-4">
                      <p className="text-sm font-medium text-red-400">{formatRupiah(shift.pengeluaran_operasional)}</p>
                    </td>
                    <td className="p-4">
                      {shift.shift_status === 'OPEN' ? (
                         <p className="text-xs text-neutral-500 italic">Menunggu Tutup Shift</p>
                      ) : (
                        <p className={`text-sm font-bold ${shift.selisih_kas < 0 ? 'text-red-400' : shift.selisih_kas > 0 ? 'text-yellow-400' : 'text-emerald-400'}`}>
                          {formatRupiah(shift.selisih_kas)}
                        </p>
                      )}
                    </td>
                    <td className="p-4">
                      {shift.shift_status === 'OPEN' ? (
                        <span className="px-2 py-1 text-xs font-bold rounded bg-neutral-800 text-neutral-500">
                          -
                        </span>
                      ) : (
                        <span className={`px-2 py-1 text-xs font-bold rounded ${shift.audit_score >= 80 ? 'bg-emerald-500/20 text-emerald-400' : 'bg-red-500/20 text-red-400'}`}>
                          {shift.audit_score}/100
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
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

    </div>
  );
};

