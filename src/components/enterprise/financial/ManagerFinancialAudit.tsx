"use client";

import React, { useState, useEffect } from "react";
import { FinancialToolbar, PeriodType } from "./FinancialToolbar";
import { BarChart3, Loader2, Store, Search, Filter, AlertTriangle, CheckCircle2, FileText, Download } from "lucide-react";
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
  
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<"ALL" | "PENDING" | "VERIFIED" | "SETTLED">("ALL");

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
    // Basic placeholder for PDF. Enterprise PDF generator goes here.
    alert("Exporting Enterprise PDF...");
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

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
        <div className="bg-[#111111] border border-white/5 p-6 rounded-2xl">
          <p className="text-xs text-neutral-500 uppercase tracking-widest mb-1">Gross Revenue</p>
          <p className="text-2xl font-bold text-white">{formatRupiah(kpi.gross_revenue || 0)}</p>
        </div>
        <div className="bg-[#111111] border border-white/5 p-6 rounded-2xl">
          <p className="text-xs text-neutral-500 uppercase tracking-widest mb-1">Net Revenue</p>
          <p className="text-2xl font-bold text-emerald-400">{formatRupiah(kpi.net_revenue || 0)}</p>
        </div>
        <div className="bg-[#111111] border border-white/5 p-6 rounded-2xl">
          <p className="text-xs text-neutral-500 uppercase tracking-widest mb-1">Total Expense</p>
          <p className="text-2xl font-bold text-red-400">{formatRupiah(kpi.total_expense || 0)}</p>
        </div>
        <div className="bg-[#111111] border border-white/5 p-6 rounded-2xl">
          <p className="text-xs text-neutral-500 uppercase tracking-widest mb-1">Total Transaksi / Cup</p>
          <p className="text-2xl font-bold text-blue-400">{kpi.total_transactions || 0} <span className="text-lg text-neutral-500">/ {kpi.total_cups || 0}</span></p>
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
                <span className={`px-2 py-1 text-[10px] font-bold uppercase rounded ${ex.severity === 'CRITICAL' ? 'bg-red-500/20 text-red-400' : 'bg-yellow-500/20 text-yellow-400'}`}>
                  {ex.severity}
                </span>
                <div>
                  <p className="text-sm font-medium text-white">{ex.description}</p>
                  <p className="text-xs text-neutral-500 mt-1">Tipe: {ex.exception_type} | Waktu: {new Date(ex.event_time).toLocaleString('id-ID')}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* SHIFT SUMMARY TABLE */}
      <section className="space-y-6">
        <div className="flex items-center gap-3 mb-6">
          <Store className="w-6 h-6 text-orange-500" />
          <h2 className="text-2xl font-black text-white uppercase tracking-widest">Shift Audit History</h2>
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
                  <th className="p-4 text-xs font-semibold text-neutral-400 uppercase tracking-wider text-right">Aksi</th>
                </tr>
              </thead>
              <tbody>
                {payload?.shiftMaster?.map((shift: any) => (
                  <tr key={shift.shift_id} className="border-b border-white/5 hover:bg-white/[0.02] transition-colors">
                    <td className="p-4">
                      <div className="flex items-center gap-2 mb-1">
                        <p className="text-sm font-bold text-white">{shift.cashier_name}</p>
                        <span className={`text-[10px] px-1.5 py-0.5 rounded font-bold ${shift.status === 'OPEN' ? 'bg-orange-500/20 text-orange-400' : 'bg-emerald-500/20 text-emerald-400'}`}>
                          {shift.status}
                        </span>
                      </div>
                      <p className="text-xs text-neutral-500">
                        {shift.status === 'OPEN' ? '🟢 Sedang Berjalan' : new Date(shift.closed_at).toLocaleString('id-ID')}
                      </p>
                    </td>
                    <td className="p-4">
                      <p className="text-sm font-medium text-white">{formatRupiah(shift.gross_sales)}</p>
                      <p className="text-xs text-neutral-500 mt-1">{shift.total_cup} Cup</p>
                    </td>
                    <td className="p-4">
                      <p className="text-sm font-medium text-red-400">{formatRupiah(shift.operational_expense)}</p>
                    </td>
                    <td className="p-4">
                      {shift.status === 'OPEN' ? (
                         <p className="text-xs text-neutral-500 italic">Menunggu Tutup Shift</p>
                      ) : (
                        <p className={`text-sm font-bold ${shift.cash_difference < 0 ? 'text-red-400' : shift.cash_difference > 0 ? 'text-yellow-400' : 'text-emerald-400'}`}>
                          {formatRupiah(shift.cash_difference)}
                        </p>
                      )}
                    </td>
                    <td className="p-4">
                      {shift.status === 'OPEN' ? (
                        <span className="px-2 py-1 text-xs font-bold rounded bg-neutral-800 text-neutral-500">
                          -
                        </span>
                      ) : (
                        <span className={`px-2 py-1 text-xs font-bold rounded ${shift.audit_score >= 80 ? 'bg-emerald-500/20 text-emerald-400' : 'bg-red-500/20 text-red-400'}`}>
                          {shift.audit_score}/100
                        </span>
                      )}
                    </td>
                    <td className="p-4 text-right">
                      <button className="px-3 py-1.5 bg-white/5 hover:bg-white/10 text-white text-xs font-medium rounded transition-colors">
                        Lihat Detail
                      </button>
                    </td>
                  </tr>
                ))}
                {(!payload?.shiftMaster || payload.shiftMaster.length === 0) && (
                  <tr>
                    <td colSpan={6} className="p-12 text-center text-neutral-500">
                      Tidak ada data shift yang ditutup pada periode ini.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </section>

    </div>
  );
};
