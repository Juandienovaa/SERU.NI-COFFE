"use client";

import { useEffect, useState } from "react";
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
  Star, AlertTriangle, Activity, LogOut, Loader2 
} from "lucide-react";
import CinematicLoader from "@/components/CinematicLoader";

export default function AdminDashboard() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<any>(null);

  useEffect(() => {
    async function initDashboard() {
      try {
        // 1. Cek Autentikasi (Hanya admin@seruni.com)
        const { data: { session } } = await supabase.auth.getSession();
        
        // --- UNTUK DEMO & TESTING TANPA LOGIN ---
        // Jika Anda ingin menguji halaman ini tanpa perlu login, comment bagian pengecekan if() di bawah ini:
        if (!session || session.user.email !== "admin@seruni.com") {
          router.push("/login");
          return;
        }

        // 2. Fetch Data Laporan Real-Time dari Supabase
        const startOfDay = new Date();
        startOfDay.setHours(0, 0, 0, 0);
        const endOfDay = new Date();
        endOfDay.setHours(23, 59, 59, 999);

        const { data: shifts, error } = await supabase
          .from('shifts')
          .select('*')
          .gte('created_at', startOfDay.toISOString())
          .lte('created_at', endOfDay.toISOString());

        if (error) throw error;

        let gerobakAktifCount = 0;
        let totalCupTerjual = 0;
        let totalOmsetHariIni = 0;
        const liveOutlets: any[] = [];
        const performaMap: Record<string, number> = {};

        // Helper to get numeric price
        const getPrice = (productId: number) => {
          const p = products.find(prod => prod.id === productId);
          if (!p) return 0;
          return typeof p.price === 'number' ? p.price : parseInt(p.price.replace(/\D/g, '')) || 0;
        };

        shifts?.forEach(shift => {
          const outletName = shift.outlet_id || "Unknown Outlet";
          let shiftCup = 0;
          let shiftOmset = 0;

          if (shift.status === 'OPEN') {
            gerobakAktifCount++;
          }

          if (shift.inventory_data && Array.isArray(shift.inventory_data)) {
            shift.inventory_data.forEach(item => {
              const terjual = item.terjual || 0;
              shiftCup += terjual;
              if (shift.status === 'OPEN') {
                const price = getPrice(item.product_id);
                shiftOmset += terjual * price;
              }
            });
          }
          
          totalCupTerjual += shiftCup;

          if (shift.status === 'CLOSED') {
            shiftOmset = Number(shift.total_sales || 0);
          }
          
          totalOmsetHariIni += shiftOmset;

          if (!performaMap[outletName]) performaMap[outletName] = 0;
          performaMap[outletName] += shiftOmset;

          if (shift.status === 'OPEN') {
            liveOutlets.push({
              id: shift.id,
              outletName: outletName,
              workerName: shift.crew_name || "Crew",
              omsetSementara: shiftOmset
            });
          }
        });

        const rataRataPenjualan = shifts && shifts.length > 0 ? totalOmsetHariIni / shifts.length : 0;

        const performaArray = Object.keys(performaMap).map(key => ({
          name: key,
          omset: performaMap[key]
        })).sort((a, b) => b.omset - a.omset);

        const starOutlets = performaArray.slice(0, 3);
        const attentionNeeded = performaArray.slice(-3).reverse().filter(p => !starOutlets.find(s => s.name === p.name));

        setData({
          kpi: {
            totalOmsetHariIni,
            totalCupTerjual,
            gerobakAktifCount,
            rataRataPenjualan
          },
          charts: {
            trenPenjualan: [
              { name: "H-6", omset: 300000 }, { name: "H-5", omset: 450000 }, { name: "H-4", omset: 380000 },
              { name: "H-3", omset: 520000 }, { name: "H-2", omset: 600000 }, { name: "H-1", omset: 800000 }, { name: "Hr Ini", omset: totalOmsetHariIni }
            ],
            performaGerobak: performaArray
          },
          liveOutlets,
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

  const { kpi, charts, liveOutlets, insights } = data;

  // Format currency
  const formatRupiah = (num: number) => {
    return new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", maximumFractionDigits: 0 }).format(num);
  };

  // Utility potong nama panjang
  const truncateName = (name: string, maxLen = 15) => {
    if (!name) return "";
    if (name.length <= maxLen) return name;
    return name.substring(0, maxLen) + "...";
  };

  // Custom Tooltip untuk Recharts
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const fullLabel = payload[0].payload?.name || label;
      return (
        <div className="bg-[#18181B] border border-neutral-800 p-3 rounded-lg shadow-xl">
          <p className="text-neutral-400 text-xs mb-1">{fullLabel}</p>
          <p className="text-[#EA580C] font-bold text-sm">{formatRupiah(payload[0].value)}</p>
        </div>
      );
    }
    return null;
  };

  // Framer Motion Variants
  const containerVars = {
    hidden: { opacity: 0 },
    show: { opacity: 1, transition: { staggerChildren: 0.1 } }
  };
  const itemVars = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0, transition: { type: "spring" as const, stiffness: 300, damping: 24 } }
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
        <motion.div variants={containerVars} initial="hidden" animate="show" className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {[
            { title: "Omset Hari Ini", value: formatRupiah(kpi.totalOmsetHariIni), icon: DollarSign, color: "text-[#EA580C]", bg: "bg-[#EA580C]/10" },
            { title: "Total Cup Terjual", value: `${kpi.totalCupTerjual} Cup`, icon: Coffee, color: "text-blue-500", bg: "bg-blue-500/10" },
            { title: "Gerobak Aktif", value: `${kpi.gerobakAktifCount} Lokasi`, icon: Store, color: "text-emerald-500", bg: "bg-emerald-500/10" },
            { title: "Rata-rata Penjualan", value: formatRupiah(kpi.rataRataPenjualan), icon: TrendingUp, color: "text-purple-500", bg: "bg-purple-500/10" },
          ].map((stat, i) => (
            <motion.div key={i} variants={itemVars} className="bg-[#18181B] border border-white/5 rounded-2xl p-5 flex items-center gap-4 hover:border-white/10 transition-colors">
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
          
          {/* Kolom Kiri: Charts & Tabel (Lebar 2/3) */}
          <div className="w-full lg:w-2/3 flex flex-col gap-6">
            
            {/* 2. Visualisasi Grafik */}
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="flex flex-col sm:flex-row gap-6">
              
              {/* Area Chart: Tren 7 Hari */}
              <div className="w-full sm:w-1/2 bg-[#18181B] border border-white/5 rounded-2xl p-5 overflow-hidden flex flex-col min-w-0">
                <h3 className="text-sm font-bold text-white mb-4 shrink-0">Tren Penjualan (7 Hari)</h3>
                <div className="w-full min-w-0 overflow-hidden">
                  <ResponsiveContainer width="100%" height={300}>
                    <AreaChart data={charts.trenPenjualan} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                      <defs>
                        <linearGradient id="colorOmset" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#EA580C" stopOpacity={0.3}/>
                          <stop offset="95%" stopColor="#EA580C" stopOpacity={0}/>
                        </linearGradient>
                      </defs>
                      <XAxis dataKey="name" stroke="#52525B" fontSize={11} tickLine={false} axisLine={false} />
                      <Tooltip content={<CustomTooltip />} cursor={{ stroke: '#3F3F46', strokeWidth: 1, strokeDasharray: '4 4' }} />
                      <Area type="monotone" dataKey="omset" stroke="#EA580C" strokeWidth={3} fillOpacity={1} fill="url(#colorOmset)" />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Bar Chart: Performa Gerobak */}
              <div className="w-full sm:w-1/2 bg-[#18181B] border border-white/5 rounded-2xl p-5 overflow-hidden flex flex-col min-w-0">
                <h3 className="text-sm font-bold text-white mb-4 shrink-0">Performa Antar Gerobak</h3>
                <div className="w-full min-w-0 overflow-hidden">
                  <ResponsiveContainer width="100%" height={500}>
                    <BarChart 
                      data={charts.performaGerobak} 
                      layout="vertical" 
                      margin={{ top: 0, right: 10, left: 0, bottom: 0 }}
                    >
                      <XAxis type="number" hide />
                      <YAxis 
                        type="category" 
                        dataKey="name" 
                        width={110} 
                        tick={{ fontSize: 11, fill: '#9CA3AF' }} 
                        interval={0} 
                        tickLine={false} 
                        axisLine={false} 
                        tickFormatter={(value) => value.length > 16 ? value.substring(0, 16) + '...' : value}
                      />
                      <Tooltip content={<CustomTooltip />} cursor={{ fill: '#27272A' }} />
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

            {/* 3. Live Outlet Monitoring */}
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }} className="bg-[#18181B] border border-white/5 rounded-2xl overflow-hidden">
              <div className="p-5 border-b border-white/5 flex items-center justify-between">
                <h3 className="text-sm font-bold text-white flex items-center gap-2">
                  <Activity className="w-4 h-4 text-emerald-500" />
                  Live Outlet Monitoring
                </h3>
                <span className="text-[10px] bg-neutral-900 text-neutral-400 px-2 py-1 rounded-md font-bold tracking-widest border border-neutral-800">
                  {liveOutlets.length} AKTIF
                </span>
              </div>
              <div className="overflow-x-auto w-full min-w-0">
                <table className="w-full text-left border-collapse whitespace-nowrap">
                  <thead>
                    <tr className="bg-neutral-900/50 text-[10px] font-bold text-neutral-500 uppercase tracking-widest">
                      <th className="px-5 py-3">Status</th>
                      <th className="px-5 py-3">Nama Gerobak</th>
                      <th className="px-5 py-3">Kasir / Pekerja</th>
                      <th className="px-5 py-3">Omset Sementara</th>
                    </tr>
                  </thead>
                  <tbody>
                    {liveOutlets.length === 0 ? (
                      <tr>
                        <td colSpan={4} className="px-5 py-8 text-center text-sm text-neutral-500">Belum ada gerobak yang buka saat ini.</td>
                      </tr>
                    ) : (
                      liveOutlets.map((outlet: any) => (
                        <tr key={outlet.id} className="border-b border-white/5 hover:bg-white/[0.02] transition-colors">
                          <td className="px-5 py-4">
                            <div className="flex items-center gap-2">
                              <span className="relative flex h-2.5 w-2.5">
                                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
                              </span>
                              <span className="text-xs font-bold text-emerald-500 uppercase tracking-wider">Live</span>
                            </div>
                          </td>
                          <td className="px-5 py-4 text-sm font-bold text-white">{outlet.outletName}</td>
                          <td className="px-5 py-4 text-sm text-neutral-400">{outlet.workerName}</td>
                          <td className="px-5 py-4 text-sm font-bold text-[#EA580C]">{formatRupiah(outlet.omsetSementara)}</td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </motion.div>

          </div>

          {/* Kolom Kanan: Leaderboard & Insights (Lebar 1/3) */}
          <div className="w-full lg:w-1/3 flex flex-col gap-6">
            
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
