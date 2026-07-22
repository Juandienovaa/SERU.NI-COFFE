"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { 
  Package, 
  MapPin, 
  Clock, 
  CheckCircle2, 
  CreditCard,
  ChefHat,
  Bike,
  Home,
  MessageCircle,
  Phone
} from "lucide-react";
import { motion } from "framer-motion";

const STATUS_STAGES = [
  { id: 'PENDING_PAYMENT', label: 'Menunggu Pembayaran', icon: CreditCard, description: 'Selesaikan pembayaran Anda.' },
  { id: 'PAID', label: 'Pembayaran Diterima', icon: CheckCircle2, description: 'Pembayaran berhasil dikonfirmasi.' },
  { id: 'CONFIRMED', label: 'Pesanan Dikonfirmasi', icon: Package, description: 'Kasir telah menerima pesanan Anda.' },
  { id: 'PREPARING', label: 'Sedang Disiapkan', icon: ChefHat, description: 'Barista kami sedang menyiapkan pesanan.' },
  { id: 'READY_FOR_DELIVERY', label: 'Menunggu Kurir', icon: Package, description: 'Pesanan siap diantar.' },
  { id: 'ON_DELIVERY', label: 'Dalam Perjalanan', icon: Bike, description: 'Kurir sedang mengantar ke lokasi Anda.' },
  { id: 'DELIVERED', label: 'Selesai', icon: Home, description: 'Pesanan telah diterima.' },
];

