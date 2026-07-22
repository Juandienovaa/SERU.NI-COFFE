"use client";

import React, { useEffect, useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { useRealtimeOrders } from "@/hooks/useRealtimeOrders";
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
  Phone,
  X
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import confetti from "canvas-confetti";

const STATUS_STAGES = [
  { id: 'WAITING_PAYMENT', label: 'Menunggu Pembayaran', icon: CreditCard, description: 'Selesaikan pembayaran Anda.' },
  { id: 'WAITING_CONFIRMATION', label: 'Menunggu Konfirmasi', icon: CheckCircle2, description: 'Pembayaran berhasil, menunggu verifikasi kasir.' },
  { id: 'PROCESSING', label: 'Pesanan Dikonfirmasi', icon: CheckCircle2, description: 'Kasir telah memverifikasi pembayaran.' },
  { id: 'PREPARING', label: 'Sedang Disiapkan', icon: ChefHat, description: 'Barista kami sedang menyiapkan pesanan.' },
  { id: 'READY_FOR_DELIVERY', label: 'Menunggu Kurir', icon: Package, description: 'Pesanan siap diantar.' },
  { id: 'ON_THE_WAY', label: 'Dalam Perjalanan', icon: Bike, description: 'Kurir sedang mengantar ke lokasi Anda.' },
  { id: 'COMPLETED', label: 'Selesai', icon: Home, description: 'Pesanan telah diterima.' },
];

export default function TrackingPage() {
  const router = useRouter();
  const [trackingId, setTrackingId] = useState<string | null>(null);
  
  // States for Completion Experience
  const [showPopup, setShowPopup] = useState(false);
  const [hasShownCompletion, setHasShownCompletion] = useState(false);

  useEffect(() => {
    const tid = sessionStorage.getItem("current_tracking_id");
    if (!tid) {
      router.replace("/menu-online");
    } else {
      setTrackingId(tid);
    }
  }, [router]);

  const realtimeOptions = useMemo(() => {
    return trackingId ? { filter: `id=eq.${trackingId}` } : undefined;
  }, [trackingId]);

  const { orders, loading } = useRealtimeOrders(realtimeOptions);

  const order = orders[0];
  
  const isCompleted = order?.order_status === 'COMPLETED';

  // Completion Effect
  useEffect(() => {
    if (isCompleted && !hasShownCompletion) {
      setHasShownCompletion(true);
      setShowPopup(true);
      
      // Fire subtle premium confetti
      const duration = 2000;
      const end = Date.now() + duration;

      const frame = () => {
        confetti({
          particleCount: 3,
          angle: 60,
          spread: 55,
          origin: { x: 0 },
          colors: ['#F97316', '#FFFFFF', '#10B981'] // Orange, White, Emerald
        });
        confetti({
          particleCount: 3,
          angle: 120,
          spread: 55,
          origin: { x: 1 },
          colors: ['#F97316', '#FFFFFF', '#10B981']
        });

        if (Date.now() < end) {
          requestAnimationFrame(frame);
        }
      };
      frame();

      // Auto hide popup after 6 seconds
      const timer = setTimeout(() => {
        setShowPopup(false);
      }, 6000);
      return () => clearTimeout(timer);
    }
  }, [isCompleted, hasShownCompletion]);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#09090B] flex items-center justify-center">
        <div className="w-10 h-10 border-4 border-white/10 border-t-orange-500 rounded-full animate-spin" />
      </div>
    );
  }

  if (!order) return null;

  const currentStageIndex = STATUS_STAGES.findIndex(s => s.id === order.order_status);
  
  const getETA = (idx: number) => {
    if (idx <= 1) return "20 - 30 Menit";
    if (idx === 2) return "15 - 20 Menit";
    if (idx === 3) return "10 - 15 Menit";
    if (idx === 4) return "5 - 10 Menit";
    if (idx === 5) return "± 5 Menit";
    return "Tiba";
  };
  
  const formatRp = (amount: number) => {
    return new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", minimumFractionDigits: 0 }).format(amount);
  };

  return (
    <div className="min-h-screen bg-[#09090B] pb-24 selection:bg-orange-500/30">
      
      {/* Decorative Background */}
      <div className={`fixed top-0 left-0 w-full h-64 bg-gradient-to-b ${isCompleted ? 'from-emerald-500/10' : 'from-orange-500/10'} to-transparent pointer-events-none transition-colors duration-1000`} />
      
      <header className="sticky top-0 z-50 bg-[#09090B]/80 backdrop-blur-xl border-b border-white/5 transition-colors duration-1000">
        <div className="max-w-3xl mx-auto px-6 h-20 flex items-center justify-center">
          <div className="flex flex-col items-center">
            <h1 className="text-white font-bold tracking-wide">Live Tracking</h1>
            <p className={`text-xs font-medium ${isCompleted ? 'text-emerald-400' : 'text-orange-400'}`}>{order.invoice_number}</p>
          </div>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-6 py-8 space-y-6 relative z-10">
        
        {/* Estimated Arrival Box OR Completion Box */}
        <AnimatePresence mode="wait">
          {!isCompleted ? (
            <motion.div 
              key="eta-box"
              initial={{ opacity: 0, y: 20 }} 
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20, scale: 0.95 }}
              className="bg-gradient-to-r from-orange-500 to-orange-600 rounded-3xl p-6 shadow-[0_10px_40px_rgba(249,115,22,0.3)] text-white flex flex-col sm:flex-row items-center justify-between gap-6"
            >
              <div>
                <p className="text-white/80 text-sm font-medium mb-1">Estimasi Tiba</p>
                <motion.p 
                  key={currentStageIndex} 
                  initial={{ opacity: 0, y: -10 }} 
                  animate={{ opacity: 1, y: 0 }} 
                  className="text-3xl font-black"
                >
                  {getETA(currentStageIndex)}
                </motion.p>
              </div>
              <div className="w-16 h-16 bg-white/20 rounded-2xl flex items-center justify-center backdrop-blur-md">
                <Clock className="w-8 h-8 text-white" />
              </div>
            </motion.div>
          ) : (
            <motion.div 
              key="completed-box"
              initial={{ opacity: 0, scale: 0.9, y: 20 }} 
              animate={{ opacity: 1, scale: 1, y: 0 }}
              transition={{ type: "spring", stiffness: 300, damping: 20 }}
              className="bg-gradient-to-r from-emerald-500 to-emerald-600 rounded-3xl p-8 shadow-[0_10px_40px_rgba(16,185,129,0.3)] text-white flex flex-col items-center text-center gap-4 relative overflow-hidden"
            >
              <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full blur-3xl -mr-32 -mt-32" />
              <div className="w-20 h-20 bg-white/20 rounded-full flex items-center justify-center backdrop-blur-md shadow-inner mb-2">
                <CheckCircle2 className="w-10 h-10 text-white" />
              </div>
              <div>
                <h2 className="text-3xl font-black mb-1">Pesanan Selesai</h2>
                <p className="text-white/90 font-medium">Terima kasih telah memilih Seru.ni Coffee</p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Tracking Timeline (Only show if not completed) */}
        <AnimatePresence>
          {!isCompleted && (
            <motion.div 
              initial={{ opacity: 0, height: 0 }} 
              animate={{ opacity: 1, height: 'auto' }} 
              exit={{ opacity: 0, height: 0, overflow: 'hidden' }}
              transition={{ duration: 0.5 }}
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
                      } ${isCurrent ? "animate-pulse" : ""}`}>
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
          )}
        </AnimatePresence>

        {/* Delivery Details */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
          className="bg-[#121217]/80 backdrop-blur-md border border-white/5 rounded-3xl p-6 md:p-8 space-y-6"
        >
          <div className="flex items-center gap-3 mb-2">
            <MapPin className={`w-5 h-5 ${isCompleted ? 'text-emerald-500' : 'text-orange-500'} transition-colors`} />
            <h3 className="text-white font-bold">Detail Pengiriman</h3>
          </div>
          
          <div className="bg-black/30 rounded-2xl p-4 border border-white/5">
            <p className="text-white font-medium mb-1">{order.customer_name}</p>
            <p className="text-sm text-neutral-400">{order.customer_phone}</p>
            <div className="h-px w-full bg-white/5 my-3" />
            <p className="text-sm text-neutral-300 leading-relaxed">{order.address}</p>
            {order.notes && (
              <p className={`text-xs mt-3 p-2 rounded-lg inline-block ${isCompleted ? 'text-emerald-400 bg-emerald-500/10' : 'text-orange-400 bg-orange-500/10'}`}>
                Catatan: {order.notes}
              </p>
            )}
          </div>
          
          {/* Mock Driver Section (Only show if preparing or delivery, hide if completed) */}
          {!isCompleted && currentStageIndex >= 3 && (
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

          {isCompleted && (
             <div className="bg-black/30 rounded-2xl p-4 border border-white/5 flex justify-between items-center">
               <span className="text-neutral-400 text-sm">Total Pembayaran</span>
               <span className="text-white font-bold text-lg">{formatRp(order.grand_total || 0)}</span>
             </div>
          )}
        </motion.div>

      </main>

      {/* Premium Success Popup */}
      <AnimatePresence>
        {showPopup && (
          <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }} 
              animate={{ opacity: 1 }} 
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-black/40 backdrop-blur-sm"
              onClick={() => setShowPopup(false)}
            />
            <motion.div 
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 20 }}
              className="relative bg-[#111111] border border-white/10 p-8 rounded-[2rem] w-full max-w-sm shadow-2xl overflow-hidden text-center"
            >
              <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-emerald-500 to-teal-500" />
              
              <button 
                onClick={() => setShowPopup(false)}
                className="absolute top-4 right-4 text-neutral-500 hover:text-white transition-colors"
              >
                <X className="w-5 h-5" />
              </button>

              <div className="w-20 h-20 mx-auto bg-gradient-to-br from-emerald-400/20 to-emerald-600/20 rounded-full flex items-center justify-center mb-6">
                <CheckCircle2 className="w-10 h-10 text-emerald-500" />
              </div>
              
              <h3 className="text-2xl font-black text-white tracking-tight mb-3">
                🎉 Pesanan Selesai
              </h3>
              
              <div className="text-neutral-400 text-sm leading-relaxed mb-8 space-y-2">
                <p>Terima kasih telah menikmati Seru.ni Coffee.</p>
                <p>Kepuasan Anda adalah prioritas kami.</p>
                <p>Semoga hari Anda semakin menyenangkan bersama secangkir kopi terbaik dari Seru.ni.</p>
                <p>Sampai jumpa di pesanan berikutnya! ☕</p>
              </div>

              <div className="space-y-3">
                <button 
                  onClick={() => router.push("/menu-online")}
                  className="w-full bg-orange-500 hover:bg-orange-600 text-white py-3.5 rounded-xl font-bold transition-colors shadow-[0_0_20px_rgba(249,115,22,0.3)]"
                >
                  Pesan Lagi
                </button>
                <button 
                  onClick={() => setShowPopup(false)}
                  className="w-full bg-white/5 hover:bg-white/10 text-white py-3.5 rounded-xl font-bold transition-colors"
                >
                  Tutup
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
