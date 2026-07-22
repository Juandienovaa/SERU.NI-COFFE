"use client";

import React, { useState, useEffect, useCallback, useMemo } from "react";
import { motion, AnimatePresence } from "motion/react";
import { supabase } from "@/lib/supabase";
import { 
  Store, RefreshCw, Sparkles, CheckCircle2, AlertTriangle, 
  ChevronDown, ChevronUp, Users, TrendingUp, DollarSign, 
  Clock, PackageMinus, Flame, Activity
} from "lucide-react";
import { formatRupiah } from "@/utils/financial";

export interface GerobakStockDetail {
  productId: number;
  productName: string;
  initialStock: number;
  distributed: number;
  addedStock: number;
  terjual: number;
  sisa: number;
  lastUpdated?: string;
  recentlyUpdated?: boolean;
}

export interface GerobakAuditItem {
  outletId: string;
  outletName: string;
  workerName: string;
  status: "OPEN" | "CLOSED";
  bukaTime?: string;
  totalCupTerjual: number;
  omsetSementara: number;
  stockDetails: GerobakStockDetail[];
  rawBukaTimeDate?: string;
}

interface LiveGerobakAuditProps {
  initialOutlets?: GerobakAuditItem[];
  onRefresh?: () => void;
  className?: string;
}

const EMPTY_OUTLETS: GerobakAuditItem[] = [];

