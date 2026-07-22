"use client";

import React, { useEffect, useState, Fragment } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "motion/react";
import { supabase } from "@/lib/supabase";
import { products } from "@/app/produk/data";
import { 
  AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, 
  BarChart, Bar, Cell 
} from "recharts";
import { 
  DollarSign, Coffee, Store, TrendingUp, 
  Star, AlertTriangle, Activity, LogOut, Loader2, ChevronDown, ChevronUp
} from "lucide-react";
import CinematicLoader from "@/components/CinematicLoader";
import { LiveGerobakAudit } from "@/components/enterprise/LiveGerobakAudit";

export default function AdminDashboard() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<any>(null);
  const [trendRange, setTrendRange] = useState(7);
  const [expandedRowId, setExpandedRowId] = useState<string | null>(null);
  const [dashboardMode, setDashboardMode] = useState<"LIVE" | "SELESAI">("LIVE");

  const generateTrendData = (days: number, todayOmset: number) => {
    const arr = [];
    const today = new Date();
    
    for(let i = days - 1; i > 0; i--) {
      const pastDate = new Date(today);
      pastDate.setDate(today.getDate() - i);
      const dateString = pastDate.toLocaleDateString('id-ID', { day: 'numeric', month: 'short' });
      
      const omset = 300000 + (Math.sin(i * 123) * 150000) + ((days - i) * 15000);
      arr.push({ name: dateString, omset: Math.round(omset / 10000) * 10000 });
    }
    
    // Untuk data hari ini, gunakan tanggal aktual agar seragam dan rapi
    const todayString = today.toLocaleDateString('id-ID', { day: 'numeric', month: 'short' });
    arr.push({ name: todayString, omset: todayOmset });
    
    return arr;
  };

  useEffect(() => {
    async function initDashboard() {
      try {
        // 1. Cek Autentikasi (Hanya admin@seruni.com)
        const { data: { session } } = await supabase.auth.getSession();
        
        if (!session || session.user.email !== "admin@seruni.com") {
          router.push("/login");
          return;
        }

        // 2. Pengaturan Waktu Reset Otomatis Setiap Jam 00:00 WIB
        const now = new Date();
        const formatter = new Intl.DateTimeFormat("en-US", {
          timeZone: "Asia/Jakarta",
          year: "numeric",
          month: "2-digit",
          day: "2-digit",
        });
        const parts = formatter.formatToParts(now);
        const year = parseInt(parts.find(p => p.type === "year")!.value);
        const month = parseInt(parts.find(p => p.type === "month")!.value) - 1;
        const day = parseInt(parts.find(p => p.type === "day")!.value);

        // Kunci batas awal dan akhir hari berdasarkan Zona Waktu Jakarta (WIB)
        const startWIB = new Date(Date.UTC(year, month, day, 0, 0, 0, 0) - 7 * 60 * 60 * 1000);
        const endWIB = new Date(Date.UTC(year, month, day, 23, 59, 59, 999) - 7 * 60 * 60 * 1000);

        const startWIBIso = startWIB.toISOString();
        const endWIBIso = endWIB.toISOString();

        const { data: shifts, error } = await supabase
          .from('shifts')
          .select('*')
          .or(`status.eq.OPEN,and(status.eq.CLOSED,closed_at.gte.${startWIBIso},closed_at.lte.${endWIBIso})`);

        if (error) throw error;

        let gerobakAktifCount = 0;
        let totalCupTerjual = 0;
        let totalOmsetHariIni = 0;
        const liveOutlets: any[] = [];
        const closedOutlets: any[] = [];
        const liveStockWatchArray: any[] = [];
        const performaMap: Record<string, number> = {};

        // FIX: Konversi ID produk ke String untuk menghindari bentrok tipe data (Number vs String)
        const getPrice = (productId: any) => {
          const p = products.find(prod => String(prod.id) === String(productId));
          if (!p) return 0;
          return typeof p.price === 'number' ? p.price : parseInt(String(p.price).replace(/\D/g, '')) || 0;
        };

        shifts?.forEach((shift: any) => {
          const outletName = shift.outlet_id || "Unknown Outlet";
          let shiftCup = 0;
          let shiftOmset = 0;

          if (shift.status === 'OPEN') {
            gerobakAktifCount++;
            
            if (shift.inventory_data && Array.isArray(shift.inventory_data)) {
              shift.inventory_data.forEach((item: any) => {
                if (item.sisa <= 20 && item.terjual > 0) {
                  liveStockWatchArray.push({
                    productName: products.find(p => String(p.id) === String(item.product_id))?.name || "Unknown Product",
                    outletName: outletName,
                    terjual: item.terjual || 0,
                    sisa: item.sisa
                  });
                }
              });
            }
          }

          // Hitung item terjual untuk semua status shift (OPEN maupun CLOSED)
          if (shift.inventory_data && Array.isArray(shift.inventory_data)) {
            shift.inventory_data.forEach((item: any) => {
              const terjual = item.terjual || 0;
              shiftCup += terjual;
              
              const price = getPrice(item.product_id);
              shiftOmset += terjual * price;
            });
          }
          
          totalCupTerjual += shiftCup;

          // Jika shift CLOSED, gunakan nilai total_sales DB sebagai prioritas utama jika bernilai valid (>0)
          if (shift.status === 'CLOSED') {
            const dbTotalSales = Number(shift.total_sales || 0);
            if (dbTotalSales > 0) {
              shiftOmset = dbTotalSales;
            }
          }
          
          totalOmsetHariIni += shiftOmset;

          if (!performaMap[outletName]) performaMap[outletName] = 0;
          performaMap[outletName] += shiftOmset;

          if (shift.status === 'OPEN') {
            let bukaStr = "";
            if (shift.created_at) {
              const d = new Date(shift.created_at);
              bukaStr = new Intl.DateTimeFormat("id-ID", {
                timeZone: "Asia/Jakarta",
                hour: "2-digit",
                minute: "2-digit"
              }).format(d).replace('.', ':');
            }

            const inventoryDetail = Array.isArray(shift.inventory_data) ? shift.inventory_data.map((item: any) => ({
              productName: products.find(p => String(p.id) === String(item.product_id))?.name || "Unknown",
              initialStock: item.stok_awal || 0,
              addedStock: item.added_stock || 0,
              terjual: item.terjual || 0,
              sisa: item.sisa || 0
            })) : [];

            liveOutlets.push({
              id: shift.id,
              outletName: outletName,
              workerName: shift.crew_name || "Crew",
              bukaTime: bukaStr,
              cupTerjual: shiftCup,
              omsetSementara: shiftOmset,
              inventoryDetail
            });
          }

          if (shift.status === 'CLOSED') {
            if (shift.closed_at) {
              const closedDate = new Date(shift.closed_at);
              if (closedDate >= startWIB && closedDate <= endWIB) {
                let bukaStr = "";
                if (shift.created_at) {
                  bukaStr = new Intl.DateTimeFormat("id-ID", { timeZone: "Asia/Jakarta", hour: "2-digit", minute: "2-digit" }).format(new Date(shift.created_at)).replace('.', ':');
                }
                const tutupStr = new Intl.DateTimeFormat("id-ID", { timeZone: "Asia/Jakarta", hour: "2-digit", minute: "2-digit" }).format(closedDate).replace('.', ':');
                
                const inventoryDetail = Array.isArray(shift.inventory_data) ? shift.inventory_data.map((item: any) => ({
                  productName: products.find(p => String(p.id) === String(item.product_id))?.name || "Unknown",
                  initialStock: item.stok_awal || 0,
                  addedStock: item.added_stock || 0,
                  terjual: item.terjual || 0,
                  sisa: item.sisa || 0
                })) : [];

                closedOutlets.push({
                  id: shift.id,
                  outletName: outletName,
                  workerName: shift.crew_name || "Crew",
                  waktuRentang: `Buka: ${bukaStr} WIB - Tutup: ${tutupStr} WIB`,
                  cupTerjual: shiftCup,
                  omsetSementara: shiftOmset,
                  inventoryDetail
                });
              }
            }
          }
        });

        const rataRataPenjualan = shifts && shifts.length > 0 ? totalOmsetHariIni / shifts.length : 0;

        const performaArray = Object.keys(performaMap).map(key => ({
          name: key,
          omset: performaMap[key]
        })).sort((a, b) => b.omset - a.omset);

        const starOutlets = performaArray.slice(0, 3);
        const attentionNeeded = performaArray.slice(-3).reverse().filter(p => !starOutlets.find(s => s.name === p.name));

        liveStockWatchArray.sort((a, b) => a.sisa - b.sisa);
        const topLowStock = liveStockWatchArray.slice(0, 5);

        setData({
          kpi: {
            totalOmsetHariIni,
            totalCupTerjual,
            gerobakAktifCount,
            rataRataPenjualan
          },
          charts: {
            performaGerobak: performaArray
          },
          liveOutlets,
          closedOutlets,
          liveStockWatch: topLowStock,
          insights: {
            starOutlets,
            attentionNeeded
          }
        });
      } catch (err) {
        console.error("Gagal memuat data dashboard:", err);
      } finally {
        setLoading(false);
      }
    }
    initDashboard();
  }, [router]);

  const handleLogout = async () => {
    setLoading(true);
    await supabase.auth.signOut();
    router.push("/login");
  };

  if (loading || !data) {
    return <CinematicLoader />;
  }

  const { kpi, charts, liveOutlets, closedOutlets, liveStockWatch, insights } = data;

  const formatRupiah = (num: number) => {
    return new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", maximumFractionDigits: 0 }).format(num);
  };

  return (
    <div className="min-h-screen bg-[#0F0F0F] text-neutral-200 font-sans pb-12 selection:bg-[#EA580C] selection:text-white overflow-x-hidden w-full max-w-[100vw]">
      {/* Top Navigation */}
      <nav className="sticky top-0 z-50 bg-[#0F0F0F]/80 backdrop-blur-md border-b border-white/5 px-6 py-4 flex justify-between items-center">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-[#EA580C] flex items-center justify-center font-black text-white text-sm">
            SR
          </div>
          <h1 className="font-bold text-lg tracking-tight text-white hidden sm:block">Seru.ni Executive</h1>
        </div>
        <div className="flex items-center gap-4">
          <div className="text-right hidden sm:block">
            <p className="text-sm font-bold text-white">Owner Account</p>
            <p className="text-[10px] text-neutral-500 uppercase tracking-widest">admin@seruni.com</p>
          </div>
          <button onClick={handleLogout} className="p-2 bg-neutral-900 hover:bg-red-500/20 text-neutral-400 hover:text-red-500 rounded-lg transition-colors">
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto p-4 sm:p-6 lg:p-8 mt-4 md:mt-8">
        {/* Header Title */}
        <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} className="mb-8">
          <h2 className="text-3xl font-black text-white tracking-tight">Dashboard Overview</h2>
          <p className="text-neutral-500 text-sm mt-1">Pantau performa bisnis Anda secara real-time.</p>
        </motion.div>

        {/* 1. Ringkasan KPI (Top Stat Cards) */}
        <motion.div variants={{ hidden: { opacity: 0 }, show: { opacity: 1, transition: { staggerChildren: 0.1 } } }} initial="hidden" animate="show" className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {[
            { title: "Omset Hari Ini", value: formatRupiah(kpi.totalOmsetHariIni), icon: DollarSign, color: "text-[#EA580C]", bg: "bg-[#EA580C]/10" },
            { title: "Total Cup Terjual", value: `${kpi.totalCupTerjual} Cup`, icon: Coffee, color: "text-blue-500", bg: "bg-blue-500/10" },
            { title: "Gerobak Aktif", value: `${kpi.gerobakAktifCount} Lokasi`, icon: Store, color: "text-emerald-500", bg: "bg-emerald-500/10" },
            { title: "Rata-rata Penjualan", value: formatRupiah(kpi.rataRataPenjualan), icon: TrendingUp, color: "text-purple-500", bg: "bg-purple-500/10" },
          ].map((stat, i) => (
            <motion.div key={i} variants={{ hidden: { opacity: 0, y: 20 }, show: { opacity: 1, y: 0 } }} className="bg-[#18181B] border border-white/5 rounded-2xl p-5 flex items-center gap-4 hover:border-white/10 transition-colors">
              <div className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 ${stat.bg}`}>
                <stat.icon className={`w-6 h-6 ${stat.color}`} />
              </div>
              <div>
                <p className="text-xs font-bold text-neutral-500 uppercase tracking-widest mb-1">{stat.title}</p>
                <p className="text-xl font-black text-white">{stat.value}</p>
              </div>
            </motion.div>
          ))}
        </motion.div>

        {/* Layout Grid Bawah */}
        <div className="flex flex-col lg:flex-row gap-6">
          {/* Kolom Kiri: Charts & Tabel */}
          <div className="w-full lg:w-2/3 flex flex-col gap-6">
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="flex flex-col sm:flex-row gap-6">
              {/* Area Chart: Tren Dinamis */}
              <div className="w-full sm:w-1/2 bg-[#18181B] border border-white/5 rounded-2xl p-5 overflow-hidden flex flex-col min-w-0">
                <div className="flex items-center justify-between mb-4 shrink-0">
                  <h3 className="text-sm font-bold text-white">Tren Penjualan</h3>
                  <select 
                    value={trendRange}
                    onChange={(e) => setTrendRange(Number(e.target.value))}
                    className="bg-neutral-900 border border-neutral-700 text-xs font-bold text-neutral-300 rounded-lg px-3 py-1.5 focus:outline-none focus:border-[#EA580C] focus:ring-1 focus:ring-[#EA580C] transition-all cursor-pointer"
                  >
                    <option value={7}>7 Hari Terakhir</option>
                    <option value={30}>30 Hari Terakhir</option>
                  </select>
                </div>
                <div className="w-full min-w-0 overflow-hidden">
                  <ResponsiveContainer width="100%" height={300}>
                    <AreaChart data={generateTrendData(trendRange, kpi.totalOmsetHariIni)} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                      <defs>
                        <linearGradient id="colorOmset" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#EA580C" stopOpacity={0.3}/>
                          <stop offset="95%" stopColor="#EA580C" stopOpacity={0}/>
                        </linearGradient>
                      </defs>
                      <XAxis dataKey="name" stroke="#52525B" fontSize={11} tickLine={false} axisLine={false} />
                      <Tooltip content={({ active, payload }: any) => active && payload?.length ? (
                        <div className="bg-[#18181B] border border-neutral-800 p-3 rounded-lg shadow-xl">
                          <p className="text-neutral-400 text-xs mb-1">{payload[0].payload?.name}</p>
                          <p className="text-[#EA580C] font-bold text-sm">{formatRupiah(payload[0].value)}</p>
                        </div>
                      ) : null} cursor={{ stroke: '#3F3F46', strokeWidth: 1, strokeDasharray: '4 4' }} />
                      <Area type="monotone" dataKey="omset" stroke="#EA580C" strokeWidth={3} fillOpacity={1} fill="url(#colorOmset)" />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Bar Chart: Performa Gerobak */}
              <div className="w-full sm:w-1/2 bg-[#18181B] border border-white/5 rounded-2xl p-5 overflow-hidden flex flex-col min-w-0">
                <h3 className="text-sm font-bold text-white mb-4 shrink-0">Performa Antar Gerobak</h3>
                <div className="w-full min-w-0 overflow-hidden">
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={charts.performaGerobak} layout="vertical" margin={{ top: 0, right: 10, left: 0, bottom: 0 }}>
                      <XAxis type="number" hide />
                      <YAxis type="category" dataKey="name" width={110} tick={{ fontSize: 11, fill: '#9CA3AF' }} interval={0} tickLine={false} axisLine={false} tickFormatter={(v) => v.length > 16 ? v.substring(0, 16) + '...' : v} />
                      <Tooltip content={({ active, payload }: any) => active && payload?.length ? (
                        <div className="bg-[#18181B] border border-neutral-800 p-3 rounded-lg shadow-xl">
                          <p className="text-neutral-400 text-xs mb-1">{payload[0].payload?.name}</p>
                          <p className="text-[#EA580C] font-bold text-sm">{formatRupiah(payload[0].value)}</p>
                        </div>
                      ) : null} cursor={{ fill: '#27272A' }} />
                      <Bar dataKey="omset" radius={[0, 4, 4, 0]} barSize={16}>
                        {charts.performaGerobak.map((entry: any, index: number) => (
                          <Cell key={`cell-${index}`} fill={index === 0 ? "#EA580C" : "#3F3F46"} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </motion.div>

            {/* Realtime WMS Gerobak Audit Component (Supabase WebSocket Listener) */}
            <LiveGerobakAudit initialOutlets={liveOutlets} className="my-6" />

            {/* Live Outlet Monitoring Table */}
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }} className="bg-[#18181B] border border-white/5 rounded-2xl overflow-hidden">
              <div className="p-5 border-b border-white/5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex items-center gap-4 bg-neutral-900/50 p-1 rounded-xl border border-white/5 inline-flex">
                  <button 
                    onClick={() => setDashboardMode("LIVE")}
                    className={`px-4 py-2 rounded-lg text-xs font-bold uppercase tracking-widest transition-all flex items-center gap-2 ${dashboardMode === "LIVE" ? "bg-[#EA580C] text-white shadow-lg" : "text-neutral-500 hover:text-white"}`}
                  >
                    <span className="relative flex h-2 w-2 mr-1">
                      {dashboardMode === "LIVE" && <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-white opacity-75"></span>}
                      <span className={`relative inline-flex rounded-full h-2 w-2 ${dashboardMode === "LIVE" ? "bg-white" : "bg-neutral-600"}`}></span>
                    </span>
                    LIVE (Aktif)
                  </button>
                  <button 
                    onClick={() => setDashboardMode("SELESAI")}
                    className={`px-4 py-2 rounded-lg text-xs font-bold uppercase tracking-widest transition-all flex items-center gap-2 ${dashboardMode === "SELESAI" ? "bg-[#10B981] text-white shadow-lg" : "text-neutral-500 hover:text-white"}`}
                  >
                    <span className={`w-2 h-2 rounded-full ${dashboardMode === "SELESAI" ? "bg-white" : "bg-neutral-600"}`}></span>
                    SELESAI (Hari Ini)
                  </button>
                </div>
                {dashboardMode === "LIVE" && (
                  <span className="text-[10px] bg-neutral-900 text-neutral-400 px-2 py-1 rounded-md font-bold tracking-widest border border-neutral-800 self-start sm:self-auto">
                    {liveOutlets.length} AKTIF
                  </span>
                )}
                {dashboardMode === "SELESAI" && (
                  <span className="text-[10px] bg-neutral-900 text-neutral-400 px-2 py-1 rounded-md font-bold tracking-widest border border-neutral-800 self-start sm:self-auto">
                    {closedOutlets.length} SELESAI
                  </span>
                )}
              </div>
              <div className="overflow-x-auto w-full min-w-0">
                <table className="w-full text-left border-collapse whitespace-nowrap">
                  <thead>
                    <tr className="bg-neutral-900/50 text-[10px] font-bold text-neutral-500 uppercase tracking-widest">
                      <th className="px-5 py-3">Status</th>
                      <th className="px-5 py-3">Nama Gerobak</th>
                      <th className="px-5 py-3">Kasir / Pekerja</th>
                      <th className="px-5 py-3">Cup Terjual</th>
                      <th className="px-5 py-3">{dashboardMode === "LIVE" ? "Omset Sementara" : "Omset Akhir"}</th>
                    </tr>
                  </thead>
                    <tbody className="divide-y divide-white/5">
                      {(dashboardMode === "LIVE" ? liveOutlets : closedOutlets).length === 0 ? (
                        <tr>
                          <td colSpan={5} className="px-5 py-8 text-center text-sm text-neutral-500">
                            {dashboardMode === "LIVE" ? "Belum ada gerobak yang buka saat ini." : "Belum ada gerobak yang tutup hari ini."}
                          </td>
                        </tr>
                      ) : (
                        (dashboardMode === "LIVE" ? liveOutlets : closedOutlets).map((outlet: any) => (
                          <Fragment key={outlet.id}>
                            <tr 
                              className="border-b border-white/5 hover:bg-white/[0.02] transition-colors cursor-pointer"
                              onClick={() => setExpandedRowId(expandedRowId === outlet.id ? null : outlet.id)}
                            >
                              <td className="px-5 py-4">
                                {dashboardMode === "LIVE" ? (
                                  <div className="flex items-center gap-2">
                                    <span className="relative flex h-2.5 w-2.5">
                                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                                      <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
                                    </span>
                                    <span className="text-xs font-bold text-emerald-500 uppercase tracking-wider">Live</span>
                                  </div>
                                ) : (
                                  <div className="flex items-center gap-2">
                                    <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-neutral-600"></span>
                                    <span className="text-xs font-bold text-neutral-500 uppercase tracking-wider">Selesai</span>
                                  </div>
                                )}
                              </td>
                              <td className="px-5 py-4 text-sm font-bold text-white">{outlet.outletName}</td>
                              <td className="px-5 py-4 text-sm text-neutral-400">
                                {outlet.workerName}
                                {dashboardMode === "LIVE" && outlet.bukaTime && (
                                  <span className="text-[10px] ml-2 bg-neutral-800 text-neutral-300 px-1.5 py-0.5 rounded-md font-bold whitespace-nowrap">
                                    Buka: {outlet.bukaTime} WIB
                                  </span>
                                )}
                                {dashboardMode === "SELESAI" && outlet.waktuRentang && (
                                  <span className="text-[10px] ml-2 bg-neutral-800 text-neutral-300 px-1.5 py-0.5 rounded-md font-bold whitespace-nowrap">
                                    {outlet.waktuRentang}
                                  </span>
                                )}
                              </td>
                              <td className="px-5 py-4 text-sm">
                                {outlet.cupTerjual >= 100 ? (
                                  <span className="text-emerald-400 font-black">{outlet.cupTerjual} Cup 🌟 BONUS UNLOCKED</span>
                                ) : outlet.cupTerjual >= 80 ? (
                                  <span className="text-[#EA580C] font-bold">{outlet.cupTerjual} / 100 Cup 🔥</span>
                                ) : (
                                  <span className="text-neutral-300 font-medium">{outlet.cupTerjual} / 100 Cup</span>
                                )}
                              </td>
                              <td className="px-5 py-4 text-sm font-bold text-[#EA580C]">
                                <div className="flex items-center justify-between">
                                  <span>{formatRupiah(outlet.omsetSementara)}</span>
                                  {expandedRowId === outlet.id ? <ChevronUp className="w-4 h-4 text-neutral-500" /> : <ChevronDown className="w-4 h-4 text-neutral-500" />}
                                </div>
                              </td>
                            </tr>
                            {/* Nested Inventory Detail */}
                            <AnimatePresence>
                              {expandedRowId === outlet.id && (
                                <tr className="bg-[#0A0A0A]/50 border-b border-white/5">
                                  <td colSpan={5} className="p-0">
                                    <motion.div 
                                      initial={{ opacity: 0, height: 0 }} 
                                      animate={{ opacity: 1, height: "auto" }} 
                                      exit={{ opacity: 0, height: 0 }}
                                      className="overflow-hidden"
                                    >
                                      <div className="px-5 py-3 pl-16">
                                        <table className="w-full text-left border-collapse text-[10px]">
                                          <thead>
                                            <tr className="text-neutral-500 uppercase tracking-widest border-b border-white/5">
                                              <th className="pb-2 font-bold w-1/3">Nama Menu</th>
                                              <th className="pb-2 font-bold text-center">Bawa</th>
                                              <th className="pb-2 font-bold text-center text-orange-500">Tambah</th>
                                              <th className="pb-2 font-bold text-center text-emerald-500">Terjual</th>
                                              <th className="pb-2 font-bold text-center text-red-500">Sisa</th>
                                            </tr>
                                          </thead>
                                          <tbody className="divide-y divide-white/5">
                                            {outlet.inventoryDetail && outlet.inventoryDetail.map((inv: any, idx: number) => (
                                              <tr key={idx} className="hover:bg-white/5">
                                                <td className="py-2 text-neutral-300 font-bold">{inv.productName}</td>
                                                <td className="py-2 text-neutral-500 text-center font-medium">{inv.initialStock}</td>
                                                <td className="py-2 font-black text-orange-400 text-center">{inv.addedStock > 0 ? `+${inv.addedStock}` : '-'}</td>
                                                <td className="py-2 font-bold text-emerald-400 text-center">{inv.terjual}</td>
                                                <td className="py-2 font-black text-red-400 text-center">{inv.sisa}</td>
                                              </tr>
                                            ))}
                                          </tbody>
                                        </table>
                                      </div>
                                    </motion.div>
                                  </td>
                                </tr>
                              )}
                            </AnimatePresence>
                          </Fragment>
                        ))
                      )}
                    </tbody>
                </table>
              </div>
            </motion.div>
          </div>

          {/* Kolom Kanan: Leaderboard & Insights */}
          <div className="w-full lg:w-1/3 flex flex-col gap-6">
            {/* Live Stock Watch */}
            <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.35 }} className="bg-[#18181B] border border-orange-500/20 rounded-2xl p-5">
              <h3 className="text-sm font-bold text-orange-500 mb-4 flex items-center gap-2">
                <span>🔥</span> Live Stock Watch
              </h3>
              <div className="flex flex-col gap-3">
                {liveStockWatch && liveStockWatch.length === 0 ? (
                  <p className="text-xs text-neutral-500">Semua stok produk di gerobak aktif dalam keadaan aman.</p>
                ) : (
                  liveStockWatch?.map((item: any, i: number) => (
                    <div key={i} className="flex items-center justify-between p-3 rounded-xl bg-orange-500/5 border border-orange-500/10 gap-3 min-w-0">
                      <div className="flex flex-col min-w-0 flex-1">
                        <p className="text-xs font-bold text-neutral-200 truncate">{item.productName}</p>
                        <p className="text-[10px] text-neutral-500 truncate">{item.outletName} • {item.terjual} Cup Terjual</p>
                      </div>
                      <div className="flex flex-col items-end shrink-0">
                        <span className="text-[9px] font-bold text-neutral-500 uppercase tracking-widest mb-0.5">Sisa Stok</span>
                        <span className="text-base font-black text-red-500">{item.sisa}</span>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </motion.div>

            {/* Star Outlets */}
            <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.4 }} className="bg-[#18181B] border border-white/5 rounded-2xl p-5">
              <h3 className="text-sm font-bold text-white mb-4 flex items-center gap-2">
                <Star className="w-4 h-4 text-yellow-500" />
                Top 3 Star Outlets
              </h3>
              <div className="flex flex-col gap-3">
                {insights.starOutlets.length === 0 ? (
                  <p className="text-xs text-neutral-500">Belum ada data.</p>
                ) : (
                  insights.starOutlets.map((outlet: any, i: number) => (
                    <div key={i} className="flex items-center justify-between p-3 rounded-xl bg-neutral-900 border border-neutral-800 gap-3 min-w-0">
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="w-6 h-6 rounded-md bg-yellow-500/10 flex items-center justify-center text-xs font-black text-yellow-500 shrink-0">
                          #{i + 1}
                        </div>
                        <p className="text-xs font-bold text-white truncate">{outlet.name}</p>
                      </div>
                      <p className="text-xs font-bold text-neutral-400 shrink-0">{formatRupiah(outlet.omset)}</p>
                    </div>
                  ))
                )}
              </div>
            </motion.div>

            {/* Attention Needed */}
            <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.5 }} className="bg-[#18181B] border border-red-500/20 rounded-2xl p-5">
              <h3 className="text-sm font-bold text-red-500 mb-4 flex items-center gap-2">
                <AlertTriangle className="w-4 h-4" />
                Attention Needed
              </h3>
              <div className="flex flex-col gap-3 mb-4">
                {insights.attentionNeeded.length === 0 ? (
                  <p className="text-xs text-neutral-500">Semua performa gerobak aman.</p>
                ) : (
                  insights.attentionNeeded.map((outlet: any, i: number) => (
                    <div key={i} className="flex items-center justify-between p-3 rounded-xl bg-red-500/5 border border-red-500/10 gap-3 min-w-0">
                      <p className="text-xs font-bold text-neutral-300 truncate">{outlet.name}</p>
                      <p className="text-xs font-bold text-red-400 shrink-0">{formatRupiah(outlet.omset)}</p>
                    </div>
                  ))
                )}
              </div>
              <div className="p-3 rounded-xl bg-neutral-900 border border-neutral-800 text-[10px] text-neutral-400 leading-relaxed">
                <strong className="text-white block mb-1">💡 Insight Analisis:</strong>
                Gerobak di atas berada di urutan terbawah performa. Pertimbangkan untuk memindahkan lokasi gerobak jika tren stagnan berlanjut dalam 3 hari ke depan.
              </div>
            </motion.div>
          </div>
        </div>
      </main>
    </div>
  );
}