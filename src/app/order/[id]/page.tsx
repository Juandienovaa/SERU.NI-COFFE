"use client";

import React, { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { Loader2, CheckCircle2, Clock, AlertTriangle, QrCode, ArrowLeft, MapPin, Package, Car, ThumbsUp, Receipt, Coffee } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import Link from "next/link";

function formatRupiah(amount: number) {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    minimumFractionDigits: 0,
  }).format(amount);
}

export default function PaymentPage() {
  const params = useParams();
  const [order, setOrder] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [confirming, setConfirming] = useState(false);

  useEffect(() => {
    if (!params.id) return;
    
    async function fetchOrder() {
      const { data, error } = await supabase
        .from("online_orders")
        .select("*, online_order_items(*)")
        .eq("id", params.id)
        .single();
        
      if (!error && data) {
        setOrder(data);
      }
      setLoading(false);
    }
    
    fetchOrder();

    // Supabase Realtime Subscription
    const channel = supabase
      .channel(`order-${params.id}`)
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'online_orders', filter: `id=eq.${params.id}` },
        (payload) => {
          setOrder((prev: any) => ({ ...prev, ...payload.new }));
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [params.id]);

  const handleKonfirmasi = async () => {
    if (!order) return;
    setConfirming(true);
    
    await supabase
      .from("online_orders")
      .update({ payment_status: 'WAITING_CONFIRMATION' })
      .eq("id", order.id);
      
    setConfirming(false);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#09090B] flex flex-col items-center justify-center">
        <Loader2 className="w-8 h-8 text-orange-500 animate-spin mb-4" />
        <p className="text-neutral-500 font-mono text-sm tracking-widest">MEMUAT TIKET PESANAN...</p>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="min-h-screen bg-[#09090B] flex flex-col items-center justify-center text-center px-6">
        <AlertTriangle className="w-12 h-12 text-red-500 mb-4" />
        <h2 className="text-xl font-black text-white mb-2">Pesanan Tidak Ditemukan</h2>
        <p className="text-neutral-400 text-sm mb-6">ID pesanan tidak valid atau telah dihapus.</p>
        <Link href="/order" className="text-orange-500 font-bold text-sm bg-orange-500/10 px-6 py-3 rounded-full">Kembali ke Menu</Link>
      </div>
    );
  }

  const isDelivered = order.order_status === 'COMPLETED' || order.order_status === 'DELIVERED';
  const isOnTheWay = order.order_status === 'ON_THE_WAY';
  const isReady = order.order_status === 'READY_FOR_DELIVERY';
  const isProcessing = order.order_status === 'PROCESSING' || order.order_status === 'PREPARING';

  return (
    <div className="min-h-screen bg-[#09090B] text-white font-sans selection:bg-orange-500/30 selection:text-orange-200 flex flex-col">
      
      {/* Header */}
      <header className="px-6 py-6 sticky top-0 z-40 bg-[#09090B]/80 backdrop-blur-md">
        <div className="max-w-md mx-auto flex items-center justify-between">
          <Link href="/order" className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center hover:bg-white/10 transition-colors">
            <ArrowLeft className="w-5 h-5 text-white" />
          </Link>
          <div className="flex items-center gap-2">
            <Coffee className="w-5 h-5 text-orange-500" />
            <span className="font-black tracking-tight text-lg">Seru.ni</span>
          </div>
          <div className="w-10 h-10" /> {/* Spacer */}
        </div>
      </header>

      <main className="flex-1 max-w-md mx-auto w-full px-6 py-4 pb-20">
        
        <AnimatePresence mode="wait">
          {/* APPLE WALLET / GOFOOD TICKET STYLE */}
          <motion.div 
            key="ticket"
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ type: "spring", damping: 25, stiffness: 300 }}
            className="w-full relative filter drop-shadow-2xl"
          >
            {/* TICKET TOP SECTION */}
            <div className={`bg-[#111111] rounded-t-[32px] p-8 pt-10 flex flex-col items-center relative overflow-hidden transition-colors duration-500 border-x border-t border-white/10 ${order.payment_status === 'PAID' ? 'bg-gradient-to-b from-[#111111] to-[#151515]' : ''}`}>
              
              {/* Dynamic Header based on Status */}
              {order.payment_status === 'WAITING_PAYMENT' && (
                <>
                  <div className="w-16 h-16 rounded-full bg-orange-500/10 flex items-center justify-center mb-6 border border-orange-500/20">
                    <Receipt className="w-8 h-8 text-orange-500" />
                  </div>
                  <span className="text-xs font-bold text-neutral-400 uppercase tracking-widest mb-1">Total Tagihan</span>
                  <div className="text-4xl font-black text-white mb-2">{formatRupiah(order.grand_total)}</div>
                  <span className="text-xs font-bold text-orange-500 bg-orange-500/10 px-3 py-1 rounded-full mb-8">Scan QRIS dibawah</span>
                  
                  <div className="w-56 h-56 bg-white rounded-3xl mb-4 p-4 shadow-[0_0_40px_rgba(255,255,255,0.1)] relative group">
                    {/* Simulated QR Code (in real life this would be an image/SVG from Midtrans/Xendit) */}
                    <div className="w-full h-full border-4 border-dashed border-neutral-300 rounded-2xl flex flex-col items-center justify-center bg-neutral-50 relative overflow-hidden">
                      <QrCode className="w-16 h-16 text-neutral-400 mb-2" />
                      <span className="text-xs font-black text-neutral-400 uppercase tracking-widest">QRIS PAYMENT</span>
                      {/* Scanning Animation */}
                      <div className="absolute inset-x-0 h-0.5 bg-orange-500/50 shadow-[0_0_10px_#ea580c] top-0 group-hover:animate-scan" />
                    </div>
                  </div>
                </>
              )}

              {order.payment_status === 'WAITING_CONFIRMATION' && (
                <>
                  <div className="w-20 h-20 rounded-full bg-orange-500/10 flex items-center justify-center mb-6 border border-orange-500/20">
                    <Clock className="w-10 h-10 text-orange-500 animate-pulse" />
                  </div>
                  <h2 className="text-2xl font-black text-white mb-2">Memverifikasi</h2>
                  <p className="text-neutral-400 text-sm text-center px-4">Kasir sedang mengecek mutasi pembayaran Anda secara otomatis.</p>
                </>
              )}

              {order.payment_status === 'PAID' && (
                <>
                  <div className="w-20 h-20 rounded-full bg-emerald-500/10 flex items-center justify-center mb-6 border border-emerald-500/20">
                    <CheckCircle2 className="w-10 h-10 text-emerald-500" />
                  </div>
                  <h2 className="text-2xl font-black text-white mb-2 text-center leading-tight">
                    {isDelivered ? 'Pesanan Selesai' : isOnTheWay ? 'Kurir Dalam Perjalanan' : isReady ? 'Siap Diambil' : isProcessing ? 'Sedang Disiapkan' : 'Pembayaran Berhasil'}
                  </h2>
                  <p className="text-neutral-400 text-sm text-center px-4">
                    {isDelivered ? 'Terima kasih telah memesan di Seru.ni' : isOnTheWay ? 'Siap-siap, pesanan segera tiba!' : isReady ? 'Tunjukkan tiket ini kepada kasir.' : isProcessing ? 'Barista kami sedang meracik pesanan Anda.' : 'Pesanan Anda telah masuk antrean.'}
                  </p>
                </>
              )}

            </div>

            {/* SCALLOPED DIVIDER (APPLE WALLET STYLE) */}
            <div className="relative flex items-center w-full bg-[#111111] border-x border-white/10">
              <div className="absolute -left-3 w-6 h-6 bg-[#09090B] rounded-full border-r border-white/10" />
              <div className="w-full h-px border-t-2 border-dashed border-white/10 mx-6" />
              <div className="absolute -right-3 w-6 h-6 bg-[#09090B] rounded-full border-l border-white/10" />
            </div>

            {/* TICKET BOTTOM SECTION (ORDER DETAILS) */}
            <div className="bg-[#111111] rounded-b-[32px] p-8 border-x border-b border-white/10">
              
              <div className="flex justify-between items-start mb-6">
                <div>
                  <span className="text-[10px] font-bold text-neutral-500 uppercase tracking-widest block mb-1">No. Pesanan</span>
                  <span className="font-mono text-sm font-black text-white">{order.invoice_number}</span>
                </div>
                <div className="text-right">
                  <span className="text-[10px] font-bold text-neutral-500 uppercase tracking-widest block mb-1">Tipe Pesanan</span>
                  <span className="font-bold text-xs bg-white/10 px-2 py-1 rounded text-white">{order.order_type}</span>
                </div>
              </div>

              <div className="mb-6">
                <span className="text-[10px] font-bold text-neutral-500 uppercase tracking-widest block mb-2">Customer</span>
                <div className="flex items-center gap-3 bg-[#1A1A1A] p-3 rounded-xl border border-white/5">
                  <div className="w-8 h-8 rounded-full bg-neutral-800 text-neutral-400 flex items-center justify-center font-bold text-xs">
                    {order.customer_name.charAt(0)}
                  </div>
                  <div>
                    <div className="text-sm font-bold text-white">{order.customer_name}</div>
                    <div className="text-xs text-neutral-400">{order.customer_phone}</div>
                  </div>
                </div>
              </div>

              {order.order_type === 'DELIVERY' && order.address && (
                <div className="mb-6">
                  <span className="text-[10px] font-bold text-neutral-500 uppercase tracking-widest block mb-2">Alamat Pengiriman</span>
                  <div className="bg-[#1A1A1A] p-3 rounded-xl border border-white/5 flex gap-3">
                    <MapPin className="w-4 h-4 text-orange-500 shrink-0 mt-0.5" />
                    <p className="text-xs text-neutral-300 leading-relaxed">{order.address}</p>
                  </div>
                </div>
              )}

              <div className="mb-6">
                <span className="text-[10px] font-bold text-neutral-500 uppercase tracking-widest block mb-2">Ringkasan Pesanan</span>
                <div className="space-y-3">
                  {order.online_order_items?.map((item: any) => (
                    <div key={item.id} className="flex justify-between text-sm">
                      <div className="flex gap-2 text-neutral-300">
                        <span className="font-bold text-white">{item.qty}x</span>
                        <span>{item.product_name}</span>
                      </div>
                      <span className="font-mono text-neutral-400">{formatRupiah(item.subtotal)}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="border-t border-white/10 pt-4 space-y-2">
                <div className="flex justify-between text-xs text-neutral-400">
                  <span>Subtotal</span>
                  <span className="font-mono">{formatRupiah(order.subtotal)}</span>
                </div>
                <div className="flex justify-between text-xs text-neutral-400">
                  <span>Delivery Fee</span>
                  <span className="font-mono text-emerald-400">
                    {order.shipping_fee === 0 ? 'FREE ONGKIR' : formatRupiah(order.shipping_fee || 0)}
                  </span>
                </div>
                <div className="flex justify-between text-sm font-bold text-white pt-2">
                  <span>Total Dibayar</span>
                  <span className="font-mono text-orange-500">{formatRupiah(order.grand_total)}</span>
                </div>
              </div>

            </div>
          </motion.div>
        </AnimatePresence>

        {/* BOTTOM FIXED ACTION BAR */}
        {order.payment_status === 'WAITING_PAYMENT' && (
          <motion.div 
            initial={{ y: 100 }} animate={{ y: 0 }}
            className="fixed bottom-0 left-0 right-0 p-6 bg-gradient-to-t from-[#09090B] via-[#09090B] to-transparent z-50 pointer-events-none flex justify-center"
          >
            <div className="w-full max-w-md pointer-events-auto">
              <button 
                onClick={handleKonfirmasi}
                disabled={confirming}
                className="w-full py-4 rounded-full bg-white text-black font-black text-sm flex items-center justify-center gap-2 hover:scale-105 active:scale-95 transition-transform disabled:opacity-50 shadow-2xl"
              >
                {confirming ? <Loader2 className="w-5 h-5 animate-spin" /> : "Saya Sudah Membayar"}
              </button>
            </div>
          </motion.div>
        )}

      </main>

      <style jsx global>{`
        @keyframes scan {
          0% { top: 0; opacity: 0; }
          10% { opacity: 1; }
          90% { opacity: 1; }
          100% { top: 100%; opacity: 0; }
        }
        .animate-scan {
          animation: scan 2s linear infinite;
        }
      `}</style>
    </div>
  );
}
