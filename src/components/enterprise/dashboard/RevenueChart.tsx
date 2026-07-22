"use client";

import React, { useState, useEffect, useMemo } from "react";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { Loader2, TrendingUp, DollarSign } from "lucide-react";
import { financialService } from "@/services/financialService";

export default function RevenueChart() {
  const [period, setPeriod] = useState<"month" | "year">("month");
  const [data, setData] = useState<{ month: any; year: any }>({ month: null, year: null });
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      try {
        // Fetch current period if not cached
        if (!data[period]) {
          const res = await financialService.getFinancialData(period);
          setData((prev) => ({ ...prev, [period]: res }));
        }
      } catch (err) {
        console.error("Failed to fetch revenue data:", err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [period, data]);

  const chartData = useMemo(() => {
    const currentData = data[period];
    if (!currentData) return [];

    const groupedMap: Record<string, number> = {};

    // Process Offline Ledger
    (currentData.offlineLedger || []).forEach((item: any) => {
      // item.date is DD/MM/YYYY
      const dateParts = item.date.split("/");
      if (dateParts.length !== 3) return;
      const day = dateParts[0].padStart(2, "0");
      const monthIndex = parseInt(dateParts[1], 10) - 1;
      const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
      const monthStr = months[monthIndex];

      let key = "";
      if (period === "month") {
        key = `${day} ${monthStr}`;
      } else {
        key = monthStr;
      }

      if (!groupedMap[key]) groupedMap[key] = 0;
      groupedMap[key] += (item.cash || 0) + (item.qris || 0);
    });

    // Process Online Ledger
    (currentData.onlineLedger || []).forEach((item: any) => {
      // item.date is also DD/MM/YYYY usually, assuming from financialService
      const dateParts = item.date.split("/");
      if (dateParts.length !== 3) return;
      const day = dateParts[0].padStart(2, "0");
      const monthIndex = parseInt(dateParts[1], 10) - 1;
      const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
      const monthStr = months[monthIndex];

      let key = "";
      if (period === "month") {
        key = `${day} ${monthStr}`;
      } else {
        key = monthStr;
      }

      if (!groupedMap[key]) groupedMap[key] = 0;
      groupedMap[key] += (item.grandTotal || 0);
    });

    // Convert map to array
    const sortedKeys = Object.keys(groupedMap).sort((a, b) => {
      if (period === "month") {
         return parseInt(a.split(" ")[0]) - parseInt(b.split(" ")[0]);
      } else {
         const m = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
         return m.indexOf(a) - m.indexOf(b);
      }
    });

    return sortedKeys.map((key) => ({
      name: key,
      revenue: groupedMap[key],
    }));
  }, [data, period]);

  const totalRevenue = useMemo(() => {
    return chartData.reduce((sum, item) => sum + item.revenue, 0);
  }, [chartData]);

  const formatRupiah = (value: number) => {
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  };

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-[#18181B] border border-white/10 p-4 rounded-2xl shadow-xl shadow-black/50 backdrop-blur-md">
          <p className="text-neutral-400 text-xs font-bold uppercase tracking-wider mb-1">{label}</p>
          <p className="text-emerald-400 text-lg font-black">{formatRupiah(payload[0].value)}</p>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="w-full bg-[#111113] border border-white/[0.05] rounded-[32px] p-6 md:p-8 hover:border-white/[0.1] transition-colors relative overflow-hidden group">
      {/* Glow Effect */}
      <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-emerald-500/5 rounded-full blur-[100px] -mr-64 -mt-64 group-hover:bg-emerald-500/10 transition-all duration-700 pointer-events-none" />

      <div className="relative z-10">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6 mb-10">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-emerald-500/10 flex items-center justify-center">
              <TrendingUp className="w-7 h-7 text-emerald-500" />
            </div>
            <div>
              <h2 className="text-xl md:text-2xl font-black text-white tracking-tight">Tren Pendapatan</h2>
              <p className="text-xs md:text-sm font-bold text-neutral-500 uppercase tracking-widest mt-1">Total: <span className="text-emerald-400">{formatRupiah(totalRevenue)}</span></p>
            </div>
          </div>

          <div className="flex items-center bg-[#18181B] border border-white/5 p-1.5 rounded-2xl">
            <button
              onClick={() => setPeriod("month")}
              disabled={isLoading}
              className={`px-5 py-2.5 rounded-xl text-xs font-bold uppercase tracking-widest transition-all ${
                period === "month"
                  ? "bg-white/10 text-white shadow-sm"
                  : "text-neutral-500 hover:text-white hover:bg-white/5"
              }`}
            >
              Bulan Ini
            </button>
            <button
              onClick={() => setPeriod("year")}
              disabled={isLoading}
              className={`px-5 py-2.5 rounded-xl text-xs font-bold uppercase tracking-widest transition-all ${
                period === "year"
                  ? "bg-white/10 text-white shadow-sm"
                  : "text-neutral-500 hover:text-white hover:bg-white/5"
              }`}
            >
              Tahun Ini
            </button>
          </div>
        </div>

        <div className="w-full h-[350px]">
          {isLoading && !data[period] ? (
            <div className="w-full h-full flex flex-col items-center justify-center text-emerald-500/50">
              <Loader2 className="w-10 h-10 animate-spin mb-4" />
              <p className="text-sm font-bold uppercase tracking-widest">Memuat Data Keuangan...</p>
            </div>
          ) : chartData.length === 0 ? (
            <div className="w-full h-full flex flex-col items-center justify-center text-neutral-600">
              <DollarSign className="w-12 h-12 mb-4 opacity-20" />
              <p className="text-sm font-bold uppercase tracking-widest">Belum ada transaksi</p>
            </div>
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData} margin={{ top: 20, right: 0, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
                <XAxis 
                  dataKey="name" 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fill: "#737373", fontSize: 12, fontWeight: 700 }}
                  dy={10}
                />
                <YAxis 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fill: "#737373", fontSize: 12, fontWeight: 700 }}
                  tickFormatter={(value) => {
                    if (value >= 1000000) return `Rp ${(value / 1000000).toFixed(1)}M`;
                    if (value >= 1000) return `Rp ${(value / 1000).toFixed(0)}K`;
                    return `Rp ${value}`;
                  }}
                  width={80}
                />
                <Tooltip content={<CustomTooltip />} cursor={{ stroke: 'rgba(255,255,255,0.1)', strokeWidth: 1, strokeDasharray: '3 3' }} />
                <Area 
                  type="monotone" 
                  dataKey="revenue" 
                  stroke="#10b981" 
                  strokeWidth={3}
                  fillOpacity={1} 
                  fill="url(#colorRevenue)" 
                  activeDot={{ r: 6, fill: "#10b981", stroke: "#111113", strokeWidth: 4 }}
                />
              </AreaChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>
    </div>
  );
}