export const LiveGerobakAudit: React.FC<LiveGerobakAuditProps> = ({
  initialOutlets = EMPTY_OUTLETS,
  onRefresh,
  className = ""
}) => {
  const [outlets, setOutlets] = useState<GerobakAuditItem[]>(initialOutlets);
  const [loading, setLoading] = useState<boolean>(false);
  const [lastSyncTime, setLastSyncTime] = useState<string>(
    new Date().toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit", second: "2-digit" }) + " WIB"
  );
  
  // State for accordion expansion
  const [expandedOutletId, setExpandedOutletId] = useState<string | null>(null);

  const fetchActiveShifts = useCallback(async () => {
    try {
      setLoading(true);
      const { data: activeShifts, error } = await supabase
        .from("shifts")
        .select("id, outlet_id, crew_name, status, created_at, omset_tunai, omset_qris")
        .in("status", ["OPEN", "open", "aktif", "Aktif"]);

      if (error) throw error;

      const { data: outletsData } = await supabase.from("outlets").select("id, name");
      const { data: productData } = await supabase.from("product_inventory").select("product_id, product_name");
      
      const shiftIds = (activeShifts || []).map((s: any) => s.id);
      let shiftInventoryData: any[] = [];
      if (shiftIds.length > 0) {
        const { data: invData } = await supabase.from("shift_inventory").select("*").in("shift_id", shiftIds);
        shiftInventoryData = invData || [];
      }

      const formattedOutlets: GerobakAuditItem[] = (activeShifts || []).map((shift: any) => {
        const outlet = (outletsData || []).find((o: any) => String(o.id) === String(shift.outlet_id));
        
        let totalCupTerjual = 0;
        const myInventory = shiftInventoryData.filter(i => i.shift_id === shift.id);
        
        const stockDetails: GerobakStockDetail[] = myInventory.map((item: any) => {
          const qtyAwal = Number(item.qty_awal || 0);
          const qtyAllocated = Number(item.qty_allocated || 0);
          const qtyAdjustment = Number(item.qty_adjustment || 0);
          const qtyReturn = Number(item.qty_return || item.qty_retur || 0);
          const qtyTerjual = Number(item.qty_terjual || 0);
          const qtyRusak = Number(item.qty_rusak || 0);
          const computedSisa = qtyAwal + qtyAllocated + qtyAdjustment + qtyReturn - qtyTerjual - qtyRusak;
          const sisaStok = computedSisa;

          totalCupTerjual += qtyTerjual;
          const prod = (productData || []).find((p: any) => String(p.product_id) === String(item.product_id));
          
          return {
            productId: item.product_id,
            productName: prod?.product_name || `Produk #${item.product_id}`,
            initialStock: qtyAwal,
            distributed: qtyAllocated,
            addedStock: qtyAdjustment + qtyReturn,
            terjual: qtyTerjual,
            sisa: sisaStok,
            lastUpdated: item.updated_at || item.created_at
          };
        });
        
        return {
          outletId: shift.outlet_id || shift.id,
          outletName: outlet?.name || shift.outlet_id || "Unknown Outlet",
          workerName: shift.crew_name || "Crew",
          status: "OPEN",
          bukaTime: new Date(shift.created_at).toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" }),
          rawBukaTimeDate: shift.created_at,
          totalCupTerjual,
          omsetSementara: Number(shift.omset_tunai || 0) + Number(shift.omset_qris || 0),
          stockDetails,
        };
      });

      setOutlets(formattedOutlets);
      
      setLastSyncTime(
        new Date().toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit", second: "2-digit" }) + " WIB"
      );
    } catch (e) {
      console.error("[LiveGerobakAudit] Gagal fetch active shifts:", e);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (initialOutlets && initialOutlets.length > 0) {
      setOutlets(initialOutlets);
    } else {
      fetchActiveShifts();
    }
  }, [initialOutlets, fetchActiveShifts]);

  // Realtime subscription
  useEffect(() => {
    let isMounted = true;
    const channel = supabase
      .channel("gerobak-inventory-audit-channel")
      .on(
        "postgres_changes",
        { event: "UPDATE", schema: "public", table: "shift_inventory" },
        (payload) => {
          if (!isMounted) return;
          // Trigger a full refetch to ensure 100% data consistency with SSOT
          fetchActiveShifts();
        }
      )
      .on(
        "postgres_changes",
        { event: "UPDATE", schema: "public", table: "shifts" },
        (payload) => {
          if (!isMounted) return;
          fetchActiveShifts();
        }
      )
      .subscribe();

    const handleLocalSync = (e: Event) => {
      if (!isMounted) return;
      const customEvent = e as CustomEvent<any>;
      if (!customEvent.detail) return;
      fetchActiveShifts();
    };

    if (typeof window !== "undefined") {
      window.addEventListener("inventory_realtime_sync", handleLocalSync);
    }

    return () => {
      isMounted = false;
      supabase.removeChannel(channel);
      if (typeof window !== "undefined") {
        window.removeEventListener("inventory_realtime_sync", handleLocalSync);
      }
    };
  }, [fetchActiveShifts]);

  const handleManualRefresh = () => {
    if (onRefresh) onRefresh();
    fetchActiveShifts();
  };

  // --- Derived Data for UI ---
  const totalGerobak = outlets.length;
  const totalCupTerjual = outlets.reduce((acc, curr) => acc + curr.totalCupTerjual, 0);
  const totalOmset = outlets.reduce((acc, curr) => acc + curr.omsetSementara, 0);

  const criticalStockItems = useMemo(() => {
    return outlets.flatMap(o => 
      o.stockDetails
        .filter(d => d.sisa < 15 && d.sisa > 0)
        .map(d => ({ ...d, outletName: o.outletName }))
    ).sort((a, b) => a.sisa - b.sisa);
  }, [outlets]);

  const topSellingList = useMemo(() => {
    const map = new Map<number, { name: string; qty: number }>();
    outlets.forEach(o => {
      o.stockDetails.forEach(d => {
        if (d.terjual > 0) {
          const ex = map.get(d.productId);
          if (ex) ex.qty += d.terjual;
          else map.set(d.productId, { name: d.productName, qty: d.terjual });
        }
      });
    });
    return Array.from(map.values()).sort((a, b) => b.qty - a.qty).slice(0, 4);
  }, [outlets]);

  const timelineEvents = useMemo(() => {
    const events: { id: string, time: Date, message: string, type: 'OPEN' | 'RESTOCK' }[] = [];
    outlets.forEach((o, i) => {
      if (o.rawBukaTimeDate) {
        events.push({ 
          id: `open-${i}`, 
          time: new Date(o.rawBukaTimeDate), 
          message: `Crew ${o.workerName} membuka shift di ${o.outletName}`, 
          type: 'OPEN' 
        });
      }
      o.stockDetails.forEach((d, j) => {
        if (d.addedStock > 0 && d.lastUpdated) {
          events.push({
            id: `restock-${i}-${j}`,
            time: new Date(d.lastUpdated),
            message: `Restock ${d.productName} di ${o.outletName}`,
            type: 'RESTOCK'
          });
        }
      });
    });
    return events.sort((a, b) => b.time.getTime() - a.time.getTime()).slice(0, 5);
  }, [outlets]);

  return (
    <div className={`w-full space-y-8 ${className}`}>
      {/* 1. EXECUTIVE HEADER */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6">
        <div>
          <h1 className="text-4xl lg:text-5xl font-semibold text-white tracking-tight mb-2">Live Monitoring</h1>
          <p className="text-zinc-400 text-sm md:text-base">Pantau aktivitas seluruh gerobak secara real-time.</p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <div className="px-4 py-2 rounded-full bg-emerald-500/10 border border-emerald-500/20 flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span className="text-xs font-semibold text-emerald-400">{totalGerobak} Outlet Online</span>
          </div>
          <div className="px-4 py-2 rounded-full bg-blue-500/10 border border-blue-500/20 flex items-center gap-2">
            <Users className="w-3.5 h-3.5 text-blue-400" />
            <span className="text-xs font-semibold text-blue-400">{totalGerobak} Crew Aktif</span>
          </div>
          <div className="px-4 py-2 rounded-full bg-orange-500/10 border border-orange-500/20 flex items-center gap-2">
            <DollarSign className="w-3.5 h-3.5 text-orange-400" />
            <span className="text-xs font-semibold text-orange-400">{formatRupiah(totalOmset)}</span>
          </div>
        </div>
      </div>

      {/* 2. SUMMARY KPI SECTION */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-6">
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="bg-zinc-900 border border-white/5 rounded-3xl p-6 flex flex-col justify-between hover:border-emerald-500/30 transition-colors">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-2xl bg-emerald-500/10 flex items-center justify-center">
              <Store className="w-5 h-5 text-emerald-500" />
            </div>
            <span className="text-sm font-medium text-zinc-500">Gerobak Online</span>
          </div>
          <div className="text-4xl font-bold text-white tracking-tight">{totalGerobak}</div>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="bg-zinc-900 border border-white/5 rounded-3xl p-6 flex flex-col justify-between hover:border-blue-500/30 transition-colors">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-2xl bg-blue-500/10 flex items-center justify-center">
              <Users className="w-5 h-5 text-blue-500" />
            </div>
            <span className="text-sm font-medium text-zinc-500">Crew Aktif</span>
          </div>
          <div className="text-4xl font-bold text-white tracking-tight">{totalGerobak}</div>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="bg-zinc-900 border border-white/5 rounded-3xl p-6 flex flex-col justify-between hover:border-orange-500/30 transition-colors">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-2xl bg-orange-500/10 flex items-center justify-center">
              <TrendingUp className="w-5 h-5 text-orange-500" />
            </div>
            <span className="text-sm font-medium text-zinc-500">Cup Terjual Hari Ini</span>
          </div>
          <div className="text-4xl font-bold text-white tracking-tight">{totalCupTerjual}</div>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }} className="bg-zinc-900 border border-white/5 rounded-3xl p-6 flex flex-col justify-between hover:border-emerald-500/30 transition-colors">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-2xl bg-emerald-500/10 flex items-center justify-center">
              <DollarSign className="w-5 h-5 text-emerald-500" />
            </div>
            <span className="text-sm font-medium text-zinc-500">Estimasi Omset</span>
          </div>
          <div className="text-3xl lg:text-4xl font-bold text-white tracking-tight">{formatRupiah(totalOmset)}</div>
        </motion.div>
      </div>

      {/* 3. LIVE STATUS BANNER */}
      <div className="h-18 bg-zinc-900/80 backdrop-blur-md border border-white/5 rounded-2xl px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <span className="relative flex h-3 w-3">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
            <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500" />
          </span>
          <span className="text-sm font-semibold text-zinc-300">Live Sync</span>
          <span className="hidden sm:inline-block text-sm text-zinc-500 border-l border-white/10 pl-3 ml-1">Realtime sinkronisasi stok gerobak</span>
        </div>
        <div className="flex items-center gap-4">
          <span className="text-xs text-zinc-500 hidden sm:inline-block" suppressHydrationWarning>Last Update: {lastSyncTime}</span>
          <button 
            onClick={handleManualRefresh} 
            disabled={loading}
            className="p-2.5 rounded-xl bg-white/5 hover:bg-white/10 text-zinc-300 hover:text-white transition-colors border border-white/5"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin text-orange-500' : ''}`} />
          </button>
        </div>
      </div>

      {/* 4. MAIN CONTENT LAYOUT (12 COLS) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* LEFT PANEL: ACTIVE OUTLETS */}
        <div className="lg:col-span-8 space-y-6">
          <h2 className="text-xl font-semibold text-white">Live Outlet Monitoring</h2>
          
          {outlets.length === 0 ? (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="py-16 text-center bg-zinc-900 border border-white/5 rounded-3xl flex flex-col items-center justify-center">
              <div className="w-16 h-16 rounded-3xl bg-white/5 flex items-center justify-center mb-4">
                <Store className="w-8 h-8 text-zinc-600" />
              </div>
              <h3 className="text-lg font-semibold text-white mb-2">Tidak ada gerobak yang sedang aktif</h3>
              <p className="text-zinc-500 text-sm mb-6 max-w-sm">Data outlet akan muncul secara otomatis begitu crew membuka shift di lapangan.</p>
              <button onClick={handleManualRefresh} className="px-6 py-3 bg-white/10 hover:bg-white/20 text-white rounded-xl font-semibold text-sm transition-colors">
                Refresh Sinkronisasi
              </button>
            </motion.div>
          ) : (
            <div className="space-y-4">
              {outlets.map((outlet, idx) => {
                const isExpanded = expandedOutletId === outlet.outletId;
                return (
                  <motion.div 
                    key={outlet.outletId}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: idx * 0.05 }}
                    className={`bg-zinc-900 border transition-colors duration-300 rounded-[24px] overflow-hidden ${isExpanded ? 'border-orange-500/30' : 'border-white/5 hover:border-white/10'}`}
                  >
                    {/* Compact Outlet Card */}
                    <div className="p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-6 cursor-pointer select-none" onClick={() => setExpandedOutletId(isExpanded ? null : outlet.outletId)}>
                      <div className="flex flex-1 items-center gap-5">
                        <div className="hidden sm:flex w-12 h-12 rounded-2xl bg-orange-500/10 border border-orange-500/20 items-center justify-center shrink-0">
                          <Store className="w-6 h-6 text-orange-500" />
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-1.5">
                            <h3 className="text-lg font-semibold text-white">{outlet.outletName}</h3>
                            <span className="px-2 py-0.5 rounded-md bg-emerald-500/10 text-emerald-400 text-[10px] font-bold uppercase tracking-widest border border-emerald-500/20">LIVE</span>
                          </div>
                          <div className="flex items-center gap-4 text-sm text-zinc-400">
                            <span className="flex items-center gap-1.5"><Users className="w-3.5 h-3.5"/> {outlet.workerName}</span>
                            <span className="flex items-center gap-1.5"><Clock className="w-3.5 h-3.5"/> {outlet.bukaTime}</span>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center justify-between sm:justify-end gap-6 sm:gap-8">
                        <div className="text-left sm:text-right">
                          <p className="text-[10px] font-semibold text-zinc-500 uppercase tracking-widest mb-1">Omset Sementara</p>
                          <p className="text-lg font-bold text-emerald-400 font-mono tracking-tight">{formatRupiah(outlet.omsetSementara)}</p>
                        </div>
                        <button className="w-10 h-10 rounded-full bg-white/5 hover:bg-white/10 flex items-center justify-center text-zinc-400 transition-colors shrink-0">
                          {isExpanded ? <ChevronUp className="w-5 h-5"/> : <ChevronDown className="w-5 h-5"/>}
                        </button>
                      </div>
                    </div>

                    {/* Accordion Detail Table */}
                    <AnimatePresence>
                      {isExpanded && (
                        <motion.div
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: "auto", opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          transition={{ duration: 0.3, ease: "easeInOut" }}
                          className="border-t border-white/5 bg-zinc-950/50"
                        >
                          <div className="p-6 overflow-x-auto">
                            <table className="w-full text-left border-collapse whitespace-nowrap min-w-[500px]">
                              <thead>
                                <tr>
                                  <th className="pb-4 pl-4 text-[11px] font-semibold text-zinc-500 uppercase tracking-widest">Produk SKU</th>
                                  <th className="pb-4 text-[11px] font-semibold text-zinc-500 uppercase tracking-widest text-right">Awal</th>
                                  <th className="pb-4 text-[11px] font-semibold text-sky-400 uppercase tracking-widest text-right">Distribusi</th>
                                  <th className="pb-4 text-[11px] font-semibold text-orange-500 uppercase tracking-widest text-right">Setor</th>
                                  <th className="pb-4 text-[11px] font-semibold text-emerald-500 uppercase tracking-widest text-right">Terjual</th>
                                  <th className="pb-4 pr-4 text-[11px] font-semibold text-red-400 uppercase tracking-widest text-right">Sisa Stok</th>
                                </tr>
                              </thead>
                              <tbody className="divide-y divide-white/5">
                                {!outlet.stockDetails?.length ? (
                                  <tr>
                                    <td colSpan={6} className="py-8 text-center text-zinc-500 text-sm">Belum ada rincian stok.</td>
                                  </tr>
                                ) : (
                                  outlet.stockDetails.map((detail, idx) => (
                                    <tr 
                                      key={`${detail.productId}-${idx}`} 
                                      className={`group transition-colors ${detail.recentlyUpdated ? 'bg-emerald-500/10' : 'hover:bg-zinc-800/50'}`}
                                    >
                                      <td className="py-4 pl-4 text-sm font-semibold text-white flex items-center gap-2">
                                        {detail.productName}
                                        {detail.recentlyUpdated && <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"/>}
                                      </td>
                                      <td className="py-4 text-sm text-zinc-400 text-right font-mono">{detail.initialStock}</td>
                                      <td className="py-4 text-sm text-sky-400 font-semibold text-right font-mono">{detail.distributed}</td>
                                      <td className="py-4 text-sm text-orange-400 font-semibold text-right font-mono">{detail.addedStock}</td>
                                      <td className="py-4 text-sm text-emerald-400 font-semibold text-right font-mono">{detail.terjual}</td>
                                      <td className={`py-4 pr-4 text-sm font-bold text-right font-mono transition-colors ${detail.sisa < 15 ? 'text-red-400' : 'text-zinc-300'}`}>
                                        {detail.sisa}
                                      </td>
                                    </tr>
                                  ))
                                )}
                              </tbody>
                            </table>
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </motion.div>
                );
              })}
            </div>
          )}
        </div>

        {/* RIGHT PANEL: SIDEBAR */}
        <div className="lg:col-span-4 space-y-6">
          
          {/* Section 1: Critical Stock */}
          <div className="bg-zinc-900 border border-white/5 rounded-3xl p-6">
            <h3 className="text-sm font-semibold text-white mb-5 flex items-center gap-2">
              <PackageMinus className="w-4 h-4 text-red-400" />
              Critical Stock
            </h3>
            {criticalStockItems.length === 0 ? (
              <p className="text-xs text-zinc-500">Semua stok terpantau aman.</p>
            ) : (
              <div className="space-y-4">
                {criticalStockItems.slice(0, 5).map((item, idx) => (
                  <div key={idx} className="flex justify-between items-center bg-zinc-950 rounded-xl p-3 border border-white/5">
                    <div>
                      <p className="text-xs font-semibold text-white">{item.productName}</p>
                      <p className="text-[10px] text-zinc-500">{item.outletName}</p>
                    </div>
                    <div className="px-2 py-1 bg-red-500/10 border border-red-500/20 rounded-md text-[10px] font-bold text-red-400 font-mono">
                      {item.sisa} left
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Section 2: Top Selling Today */}
          <div className="bg-zinc-900 border border-white/5 rounded-3xl p-6">
            <h3 className="text-sm font-semibold text-white mb-5 flex items-center gap-2">
              <Flame className="w-4 h-4 text-orange-500" />
              Top Selling Today
            </h3>
            {topSellingList.length === 0 ? (
              <p className="text-xs text-zinc-500">Belum ada penjualan tercatat.</p>
            ) : (
              <div className="space-y-4">
                {topSellingList.map((item, idx) => (
                  <div key={idx} className="flex items-center gap-3">
                    <div className="w-6 h-6 rounded-md bg-white/5 text-zinc-500 text-[10px] font-bold flex items-center justify-center shrink-0">
                      #{idx + 1}
                    </div>
                    <p className="text-xs font-semibold text-white flex-1 truncate">{item.name}</p>
                    <p className="text-xs font-bold text-emerald-400 font-mono">{item.qty} cup</p>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Section 3: Recent Activity Timeline */}
          <div className="bg-zinc-900 border border-white/5 rounded-3xl p-6">
            <h3 className="text-sm font-semibold text-white mb-5 flex items-center gap-2">
              <Activity className="w-4 h-4 text-blue-400" />
              Recent Activity
            </h3>
            {timelineEvents.length === 0 ? (
              <p className="text-xs text-zinc-500">Belum ada aktivitas baru.</p>
            ) : (
              <div className="relative border-l border-white/10 ml-3 space-y-6">
                {timelineEvents.map((evt) => (
                  <div key={evt.id} className="relative pl-5">
                    <div className={`absolute -left-[5px] top-1 w-2.5 h-2.5 rounded-full ring-4 ring-zinc-900 ${evt.type === 'OPEN' ? 'bg-blue-400' : 'bg-emerald-400'}`} />
                    <p className="text-[10px] font-semibold text-zinc-500 mb-0.5">
                      {evt.time.toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" })}
                    </p>
                    <p className="text-xs text-zinc-300 leading-relaxed">{evt.message}</p>
                  </div>
                ))}
              </div>
            )}
          </div>

        </div>
      </div>
    </div>
  );
};