export default function TrackingPage() {
  const router = useRouter();
  const [order, setOrder] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const trackingId = sessionStorage.getItem("current_tracking_id");
    if (!trackingId) {
      router.replace("/menu-online");
      return;
    }

    const fetchOrder = async () => {
      const { data, error } = await supabase
        .from("online_orders")
        .select("*, online_order_items(*)")
        .eq("id", trackingId)
        .single();
        
      if (data) setOrder(data);
      setLoading(false);
    };

    fetchOrder();

    const channel = supabase.channel('public:online_orders')
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'online_orders', filter: `id=eq.${trackingId}` }, (payload) => {
        setOrder((prev: any) => ({ ...prev, ...payload.new }));
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [router]);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#09090B] flex items-center justify-center">
        <div className="w-10 h-10 border-4 border-white/10 border-t-orange-500 rounded-full animate-spin" />
      </div>
    );
  }

  if (!order) return null;

  const currentStageIndex = STATUS_STAGES.findIndex(s => s.id === order.order_status);
  
  // Format dates
  const orderDate = new Date(order.created_at).toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
  const orderTime = new Date(order.created_at).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' });

  return (
    <div className="min-h-screen bg-[#09090B] pb-24 selection:bg-orange-500/30">
      
      {/* Decorative Background */}
      <div className="fixed top-0 left-0 w-full h-64 bg-gradient-to-b from-orange-500/10 to-transparent pointer-events-none" />
      
      <header className="sticky top-0 z-50 bg-[#09090B]/80 backdrop-blur-xl border-b border-white/5">
        <div className="max-w-3xl mx-auto px-6 h-20 flex items-center justify-center">
          <div className="flex flex-col items-center">
            <h1 className="text-white font-bold tracking-wide">Live Tracking</h1>
            <p className="text-xs text-orange-400 font-medium">{order.invoice_number}</p>
          </div>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-6 py-8 space-y-6 relative z-10">
        
        {/* Estimated Arrival Box */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
          className="bg-gradient-to-r from-orange-500 to-orange-600 rounded-3xl p-6 shadow-[0_10px_40px_rgba(249,115,22,0.3)] text-white flex flex-col sm:flex-row items-center justify-between gap-6"
        >
          <div>
            <p className="text-white/80 text-sm font-medium mb-1">Estimasi Tiba</p>
            <p className="text-3xl font-black">{currentStageIndex >= 6 ? 'Tiba' : '15 - 25 Menit'}</p>
          </div>
          <div className="w-16 h-16 bg-white/20 rounded-2xl flex items-center justify-center backdrop-blur-md">
            <Clock className="w-8 h-8 text-white" />
          </div>
        </motion.div>

        {/* Tracking Timeline */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
          className="bg-[#121217]/80 backdrop-blur-md border border-white/5 rounded-3xl p-6 md:p-8"
        >
          <h2 className="text-lg font-bold text-white mb-8">Status Pesanan</h2>
          
          <div className="space-y-8 relative">
            {/* Progress Line Background */}
            <div className="absolute top-4 bottom-4 left-6 w-px bg-white/10" />
            
            {/* Active Progress Line */}
            <div 
              className="absolute top-4 left-6 w-px bg-orange-500 transition-all duration-1000 ease-out shadow-[0_0_10px_#f97316]" 
              style={{ height: `${Math.max(0, (currentStageIndex / (STATUS_STAGES.length - 1)) * 100)}%` }}
            />

            {STATUS_STAGES.map((stage, idx) => {
              const isActive = idx <= currentStageIndex;
              const isCurrent = idx === currentStageIndex;
              const Icon = stage.icon;

              return (
                <div key={stage.id} className="relative flex gap-6 z-10">
                  <div className={`w-12 h-12 shrink-0 rounded-full flex items-center justify-center border-4 border-[#121217] transition-all duration-500 ${
                    isActive ? "bg-orange-500 text-white shadow-[0_0_20px_rgba(249,115,22,0.4)]" : "bg-neutral-800 text-neutral-500"
                  }`}>
                    <Icon className="w-5 h-5" />
                  </div>
                  
                  <div className="pt-2">
                    <h3 className={`text-base font-bold transition-colors ${isActive ? "text-white" : "text-neutral-500"}`}>
                      {stage.label}
                    </h3>
                    <p className={`text-sm mt-1 transition-colors ${isActive ? "text-neutral-400" : "text-neutral-600"}`}>
                      {stage.description}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </motion.div>

        {/* Delivery Details */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
          className="bg-[#121217]/80 backdrop-blur-md border border-white/5 rounded-3xl p-6 md:p-8 space-y-6"
        >
          <div className="flex items-center gap-3 mb-2">
            <MapPin className="w-5 h-5 text-orange-500" />
            <h3 className="text-white font-bold">Detail Pengiriman</h3>
          </div>
          
          <div className="bg-black/30 rounded-2xl p-4 border border-white/5">
            <p className="text-white font-medium mb-1">{order.customer_name}</p>
            <p className="text-sm text-neutral-400">{order.customer_phone}</p>
            <div className="h-px w-full bg-white/5 my-3" />
            <p className="text-sm text-neutral-300 leading-relaxed">{order.address}</p>
            {order.notes && (
              <p className="text-xs text-orange-400 mt-3 bg-orange-500/10 p-2 rounded-lg inline-block">Catatan: {order.notes}</p>
            )}
          </div>
          
          {/* Mock Driver Section (Only show if preparing or delivery) */}
          {currentStageIndex >= 3 && (
            <div className="bg-blue-500/10 border border-blue-500/20 rounded-2xl p-4 flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-black/40 rounded-full flex items-center justify-center">
                  <span className="text-xl">🛵</span>
                </div>
                <div>
                  <p className="text-white font-bold text-sm">Budi Kurir</p>
                  <p className="text-xs text-neutral-400">BM 1234 XY</p>
                </div>
              </div>
              <div className="flex gap-2">
                <button className="w-10 h-10 rounded-full bg-blue-500/20 text-blue-400 flex items-center justify-center hover:bg-blue-500/30 transition-colors">
                  <MessageCircle className="w-4 h-4" />
                </button>
                <button className="w-10 h-10 rounded-full bg-blue-500/20 text-blue-400 flex items-center justify-center hover:bg-blue-500/30 transition-colors">
                  <Phone className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}
        </motion.div>

      </main>
    </div>
  );
}
