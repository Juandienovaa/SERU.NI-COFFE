"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { useOnlineCart } from "@/store/useOnlineCart";
import { supabase } from "@/lib/supabase";
import { Loader2 } from "lucide-react";

export default function PaymentPage() {
  const router = useRouter();
  const { items, getTotalItems, getSubtotal, clearCart } = useOnlineCart();
  
  // State untuk hydration fix
  const [isMounted, setIsMounted] = useState(false);
  const [isConfirming, setIsConfirming] = useState(false);
  
  // State untuk timer 5 menit (300 detik)
  const [timeLeft, setTimeLeft] = useState(300);

  // Mencegah hydration mismatch dengan menunggu komponen dimount
  useEffect(() => {
    setIsMounted(true);
  }, []);

  // Kurangi timer setiap detik
  useEffect(() => {
    if (timeLeft <= 0) return;
    
    const timer = setInterval(() => {
      setTimeLeft((prev) => prev - 1);
    }, 1000);

    return () => clearInterval(timer);
  }, [timeLeft]);

  // Format MM:SS
  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60).toString().padStart(2, "0");
    const s = (seconds % 60).toString().padStart(2, "0");
    return `${m}:${s}`;
  };

  const formatRp = (num: number) => {
    return new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", minimumFractionDigits: 0 }).format(num);
  };

  // Logic Perhitungan
  const totalQty = isMounted ? getTotalItems() : 0;
  const subtotal = isMounted ? getSubtotal() : 0;
  const shippingCost = totalQty >= 5 ? 0 : 10000;
  const grandTotal = subtotal + shippingCost;
  
  const isTimeUp = timeLeft === 0;

  const handleConfirmPayment = async () => {
    try {
      setIsConfirming(true);
      const payloadStr = sessionStorage.getItem("current_checkout");
      if (!payloadStr) {
        throw new Error("Data pesanan tidak ditemukan.");
      }
      
      const payload = JSON.parse(payloadStr);
      const invoiceNumber = `INV-${Date.now().toString().slice(-6)}-${Math.floor(Math.random() * 1000)}`;
      
      const { data: orderData, error: orderError } = await supabase.from("online_orders").insert([{
        invoice_number: invoiceNumber,
        customer_name: payload.customer.name,
        customer_phone: payload.customer.phone,
        delivery_address: payload.customer.address,
        latitude: payload.customer.lat ? parseFloat(payload.customer.lat) : null,
        longitude: payload.customer.lng ? parseFloat(payload.customer.lng) : null,
        order_type: 'DELIVERY',
        payment_status: 'PAID',
        order_status: 'WAITING_CONFIRMATION',
        payment_method: 'QRIS',
        subtotal: payload.financial.subtotal,
        delivery_fee: payload.financial.delivery_fee,
        grand_total: payload.financial.total,
        notes: payload.customer.notes
      }]).select("id").single();

      if (orderError) throw orderError;

      const orderItems = items.map(item => ({
        order_id: orderData.id,
        product_id: item.product.product_id,
        product_name: item.product.product_name,
        quantity: item.qty,
        price: item.product.price || 0,
        subtotal: (item.product.price || 0) * item.qty
      }));

      const { error: itemsError } = await supabase.from("online_order_items").insert(orderItems);
      
      if (itemsError) throw itemsError;

      sessionStorage.setItem("current_tracking_id", orderData.id);
      sessionStorage.removeItem("current_checkout");
      clearCart();
      
      router.push("/tracking");
    } catch (error: any) {
      console.error("Order error:", error);
      alert(`Terjadi kesalahan saat memproses pesanan: ${error?.message || JSON.stringify(error)}`);
      setIsConfirming(false);
    }
  };

  // Jangan render UI utama sebelum client terhidrasi sepenuhnya untuk menghindari mismatch
  if (!isMounted) return null;

  return (
    <div className="min-h-screen bg-[#09090B] flex flex-col items-center justify-center p-6 selection:bg-orange-500/30 overflow-hidden relative py-12">
      {/* Background Decor */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-orange-500/10 blur-[120px] rounded-full" />
      </div>

      <div className="w-full max-w-md bg-[#121217]/80 backdrop-blur-xl border border-white/10 rounded-3xl overflow-hidden shadow-2xl relative z-10">
        <div className="p-8 flex flex-col text-left">
          
          <h1 className="text-2xl font-bold text-white mb-2 text-center">Pembayaran QRIS</h1>
          <p className="text-neutral-400 text-sm mb-6 text-center">
            Scan QR Code di bawah menggunakan aplikasi M-Banking atau e-Wallet Anda.
          </p>

          {/* Rincian Pesanan */}
          <div className="bg-zinc-800 rounded-xl p-5 mb-6 shadow-inner border border-white/5">
            <h2 className="text-white font-bold mb-4 text-sm uppercase tracking-wider">Rincian Pesanan</h2>
            
            <div className="flex flex-col gap-3 mb-4">
              {items.length > 0 ? (
                items.map((item) => (
                  <div key={item.product.product_id} className="flex justify-between items-center text-sm">
                    <span className="text-neutral-300 font-medium">
                      {item.product.product_name}
                    </span>
                    <span className="text-neutral-400">
                      {item.qty} x {formatRp(item.product.price || 0)}
                    </span>
                  </div>
                ))
              ) : (
                <div className="text-neutral-500 text-sm italic">Keranjang kosong</div>
              )}
            </div>

            <div className="border-t border-white/10 my-4" />

            <div className="flex justify-between items-center text-sm mb-3">
              <span className="text-neutral-400">Subtotal</span>
              <span className="text-white font-medium">{formatRp(subtotal)}</span>
            </div>

            <div className="flex justify-between items-center text-sm mb-4">
              <span className="text-neutral-400">Ongkos Kirim</span>
              {shippingCost === 0 ? (
                <span className="text-emerald-400 font-bold">Gratis</span>
              ) : (
                <span className="text-white font-medium">{formatRp(shippingCost)}</span>
              )}
            </div>

            <div className="flex justify-between items-center bg-black/30 p-3 rounded-lg border border-white/5">
              <span className="text-neutral-300 font-bold text-sm">TOTAL PEMBAYARAN</span>
              <span className="text-orange-500 font-black text-lg">{formatRp(grandTotal)}</span>
            </div>
          </div>

          {/* QRIS Image */}
          <div className="bg-white p-4 rounded-2xl w-full flex items-center justify-center shadow-[0_0_40px_rgba(255,255,255,0.1)] relative mb-6">
            <Image 
              src="/qris.jpeg" 
              alt="QRIS Seru.ni"
              width={250}
              height={250}
              priority
              className="w-full max-w-[250px] aspect-square object-contain bg-white p-2 rounded-xl mx-auto shadow-md"
            />
          </div>

          {/* Countdown Timer Warning */}
          <div className="mb-6 text-center">
            <p className={`text-lg font-bold ${isTimeUp ? 'text-neutral-500' : 'text-orange-500'}`}>
              {isTimeUp 
                ? "Waktu pembayaran telah habis" 
                : `Selesaikan pembayaran dalam ${formatTime(timeLeft)}`}
            </p>
          </div>

          {/* CTA Button */}
          <button
            onClick={handleConfirmPayment}
            disabled={isTimeUp || isConfirming}
            className={`flex items-center justify-center gap-2 w-full py-3 px-6 rounded-lg font-bold text-white transition-all shadow-lg active:scale-95 ${
              isTimeUp || isConfirming
                ? "bg-neutral-600 cursor-not-allowed opacity-70 shadow-none text-neutral-300" 
                : "bg-orange-600 hover:bg-orange-500 shadow-orange-500/20"
            }`}
          >
            {isConfirming && <Loader2 className="w-5 h-5 animate-spin" />}
            {isConfirming ? "Memproses..." : isTimeUp ? "Waktu Habis" : "Konfirmasi Pembayaran"}
          </button>

        </div>
      </div>
    </div>
  );
}
