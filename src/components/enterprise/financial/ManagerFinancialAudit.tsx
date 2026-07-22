"use client";

import React, { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { FinancialToolbar, PeriodType } from "./FinancialToolbar";
import { LedgerTableOffline, LedgerTableOnline } from "./LedgerTable";
import { ExportReportModal } from "./ExportReportModal";
import { BarChart3, Loader2, Store, Globe, Banknote, Coffee, ShieldCheck, Wallet, Search, Filter, X, FileText, CheckCircle2, History } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { financialService, OfflineLedgerItem, OnlineLedgerItem, FinancialSummaryData, OnlineSummaryData } from "@/services/financialService";
import { supabase } from "@/lib/supabase";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

function formatRupiah(amount: number) {
  return new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", minimumFractionDigits: 0 }).format(amount);
}

export const ManagerFinancialAudit = () => {
  const [period, setPeriod] = useState<PeriodType>("today");
  
  // Real Data States
  const [isLoading, setIsLoading] = useState(true);
  
  const [offlineSummary, setOfflineSummary] = useState<FinancialSummaryData>({ totalCash: 0, totalQris: 0, totalCup: 0, totalBonus: 0, totalNetCash: 0 });
  const [onlineSummary, setOnlineSummary] = useState<OnlineSummaryData>({ totalOrder: 0, totalDeliveryFee: 0, averageOrder: 0, grandTotal: 0, totalQris: 0 });
  const [offlineLedger, setOfflineLedger] = useState<OfflineLedgerItem[]>([]);
  const [onlineLedger, setOnlineLedger] = useState<OnlineLedgerItem[]>([]);

  // Filter & Search States
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<"ALL" | "PENDING" | "VERIFIED" | "SETTLED">("ALL");

  // Export Modal State
  const [isExportModalOpen, setIsExportModalOpen] = useState(false);

  const [isMounted, setIsMounted] = useState(false);
  useEffect(() => setIsMounted(true), []);

  // Slide Over States
  const [selectedLedger, setSelectedLedger] = useState<OfflineLedgerItem | null>(null);
  const [settlementDetails, setSettlementDetails] = useState<any | null>(null);
  const [isLoadingDetails, setIsLoadingDetails] = useState(false);
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);

  const fetchFinancialData = async () => {
    setIsLoading(true);
    try {
      const data = await financialService.getFinancialData(period);
      setOfflineSummary(data.offlineSummary);
      setOnlineSummary(data.onlineSummary);
      setOfflineLedger(data.offlineLedger);
      setOnlineLedger(data.onlineLedger);
    } catch (error) {
      console.error("Failed to fetch financial data:", error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchFinancialData();
    
    // Realtime Subscriptions
    const channel = supabase.channel('manager-financial-audit')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'transactions' }, () => fetchFinancialData())
      .on('postgres_changes', { event: '*', schema: 'public', table: 'online_orders' }, () => fetchFinancialData())
      .on('postgres_changes', { event: '*', schema: 'public', table: 'settlements' }, () => fetchFinancialData())
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [period]);

  const handleRowClick = async (item: OfflineLedgerItem) => {
    setSelectedLedger(item);
    setIsLoadingDetails(true);
    try {
      const details = await financialService.getSettlementDetails(item.id, item.group_key);
      setSettlementDetails(details);
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoadingDetails(false);
    }
  };

  const handleUpdateStatus = async (newStatus: "VERIFIED" | "SETTLED") => {
    if (!selectedLedger) return;
    setIsUpdatingStatus(true);
    
    // Fallback ID to current user if auth system is available, here using a hardcoded placeholder for demo
    const userId = "00000000-0000-0000-0000-000000000000"; 
    
    const success = await financialService.updateSettlementStatus(selectedLedger.id, selectedLedger.status, newStatus, userId);
    
    if (success) {
      setSelectedLedger({ ...selectedLedger, status: newStatus });
      fetchFinancialData(); // Refresh main list
      // Refresh details to get new audit trails
      const details = await financialService.getSettlementDetails(selectedLedger.id, selectedLedger.group_key);
      setSettlementDetails(details);
    }
    
    setIsUpdatingStatus(false);
  };

  const handleExportPDF = () => {
    if (!selectedLedger || !settlementDetails) return;

    const doc = new jsPDF();

    // Headers
    doc.setFontSize(22);
    doc.setFont("helvetica", "bold");
    doc.text("SERUNI", 14, 20);

    doc.setFontSize(10);
    doc.setFont("helvetica", "normal");
    doc.text("ENTERPRISE POINT OF SALE", 14, 26);
    doc.text("Laporan Settlement Keuangan", 14, 32);

    // Settlement Info
    doc.setFontSize(12);
    doc.setFont("helvetica", "bold");
    doc.text(`Detail Settlement: ${selectedLedger.status}`, 14, 45);

    doc.setFontSize(10);
    doc.setFont("helvetica", "normal");
    doc.text(`Tanggal: ${selectedLedger.date}`, 14, 52);
    doc.text(`Outlet: ${selectedLedger.outlet}`, 14, 58);
    doc.text(`Shift: ${selectedLedger.shift}`, 14, 64);
    doc.text(`Crew/Kasir: ${selectedLedger.crewName}`, 14, 70);

    // Summary Box
    doc.rect(14, 76, 182, 36);
    doc.setFont("helvetica", "bold");
    doc.text("Ringkasan Pendapatan", 18, 83);
    
    doc.setFont("helvetica", "normal");
    doc.text(`Total Cup Terjual: ${selectedLedger.cupSold}`, 18, 91);
    doc.text(`Gross Cash: ${formatRupiah(selectedLedger.cash)}`, 18, 97);
    doc.text(`Total QRIS: ${formatRupiah(selectedLedger.qris)}`, 18, 103);
    doc.text(`Bonus Crew: -${formatRupiah(selectedLedger.bonus)}`, 110, 91);
    
    doc.setFont("helvetica", "bold");
    doc.text(`Net Cash (Setoran): ${formatRupiah(selectedLedger.netCash)}`, 110, 103);

    // Transactions Table
    doc.text("Daftar Transaksi:", 14, 122);
    
    const tableData = settlementDetails.transactions.map((t: any, idx: number) => [
      idx + 1,
      t.invoice_number || t.id.substring(0,8),
      new Date(t.created_at).toLocaleTimeString('id-ID'),
      t.metode_bayar || t.payment_method || 'CASH',
      formatRupiah(t.total_amount || t.total_harga || 0)
    ]);

    autoTable(doc, {
      startY: 126,
      head: [['No', 'Invoice', 'Waktu', 'Metode', 'Total']],
      body: tableData,
      theme: 'grid',
      headStyles: { fillColor: [249, 115, 22] }, // Orange-500
      styles: { fontSize: 9 }
    });

    // Signature Area
    const finalY = (doc as any).lastAutoTable.finalY || 126;
    doc.setFont("helvetica", "normal");
    doc.text("Diverifikasi oleh Manager,", 140, finalY + 20);
    doc.text("_______________________", 140, finalY + 40);

    doc.save(`Settlement_${selectedLedger.date}_${selectedLedger.crewName}.pdf`);
  };

  const filteredOfflineLedger = offlineLedger.filter(item => {
    const matchesSearch = item.crewName.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          item.outlet.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === "ALL" || item.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="w-full max-w-7xl mx-auto px-6 py-8 md:px-12 md:py-12 min-h-screen font-sans">
      
      {/* Header */}
      <header className="mb-10">
        <h1 className="text-4xl md:text-5xl font-black text-white tracking-tighter mb-4 flex items-center gap-4">
          <BarChart3 className="w-10 h-10 text-orange-500" /> Audit Keuangan
        </h1>
        <p className="text-neutral-400 text-sm md:text-base max-w-2xl leading-relaxed">
          Monitoring Enterprise Settlement. Data telah digabungkan (Grouped) berdasarkan Shift dan Hari untuk mempermudah validasi akhir.
        </p>
      </header>

      {/* Toolbar */}
      <div className="mb-10">
        <FinancialToolbar
          period={period}
          setPeriod={setPeriod}
          onRefresh={fetchFinancialData}
          onExport={() => setIsExportModalOpen(true)}
        />
      </div>

      <AnimatePresence mode="wait">
        {isLoading ? (
          <motion.div
            key="loading"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="w-full h-64 flex flex-col items-center justify-center text-white/50"
          >
            <Loader2 className="w-8 h-8 animate-spin mb-4 text-orange-500" />
            <p className="text-sm font-medium tracking-wide">Menarik Data Settlement Enterprise...</p>
          </motion.div>
        ) : (
          <motion.div
            key="content"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
            className="space-y-16"
          >
            {/* SECTION 1: OFFLINE POS */}
            <section className="space-y-6">
              <div className="flex items-center gap-3 mb-6 justify-between flex-wrap">
                <div className="flex items-center gap-3">
                  <Store className="w-6 h-6 text-emerald-500" />
                  <h2 className="text-2xl font-black text-white uppercase tracking-widest">OFFLINE POS</h2>
                </div>
                
                {/* Search & Filter */}
                <div className="flex items-center gap-3">
                  <div className="relative">
                    <Search className="w-4 h-4 text-neutral-500 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input 
                      type="text" 
                      placeholder="Cari Crew / Gerobak" 
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="bg-[#111111] border border-white/10 rounded-xl pl-9 pr-4 py-2 text-sm text-white focus:outline-none focus:border-orange-500"
                    />
                  </div>
                  <div className="relative">
                    <Filter className="w-4 h-4 text-neutral-500 absolute left-3 top-1/2 -translate-y-1/2" />
                    <select 
                      value={statusFilter}
                      onChange={(e) => setStatusFilter(e.target.value as any)}
                      className="bg-[#111111] border border-white/10 rounded-xl pl-9 pr-4 py-2 text-sm text-white appearance-none focus:outline-none focus:border-orange-500 cursor-pointer"
                    >
                      <option value="ALL">Semua Status</option>
                      <option value="PENDING">PENDING</option>
                      <option value="VERIFIED">VERIFIED</option>
                      <option value="SETTLED">SETTLED</option>
                    </select>
                  </div>
                </div>
              </div>
              
              <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                <div className="bg-[#111111] border border-white/5 rounded-2xl p-5">
                  <div className="text-xs font-bold text-neutral-500 uppercase tracking-widest mb-1">Total Cup</div>
                  <div className="text-2xl font-black text-white">{offlineSummary.totalCup}</div>
                </div>
                <div className="bg-[#111111] border border-white/5 rounded-2xl p-5">
                  <div className="text-xs font-bold text-neutral-500 uppercase tracking-widest mb-1">Gross Cash</div>
                  <div className="text-xl font-black text-white">{formatRupiah(offlineSummary.totalCash)}</div>
                </div>
                <div className="bg-[#111111] border border-white/5 rounded-2xl p-5">
                  <div className="text-xs font-bold text-neutral-500 uppercase tracking-widest mb-1">Total QRIS</div>
                  <div className="text-xl font-black text-cyan-400">{formatRupiah(offlineSummary.totalQris)}</div>
                </div>
                <div className="bg-amber-500/10 border border-amber-500/20 rounded-2xl p-5">
                  <div className="text-xs font-bold text-amber-500/70 uppercase tracking-widest mb-1">Bonus Crew</div>
                  <div className="text-xl font-black text-amber-500">{formatRupiah(offlineSummary.totalBonus)}</div>
                </div>
                <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-2xl p-5">
                  <div className="text-xs font-bold text-emerald-500/70 uppercase tracking-widest mb-1">Net Cash</div>
                  <div className="text-2xl font-black text-emerald-400">{formatRupiah(offlineSummary.totalNetCash)}</div>
                </div>
              </div>

              <LedgerTableOffline data={filteredOfflineLedger} onViewDetail={handleRowClick} />
            </section>

            {/* SECTION 2: ONLINE ORDER */}
            <section className="space-y-6">
              <div className="flex items-center gap-3 mb-6">
                <Globe className="w-6 h-6 text-orange-500" />
                <h2 className="text-2xl font-black text-white uppercase tracking-widest">ONLINE ORDER</h2>
              </div>
              
              <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                <div className="bg-[#111111] border border-white/5 rounded-2xl p-5">
                  <div className="text-xs font-bold text-neutral-500 uppercase tracking-widest mb-1">Total Order</div>
                  <div className="text-2xl font-black text-white">{onlineSummary.totalOrder}</div>
                </div>
                <div className="bg-[#111111] border border-white/5 rounded-2xl p-5">
                  <div className="text-xs font-bold text-neutral-500 uppercase tracking-widest mb-1">Average Order</div>
                  <div className="text-xl font-black text-white">{formatRupiah(onlineSummary.averageOrder)}</div>
                </div>
                <div className="bg-[#111111] border border-white/5 rounded-2xl p-5">
                  <div className="text-xs font-bold text-neutral-500 uppercase tracking-widest mb-1">Delivery Fee</div>
                  <div className="text-xl font-black text-neutral-300">{formatRupiah(onlineSummary.totalDeliveryFee)}</div>
                </div>
                <div className="bg-[#111111] border border-white/5 rounded-2xl p-5">
                  <div className="text-xs font-bold text-neutral-500 uppercase tracking-widest mb-1">Total QRIS</div>
                  <div className="text-xl font-black text-cyan-400">{formatRupiah(onlineSummary.totalQris)}</div>
                </div>
                <div className="bg-orange-500/10 border border-orange-500/20 rounded-2xl p-5">
                  <div className="text-xs font-bold text-orange-500/70 uppercase tracking-widest mb-1">Grand Total</div>
                  <div className="text-2xl font-black text-orange-500">{formatRupiah(onlineSummary.grandTotal)}</div>
                </div>
              </div>

              <LedgerTableOnline data={onlineLedger} />
            </section>

          </motion.div>
        )}
      </AnimatePresence>

      <ExportReportModal 
        isOpen={isExportModalOpen} 
        onClose={() => setIsExportModalOpen(false)} 
        period={period} 
      />
      
      {/* Premium Center Modal for Ledger Details */}
      {isMounted && createPortal(
        <AnimatePresence>
          {selectedLedger && (
            <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6" style={{ position: 'fixed' }}>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setSelectedLedger(null)}
              className="absolute inset-0 bg-black/80 backdrop-blur-md"
            />
            
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              transition={{ type: "spring", damping: 25, stiffness: 300 }}
              className="relative w-full max-w-[1100px] h-[85vh] bg-[#0A0A0C] border border-white/10 rounded-[32px] shadow-2xl overflow-hidden flex flex-col"
            >
              {/* Premium Header */}
              <div className="flex-none p-6 md:p-8 border-b border-white/10 bg-gradient-to-b from-white/[0.03] to-transparent">
                <div className="flex justify-between items-start">
                  <div className="flex gap-4">
                    <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-orange-500 to-amber-500 flex items-center justify-center shadow-lg shadow-orange-500/20">
                      <Store className="w-8 h-8 text-white" />
                    </div>
                    <div>
                      <h2 className="text-2xl md:text-3xl font-black text-white uppercase tracking-tight">
                        {selectedLedger.outlet}
                      </h2>
                      <div className="flex items-center gap-3 mt-2 text-sm text-neutral-400 font-medium">
                        <span className="bg-white/10 text-white px-3 py-1 rounded-full text-xs">
                          {selectedLedger.shiftInfo?.shiftType || selectedLedger.shift}
                        </span>
                        <span>•</span>
                        <span>{selectedLedger.date}</span>
                        <span>•</span>
                        <span>Crew: <span className="text-white">{selectedLedger.shiftInfo?.crewName || selectedLedger.crewName}</span></span>
                      </div>
                    </div>
                  </div>
                  <button onClick={() => setSelectedLedger(null)} className="p-2 bg-white/5 hover:bg-white/10 rounded-full transition-colors print:hidden">
                    <X className="w-5 h-5 text-neutral-400 hover:text-white" />
                  </button>
                </div>
              </div>

              {/* Main Content Area (Scrollable) */}
              <div className="flex-1 overflow-y-auto p-6 md:p-8 space-y-8">
                
                {/* 6 Summary Cards */}
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
                  {[
                    { label: "Total Cup", value: selectedLedger.cupSold, color: "text-white" },
                    { label: "Gross Cash", value: formatRupiah(selectedLedger.cash), color: "text-white" },
                    { label: "QRIS", value: formatRupiah(selectedLedger.qris), color: "text-cyan-400" },
                    { label: "Bonus Crew", value: `-${formatRupiah(selectedLedger.bonus)}`, color: "text-amber-400" },
                    { label: "Net Cash", value: formatRupiah(selectedLedger.netCash), color: "text-emerald-400", highlight: true },
                    { label: "Total Pendapatan", value: formatRupiah((selectedLedger.cash || 0) + (selectedLedger.qris || 0)), color: "text-white" }
                  ].map((card, idx) => (
                    <div key={idx} className={`p-4 rounded-2xl border ${card.highlight ? "bg-emerald-500/10 border-emerald-500/20" : "bg-[#111111] border-white/5"}`}>
                      <div className={`text-[10px] font-bold uppercase tracking-widest mb-1 ${card.highlight ? "text-emerald-500/70" : "text-neutral-500"}`}>{card.label}</div>
                      <div className={`text-lg font-black ${card.color}`}>{card.value}</div>
                    </div>
                  ))}
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                  
                  {/* Left Column: Shift Info & Audit Trail */}
                  <div className="lg:col-span-1 space-y-8">
                    {/* Shift Information */}
                    <div>
                      <h3 className="text-xs font-bold text-neutral-500 uppercase tracking-widest mb-4 flex items-center gap-2">
                        <Coffee className="w-4 h-4" /> Informasi Shift
                      </h3>
                      <div className="bg-[#111111] border border-white/5 rounded-2xl p-5 space-y-4">
                        <div className="flex justify-between">
                          <span className="text-sm text-neutral-400">Outlet</span>
                          <span className="text-sm font-bold text-white text-right">{selectedLedger.outlet}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-sm text-neutral-400">Crew / Kasir</span>
                          <span className="text-sm font-bold text-white text-right">{selectedLedger.shiftInfo?.crewName || selectedLedger.crewName}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-sm text-neutral-400">Jam Buka</span>
                          <span className="text-sm font-mono text-white text-right">{selectedLedger.shiftInfo?.jamBuka || "-"}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-sm text-neutral-400">Jam Tutup</span>
                          <span className="text-sm font-mono text-white text-right">{selectedLedger.shiftInfo?.jamTutup || "-"}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-sm text-neutral-400">Status Shift</span>
                          <span className="text-sm font-bold text-emerald-400 uppercase">{selectedLedger.shiftInfo?.status || "CLOSED"}</span>
                        </div>
                      </div>
                    </div>

                    {/* Audit Trail Timeline */}
                    <div>
                      <h3 className="text-xs font-bold text-neutral-500 uppercase tracking-widest mb-4 flex items-center gap-2">
                        <History className="w-4 h-4" /> Audit Trail
                      </h3>
                      <div className="bg-[#111111] border border-white/5 rounded-2xl p-5">
                        <div className="space-y-6 pl-2 border-l-2 border-white/10 ml-2">
                          
                          <div className="relative pl-6">
                            <div className="absolute w-3 h-3 bg-emerald-500 rounded-full -left-[23px] top-1 ring-4 ring-emerald-500/20" />
                            <div className="text-sm font-bold text-white">Created</div>
                            <div className="text-xs text-neutral-400 mt-1">Sistem (Otomatis)</div>
                          </div>

                          <div className="relative pl-6">
                            <div className={`absolute w-3 h-3 rounded-full -left-[23px] top-1 ${selectedLedger.status !== "PENDING" ? "bg-emerald-500 ring-4 ring-emerald-500/20" : "bg-[#1A1A1E] border-2 border-neutral-600"}`} />
                            <div className={`text-sm font-bold ${selectedLedger.status !== "PENDING" ? "text-white" : "text-neutral-500"}`}>Verified</div>
                            {selectedLedger.status !== "PENDING" && <div className="text-xs text-neutral-400 mt-1">Oleh Manager</div>}
                          </div>

                          <div className="relative pl-6">
                            <div className={`absolute w-3 h-3 rounded-full -left-[23px] top-1 ${selectedLedger.status === "SETTLED" ? "bg-emerald-500 ring-4 ring-emerald-500/20" : "bg-[#1A1A1E] border-2 border-neutral-600"}`} />
                            <div className={`text-sm font-bold ${selectedLedger.status === "SETTLED" ? "text-white" : "text-neutral-500"}`}>Settled (Disetor)</div>
                          </div>

                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Right Column: Transactions */}
                  <div className="lg:col-span-2 space-y-4">
                    <h3 className="text-xs font-bold text-neutral-500 uppercase tracking-widest mb-4 flex items-center gap-2">
                      <Banknote className="w-4 h-4" /> Daftar Transaksi
                    </h3>
                    
                    <div className="bg-[#111111] border border-white/5 rounded-2xl overflow-hidden">
                      {isLoadingDetails ? (
                        <div className="h-64 flex flex-col items-center justify-center text-neutral-500">
                          <Loader2 className="w-8 h-8 animate-spin mb-4 text-orange-500" />
                          <span className="text-sm">Memuat rincian transaksi...</span>
                        </div>
                      ) : (
                        <div className="overflow-x-auto">
                          <table className="w-full text-left text-sm">
                            <thead className="bg-white/5 text-neutral-400 text-xs uppercase tracking-wider">
                              <tr>
                                <th className="px-6 py-4 font-medium">Jam</th>
                                <th className="px-6 py-4 font-medium">Invoice</th>
                                <th className="px-6 py-4 font-medium">Payment</th>
                                <th className="px-6 py-4 font-medium">Cup</th>
                                <th className="px-6 py-4 font-medium text-right">Total</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-white/5">
                              {settlementDetails?.transactions?.length === 0 ? (
                                <tr>
                                  <td colSpan={5} className="px-6 py-12 text-center text-neutral-500 italic">
                                    Tidak ada transaksi ditemukan.
                                  </td>
                                </tr>
                              ) : (
                                settlementDetails?.transactions?.map((t: any) => (
                                  <React.Fragment key={t.id}>
                                    <tr className="hover:bg-white/[0.02] transition-colors group cursor-pointer">
                                      <td className="px-6 py-4 whitespace-nowrap font-mono text-neutral-300">
                                        {new Date(t.created_at).toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" })}
                                      </td>
                                      <td className="px-6 py-4 whitespace-nowrap font-bold text-white">
                                        {t.invoice_number || t.id.substring(0,8)}
                                      </td>
                                      <td className="px-6 py-4 whitespace-nowrap">
                                        <span className={`px-2 py-1 rounded text-[10px] font-bold ${
                                          (t.metode_bayar || t.payment_method) === "QRIS" ? "bg-cyan-500/20 text-cyan-400" : "bg-emerald-500/20 text-emerald-400"
                                        }`}>
                                          {t.metode_bayar || t.payment_method || "CASH"}
                                        </span>
                                      </td>
                                      <td className="px-6 py-4 whitespace-nowrap text-neutral-300">
                                        {t.total_items || t.qty || 0}
                                      </td>
                                      <td className="px-6 py-4 whitespace-nowrap font-mono font-bold text-white text-right">
                                        {formatRupiah(t.total_amount || t.total_harga || 0)}
                                      </td>
                                    </tr>
                                  </React.Fragment>
                                ))
                              )}
                            </tbody>
                          </table>
                        </div>
                      )}
                    </div>
                  </div>

                </div>
              </div>

              {/* Footer Actions */}
              <div className="flex-none p-6 md:p-8 border-t border-white/10 bg-[#0A0A0C] flex flex-wrap justify-between items-center gap-4">
                <div className="flex gap-3">
                  <button onClick={() => window.print()} className="px-5 py-2.5 rounded-xl bg-white/5 hover:bg-white/10 text-white font-bold text-sm transition-colors print:hidden">
                    Print
                  </button>
                  <button onClick={handleExportPDF} className="px-5 py-2.5 rounded-xl bg-white/5 hover:bg-white/10 text-white font-bold text-sm flex items-center transition-colors print:hidden">
                    <FileText className="w-4 h-4 mr-2" /> Export PDF
                  </button>
                </div>
                
                <div className="flex gap-3 w-full md:w-auto">
                  {selectedLedger.status === "PENDING" && (
                    <button 
                      onClick={() => handleUpdateStatus("VERIFIED")}
                      disabled={isUpdatingStatus}
                      className="w-full md:w-auto px-8 py-3 rounded-xl bg-amber-500 hover:bg-amber-600 text-black font-black text-sm flex items-center justify-center transition-colors shadow-lg shadow-amber-500/20 disabled:opacity-50"
                    >
                      {isUpdatingStatus ? <Loader2 className="w-4 h-4 animate-spin" /> : "Verifikasi (VERIFIED)"}
                    </button>
                  )}
                  {selectedLedger.status === "VERIFIED" && (
                    <button 
                      onClick={() => handleUpdateStatus("SETTLED")}
                      disabled={isUpdatingStatus}
                      className="w-full md:w-auto px-8 py-3 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-black font-black text-sm flex items-center justify-center transition-colors shadow-lg shadow-emerald-500/20 disabled:opacity-50"
                    >
                      {isUpdatingStatus ? <Loader2 className="w-4 h-4 animate-spin" /> : "Setor (SETTLE)"}
                    </button>
                  )}
                  {selectedLedger.status === "SETTLED" && (
                    <div className="w-full md:w-auto px-8 py-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 font-black text-sm flex items-center justify-center">
                      <CheckCircle2 className="w-4 h-4 mr-2" /> BERHASIL
                    </div>
                  )}
                </div>
              </div>
            </motion.div>
          </div>
          )}
        </AnimatePresence>,
        document.body
      )}
    </div>
  );
};
