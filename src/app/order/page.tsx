"use client";

import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { fetchAllProducts } from "@/services/productService";
import { getAvailableStockForShift } from "@/services/backendService"; // Reusing to check Master Inventory
import { ProductCatalogItem } from "@/types/product";
import { Plus, Minus, ShoppingBag, MapPin, Navigation2, ArrowRight, Loader2, CheckCircle2 } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { useRouter } from "next/navigation";

function formatRupiah(amount: number) {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    minimumFractionDigits: 0,
  }).format(amount);
}

export default function CustomerOrderPage() {
  const router = useRouter();
  
  const [products, setProducts] = useState<ProductCatalogItem[]>([]);
  const [stockMap, setStockMap] = useState<Record<number, number>>({});
  const [loading, setLoading] = useState(true);
  
  const [cart, setCart] = useState<{ product: ProductCatalogItem; qty: number }[]>([]);
  const [isCheckout, setIsCheckout] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  
  const [form, setForm] = useState({
    name: "",
    phone: "",
    address: "",
    mapLink: "",
    orderType: "DELIVERY" as "DELIVERY" | "TAKEAWAY",
    notes: ""
  });

  useEffect(() => {
    async function loadData() {
      try {
        const [prodRes, stockRes] = await Promise.all([
          fetchAllProducts(),
          getAvailableStockForShift()
        ]);
        
        if (prodRes.success) setProducts(prodRes.data);
        
        const map: Record<number, number> = {};
        stockRes.forEach((s: any) => {
          map[s.product_id] = s.current_stock;
        });
        setStockMap(map);
      } catch (err) {
        console.error("Failed to load products", err);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  const handleAddToCart = (product: ProductCatalogItem) => {
    const stock = stockMap[product.product_id] || 0;
    if (stock <= 0) return; // Sold out

    setCart(prev => {
      const existing = prev.find(item => item.product.product_id === product.product_id);
      if (existing) {
        if (existing.qty >= stock) return prev; // Cannot exceed stock
        return prev.map(item => item.product.product_id === product.product_id ? { ...item, qty: item.qty + 1 } : item);
      }
      return [...prev, { product, qty: 1 }];
    });
  };

  const handleRemoveFromCart = (productId: number) => {
    setCart(prev => {
      const existing = prev.find(item => item.product.product_id === productId);
      if (existing && existing.qty > 1) {
        return prev.map(item => item.product.product_id === productId ? { ...item, qty: item.qty - 1 } : item);
      }
      return prev.filter(item => item.product.product_id !== productId);
    });
  };

  const totalQty = cart.reduce((acc, item) => acc + item.qty, 0);
  const subtotal = cart.reduce((acc, item) => acc + (item.product.price * item.qty), 0);
  const isFreeOngkir = totalQty >= 5;
  const shippingFee = form.orderType === "TAKEAWAY" ? 0 : (isFreeOngkir ? 0 : 10000);
  const grandTotal = subtotal + shippingFee;

  const handleCheckoutSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (cart.length === 0) return;
    if (!form.name || !form.phone || (form.orderType === "DELIVERY" && !form.address)) {
      alert("Mohon lengkapi data pengiriman Anda.");
      return;
    }

    try {
      setSubmitting(true);
      const invoiceNumber = `INV-${Date.now().toString().slice(-6)}-${Math.floor(Math.random() * 1000)}`;
      
      const { data: orderData, error: orderError } = await supabase.from("online_orders").insert([{
        invoice_number: invoiceNumber,
        customer_name: form.name,
        customer_phone: form.phone,
        address: form.address,
        map_link: form.mapLink,
        order_type: form.orderType,
        payment_status: 'WAITING_PAYMENT',
        order_status: 'PENDING',
        subtotal: subtotal,
        shipping_fee: shippingFee,
        grand_total: grandTotal,
        notes: form.notes
      }]).select("id").single();

      if (orderError) throw orderError;

      const orderItems = cart.map(item => ({
        order_id: orderData.id,
        product_id: item.product.product_id,
        product_name: item.product.product_name,
        qty: item.qty,
        price: item.product.price,
        subtotal: item.product.price * item.qty
      }));

      const { error: itemsError } = await supabase.from("online_order_items").insert(orderItems);
      if (itemsError) throw itemsError;

      // ENTERPRISE SSOT: Insert Master Transaction
      const { data: txMaster, error: txMasterError } = await supabase.from("transactions").insert([{
        shift_id: null,
        outlet_id: "ONLINE",
        cashier_id: "SYSTEM",
        payment_method: 'QRIS',
        cash_amount: 0,
        qris_amount: grandTotal,
        total_amount: grandTotal,
        total_items: totalQty,
        is_central_cashier: false,
        order_type: 'ONLINE',
        payment_status: 'WAITING_PAYMENT',
        created_at: new Date().toISOString()
      }]).select("id").single();

      if (txMaster && !txMasterError) {
        const txItems = cart.map(item => ({
          transaction_id: txMaster.id,
          product_id: item.product.product_id,
          qty: item.qty,
          price: item.product.price,
          subtotal: item.product.price * item.qty,
          created_at: new Date().toISOString()
        }));
        await supabase.from("transaction_items").insert(txItems);
        // Link transaction_id to online_order for future updates
        await supabase.from("online_orders").update({ notes: `${form.notes || ''} [TXID:${txMaster.id}]` }).eq("id", orderData.id);
      }

      // Redirect to payment page
      router.push(`/order/${orderData.id}`);

    } catch (err: any) {
      alert(`Checkout gagal: ${err.message}`);
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0A0A0A] flex flex-col items-center justify-center">
        <Loader2 className="w-8 h-8 text-orange-500 animate-spin mb-4" />
        <p className="text-neutral-500 font-mono text-sm tracking-widest">LOADING MENU...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0A0A0A] text-white font-sans selection:bg-orange-500/30 selection:text-orange-200 pb-32">
      
      {/* Header */}
      <header className="sticky top-0 z-40 bg-[#0A0A0A]/80 backdrop-blur-xl border-b border-white/5 pt-12 pb-6 px-6">
        <div className="max-w-2xl mx-auto flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-black tracking-tighter">Seru.ni Coffee</h1>
            <p className="text-xs text-neutral-400 mt-1 font-mono uppercase tracking-widest">Online Delivery & Pickup</p>
          </div>
          <div className="w-10 h-10 rounded-full bg-orange-500/10 flex items-center justify-center border border-orange-500/20">
            <ShoppingBag className="w-4 h-4 text-orange-500" />
            {totalQty > 0 && (
              <div className="absolute top-10 right-5 w-4 h-4 bg-orange-500 rounded-full flex items-center justify-center text-[9px] font-black">
                {totalQty}
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-2xl mx-auto px-6 py-8">
        
        {!isCheckout ? (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
            {products.map(p => {
              const stock = stockMap[p.product_id] || 0;
              const cartItem = cart.find(c => c.product.product_id === p.product_id);
              const qty = cartItem ? cartItem.qty : 0;
              const isSoldOut = stock <= 0;

              return (
                <div key={p.product_id} className={`p-4 rounded-3xl border transition-all duration-300 flex items-center gap-4 ${isSoldOut ? 'bg-neutral-900/50 border-white/5 opacity-60 grayscale' : qty > 0 ? 'bg-orange-500/5 border-orange-500/20' : 'bg-[#111111] border-white/5 hover:border-white/10'}`}>
                  {/* Image */}
                  <div className="w-20 h-20 rounded-2xl bg-black overflow-hidden relative shrink-0">
                    <img src={p.image} alt={p.product_name} className="w-full h-full object-cover opacity-80" />
                  </div>
                  
                  {/* Info */}
                  <div className="flex-1">
                    <h3 className="font-bold text-white leading-tight">{p.product_name}</h3>
                    <p className="text-sm font-black text-orange-400 mt-1">{formatRupiah(p.price)}</p>
                    {isSoldOut && <p className="text-[10px] font-bold text-red-500 uppercase tracking-widest mt-2">Sold Out</p>}
                  </div>

                  {/* Actions */}
                  {!isSoldOut && (
                    <div className="shrink-0 flex flex-col items-center gap-2">
                      {qty > 0 ? (
                        <div className="flex items-center gap-3 bg-black rounded-full p-1 border border-white/10">
                          <button onClick={() => handleRemoveFromCart(p.product_id)} className="w-8 h-8 rounded-full bg-[#1A1A1A] flex items-center justify-center text-neutral-400 active:scale-95">
                            <Minus className="w-4 h-4" />
                          </button>
                          <span className="font-black font-mono w-4 text-center">{qty}</span>
                          <button onClick={() => handleAddToCart(p)} disabled={qty >= stock} className={`w-8 h-8 rounded-full flex items-center justify-center active:scale-95 ${qty >= stock ? 'bg-neutral-800 text-neutral-600' : 'bg-orange-500 text-white'}`}>
                            <Plus className="w-4 h-4" />
                          </button>
                        </div>
                      ) : (
                        <button onClick={() => handleAddToCart(p)} className="px-5 py-2.5 rounded-full bg-white text-black font-bold text-xs hover:scale-105 active:scale-95 transition-transform flex items-center gap-2">
                          <Plus className="w-4 h-4" /> Tambah
                        </button>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </motion.div>
        ) : (
          <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="space-y-6">
            <button onClick={() => setIsCheckout(false)} className="text-xs font-bold text-neutral-400 hover:text-white uppercase tracking-widest flex items-center gap-2">
              &larr; Kembali ke Menu
            </button>
            
            <h2 className="text-2xl font-black">Checkout</h2>

            <form id="checkout-form" onSubmit={handleCheckoutSubmit} className="space-y-6">
              
              <div className="bg-[#111111] p-5 rounded-3xl border border-white/5 space-y-4">
                <h3 className="font-bold text-neutral-300 flex items-center gap-2 mb-4">
                  <Navigation2 className="w-4 h-4 text-orange-500" /> Tipe Pesanan
                </h3>
                <div className="grid grid-cols-2 gap-3">
                  <button type="button" onClick={() => setForm({...form, orderType: 'DELIVERY'})} className={`py-4 rounded-2xl font-bold text-sm border transition-all ${form.orderType === 'DELIVERY' ? 'bg-orange-500/10 border-orange-500/50 text-orange-400' : 'bg-[#1A1A1A] border-white/5 text-neutral-500'}`}>
                    Delivery
                  </button>
                  <button type="button" onClick={() => setForm({...form, orderType: 'TAKEAWAY'})} className={`py-4 rounded-2xl font-bold text-sm border transition-all ${form.orderType === 'TAKEAWAY' ? 'bg-orange-500/10 border-orange-500/50 text-orange-400' : 'bg-[#1A1A1A] border-white/5 text-neutral-500'}`}>
                    Take Away
                  </button>
                </div>
              </div>

              <div className="bg-[#111111] p-5 rounded-3xl border border-white/5 space-y-4">
                <h3 className="font-bold text-neutral-300 mb-4">Informasi Customer</h3>
                <div>
                  <label className="text-[10px] uppercase tracking-widest text-neutral-500 font-bold ml-2 mb-1 block">Nama Lengkap *</label>
                  <input required type="text" value={form.name} onChange={e => setForm({...form, name: e.target.value})} className="w-full bg-[#1A1A1A] border border-white/5 rounded-2xl px-4 py-3.5 text-white outline-none focus:border-orange-500/50 transition-colors" placeholder="Cth: Budi Santoso" />
                </div>
                <div>
                  <label className="text-[10px] uppercase tracking-widest text-neutral-500 font-bold ml-2 mb-1 block">Nomor WhatsApp *</label>
                  <input required type="tel" value={form.phone} onChange={e => setForm({...form, phone: e.target.value})} className="w-full bg-[#1A1A1A] border border-white/5 rounded-2xl px-4 py-3.5 text-white outline-none focus:border-orange-500/50 transition-colors" placeholder="08xxxxxxxxxx" />
                </div>
              </div>

              {form.orderType === "DELIVERY" && (
                <div className="bg-[#111111] p-5 rounded-3xl border border-white/5 space-y-4">
                  <h3 className="font-bold text-neutral-300 flex items-center gap-2 mb-4">
                    <MapPin className="w-4 h-4 text-emerald-500" /> Lokasi Pengiriman
                  </h3>
                  <div>
                    <label className="text-[10px] uppercase tracking-widest text-neutral-500 font-bold ml-2 mb-1 block">Alamat Lengkap *</label>
                    <textarea required={form.orderType === "DELIVERY"} value={form.address} onChange={e => setForm({...form, address: e.target.value})} rows={3} className="w-full bg-[#1A1A1A] border border-white/5 rounded-2xl px-4 py-3.5 text-white outline-none focus:border-orange-500/50 transition-colors resize-none" placeholder="Cth: Jl. Sudirman No. 12, Pagar Hitam" />
                  </div>
                  <div>
                    <label className="text-[10px] uppercase tracking-widest text-neutral-500 font-bold ml-2 mb-1 block">Link Google Maps (Opsional)</label>
                    <input type="url" value={form.mapLink} onChange={e => setForm({...form, mapLink: e.target.value})} className="w-full bg-[#1A1A1A] border border-white/5 rounded-2xl px-4 py-3.5 text-white outline-none focus:border-orange-500/50 transition-colors" placeholder="https://maps.app.goo.gl/..." />
                  </div>
                </div>
              )}

              <div className="bg-[#111111] p-5 rounded-3xl border border-white/5 space-y-4">
                 <div>
                  <label className="text-[10px] uppercase tracking-widest text-neutral-500 font-bold ml-2 mb-1 block">Catatan Tambahan (Opsional)</label>
                  <input type="text" value={form.notes} onChange={e => setForm({...form, notes: e.target.value})} className="w-full bg-[#1A1A1A] border border-white/5 rounded-2xl px-4 py-3.5 text-white outline-none focus:border-orange-500/50 transition-colors" placeholder="Cth: Gulanya sedikit saja, Es dipisah" />
                </div>
              </div>

            </form>
          </motion.div>
        )}

      </main>

      {/* Floating Action Bar */}
      <AnimatePresence>
        {totalQty > 0 && (
          <motion.div 
            initial={{ y: 100, opacity: 0 }} 
            animate={{ y: 0, opacity: 1 }} 
            exit={{ y: 100, opacity: 0 }}
            className="fixed bottom-0 left-0 right-0 z-50 p-6 pointer-events-none"
          >
            <div className="max-w-2xl mx-auto pointer-events-auto">
              <div className="bg-[#18181B]/95 backdrop-blur-2xl border border-white/10 rounded-[32px] p-2 flex flex-col sm:flex-row items-center gap-4 shadow-2xl">
                
                <div className="flex-1 px-4 py-2 w-full">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs font-bold text-neutral-400">Total {totalQty} Item</span>
                    {form.orderType === "DELIVERY" && (
                      <span className={`text-[10px] font-black px-2 py-0.5 rounded uppercase tracking-widest ${isFreeOngkir ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'bg-neutral-800 text-neutral-500'}`}>
                        {isFreeOngkir ? 'FREE ONGKIR' : 'Ongkir 10K'}
                      </span>
                    )}
                  </div>
                  <div className="text-xl font-black text-white">{formatRupiah(grandTotal)}</div>
                </div>
                
                <button 
                  onClick={() => isCheckout ? document.getElementById("checkout-form")?.dispatchEvent(new Event("submit", { cancelable: true, bubbles: true })) : setIsCheckout(true)}
                  disabled={submitting}
                  className="w-full sm:w-auto px-8 py-4 rounded-[24px] bg-white text-black font-black text-sm flex items-center justify-center gap-2 hover:scale-105 active:scale-95 transition-transform disabled:opacity-50 disabled:cursor-not-allowed shrink-0"
                >
                  {submitting ? <Loader2 className="w-5 h-5 animate-spin" /> : isCheckout ? (
                    <>Bayar QRIS <ArrowRight className="w-4 h-4" /></>
                  ) : (
                    <>Checkout <ArrowRight className="w-4 h-4" /></>
                  )}
                </button>

              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

    </div>
  );
}
