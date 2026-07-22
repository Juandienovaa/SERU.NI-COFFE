"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { QrCode, CheckCircle2, Copy, Loader2, ArrowRight } from "lucide-react";
import Image from "next/image";
import { supabase } from "@/lib/supabase";
import { useOnlineCart } from "@/store/useOnlineCart";
import Swal from 'sweetalert2';

export default function PaymentPage() {
  const router = useRouter();
  const [checkoutData, setCheckoutData] = useState<any>(null);
  const [paymentStatus, setPaymentStatus] = useState<"WAITING" | "PAID" | "VERIFYING">("WAITING");
  const [orderId, setOrderId] = useState<number | null>(null);
  const clearCart = useOnlineCart((state) => state.clearCart);
  
  useEffect(() => {
    const dataStr = sessionStorage.getItem("current_checkout");
    if (!dataStr) {
      router.replace("/menu-online");
      return;
    }
    const data = JSON.parse(dataStr);
    setCheckoutData(data);
    createOrder(data);
  }, [router]);

  const createOrder = async (data: any) => {
    try {
      const invoiceNumber = `INV-${Date.now().toString().slice(-6)}-${Math.floor(Math.random() * 1000)}`;
      const mapLink = data.customer.lat && data.customer.lng 
        ? `https://www.google.com/maps/search/?api=1&query=${data.customer.lat},${data.customer.lng}` 
        : "";

      // 1. Insert Order
      const { data: orderRes, error: orderErr } = await supabase.from("online_orders").insert([{
        invoice_number: invoiceNumber,
        customer_name: data.customer.name,
        customer_phone: data.customer.phone,
        address: data.customer.address,
        map_link: mapLink,
        order_type: "DELIVERY",
        payment_status: 'WAITING_PAYMENT',
        order_status: 'PENDING_PAYMENT',
        subtotal: data.financial.subtotal,
        shipping_fee: data.financial.delivery_fee,
        grand_total: data.financial.total,
        notes: data.customer.notes
      }]).select("id").single();

      if (orderErr) throw orderErr;
      
      const newOrderId = orderRes.id;
      setOrderId(newOrderId);

      // 2. Insert Items
      const orderItems = data.cart.map((item: any) => ({
        order_id: newOrderId,
        product_id: item.product.product_id,
        product_name: item.product.name || item.product.product_name,
        qty: item.qty,
        price: item.product.price || 0,
        subtotal: (item.product.price || 0) * item.qty
      }));

      const { error: itemsErr } = await supabase.from("online_order_items").insert(orderItems);
      if (itemsErr) throw itemsErr;

      // 3. Clear Cart
      clearCart();

      // 4. Start polling for payment simulation
      simulatePaymentSuccess(newOrderId);

    } catch (err: any) {
      console.error("Order Creation Error:", err);
      Swal.fire({
        icon: 'error', title: 'Terjadi Kesalahan', text: err.message,
        background: '#18181b', color: '#fff'
      });
    }
  };

  const simulatePaymentSuccess = (id: number) => {
    // In a real app, this would poll the Midtrans/Moota API or listen to Supabase Realtime.
    // For this mockup, we auto-success after 5 seconds to demonstrate the flow.
    setTimeout(async () => {
      setPaymentStatus("VERIFYING");
      // Update DB to trigger Cashier notification
      await supabase.from("online_orders").update({
        payment_status: 'WAITING_CONFIRMATION', 
        order_status: 'PAID'
      }).eq('id', id);

      setTimeout(() => {
        setPaymentStatus("PAID");
        setTimeout(() => {
          sessionStorage.setItem("current_tracking_id", id.toString());
          router.replace("/tracking");
        }, 1500);
      }, 1500);
    }, 5000);
  };

  const formatRp = (num: number) => new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", minimumFractionDigits: 0 }).format(num);

  if (!checkoutData) return null;

  return (
    <div className="min-h-screen bg-[#09090B] flex items-center justify-center p-6 selection:bg-orange-500/30 overflow-hidden relative">
      
      {/* Background Decor */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-orange-500/10 blur-[120px] rounded-full" />
      </div>

      <motion.div 
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
        className="w-full max-w-md bg-[#121217]/80 backdrop-blur-xl border border-white/10 rounded-3xl overflow-hidden shadow-2xl relative z-10"
      >
        <div className="p-8 flex flex-col items-center">
          
          <div className="w-16 h-16 rounded-2xl bg-orange-500/20 flex items-center justify-center mb-6 border border-orange-500/30">
            <QrCode className="w-8 h-8 text-orange-500" />
          </div>

          <h1 className="text-2xl font-bold text-white mb-2">Pembayaran QRIS</h1>
          <p className="text-neutral-400 text-sm text-center mb-8">
            Scan QR Code di bawah menggunakan aplikasi M-Banking atau e-Wallet Anda.
          </p>

          <div className="bg-white p-4 rounded-2xl w-64 h-64 flex items-center justify-center shadow-[0_0_40px_rgba(255,255,255,0.1)] relative">
            {/* Mock QR Code Image */}
            <div className="w-full h-full border-4 border-black/5 rounded-xl flex items-center justify-center relative overflow-hidden">
               <div className="absolute inset-0 opacity-20 bg-[url('https://upload.wikimedia.org/wikipedia/commons/d/d0/QR_code_for_mobile_English_Wikipedia.svg')] bg-cover" />
               <div className="absolute inset-0 flex items-center justify-center z-10 font-black text-black opacity-30 rotate-45 text-2xl">MOCK QRIS</div>
            </div>
            
            {/* Scanning Laser Animation */}
            {paymentStatus === "WAITING" && (
              <motion.div 
                animate={{ top: ["0%", "100%", "0%"] }}
                transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
                className="absolute left-0 right-0 h-1 bg-red-500 shadow-[0_0_10px_red] z-20"
              />
            )}
          </div>

          <div className="mt-8 bg-black/30 border border-white/5 rounded-2xl p-4 w-full text-center">
            <p className="text-xs text-neutral-500 uppercase tracking-wider mb-1">Total Pembayaran</p>
            <p className="text-3xl font-black text-transparent bg-clip-text bg-gradient-to-r from-orange-400 to-orange-600">
              {formatRp(checkoutData.financial.total)}
            </p>
          </div>

          <div className="mt-8 w-full flex flex-col items-center gap-3">
            {paymentStatus === "WAITING" && (
              <div className="flex items-center gap-3 text-orange-400 bg-orange-500/10 px-6 py-3 rounded-full border border-orange-500/20">
                <Loader2 className="w-5 h-5 animate-spin" />
                <span className="font-medium text-sm">Menunggu Pembayaran...</span>
              </div>
            )}
            
            {paymentStatus === "VERIFYING" && (
              <div className="flex items-center gap-3 text-blue-400 bg-blue-500/10 px-6 py-3 rounded-full border border-blue-500/20">
                <Loader2 className="w-5 h-5 animate-spin" />
                <span className="font-medium text-sm">Memverifikasi Pembayaran...</span>
              </div>
            )}

            {paymentStatus === "PAID" && (
              <div className="flex items-center gap-3 text-emerald-400 bg-emerald-500/10 px-6 py-3 rounded-full border border-emerald-500/20">
                <CheckCircle2 className="w-5 h-5" />
                <span className="font-medium text-sm">Pembayaran Berhasil!</span>
              </div>
            )}
          </div>

        </div>
      </motion.div>
    </div>
  );
}
