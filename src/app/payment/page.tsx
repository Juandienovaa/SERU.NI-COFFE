"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useOnlineCart } from "@/store/useOnlineCart";

export default function PaymentPage() {
  const router = useRouter();
  const { items, getTotalItems, getSubtotal } = useOnlineCart();
  
  // State untuk hydration fix
  const [isMounted, setIsMounted] = useState(false);
  
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
  const shippingCost = totalQty > 5 ? 0 : 10000;
  const grandTotal = subtotal + shippingCost;
  
  const isTimeUp = timeLeft === 0;

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
            <img 
              src="/qris.jpeg" 
              alt="QRIS Seru.ni"
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
            onClick={() => router.push('/live-tracking')}
            disabled={isTimeUp}
            className={`w-full py-3 px-6 rounded-lg font-bold text-white transition-all shadow-lg active:scale-95 ${
              isTimeUp 
                ? "bg-neutral-600 cursor-not-allowed opacity-70 shadow-none text-neutral-300" 
                : "bg-orange-600 hover:bg-orange-500 shadow-orange-500/20"
            }`}
          >
            {isTimeUp ? "Waktu Habis" : "Konfirmasi Pembayaran"}
          </button>

        </div>
      </div>
    </div>
  );
}
