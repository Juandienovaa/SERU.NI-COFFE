"use client";

import React, { useState, useEffect } from "react";
import { ArrowUpRight, Users, Activity, BarChart3, Package, PackageCheck, AlertCircle, Clock, ShoppingBag, Banknote } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { useRealtimeOrders } from "@/hooks/useRealtimeOrders";
import RevenueChart from "@/components/enterprise/dashboard/RevenueChart";

interface DashboardClientProps {
  initialBatches: any[];
  initialRawInventory: { current_stock: number } | null;
  initialFinishedProducts: any[];
  RAW_CUP_PRODUCT_ID: number;
}

export default function DashboardClient({
  initialBatches,
  initialRawInventory,
  initialFinishedProducts,
  RAW_CUP_PRODUCT_ID
}: DashboardClientProps) {
  const [batches, setBatches] = useState(initialBatches || []);
  const [rawInventory, setRawInventory] = useState(initialRawInventory);
  const [finishedProducts, setFinishedProducts] = useState(initialFinishedProducts || []);
  const { orders: onlineOrders } = useRealtimeOrders({ limit: 500 });

  useEffect(() => {
    const fetchFreshData = async () => {
      const [
        { data: newBatches },
        { data: newRawInventory },
        { data: newFinishedProducts }
      ] = await Promise.all([
        supabase.from("production_batches").select("status, raw_cups_given, defect_cups, created_at"),
        supabase.from("product_inventory").select("current_stock").eq("product_id", RAW_CUP_PRODUCT_ID).single(),
        supabase.from("product_inventory").select("current_stock").neq("product_id", RAW_CUP_PRODUCT_ID)
      ]);

      if (newBatches) setBatches(newBatches);
      if (newRawInventory) setRawInventory(newRawInventory);
      if (newFinishedProducts) setFinishedProducts(newFinishedProducts);
    };

    // Subscriptions
    const batchSub = supabase
      .channel('public:production_batches')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'production_batches' }, () => {
        fetchFreshData();
      })
      .subscribe();

    const inventorySub = supabase
      .channel('public:product_inventory')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'product_inventory' }, () => {
        fetchFreshData();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(batchSub);
      supabase.removeChannel(inventorySub);
    };
  }, [RAW_CUP_PRODUCT_ID]);

  // Calculations
  const now = new Date();
  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0).getTime();

  let pendingBatchCount = 0;
  let completedBatchCount = 0;
  let cupAllocatedToday = 0;
  let defectToday = 0;

  batches.forEach(batch => {
    if (batch.status === "PENDING" || batch.status === "PENDING_BARISTA") pendingBatchCount++;
    if (batch.status === "COMPLETED") completedBatchCount++;
    
    const batchTime = batch.created_at ? new Date(batch.created_at).getTime() : 0;
    if (batchTime >= startOfToday) {
      cupAllocatedToday += Number(batch.raw_cups_given) || 0;
      defectToday += Number(batch.defect_cups) || 0;
    }
  });

  const rawCupRemaining = rawInventory?.current_stock || 0;
  const finishedProductTotal = finishedProducts?.reduce((sum, item) => sum + (item.current_stock || 0), 0) || 0;

  let onlineRevenueToday = 0;
  let onlineOrdersToday = 0;
  let waitingOrders = 0;
  let preparingOrders = 0;

  onlineOrders.forEach(order => {
    const orderTime = new Date(order.created_at).getTime();
    if (orderTime >= startOfToday) {
      if (order.payment_status === "PAID") {
        onlineRevenueToday += order.grand_total || 0;
      }
      onlineOrdersToday++;
    }
    
    if (order.order_status === "WAITING_CONFIRMATION" || order.payment_status === "WAITING_CONFIRMATION") {
      waitingOrders++;
    }
    if (order.order_status === "PREPARING" || order.order_status === "PROCESSING") {
      preparingOrders++;
    }
  });

  return (
    <div className="p-8 md:p-12 w-full max-w-7xl mx-auto animate-in fade-in duration-500">
      <header className="mb-12">
        <h1 className="text-3xl md:text-4xl font-black text-white tracking-tight flex items-center gap-3">
          Production Summary
          <span className="flex items-center gap-2 px-2.5 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-[10px] font-bold text-emerald-400 uppercase tracking-widest mt-1">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
            Live Sync
          </span>
        </h1>
        <p className="text-neutral-400 mt-2 text-sm md:text-base max-w-xl leading-relaxed">
          Monitor status alokasi bahan baku, efisiensi produksi (yield), dan jumlah produk jadi secara real-time (Single Source of Truth).
        </p>
      </header>

      {/* Online Orders Stats Grid */}
      <h2 className="text-xl font-bold text-white mb-6">Online Orders Today</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
        <div className="bg-[#111113] border border-white/[0.05] rounded-3xl p-6 hover:border-white/[0.1] transition-colors relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-green-500/10 rounded-full blur-2xl -mr-10 -mt-10" />
          <div className="relative z-10 flex flex-col justify-between h-full">
            <div className="w-10 h-10 rounded-xl bg-green-500/10 flex items-center justify-center mb-6">
              <Banknote className="w-5 h-5 text-green-500" />
            </div>
            <div>
              <p className="text-xs font-bold text-neutral-400 uppercase tracking-widest mb-1">Live Revenue</p>
              <h2 className="text-2xl md:text-3xl font-black text-white tracking-tighter">
                {new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", maximumFractionDigits: 0 }).format(onlineRevenueToday)}
              </h2>
            </div>
          </div>
        </div>

        <div className="bg-[#111113] border border-white/[0.05] rounded-3xl p-6 hover:border-white/[0.1] transition-colors flex flex-col justify-between">
          <div className="w-10 h-10 rounded-xl bg-blue-500/10 flex items-center justify-center mb-6">
            <ShoppingBag className="w-5 h-5 text-blue-500" />
          </div>
          <div>
            <p className="text-xs font-bold text-neutral-400 uppercase tracking-widest mb-1">Total Orders</p>
            <h2 className="text-3xl font-black text-white tracking-tighter">{onlineOrdersToday}</h2>
          </div>
        </div>

        <div className="bg-[#111113] border border-white/[0.05] rounded-3xl p-6 hover:border-white/[0.1] transition-colors flex flex-col justify-between">
          <div className="w-10 h-10 rounded-xl bg-red-500/10 flex items-center justify-center mb-6">
            <AlertCircle className="w-5 h-5 text-red-500" />
          </div>
          <div>
            <p className="text-xs font-bold text-neutral-400 uppercase tracking-widest mb-1">Waiting Confirm</p>
            <h2 className="text-3xl font-black text-white tracking-tighter">{waitingOrders}</h2>
          </div>
        </div>

        <div className="bg-[#111113] border border-white/[0.05] rounded-3xl p-6 hover:border-white/[0.1] transition-colors flex flex-col justify-between">
          <div className="w-10 h-10 rounded-xl bg-amber-500/10 flex items-center justify-center mb-6">
            <Clock className="w-5 h-5 text-amber-500" />
          </div>
          <div>
            <p className="text-xs font-bold text-neutral-400 uppercase tracking-widest mb-1">Preparing</p>
            <h2 className="text-3xl font-black text-white tracking-tighter">{preparingOrders}</h2>
          </div>
        </div>
      </div>

      <h2 className="text-xl font-bold text-white mb-6">Offline / Batch Production</h2>
      {/* Bento Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {/* Card 1: Raw Cup Remaining */}
        <div className="col-span-1 md:col-span-2 lg:col-span-2 bg-[#111113] border border-white/[0.05] rounded-3xl p-8 hover:border-white/[0.1] transition-colors relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-64 h-64 bg-orange-500/10 rounded-full blur-3xl -mr-20 -mt-20 group-hover:bg-orange-500/20 transition-all duration-500" />
          <div className="relative z-10 flex flex-col h-full justify-between">
            <div className="w-12 h-12 rounded-2xl bg-orange-500/10 flex items-center justify-center mb-12">
              <Package className="w-6 h-6 text-orange-500" />
            </div>
            <div>
              <p className="text-sm font-bold text-neutral-400 uppercase tracking-widest mb-1">Raw Cup Remaining</p>
              <div className="flex items-end gap-4">
                <h2 className="text-4xl md:text-5xl font-black text-white tracking-tighter">
                  {new Intl.NumberFormat("id-ID").format(rawCupRemaining)} <span className="text-2xl text-neutral-500 font-bold">Cup</span>
                </h2>
                <span className="flex items-center gap-1 text-orange-400 text-sm font-bold bg-orange-500/10 px-2 py-1 rounded-lg mb-1">
                  Available
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Card 2: Defect Today */}
        <div className="bg-[#111113] border border-white/[0.05] rounded-3xl p-8 hover:border-white/[0.1] transition-colors flex flex-col justify-between">
          <div className="w-12 h-12 rounded-2xl bg-red-500/10 flex items-center justify-center mb-12">
            <AlertCircle className="w-6 h-6 text-red-500" />
          </div>
          <div>
            <p className="text-sm font-bold text-neutral-400 uppercase tracking-widest mb-1">Defect Today</p>
            <h2 className="text-4xl md:text-5xl font-black text-white tracking-tighter">
              {defectToday} <span className="text-xl text-neutral-600">Cup</span>
            </h2>
          </div>
        </div>

        {/* Card 3: Batch Status (Pending vs Completed) */}
        <div className="bg-[#111113] border border-white/[0.05] rounded-3xl p-8 hover:border-white/[0.1] transition-colors flex flex-col justify-between">
          <div className="w-12 h-12 rounded-2xl bg-amber-500/10 flex items-center justify-center mb-12">
            <Clock className="w-6 h-6 text-amber-500" />
          </div>
          <div>
            <p className="text-sm font-bold text-neutral-400 uppercase tracking-widest mb-1">Pending Batch</p>
            <h2 className="text-4xl md:text-5xl font-black text-white tracking-tighter">{pendingBatchCount}</h2>
          </div>
        </div>
        
        {/* Card 4: Finished Product */}
        <div className="bg-[#111113] border border-white/[0.05] rounded-3xl p-8 hover:border-white/[0.1] transition-colors flex flex-col justify-between">
          <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 flex items-center justify-center mb-12">
            <PackageCheck className="w-6 h-6 text-emerald-500" />
          </div>
          <div>
            <p className="text-sm font-bold text-neutral-400 uppercase tracking-widest mb-1">Total Finished Product</p>
            <h2 className="text-4xl md:text-5xl font-black text-white tracking-tighter">{new Intl.NumberFormat("id-ID").format(finishedProductTotal)}</h2>
          </div>
        </div>

        {/* Card 5: Allocated Today */}
        <div className="bg-[#111113] border border-white/[0.05] rounded-3xl p-8 hover:border-white/[0.1] transition-colors flex flex-col justify-between">
          <div className="w-12 h-12 rounded-2xl bg-blue-500/10 flex items-center justify-center mb-12">
            <Activity className="w-6 h-6 text-blue-500" />
          </div>
          <div>
            <p className="text-sm font-bold text-neutral-400 uppercase tracking-widest mb-1">Cup Allocated Today</p>
            <h2 className="text-4xl md:text-5xl font-black text-white tracking-tighter">
              {new Intl.NumberFormat("id-ID").format(cupAllocatedToday)}
            </h2>
          </div>
        </div>
      </div>

      {/* Revenue Chart Section */}
      <div className="mt-8">
        <RevenueChart />
      </div>
    </div>
  );
}
