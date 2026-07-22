"use client";

import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "motion/react";
import { supabase } from "@/lib/supabase";
import { fetchAllProducts } from "@/services/productService";
import { ProductCatalogItem } from "@/types/product";
import { ShoppingCart, ListOrdered, CheckCircle2, Package, Car, X, Plus, Minus, Search, Bell, MapPin, Phone, Receipt } from "lucide-react";
import { useRouter } from "next/navigation";
import Swal from 'sweetalert2';
import withReactContent from 'sweetalert2-react-content';

const MySwal = withReactContent(Swal);

const Toast = MySwal.mixin({
  toast: true,
  position: 'top-end',
  showConfirmButton: false,
  timer: 1000,
  timerProgressBar: false,
  background: '#18181b',
  color: '#ffffff',
  customClass: {
    popup: 'border border-[#27272a] rounded-2xl shadow-xl'
  }
});

function formatRupiah(amount: number) {
  return new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", minimumFractionDigits: 0 }).format(amount);
}

const ORDER_STATUS_FILTERS = [
  "Semua",
  "WAITING_PAYMENT",
  "WAITING_CONFIRMATION",
  "PROCESSING",
  "PREPARING",
  "READY_FOR_DELIVERY",
  "ON_THE_WAY",
  "COMPLETED"
];

export default function CentralCashierDashboard() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<"OFFLINE" | "ONLINE">("ONLINE");
  const [onlineFilter, setOnlineFilter] = useState<string>("Semua");
  const [selectedOrder, setSelectedOrder] = useState<any | null>(null);
  
  // Current User Session State
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [loginTime, setLoginTime] = useState<string>("");

  // Shared State
  const [loading, setLoading] = useState(true);
  const [products, setProducts] = useState<ProductCatalogItem[]>([]);
  const [inventory, setInventory] = useState<any[]>([]);

  // Offline POS State
  const [cart, setCart] = useState<{ product: ProductCatalogItem; qty: number }[]>([]);
  const [submittingOffline, setSubmittingOffline] = useState(false);

  // Online Orders State
  const [onlineOrders, setOnlineOrders] = useState<any[]>([]);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const wakeLockRef = useRef<any>(null);

  useEffect(() => {
    const storedUser = localStorage.getItem("current_user");
    if (!storedUser) {
      router.replace("/masuk-kasir");
      return;
    }
    
    try {
      setCurrentUser(JSON.parse(storedUser));
      const lt = localStorage.getItem("login_time");
      if (lt) {
        setLoginTime(new Date(lt).toLocaleTimeString("id-ID", { hour: '2-digit', minute: '2-digit' }));
      }
    } catch (e) {
      router.replace("/masuk-kasir");
      return;
    }

    // Initialize Audio
    audioRef.current = new Audio("/audio-loop.mp3");
    audioRef.current.loop = true;

    // Wake Lock & Notification Setup
    const requestWakeLock = async () => {
      if ('wakeLock' in navigator && document.visibilityState === 'visible') {
        try {
          wakeLockRef.current = await (navigator as any).wakeLock.request('screen');
        } catch (err: any) {
          console.warn("WakeLock Error:", err.name, err.message);
        }
      }
    };
    requestWakeLock();

    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        requestWakeLock();
        document.title = 'Kasir Dashboard';
      }
    };
    document.addEventListener('visibilitychange', handleVisibilityChange);

    if ("Notification" in window && Notification.permission === "default") {
      Notification.requestPermission();
    }

    async function loadData() {
      const [prodRes, invRes, ordersRes] = await Promise.all([
        fetchAllProducts(),
        supabase.from("product_inventory").select("*"),
        supabase.from("online_orders").select("*, online_order_items(*)").order("created_at", { ascending: false }).limit(50)
      ]);
      
      if (prodRes.success) setProducts(prodRes.data || []);
      if (invRes.data) setInventory(invRes.data || []);
      if (ordersRes.data) {
        setOnlineOrders(ordersRes.data || []);
        checkAndPlayAudio(ordersRes.data || []);
      }
      
      setLoading(false);
    }
    
    loadData();

    // Supabase Realtime
    const orderChannel = supabase.channel('central-cashier-orders')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'online_orders' }, (payload) => {
        setOnlineOrders((prev: any[]) => {
          const newOrders = [payload.new, ...prev];
          checkAndPlayAudio(newOrders);
          return newOrders;
        });
      })
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'online_orders' }, (payload) => {
        setOnlineOrders((prev: any[]) => {
          const newOrders = prev.map(o => o.id === payload.new.id ? { ...o, ...payload.new } : o);
          checkAndPlayAudio(newOrders);
          return newOrders;
        });
      })
      .subscribe();

    const invChannel = supabase.channel('central-cashier-inventory')
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'product_inventory' }, (payload) => {
        setInventory((prev: any[]) => prev.map(i => i.product_id === payload.new.product_id ? payload.new : i));
      })
      .subscribe();

    return () => {
      supabase.removeChannel(orderChannel);
      supabase.removeChannel(invChannel);
      if (audioRef.current) {
        audioRef.current.pause();
      }
      if (wakeLockRef.current) {
        wakeLockRef.current.release();
        wakeLockRef.current = null;
      }
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [router]);

  const checkAndPlayAudio = (orders: any[]) => {
    // Check if there are any orders needing attention
    const needsAttention = orders.some(o => 
      o.payment_status === 'WAITING_PAYMENT' || o.payment_status === 'WAITING_CONFIRMATION'
    );
    
    if (needsAttention && !selectedOrder) {
      audioRef.current?.play().catch(e => console.warn("Audio autoplay blocked:", e));
      
      // Blink Title & Desktop Notification if hidden
      if (document.visibilityState !== 'visible') {
        document.title = '🚨 PESANAN BARU! 🚨';
        if ("Notification" in window && Notification.permission === "granted") {
          new Notification("Pesanan Baru Masuk!", {
            body: "Ada pesanan online baru yang perlu segera diverifikasi dan diproses.",
            icon: "/images/hero-section-logo.PNG"
          });
        }
      }
    } else {
      audioRef.current?.pause();
      if (audioRef.current) audioRef.current.currentTime = 0;
      if (document.visibilityState === 'visible') document.title = 'Kasir Dashboard';
    }
  };

  const handleStopAudio = () => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
    }
  };

  const handleOpenOrder = (order: any) => {
    setSelectedOrder(order);
    handleStopAudio();
  };

  const handleCloseOrder = () => {
    setSelectedOrder(null);
    checkAndPlayAudio(onlineOrders); // Resume audio if there are still pending orders
  };

  const handleLogout = () => {
    localStorage.removeItem("current_user");
    localStorage.removeItem("user_id");
    localStorage.removeItem("user_role");
    localStorage.removeItem("login_time");
    router.replace("/masuk-kasir");
  };

  // ----------------------------------------------------
  // ONLINE ORDERS LOGIC
  // ----------------------------------------------------
  const updateOrderStatus = async (id: string, paymentStatus: string, orderStatus: string) => {
    handleStopAudio();
    await supabase.from("online_orders").update({ payment_status: paymentStatus, order_status: orderStatus }).eq("id", id);
    
    // Update local state immediately for snappy UI
    setOnlineOrders((prev: any[]) => prev.map(o => o.id === id ? { ...o, payment_status: paymentStatus, order_status: orderStatus } : o));
    
    if (selectedOrder?.id === id) {
      setSelectedOrder((prev: any) => prev ? { ...prev, payment_status: paymentStatus, order_status: orderStatus } : null);
    }

    if (paymentStatus === "PAID") {
      const order = onlineOrders.find(o => o.id === id);
      if (order && order.online_order_items) {
        for (const item of order.online_order_items) {
          await supabase.rpc('rpc_allocate_inventory', { p_shift_id: '00000000-0000-0000-0000-000000000000', p_product_id: item.product_id, p_qty: item.qty });
        }
        
        const txIdMatch = order.notes?.match(/\[TXID:([^\]]+)\]/);
        if (txIdMatch) {
          await supabase.from("transactions").update({ payment_status: 'PAID', cashier_id: currentUser?.id || "KASIR" }).eq("id", txIdMatch[1]);
        } else {
          const { data: txMaster, error: txMasterError } = await supabase.from("transactions").insert([{
            shift_id: null,
            outlet_id: "ONLINE",
            cashier_id: currentUser?.id || "KASIR",
            payment_method: 'QRIS',
            cash_amount: 0,
            qris_amount: order.grand_total,
            total_amount: order.grand_total,
            total_items: order.online_order_items.reduce((acc: number, item: any) => acc + item.qty, 0),
            is_central_cashier: true,
            order_type: 'ONLINE',
            payment_status: 'PAID',
            created_at: new Date().toISOString()
          }]).select("id").single();

          if (txMaster && !txMasterError) {
            const txs = order.online_order_items.map((item: any) => ({
              transaction_id: txMaster.id,
              product_id: item.product_id,
              qty: item.qty,
              price: item.price,
              subtotal: item.subtotal,
              created_at: new Date().toISOString()
            }));
            if (txs.length > 0) await supabase.from("transaction_items").insert(txs);
          }
        }
      }
    }
  };

  // ----------------------------------------------------
  // OFFLINE POS LOGIC
  // ----------------------------------------------------
  const handleAddToCart = (p: ProductCatalogItem) => {
    const inv = inventory.find(i => i.product_id === p.product_id);
    if (!inv || inv.current_stock <= 0) return;

    setCart((prev: { product: ProductCatalogItem; qty: number }[]) => {
      const existing = prev.find(item => item.product.product_id === p.product_id);
      if (existing) {
        if (existing.qty >= inv.current_stock) return prev;
        return prev.map(item => item.product.product_id === p.product_id ? { ...item, qty: item.qty + 1 } : item);
      }
      return [...prev, { product: p, qty: 1 }];
    });

    Toast.fire({ icon: 'success', title: `${p.product_name} ditambahkan` });
  };

  const handleRemoveFromCart = (id: number) => {
    setCart((prev: { product: ProductCatalogItem; qty: number }[]) => {
      const existing = prev.find(item => item.product.product_id === id);
      if (existing && existing.qty > 1) {
        return prev.map(item => item.product.product_id === id ? { ...item, qty: item.qty - 1 } : item);
      }
      return prev.filter(item => item.product.product_id !== id);
    });
  };

  const offlineSubtotal = cart.reduce((acc, item) => acc + ((item.product.price || 0) * item.qty), 0);

  const handleOfflineCheckout = async (method: 'CASH' | 'QRIS') => {
    if (cart.length === 0) return;
    setSubmittingOffline(true);

    try {
      // 1. Kurangi stok product_inventory dan catat inventory_movements
      for (const item of cart) {
        const { data: currentInv } = await supabase
          .from("product_inventory")
          .select("current_stock")
          .eq("product_id", item.product.product_id)
          .single();

        if (currentInv) {
          const newStock = Math.max(0, currentInv.current_stock - item.qty);
          await supabase
            .from("product_inventory")
            .update({ current_stock: newStock })
            .eq("product_id", item.product.product_id);

          await supabase.from("inventory_movements").insert([{
            product_id: item.product.product_id,
            movement_type: "SALE",
            quantity: item.qty,
            stock_before: currentInv.current_stock,
            stock_after: newStock,
            reference_id: "OFFLINE_CHECKOUT",
            notes: "Penjualan POS Kasir Pusat",
            created_at: new Date().toISOString()
          }]);
        }
      }

      // 2. Insert ke transactions
      const qtySold = cart.reduce((acc, item) => acc + item.qty, 0);
      const { data: txMaster, error: txMasterError } = await supabase.from("transactions").insert([{
        shift_id: null,
        outlet_id: "CENTRAL_CASHIER",
        cashier_id: currentUser?.id || "KASIR",
        payment_method: method,
        metode_bayar: method,
        cash_amount: method === 'CASH' ? offlineSubtotal : 0,
        qris_amount: method === 'QRIS' ? offlineSubtotal : 0,
        total_amount: offlineSubtotal,
        total_harga: offlineSubtotal,
        total_items: qtySold,
        qty: qtySold,
        is_central_cashier: true,
        order_type: 'OFFLINE',
        payment_status: 'PAID',
        created_at: new Date().toISOString()
      }]).select("id").single();

      if (txMaster && !txMasterError) {
        const txs = cart.map(item => ({
          transaction_id: txMaster.id,
          product_id: item.product.product_id,
          qty: item.qty,
          price: item.product.price || 0,
          subtotal: (item.product.price || 0) * item.qty,
          created_at: new Date().toISOString()
        }));
        if (txs.length > 0) await supabase.from("transaction_items").insert(txs);
      }

      setCart([]);
      MySwal.fire({ icon: 'success', title: 'Pesanan Berhasil', background: '#18181b', color: '#ffffff', timer: 1500, showConfirmButton: false, customClass: { popup: 'border border-[#27272a] rounded-2xl' } });
      
      // Sinkronisasi UI
      const { data: newInv } = await supabase.from("product_inventory").select("*");
      if (newInv) {
        setInventory(newInv);
      }
    } catch (err: any) {
      MySwal.fire({ icon: 'error', title: 'Transaksi Gagal', text: 'Gagal menyimpan transaksi ke database.', background: '#18181b', color: '#ffffff', confirmButtonText: 'Tutup', customClass: { popup: 'border border-[#27272a] rounded-2xl' } });
    } finally {
      setSubmittingOffline(false);
    }
  };

  const confirmCashPayment = () => {
    if (cart.length === 0 || submittingOffline) return;
    MySwal.fire({ title: 'Konfirmasi Pembayaran', text: 'Apakah yakin pembayaran dilakukan menggunakan Tunai?', icon: 'question', background: '#18181b', color: '#ffffff', showCancelButton: true, confirmButtonText: 'Ya, Konfirmasi', cancelButtonText: 'Batal', confirmButtonColor: '#ea580c', cancelButtonColor: '#27272a', reverseButtons: true, customClass: { popup: 'border border-[#27272a] rounded-2xl' } }).then((result) => { if (result.isConfirmed) handleOfflineCheckout('CASH'); });
  };

  const confirmQrisPayment = () => {
    if (cart.length === 0 || submittingOffline) return;
    MySwal.fire({ title: 'Konfirmasi Pembayaran', text: 'Apakah pembayaran QRIS sudah diterima?', icon: 'question', background: '#18181b', color: '#ffffff', showCancelButton: true, confirmButtonText: 'Ya, Konfirmasi', cancelButtonText: 'Batal', confirmButtonColor: '#ea580c', cancelButtonColor: '#27272a', reverseButtons: true, customClass: { popup: 'border border-[#27272a] rounded-2xl' } }).then((result) => { if (result.isConfirmed) handleOfflineCheckout('QRIS'); });
  };

  if (loading) return <div className="min-h-screen bg-[#09090B] flex items-center justify-center text-orange-500"><ListOrdered className="animate-spin w-8 h-8" /></div>;

  const filteredOnlineOrders = onlineFilter === "Semua" 
    ? onlineOrders 
    : onlineOrders.filter(o => o.payment_status === onlineFilter || o.order_status === onlineFilter);

  const pendingCount = onlineOrders.filter(o => o.payment_status === 'WAITING_CONFIRMATION').length;

  return (
    <div className="min-h-screen flex bg-[#09090B] text-white font-sans overflow-hidden">
      
      {/* Sidebar */}
      <aside className="w-20 md:w-64 bg-[#111111] border-r border-white/5 flex flex-col shrink-0">
        <div className="p-6 text-center md:text-left border-b border-white/5 shrink-0">
          <h2 className="font-black text-xl hidden md:block">Central Cashier</h2>
          <span className="text-xs font-bold text-orange-500 uppercase tracking-widest hidden md:block">Master POS</span>
          <span className="font-black text-xl md:hidden text-orange-500">CC</span>
        </div>
        <nav className="flex-1 overflow-y-auto p-4 space-y-2">
          <button onClick={() => setActiveTab("ONLINE")} className={`w-full flex items-center gap-3 p-4 rounded-2xl transition-all ${activeTab === 'ONLINE' ? 'bg-orange-500 text-white' : 'hover:bg-white/5 text-neutral-400'}`}>
            <div className="relative">
              <Bell className="w-5 h-5" />
              {pendingCount > 0 && <div className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-red-500 rounded-full animate-ping" />}
            </div>
            <span className="font-bold text-sm hidden md:block">Online Orders</span>
          </button>
          
          {/* Sub-menu Filter untuk Online Orders */}
          <AnimatePresence>
            {activeTab === 'ONLINE' && (
              <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="pl-4 space-y-1 overflow-hidden hidden md:block">
                {ORDER_STATUS_FILTERS.map(filter => {
                  const count = filter === "Semua" 
                    ? onlineOrders.length 
                    : onlineOrders.filter(o => o.payment_status === filter || o.order_status === filter).length;
                  return (
                    <button
                      key={filter}
                      onClick={() => setOnlineFilter(filter)}
                      className={`w-full flex items-center justify-between p-3 rounded-xl text-xs font-bold transition-all ${onlineFilter === filter ? 'bg-white/10 text-white' : 'text-neutral-500 hover:bg-white/5 hover:text-neutral-300'}`}
                    >
                      <span className="uppercase tracking-wider">{filter.replace(/_/g, ' ')}</span>
                      {count > 0 && <span className={`px-1.5 py-0.5 rounded text-[10px] ${filter.includes('WAITING') ? 'bg-yellow-500/20 text-yellow-500' : 'bg-white/10 text-neutral-400'}`}>{count}</span>}
                    </button>
                  );
                })}
              </motion.div>
            )}
          </AnimatePresence>

          <button onClick={() => setActiveTab("OFFLINE")} className={`w-full flex items-center gap-3 p-4 rounded-2xl transition-all ${activeTab === 'OFFLINE' ? 'bg-orange-500 text-white mt-4' : 'hover:bg-white/5 text-neutral-400 mt-4'}`}>
            <ShoppingCart className="w-5 h-5" />
            <span className="font-bold text-sm hidden md:block">Offline POS</span>
          </button>
        </nav>
      </aside>

      {/* Main Content */}
      <main className="flex-1 h-screen flex flex-col relative overflow-hidden">
        <header className="h-20 border-b border-white/5 flex items-center justify-between px-8 shrink-0 bg-[#0A0A0A]/80 backdrop-blur-md z-10">
          <h1 className="text-2xl font-black tracking-tighter">
            {activeTab === 'ONLINE' ? 'Live Online Orders' : 'Offline Point of Sales'}
          </h1>
          
          <div className="flex items-center gap-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-neutral-800 overflow-hidden flex-shrink-0">
                {currentUser?.avatar_url ? (
                  <img src={currentUser.avatar_url} alt="Kasir" className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full bg-orange-500/20 text-orange-500 flex items-center justify-center font-bold">
                    {currentUser?.name?.charAt(0) || "K"}
                  </div>
                )}
              </div>
              <div className="text-right">
                <p className="text-sm font-bold text-white">{currentUser?.name || "Kasir Pusat"}</p>
                <p className="text-[10px] text-neutral-400 uppercase tracking-widest">{currentUser?.role || "Central Cashier"} • Login: {loginTime}</p>
              </div>
            </div>
            <button 
              onClick={handleLogout}
              className="text-xs font-bold text-red-500 hover:text-red-400 uppercase tracking-widest px-4 py-2 rounded-xl bg-red-500/10 hover:bg-red-500/20 transition-colors"
            >
              Keluar
            </button>
          </div>
        </header>

        <div className="flex-1 overflow-y-auto p-8 relative">
          <AnimatePresence mode="wait">
            
            {activeTab === 'ONLINE' && (
              <motion.div key="online" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 pb-20">
                {filteredOnlineOrders.map(order => (
                  <button 
                    key={order.id} 
                    onClick={() => handleOpenOrder(order)}
                    className="bg-[#111111] hover:bg-[#151515] hover:border-orange-500/30 border border-white/5 p-6 rounded-[32px] flex flex-col text-left transition-all group"
                  >
                    <div className="flex justify-between items-start mb-4 w-full">
                      <div>
                        <span className="text-[10px] font-bold text-neutral-500 uppercase tracking-widest block mb-1">Invoice</span>
                        <span className="font-black text-orange-400 text-sm">{order.invoice_number}</span>
                      </div>
                      <span className={`text-[10px] font-black uppercase tracking-widest px-2 py-1 rounded-md ${
                        order.payment_status === 'WAITING_CONFIRMATION' ? 'bg-yellow-500/20 text-yellow-500 animate-pulse' :
                        order.order_status === 'COMPLETED' ? 'bg-emerald-500/20 text-emerald-500' : 'bg-neutral-800 text-neutral-400'
                      }`}>
                        {order.order_status !== 'PENDING' ? order.order_status : order.payment_status}
                      </span>
                    </div>

                    <div className="flex-1 w-full">
                      <h3 className="font-bold text-white text-lg truncate">{order.customer_name}</h3>
                      <p className="text-xs text-neutral-400 mb-4">{order.online_order_items?.length || 0} Items</p>
                    </div>

                    <div className="border-t border-white/5 pt-4 mt-auto w-full">
                      <div className="flex justify-between items-center">
                        <span className="text-xs font-bold text-neutral-500">Grand Total</span>
                        <span className="font-black text-lg text-white group-hover:text-orange-400 transition-colors">{formatRupiah(order.grand_total)}</span>
                      </div>
                    </div>
                  </button>
                ))}
                {filteredOnlineOrders.length === 0 && (
                  <div className="col-span-full py-20 text-center text-neutral-500 flex flex-col items-center">
                    <Receipt className="w-12 h-12 mb-4 opacity-20" />
                    <p>Tidak ada pesanan online.</p>
                  </div>
                )}
              </motion.div>
            )}

            {activeTab === 'OFFLINE' && (
              <motion.div key="offline" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="flex h-full gap-8">
                {/* Product Grid */}
                <div className="flex-1 grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 h-fit">
                  {products.map(p => {
                    const inv = inventory.find(i => i.product_id === p.product_id);
                    const stock = inv?.current_stock || 0;
                    return (
                      <button key={p.product_id} onClick={() => handleAddToCart(p)} disabled={stock <= 0} className={`p-4 rounded-2xl border text-left transition-all ${stock <= 0 ? 'bg-[#111111]/50 border-white/5 opacity-50' : 'bg-[#111111] border-white/5 hover:border-orange-500/30'}`}>
                        <div className="w-full aspect-square rounded-xl bg-black mb-3 overflow-hidden">
                          <img src={p.image} className="w-full h-full object-cover opacity-80" />
                        </div>
                        <h3 className="font-bold text-sm text-white truncate">{p.product_name}</h3>
                        <div className="flex justify-between items-center mt-2">
                          <span className="font-black text-orange-400">{formatRupiah(p.price || 0)}</span>
                          <span className="text-[10px] font-bold text-neutral-500">Stok: {stock}</span>
                        </div>
                      </button>
                    );
                  })}
                </div>

                {/* Cart Sidebar */}
                <div className="w-80 bg-[#111111] border border-white/5 rounded-3xl p-6 flex flex-col shrink-0 h-fit max-h-full">
                  <h3 className="font-black text-lg mb-4 flex items-center gap-2"><ShoppingCart className="w-5 h-5 text-orange-500" /> Current Order</h3>
                  
                  <div className="flex-1 overflow-y-auto space-y-4 mb-6">
                    {cart.map(item => (
                      <div key={item.product.product_id} className="flex items-center justify-between">
                        <div>
                          <div className="font-bold text-sm">{item.product.product_name}</div>
                          <div className="text-xs text-neutral-400">{formatRupiah(item.product.price || 0)}</div>
                        </div>
                        <div className="flex items-center gap-3 bg-[#1A1A1A] rounded-full p-1 border border-white/5">
                          <button onClick={() => handleRemoveFromCart(item.product.product_id)} className="w-6 h-6 rounded-full bg-neutral-800 flex items-center justify-center"><Minus className="w-3 h-3" /></button>
                          <span className="font-mono text-xs font-bold">{item.qty}</span>
                          <button onClick={() => handleAddToCart(item.product)} className="w-6 h-6 rounded-full bg-neutral-800 flex items-center justify-center"><Plus className="w-3 h-3" /></button>
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="border-t border-white/5 pt-4 space-y-4">
                    <div className="flex justify-between items-center">
                      <span className="text-sm font-bold text-neutral-400">Total</span>
                      <span className="font-black text-xl">{formatRupiah(offlineSubtotal)}</span>
                    </div>
                    <button onClick={confirmCashPayment} disabled={cart.length === 0 || submittingOffline} className="w-full py-4 rounded-xl bg-white text-black font-black text-sm hover:scale-105 active:scale-95 transition-transform disabled:opacity-50">
                      BAYAR TUNAI
                    </button>
                    <button onClick={confirmQrisPayment} disabled={cart.length === 0 || submittingOffline} className="w-full py-4 rounded-xl bg-orange-500 text-white font-black text-sm hover:scale-105 active:scale-95 transition-transform disabled:opacity-50">
                      BAYAR QRIS
                    </button>
                  </div>
                </div>
              </motion.div>
            )}

          </AnimatePresence>
        </div>

        {/* Slide Over Detail */}
        <AnimatePresence>
          {selectedOrder && (
            <>
              <motion.div 
                initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} 
                onClick={handleCloseOrder}
                className="absolute inset-0 bg-black/60 backdrop-blur-sm z-40" 
              />
              <motion.div 
                initial={{ x: '100%' }} animate={{ x: 0 }} exit={{ x: '100%' }}
                transition={{ type: "spring", damping: 25, stiffness: 200 }}
                className="absolute right-0 top-0 bottom-0 w-full md:w-[480px] bg-[#111111] border-l border-white/10 z-50 flex flex-col shadow-2xl"
              >
                <div className="p-6 border-b border-white/5 flex justify-between items-center bg-[#0A0A0A]/50 backdrop-blur-md">
                  <div>
                    <h3 className="font-black text-xl text-white">Detail Pesanan</h3>
                    <p className="text-sm font-mono text-orange-500">{selectedOrder.invoice_number}</p>
                  </div>
                  <button onClick={handleCloseOrder} className="w-10 h-10 rounded-full bg-white/5 hover:bg-white/10 flex items-center justify-center transition-colors">
                    <X className="w-5 h-5 text-neutral-400" />
                  </button>
                </div>
                
                <div className="flex-1 overflow-y-auto p-6 space-y-6">
                  
                  {/* Customer Info */}
                  <div className="bg-[#1A1A1A] p-5 rounded-2xl border border-white/5 space-y-4">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-full bg-orange-500/20 text-orange-500 flex items-center justify-center font-black text-xl">
                        {selectedOrder.customer_name.charAt(0)}
                      </div>
                      <div>
                        <h4 className="font-bold text-white text-lg">{selectedOrder.customer_name}</h4>
                        <div className="flex items-center gap-2 text-xs text-neutral-400">
                          <Phone className="w-3 h-3" /> {selectedOrder.customer_phone}
                        </div>
                      </div>
                    </div>
                    
                    {selectedOrder.order_type === 'DELIVERY' && (
                      <div className="pt-4 border-t border-white/5">
                        <div className="flex items-start gap-2 text-sm text-neutral-300">
                          <MapPin className="w-4 h-4 text-orange-500 shrink-0 mt-0.5" />
                          <p className="leading-relaxed">{selectedOrder.address}</p>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Order Items */}
                  <div>
                    <h4 className="text-xs font-bold text-neutral-500 uppercase tracking-widest mb-3">Daftar Produk</h4>
                    <div className="space-y-3">
                      {selectedOrder.online_order_items?.map((item: any) => (
                        <div key={item.id} className="flex justify-between items-center bg-[#18181B] p-4 rounded-xl border border-white/5">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-lg bg-neutral-800 flex items-center justify-center font-bold text-xs">{item.qty}x</div>
                            <span className="font-bold text-sm text-neutral-300">{item.product_name}</span>
                          </div>
                          <span className="font-mono text-sm font-bold text-white">{formatRupiah(item.subtotal)}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Summary */}
                  <div className="bg-[#18181B] p-5 rounded-2xl border border-white/5 space-y-3">
                    <div className="flex justify-between text-sm text-neutral-400">
                      <span>Subtotal</span>
                      <span className="font-mono">{formatRupiah(selectedOrder.grand_total - (selectedOrder.shipping_fee || 0))}</span>
                    </div>
                    <div className="flex justify-between text-sm text-neutral-400">
                      <span>Delivery Fee</span>
                      <span className="font-mono text-emerald-400">
                        {selectedOrder.shipping_fee === 0 ? 'FREE ONGKIR' : formatRupiah(selectedOrder.shipping_fee || 0)}
                      </span>
                    </div>
                    <div className="border-t border-white/5 pt-3 mt-3 flex justify-between items-center">
                      <span className="font-bold text-white">Grand Total</span>
                      <span className="font-black text-2xl text-orange-500">{formatRupiah(selectedOrder.grand_total)}</span>
                    </div>
                    <div className="flex justify-between items-center pt-2">
                      <span className="text-xs font-bold text-neutral-500 uppercase">Metode Bayar</span>
                      <span className="text-xs font-black text-cyan-400 px-2 py-1 bg-cyan-500/10 rounded-md">QRIS</span>
                    </div>
                  </div>

                </div>

                <div className="p-6 border-t border-white/5 bg-[#0A0A0A] shrink-0">
                  {selectedOrder.payment_status === 'WAITING_CONFIRMATION' && (
                    <button onClick={() => updateOrderStatus(selectedOrder.id, 'PAID', 'PROCESSING')} className="w-full py-4 rounded-2xl bg-emerald-500 text-white font-black text-sm uppercase tracking-widest hover:bg-emerald-400 transition-colors">
                      Verifikasi Pembayaran QRIS
                    </button>
                  )}
                  {selectedOrder.payment_status === 'PAID' && selectedOrder.order_status === 'PROCESSING' && (
                    <button onClick={() => updateOrderStatus(selectedOrder.id, 'PAID', 'READY_FOR_DELIVERY')} className="w-full py-4 rounded-2xl bg-orange-500 text-white font-black text-sm uppercase tracking-widest hover:bg-orange-400 transition-colors flex items-center justify-center gap-2">
                      <Package className="w-5 h-5" /> Pesanan Siap Dikirim
                    </button>
                  )}
                  {selectedOrder.order_status === 'READY_FOR_DELIVERY' && selectedOrder.order_type === 'DELIVERY' && (
                    <button onClick={() => updateOrderStatus(selectedOrder.id, 'PAID', 'ON_THE_WAY')} className="w-full py-4 rounded-2xl bg-blue-500 text-white font-black text-sm uppercase tracking-widest hover:bg-blue-400 transition-colors flex items-center justify-center gap-2">
                      <Car className="w-5 h-5" /> Kurir Berangkat
                    </button>
                  )}
                  {(selectedOrder.order_status === 'ON_THE_WAY' || (selectedOrder.order_status === 'READY_FOR_DELIVERY' && selectedOrder.order_type === 'TAKEAWAY')) && (
                    <button onClick={() => updateOrderStatus(selectedOrder.id, 'PAID', 'COMPLETED')} className="w-full py-4 rounded-2xl bg-neutral-800 text-emerald-500 font-black text-sm uppercase tracking-widest hover:bg-neutral-700 transition-colors flex items-center justify-center gap-2">
                      <CheckCircle2 className="w-5 h-5" /> Pesanan Selesai
                    </button>
                  )}
                  {selectedOrder.order_status === 'COMPLETED' && (
                    <div className="w-full py-4 rounded-2xl bg-emerald-500/10 text-emerald-500 font-black text-sm uppercase tracking-widest text-center flex items-center justify-center gap-2">
                      <CheckCircle2 className="w-5 h-5" /> Transaksi Selesai
                    </div>
                  )}
                </div>
              </motion.div>
            </>
          )}
        </AnimatePresence>

      </main>
    </div>
  );
}