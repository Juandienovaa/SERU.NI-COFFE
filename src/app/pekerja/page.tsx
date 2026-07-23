"use client";

// Pastikan halaman ini TIDAK PERNAH di-cache oleh Next.js 15
export const dynamic = 'force-dynamic';

import { useState, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "motion/react";
import { fetchAllProducts } from "@/services/productService";
import { ProductCatalogItem } from "@/types/product";
import { 
  getOutlets, 
  getLiveStockByOutlet, 
  getLiveStockByShiftId,
  bukaShift, 
  catatPenjualanProduk, 
  tutupShift,
  getActiveShiftForUser,
  transferAdditionalStock,
  getMasterInventoryStock,
  getAvailableStockForShift
} from "@/services/backendService";
import { supabase } from "@/lib/supabase";
import { LogOut, Plus, Minus, X, User, Loader2, AlertTriangle, CheckCircle2, Store, Search } from "lucide-react";
import CinematicLoader from "@/components/CinematicLoader";
import { saveActiveShift, clearActiveShift, getActiveShift } from "@/services/shiftStorageService";
import { checkActiveShiftInSupabase, syncRecordToStorageCache } from "@/services/shiftAuthService";
import CloseShiftModal from "@/components/pos/close-shift/CloseShiftModal";
import { InventoryItemSnapshot } from "@/types/shift";

// KAMUS LOKASI
export const locationMap: Record<string, string> = {
  // --- SHIFT SIANG ---
  "crew1@seruni.com": "Kaca Puri",
  "crew2@seruni.com": "Depan Bintan 21",
  "crew3@seruni.com": "Pemuda (Depan SMA 4)",
  "crew4@seruni.com": "Depan RRI (Imigrasi)",
  "crew5@seruni.com": "Ganet",
  
  // --- SHIFT MALAM ---
  "crew6@seruni.com": "Depan Gonggong",
  "crew7@seruni.com": "Depan Gedung Daerah",
  "crew8@seruni.com": "Daerah Tugu Sirih",
  "crew9@seruni.com": "Bazar TPL 2",
  "crew10@seruni.com": "Ganet",

  // --- ADMIN ---
  "admin@seruni.com": "Seruni Bintan Centre"
};

export default function WorkerDashboard() {
  const router = useRouter();
  const [authLoading, setAuthLoading] = useState(true);

  // States Utama
  const [outlets, setOutlets] = useState<any[]>([]);
  const [selectedOutlet, setSelectedOutlet] = useState<string>("");
  const [workerName, setWorkerName] = useState<string>("");
  const [shiftType, setShiftType] = useState<"pagi" | "malam">("pagi");
  const [availableStocks, setAvailableStocks] = useState<any[]>([]);
  
  const [products, setProducts] = useState<ProductCatalogItem[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [stocks, setStocks] = useState<{ productId: number; stock: number }[]>([]);

  const [activeShift, setActiveShift] = useState<any>(null);
  const [liveInventory, setLiveInventory] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  // States UI Konfirmasi (Pop-up)
  const [confirmSale, setConfirmSale] = useState<{ isOpen: boolean; productId: number | null; productName: string; paymentMethod: 'CASH' | 'QRIS' }>({ isOpen: false, productId: null, productName: "", paymentMethod: 'CASH' });
  const [restockModal, setRestockModal] = useState<{ isOpen: boolean; productId: number | null; productName: string; addedAmount: number; masterStock: number; currentShiftStock: number }>({ isOpen: false, productId: null, productName: "", addedAmount: 1, masterStock: 0, currentShiftStock: 0 });
  const [confirmClose, setConfirmClose] = useState(false);
  const [confirmOpenModal, setConfirmOpenModal] = useState(false);
  const [successOpenModal, setSuccessOpenModal] = useState(false);
  const [pendingShiftData, setPendingShiftData] = useState<any>(null);

  // Init Auth & Auto-Resume (Single Source of Truth + Fast Cache Recovery)
  useEffect(() => {
    let isMounted = true;
    async function init() {
      try {
        setAuthLoading(true);

        // 1. Cek fast cache lokal terlebih dahulu
        const fastCache = getActiveShift();
        const sessionStr = localStorage.getItem("session") || localStorage.getItem("pos_shift_session");

        if (!sessionStr && !fastCache) {
          router.replace("/kasir");
          return;
        }

        const session = sessionStr ? JSON.parse(sessionStr) : {};
        const userId = session.id || fastCache?.cashier_id || "mock-123";
        const crewName = session.nama || session.crewName || fastCache?.cashier_name || "Crew Member";
        const targetOutlet = session.lokasi || fastCache?.location_name || "";

        if (targetOutlet) setSelectedOutlet(targetOutlet);
        if (crewName) setWorkerName(crewName);

        // Jika ada fast cache aktif, set terlebih dahulu agar UI tidak berkedip (Instant Resume UX)
        if (fastCache && fastCache.active_shift_id) {
          setActiveShift(fastCache);
        }

        // 2. Verifikasi dengan Supabase sebagai Single Source of Truth
        const [outletsData, activeUserShift, invData, productsRes] = await Promise.all([
          getOutlets().catch(() => []),
          checkActiveShiftInSupabase(userId, crewName).catch(() => null),
          getAvailableStockForShift().catch(() => []),
          fetchAllProducts().catch(() => ({ success: false, data: [] }))
        ]);

        if (!isMounted) return;
        setOutlets(outletsData);
        setAvailableStocks(invData);
        
        if (productsRes.success && productsRes.data) {
          setProducts(productsRes.data);
          setStocks(prev => prev.length === 0 ? productsRes.data.map(p => ({ productId: p.product_id, stock: 0 })) : prev);
        }

        if (activeUserShift && activeUserShift.id) {
          // --- SHIFT TERBUKA DITEMUKAN DI SUPABASE ---
          const syncedCache = syncRecordToStorageCache(activeUserShift, userId, crewName);
          setSelectedOutlet(activeUserShift.outlet_id || targetOutlet);
          setWorkerName(activeUserShift.crew_name || crewName);
          setActiveShift(activeUserShift);

          let inv = await getLiveStockByShiftId(activeUserShift.id);
          if (!inv || inv.length === 0) {
            inv = activeUserShift.inventory_data || [];
          }
          if (isMounted) setLiveInventory(inv);
        } else {
          // --- TIDAK ADA SHIFT TERBUKA DI SUPABASE ---
          // Jika di localStorage masih ada cache lama padahal di DB sudah ditutup, bersihkan cache stale
          if (fastCache) {
            console.warn("[WorkerDashboard] Stale active shift terdeteksi di localStorage. Membersihkan karena DB menunjukkan CLOSED.");
            clearActiveShift();
          }
          setActiveShift(null);
        }

      } catch (err: any) {
        console.error("Init failed detail:", JSON.stringify(err, null, 2));
        console.error("Error message:", err?.message || err);
        // MATIKAN SEMENTARA agar tidak terjadi infinite loop
        // router.replace("/kasir");
      } finally {
        if (isMounted) setAuthLoading(false);
      }
    }
    init();
    return () => { isMounted = false; };
  }, [router]);

  // ================= SUPABASE REALTIME SUBSCRIPTION =================
  // Subscribe ke tabel shift_inventory agar perubahan stok langsung terefleksi di UI
  useEffect(() => {
    if (!activeShift?.id) return;

    const channel = supabase.channel(`shift_inventory_${activeShift.id}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'shift_inventory',
          filter: `shift_id=eq.${activeShift.id}`
        },
        async (payload) => {
          console.log("Realtime shift_inventory payload received!", payload);
          // Refetch fresh inventory data directly
          let freshInv = await getLiveStockByShiftId(activeShift.id);
          if (!freshInv || freshInv.length === 0) {
            freshInv = activeShift.inventory_data || [];
          }
          setLiveInventory(freshInv);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [activeShift?.id, selectedOutlet]);

  // Handler Stok Awal
  const incrementStock = (productId: number) => setStocks(prev => prev.map(s => s.productId === productId ? { ...s, stock: s.stock + 1 } : s));
  const decrementStock = (productId: number) => setStocks(prev => prev.map(s => (s.productId === productId && s.stock > 0) ? { ...s, stock: s.stock - 1 } : s));
  const handleStockChange = (productId: number, value: string, maxStock: number) => {
    let num = parseInt(value, 10);
    if (isNaN(num)) num = 0;
    if (num < 0) num = 0;
    if (num > maxStock) num = maxStock;
    setStocks(prev => prev.map(s => s.productId === productId ? { ...s, stock: num } : s));
  };

  const filteredProducts = useMemo(() => {
    if (!searchQuery) return products;
    return products.filter(p => p.product_name.toLowerCase().includes(searchQuery.toLowerCase()));
  }, [products, searchQuery]);

  // Fungsi Buka Shift (Fase Validasi)
  const handleBukaShift = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!workerName || !selectedOutlet) {
      setErrorMsg("Nama Pekerja dan Outlet harus diisi!");
      return;
    }
    setConfirmOpenModal(true);
  };

  // Fungsi Buka Shift (Fase Eksekusi)
  const executeBukaShift = async () => {
    try {
      setLoading(true); setErrorMsg("");
      
      let userId: string | null = null;
      if (typeof window !== "undefined") {
        const sessionStr = localStorage.getItem("session") || localStorage.getItem("pos_shift_session");
        if (sessionStr) {
          try {
            const parsed = JSON.parse(sessionStr);
            userId = parsed.id || parsed.cashier_id;
          } catch (e) {}
        }
      }

      if (!userId) {
        alert("Sesi login tidak valid. Silakan login ulang dengan PIN.");
        setErrorMsg("Sesi login tidak valid. Silakan login ulang dengan PIN.");
        setConfirmOpenModal(false);
        return;
      }

      const inventoryDataPayload = products.map(p => {
        const stockInput = stocks.find(s => s.productId === p.product_id)?.stock || 0;
        const invRow = availableStocks.find((a: any) => a.product_id === p.product_id);
        const name = invRow ? invRow.product_name : p.product_name;
        return { product_id: p.product_id, nama: name, stok_awal: stockInput, terjual: 0, sisa: stockInput };
      });
      const newShift = await bukaShift(userId, workerName, selectedOutlet, shiftType, inventoryDataPayload);
      
      // Simpan shift baru ke dalam fast cache localStorage (Single Source of Truth sync)
      if (newShift && newShift.id) {
        saveActiveShift({
          active_shift_id: newShift.id,
          location_id: selectedOutlet,
          location_name: selectedOutlet,
          cashier_id: newShift.user_id || userId,
          cashier_name: workerName,
          status: "OPEN",
          opened_at: newShift.created_at || new Date().toISOString(),
          shift_type: shiftType,
        });
      }

      setConfirmOpenModal(false);
      setPendingShiftData(newShift);
      setSuccessOpenModal(true);
    } catch (err: any) {
      setErrorMsg(err.message || "Gagal membuka shift.");
      setConfirmOpenModal(false);
    } finally {
      setLoading(false);
    }
  };

  // Fungsi Masuk Ke Kasir Live (Fase Transisi)
  const masukKeKasirLive = async () => {
    setSuccessOpenModal(false);
    setActiveShift(pendingShiftData);
    if (pendingShiftData && pendingShiftData.id) {
      saveActiveShift({
        active_shift_id: pendingShiftData.id,
        location_id: selectedOutlet,
        location_name: selectedOutlet,
        cashier_id: pendingShiftData.user_id || "mock-1",
        cashier_name: workerName,
        status: "OPEN",
        opened_at: pendingShiftData.created_at || new Date().toISOString(),
        shift_type: shiftType,
      });
    }
    if (pendingShiftData && pendingShiftData.id) {
      let inv = await getLiveStockByShiftId(pendingShiftData.id);
      if (!inv || inv.length === 0) {
        inv = pendingShiftData.inventory_data || [];
      }
      setLiveInventory(inv);
    } else if (selectedOutlet) {
      const inv = await getLiveStockByOutlet(selectedOutlet);
      setLiveInventory(inv);
    }
  };

  // Fungsi Jual (Dijalankan dari Modal)
  const executeJual = async () => {
    if (!activeShift || !confirmSale.productId) return;
    try {
      setLoading(true);
      const price = getPrice(confirmSale.productId);
      
      if (price <= 0) {
        throw new Error("Harga produk tidak valid (Rp0). Penjualan ditolak untuk menghindari data korup.");
      }
      
      const metodeBayar = confirmSale.paymentMethod || 'CASH';
      await catatPenjualanProduk(activeShift.id || activeShift.active_shift_id, confirmSale.productId, 1, metodeBayar, price);
      
      let inv = await getLiveStockByShiftId(activeShift.id);
      if (!inv || inv.length === 0) {
        inv = activeShift.inventory_data || [];
      }
      setLiveInventory(inv);
      // Hapus update omset_tunai manual yang lama.
      // Jika diperlukan, refetch shifts data disini, tapi biarkan Realtime update inventory.
      // Tutup modal setelah sukses
      setConfirmSale({ isOpen: false, productId: null, productName: "", paymentMethod: 'CASH' });
    } catch (err: any) {
      alert("Gagal mencatat penjualan: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  // Handler untuk membuka modal Tutup Shift dengan sinkronisasi live dari Supabase
  const handleOpenCloseShiftModal = async () => {
    if (!activeShift?.id) {
      setConfirmClose(true);
      return;
    }
    try {
      setLoading(true);
      const { data: latestShift, error } = await supabase
        .from("shifts")
        .select("omset_tunai, omset_qris, total_sales, inventory_data")
        .eq("id", activeShift.id)
        .maybeSingle();

      if (latestShift && !error) {
        setActiveShift((prev: any) => ({
          ...prev,
          omset_tunai: latestShift.omset_tunai,
          omset_qris: latestShift.omset_qris,
          total_sales: latestShift.total_sales,
          inventory_data: latestShift.inventory_data || prev.inventory_data,
        }));
        
        // Fetch fresh inventory one last time from the Single Source of Truth
        // to ensure we have the absolute latest data before closing.
        let inv = await getLiveStockByShiftId(activeShift.id);
        if (!inv || inv.length === 0) {
          inv = activeShift.inventory_data || [];
        }
        setLiveInventory(inv);
      }
    } catch (e) {
      console.error("Gagal sync data shift sebelum tutup:", e);
    } finally {
      setLoading(false);
      setConfirmClose(true);
    }
  };

  // Handler untuk membuka Modal Transfer Stok
  const handleOpenRestockModal = async (productId: number, productName: string, currentStock: number) => {
    try {
      setLoading(true);
      const mStock = await getMasterInventoryStock(productId);
      setRestockModal({
        isOpen: true,
        productId,
        productName,
        addedAmount: 1,
        masterStock: mStock,
        currentShiftStock: currentStock
      });
    } catch (err: any) {
      alert("Gagal mengecek Master Inventory: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  // Fungsi Tambah Stok (Dijalankan dari Modal Restock)
  const executeRestock = async () => {
    if (!activeShift || !restockModal.productId || restockModal.addedAmount <= 0) return;
    try {
      setLoading(true);
      
      const crewName = workerName || activeShift?.crew_name || activeShift?.cashier_name || "Crew Member";
      
      await transferAdditionalStock(
        activeShift.id || activeShift.active_shift_id,
        restockModal.productId,
        restockModal.addedAmount,
        crewName
      );
      
      let inv = await getLiveStockByShiftId(activeShift.id || activeShift.active_shift_id);
      if (!inv || inv.length === 0) {
        inv = activeShift.inventory_data || [];
      }
      setLiveInventory(inv);
      setRestockModal({ isOpen: false, productId: null, productName: "", addedAmount: 1, masterStock: 0, currentShiftStock: 0 });
    } catch (err: any) {
      alert(err.message || "Gagal mentransfer stok dari gudang.");
    } finally {
      setLoading(false);
    }
  };

  // ================= HITUNG RINGKASAN SHIFT =================
  const getPrice = (productId: any) => {
    const p = products.find(prod => String(prod.product_id) === String(productId));
    if (!p) {
      console.warn(`[getPrice] Product with ID ${productId} not found in catalog.`);
      return 0;
    }
    return typeof p.price === 'number' ? p.price : parseInt(String(p.price).replace(/\D/g, '')) || 0;
  };

  const totalOmset = liveInventory.reduce((sum, item) => sum + ((item.terjual || 0) * getPrice(item.product_id)), 0);
  const totalCupTerjual = liveInventory.reduce((sum, item) => sum + (item.terjual || 0), 0);
  const totalSisaStok = liveInventory.reduce((sum, item) => sum + (item.sisa || 0), 0);

  const formatRupiah = (num: number) => {
    return new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", maximumFractionDigits: 0 }).format(num);
  };

  const [showCloseSuccessToast, setShowCloseSuccessToast] = useState(false);

  // Handler Saat Shift Sukses Ditutup via CloseShiftModal
  const handleSuccessCloseShift = () => {
    setConfirmClose(false);
    clearActiveShift();
    setActiveShift(null);
    setLiveInventory([]);
    setShowCloseSuccessToast(true);
    setTimeout(() => {
      router.replace("/auth-pin");
    }, 1800);
  };

  const handleLogout = async () => {
    setAuthLoading(true);
    clearActiveShift();
    router.replace("/kasir");
  };

  if (authLoading) {
    return <CinematicLoader />;
  }

  return (
    <div className="min-h-screen bg-[#0A0A0A] bg-[linear-gradient(to_right,#ffffff05_1px,transparent_1px),linear-gradient(to_bottom,#ffffff05_1px,transparent_1px)] bg-[size:24px_24px] text-neutral-200 font-sans pb-24 selection:bg-[#EA580C] selection:text-white overflow-x-hidden">
      
      {/* HEADER */}
      <header className="sticky top-0 z-40 bg-[#0A0A0A]/80 backdrop-blur-xl border-b border-[#1A1A1A] px-5 py-4 flex justify-between items-center shadow-md">
        {/* Fix Logo: Ganti ke img biasa agar tidak hilang */}
        <img src="/logo-brand.png" alt="Seruni" className="h-8 md:h-10 w-auto object-contain opacity-95" loading="eager" />
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2 bg-neutral-900 rounded-full pl-2 pr-3 py-1.5 border border-neutral-800">
            <div className="w-6 h-6 rounded-full bg-neutral-800 flex items-center justify-center">
              <User className="w-3.5 h-3.5 text-[#EA580C]" />
            </div>
            <span className="text-xs font-bold text-neutral-300">
              {workerName ? workerName.split(" ")[0] : "Crew"}
            </span>
          </div>
          <button onClick={handleLogout} className="text-neutral-500 hover:text-red-500 transition-colors p-1">
            <LogOut className="w-5 h-5" />
          </button>
        </div>
      </header>

      {/* ERROR MESSAGE */}
      <AnimatePresence>
        {errorMsg && (
          <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, height: 0 }} className="px-5 mt-6 relative z-30">
            <div className="bg-red-500/10 border border-red-500/30 text-red-400 p-4 rounded-2xl font-medium text-xs flex items-center gap-3">
              <X className="w-4 h-4 shrink-0" />
              {errorMsg}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="max-w-6xl mx-auto px-5 pt-8 pb-24 w-full relative z-10">
        <AnimatePresence mode="wait">
          {!activeShift ? (
            /* ================= STATE 1: BUKA SHIFT ================= */
            <motion.div key="buka-shift" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="w-full min-h-screen bg-[#09090B] flex flex-col relative pb-28">
              
              {/* Sticky Header Baru */}
              <div className="sticky top-0 z-40 bg-[#09090B]/80 backdrop-blur-xl border-b border-white/5 px-6 py-4 flex justify-between items-center">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-neutral-900 border border-white/10 flex items-center justify-center shadow-inner">
                    <User className="w-5 h-5 text-[#F97316]" />
                  </div>
                  <div>
                    <h2 className="text-sm font-bold text-white tracking-wide">{workerName || "Crew"}</h2>
                    <div className="flex items-center gap-1.5 mt-0.5">
                      <span className="w-2 h-2 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]"></span>
                      <p className="text-[10px] text-zinc-400 font-medium uppercase tracking-widest">{selectedOutlet || "Memuat..."}</p>
                    </div>
                  </div>
                </div>
                <button onClick={handleLogout} className="w-10 h-10 rounded-full bg-white/5 hover:bg-red-500/10 flex items-center justify-center text-zinc-400 hover:text-red-500 transition-colors active:scale-95">
                  <LogOut className="w-4 h-4" />
                </button>
              </div>

              <div className="flex-1 w-full max-w-lg mx-auto px-5 pt-6 flex flex-col gap-8">
                
                {/* Summary Section */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-[#18181B] border border-white/5 rounded-[24px] p-5 shadow-[0_4px_24px_rgba(0,0,0,0.2)]">
                    <p className="text-xs font-bold text-zinc-500 uppercase tracking-widest mb-1">Produk Dipilih</p>
                    <p className="text-[34px] font-black text-white leading-none tracking-tighter">{stocks.filter(s => s.stock > 0).length} <span className="text-lg text-zinc-600 font-bold tracking-normal">Item</span></p>
                  </div>
                  <div className="bg-[#18181B] border border-white/5 rounded-[24px] p-5 shadow-[0_4px_24px_rgba(0,0,0,0.2)]">
                    <p className="text-xs font-bold text-zinc-500 uppercase tracking-widest mb-1">Total Dibawa</p>
                    <p className="text-[34px] font-black text-[#F97316] leading-none tracking-tighter">{stocks.reduce((acc, curr) => acc + curr.stock, 0)} <span className="text-lg text-zinc-600 font-bold tracking-normal">Cup</span></p>
                  </div>
                </div>

                {/* Sticky Search Bar */}
                <div className="sticky top-[76px] z-30 pt-2 pb-4 bg-[#09090B]/90 backdrop-blur-xl">
                  <div className="relative w-full group">
                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                      <Search className="w-5 h-5 text-zinc-500 group-focus-within:text-[#F97316] transition-colors" />
                    </div>
                    <input
                      type="text"
                      placeholder="Cari Produk..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="w-full bg-[#18181B] border border-white/5 text-white rounded-[20px] py-4 pl-12 pr-4 shadow-sm focus:outline-none focus:border-[#F97316]/50 focus:ring-1 focus:ring-[#F97316]/50 transition-all font-medium placeholder:text-zinc-600"
                    />
                    {searchQuery && (
                      <button type="button" onClick={() => setSearchQuery("")} className="absolute inset-y-0 right-0 pr-4 flex items-center text-zinc-500 hover:text-white">
                        <X className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </div>

                {/* Product List */}
                <div className="flex flex-col gap-6">
                  {filteredProducts.map((p, index) => {
                    const invData = availableStocks.find(a => a.product_id === p.product_id);
                    const currentStock = invData ? invData.current_stock : 0;
                    const selectedStock = stocks.find(s => s.productId === p.product_id)?.stock || 0;
                    const sisaMaster = currentStock - selectedStock;
                    const isEmpty = currentStock === 0;
                    const isLowStock = currentStock > 0 && currentStock <= 10;
                    const isMaxed = selectedStock >= currentStock;
                    
                    return (
                      <motion.div 
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: Math.min(index * 0.05, 0.5), duration: 0.3 }}
                        key={p.product_id} 
                        className={`w-full bg-[#18181B] border ${isEmpty ? 'border-red-500/10 opacity-70' : isMaxed ? 'border-[#F97316]/30' : 'border-white/5'} rounded-[24px] p-5 flex items-center gap-5 shadow-[0_8px_32px_rgba(0,0,0,0.12)] hover:shadow-[0_8px_32px_rgba(249,115,22,0.05)] transition-all`}
                      >
                        {/* Image */}
                        <div className="w-[100px] h-[100px] rounded-[18px] bg-[#09090B] border border-white/5 overflow-hidden shrink-0 relative">
                          {p.image_url || p.image ? (
                             <img src={p.image_url || p.image} alt={p.product_name} className={`w-full h-full object-cover ${isEmpty ? 'grayscale' : ''}`} loading="lazy" />
                          ) : (
                             <div className="w-full h-full flex items-center justify-center text-zinc-700 font-bold text-xs">No Image</div>
                          )}
                          {isEmpty && <div className="absolute inset-0 bg-black/50 flex items-center justify-center"><span className="text-[10px] font-black text-white tracking-widest bg-red-600 px-2 py-1 rounded">HABIS</span></div>}
                        </div>

                        {/* Content */}
                        <div className="flex-1 flex flex-col justify-center min-w-0 py-1">
                          <h3 className="text-[18px] font-bold text-white leading-tight mb-2 truncate pr-2">{p.product_name}</h3>
                          
                          <div className="flex flex-wrap items-center gap-2 mb-3">
                            {isEmpty ? (
                              <span className="px-2 py-1 rounded-md text-[10px] font-black uppercase tracking-widest bg-red-500/10 text-red-500 border border-red-500/20">Habis</span>
                            ) : isLowStock ? (
                              <span className="px-2 py-1 rounded-md text-[10px] font-black uppercase tracking-widest bg-yellow-500/10 text-yellow-500 border border-yellow-500/20">Menipis</span>
                            ) : (
                              <span className="px-2 py-1 rounded-md text-[10px] font-black uppercase tracking-widest bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">Ready</span>
                            )}
                            <span className="text-[11px] font-bold text-zinc-500 uppercase tracking-widest bg-zinc-900 px-2 py-1 rounded-md border border-zinc-800">
                              Master: <span className={sisaMaster < 10 && !isEmpty ? 'text-red-400' : 'text-zinc-300'}>{sisaMaster} Cup</span>
                            </span>
                          </div>

                          {/* Stepper */}
                          <div className="flex items-center gap-2 mt-auto">
                            <motion.button 
                              whileTap={{ scale: 0.9 }}
                              type="button" 
                              disabled={selectedStock <= 0 || isEmpty}
                              onClick={() => decrementStock(p.product_id)} 
                              className="w-11 h-11 rounded-2xl bg-[#09090B] border border-white/5 hover:bg-zinc-800 disabled:opacity-30 disabled:pointer-events-none flex items-center justify-center text-zinc-400 transition-colors shadow-inner shrink-0"
                            >
                              <Minus className="w-5 h-5" />
                            </motion.button>
                            
                            <div className="w-16 text-center">
                              <input
                                type="number"
                                inputMode="numeric"
                                value={selectedStock || ''}
                                onChange={(e) => handleStockChange(p.product_id, e.target.value, currentStock)}
                                onBlur={(e) => {
                                  if (!e.target.value) handleStockChange(p.product_id, "0", currentStock);
                                }}
                                disabled={isEmpty}
                                placeholder="0"
                                className="w-full bg-transparent text-center text-[22px] font-black text-white focus:outline-none disabled:opacity-50"
                              />
                            </div>
                            
                            <motion.button 
                              whileTap={{ scale: 0.9 }}
                              type="button" 
                              disabled={isMaxed || isEmpty}
                              onClick={() => incrementStock(p.product_id)} 
                              className="w-11 h-11 rounded-2xl bg-[#F97316]/10 border border-[#F97316]/20 hover:bg-[#F97316]/20 disabled:opacity-30 disabled:border-transparent disabled:bg-[#09090B] disabled:pointer-events-none flex items-center justify-center text-[#F97316] transition-colors shrink-0"
                            >
                              <Plus className="w-5 h-5" />
                            </motion.button>
                          </div>
                        </div>
                      </motion.div>
                    );
                  })}
                  
                  {filteredProducts.length === 0 && (
                    <div className="text-center py-12 text-zinc-600 font-medium">
                      <Search className="w-12 h-12 text-zinc-800 mx-auto mb-4" />
                      Produk tidak ditemukan.
                    </div>
                  )}
                </div>
              </div>

              {/* STICKY BOTTOM ACTION BAR */}
              <div className="fixed bottom-0 left-0 right-0 z-50 p-5 bg-[#09090B]/80 backdrop-blur-2xl border-t border-white/10">
                <div className="max-w-lg mx-auto flex items-center gap-4">
                  <div className="flex-1 bg-[#18181B] rounded-[20px] px-5 py-3 border border-white/5 flex flex-col justify-center">
                    <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest mb-0.5">Total Dipilih</span>
                    <span className="text-[20px] font-black text-white leading-none">{stocks.reduce((acc, curr) => acc + curr.stock, 0)} <span className="text-xs text-zinc-500 font-medium">Cup</span></span>
                  </div>
                  <motion.button 
                    whileTap={{ scale: 0.97 }}
                    onClick={handleBukaShift}
                    disabled={loading || stocks.reduce((acc, curr) => acc + curr.stock, 0) === 0} 
                    className="flex-[1.5] h-[64px] bg-[#F97316] hover:bg-orange-500 disabled:bg-zinc-800 disabled:text-zinc-600 text-white rounded-[20px] font-black text-sm tracking-wide shadow-[0_10px_30px_rgba(249,115,22,0.3)] disabled:shadow-none flex items-center justify-center gap-2 transition-colors uppercase"
                  >
                    {loading ? <Loader2 className="w-6 h-6 animate-spin" /> : "Buka Shift"}
                  </motion.button>
                </div>
              </div>
            </motion.div>
          ) : (
            /* ================= STATE 2: KASIR LIVE ================= */
            <motion.div key="jualan" initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }} className="w-full mb-28">
              
              <div className="bg-[#111111] border border-[#1A1A1A] p-6 rounded-3xl relative overflow-hidden mb-8 shadow-xl">
                <div className="absolute top-5 right-5 z-[60] cursor-pointer pointer-events-auto">
                  <button onClick={handleOpenCloseShiftModal} className="px-4 py-2.5 bg-red-500/10 border border-red-500/20 text-red-500 text-[10px] font-black uppercase tracking-widest rounded-xl hover:bg-red-500 hover:text-white transition-all active:scale-95">
                    Tutup Shift
                  </button>
                </div>
                <div className="flex items-center gap-2.5 mb-4 relative z-10">
                   <span className="relative flex h-3 w-3">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#10B981] opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-3 w-3 bg-[#10B981]"></span>
                   </span>
                   <span className="text-[10px] font-black text-[#10B981] tracking-widest uppercase bg-[#10B981]/10 px-2 py-1 rounded-md">Live Kasir</span>
                </div>
                <h2 className="text-2xl sm:text-3xl font-black text-white leading-tight relative z-10 pr-24">
                  {selectedOutlet || "Lokasi Unknown"}
                </h2>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {products.map((p) => {
                   const invItem = liveInventory.find(inv => inv.product_id === p.product_id);
                   const currentStock = invItem ? invItem.sisa : 0;
                   const soldCount = invItem ? invItem.terjual : 0;
                   const isEmpty = !invItem || currentStock <= 0;

                   return (
                     <div key={p.product_id} className={`bg-[#111111] border ${isEmpty ? 'border-red-500/20' : 'border-[#1A1A1A]'} p-4 rounded-3xl flex gap-5 items-center relative overflow-hidden`}>
                        {isEmpty && <div className="absolute inset-0 bg-[#0A0A0A]/50 z-10 pointer-events-none" />}
                        
                        <div className="relative w-24 h-28 rounded-2xl bg-[#1A1A1A] border border-neutral-800 shrink-0 z-0 overflow-hidden">
                          {/* Fix Image: Ganti img biasa biar tidak blank di HP */}
                          <img src={p.image} alt={p.product_name} className={`w-full h-full object-cover ${isEmpty ? 'grayscale opacity-50' : ''}`} loading="lazy" />
                        </div>
                        
                        <div className="flex-1 flex flex-col h-full py-1 z-0">
                          <h3 className={`font-black text-lg leading-tight mb-2 ${isEmpty ? 'text-neutral-500' : 'text-white'}`}>{p.product_name}</h3>
                          
                          <div className="flex flex-wrap items-center gap-2 mt-1 mb-4">
                            <div className="flex items-center gap-2">
                              <div className={`flex items-center gap-1.5 sm:gap-2 px-2 sm:px-3 py-1.5 rounded-xl border whitespace-nowrap ${isEmpty ? 'bg-red-500/5 border-red-500/10' : 'bg-[#EA580C]/5 border-[#EA580C]/10'}`}>
                                <span className="text-[10px] font-bold text-neutral-500 uppercase tracking-wider">Sisa</span>
                                <span className={`text-base font-black ${isEmpty ? 'text-red-500' : 'text-[#EA580C]'}`}>{currentStock}</span>
                              </div>
                              <button
                                onClick={() => handleOpenRestockModal(p.product_id, p.product_name, currentStock)}
                                disabled={loading}
                                className="w-8 h-8 shrink-0 flex items-center justify-center rounded-xl border border-neutral-700 bg-transparent text-neutral-400 hover:border-neutral-500 hover:text-white transition-all duration-200 active:scale-95 z-20 pointer-events-auto"
                                title="Tambah Stok"
                              >
                                <Plus className="w-4 h-4" />
                              </button>
                            </div>
                            <div className="flex items-center gap-1.5 sm:gap-2 px-2 sm:px-3 py-1.5 rounded-xl bg-[#10B981]/5 border border-[#10B981]/10 whitespace-nowrap shrink-0">
                              <span className="text-[10px] font-bold text-neutral-500 uppercase tracking-wider">Terjual</span>
                              <span className="text-base font-black text-[#10B981]">{soldCount}</span>
                            </div>
                          </div>
                          
                          {isEmpty ? (
                            <div className="flex gap-2 w-full mt-1">
                              <button disabled className="flex-1 flex items-center justify-center gap-1 py-3.5 rounded-xl font-black text-[10px] tracking-widest uppercase bg-[#1A1A1A] text-neutral-600 border border-neutral-800">
                                <X className="w-3 h-3"/> SOLD OUT
                              </button>
                              <button 
                                onClick={() => handleOpenRestockModal(p.product_id, p.product_name, currentStock)}
                                disabled={loading}
                                className="flex-1 flex items-center justify-center gap-1 py-3.5 rounded-xl font-black text-[10px] tracking-widest uppercase text-[#EA580C] border border-[#EA580C] hover:bg-[#EA580C]/10 transition-colors active:scale-95"
                              >
                                + STOK
                              </button>
                            </div>
                          ) : (
                            <button 
                              onClick={() => setConfirmSale({ isOpen: true, productId: p.product_id, productName: p.product_name, paymentMethod: 'CASH' })} 
                              disabled={loading}
                              className="w-full flex items-center justify-center gap-2 py-3.5 mt-1 rounded-xl font-black text-xs tracking-widest uppercase transition-all bg-[#EA580C] text-white active:scale-[0.95]"
                            >
                              <Plus className="w-4 h-4"/> JUAL 1 CUP
                            </button>
                          )}
                        </div>
                     </div>
                   )
                })}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* ================= MODAL KONFIRMASI JUAL ================= */}
      <AnimatePresence>
        {confirmSale.isOpen && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-sm p-5">
            <motion.div initial={{ scale: 0.9, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.9, y: 20 }} className="bg-[#111111] border border-[#1A1A1A] w-full max-w-sm rounded-3xl p-6 shadow-2xl flex flex-col items-center text-center">
              <div className="w-16 h-16 rounded-full bg-[#EA580C]/10 flex items-center justify-center mb-4">
                <CheckCircle2 className="w-8 h-8 text-[#EA580C]" />
              </div>
              <h3 className="text-xl font-black text-white mb-2">Konfirmasi Jual</h3>
              <p className="text-neutral-400 text-sm mb-6">Kurangi 1 stok <strong className="text-white">{confirmSale.productName}</strong> dari gerobak?</p>
              
              {/* PEMILIHAN METODE BAYAR */}
              <div className="w-full bg-[#1A1A1A] p-1.5 rounded-2xl border border-neutral-800 flex gap-1 mb-6">
                <button
                  type="button"
                  onClick={() => setConfirmSale(prev => ({ ...prev, paymentMethod: 'CASH' }))}
                  className={`flex-1 py-3 rounded-xl font-black text-xs uppercase tracking-wider transition-all duration-200 flex items-center justify-center gap-2 ${
                    (!confirmSale.paymentMethod || confirmSale.paymentMethod === 'CASH')
                      ? 'bg-[#10B981] text-white shadow-lg shadow-[#10B981]/20'
                      : 'text-neutral-500 hover:text-neutral-300'
                  }`}
                >
                  💵 TUNAI
                </button>
                <button
                  type="button"
                  onClick={() => setConfirmSale(prev => ({ ...prev, paymentMethod: 'QRIS' }))}
                  className={`flex-1 py-3 rounded-xl font-black text-xs uppercase tracking-wider transition-all duration-200 flex items-center justify-center gap-2 ${
                    confirmSale.paymentMethod === 'QRIS'
                      ? 'bg-[#3B82F6] text-white shadow-lg shadow-[#3B82F6]/20'
                      : 'text-neutral-500 hover:text-neutral-300'
                  }`}
                >
                  📱 QRIS
                </button>
              </div>

              <div className="flex w-full gap-3">
                <button onClick={() => setConfirmSale({ isOpen: false, productId: null, productName: "", paymentMethod: 'CASH' })} disabled={loading} className="flex-1 py-4 rounded-2xl bg-[#1A1A1A] text-white font-bold text-sm">Batal</button>
                <button onClick={executeJual} disabled={loading} className="flex-1 py-4 rounded-2xl bg-[#EA580C] text-white font-bold text-sm flex items-center justify-center gap-2">
                  {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : "Ya, Jual!"}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ================= MODAL TAMBAH STOK (RESTOCK) ================= */}
      <AnimatePresence>
        {restockModal.isOpen && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-sm p-5">
            <motion.div initial={{ scale: 0.9, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.9, y: 20 }} className="bg-[#111111] border border-[#1A1A1A] w-full max-w-sm rounded-3xl p-6 shadow-2xl flex flex-col items-center text-center">
              <div className="w-16 h-16 rounded-full bg-[#EA580C]/10 flex items-center justify-center mb-4 shrink-0">
                <Store className="w-8 h-8 text-[#EA580C]" />
              </div>
              <h3 className="text-xl font-black text-white mb-2">Transfer Stok dari Gudang</h3>
              <p className="text-neutral-400 text-sm mb-6">Ambil stok tambahan dari Master Inventory.</p>
              
              <div className="w-full bg-[#1A1A1A] rounded-2xl p-4 mb-6 text-left border border-neutral-800">
                <h4 className="font-bold text-white mb-3 border-b border-neutral-800 pb-2">{restockModal.productName}</h4>
                <div className="flex justify-between items-center mb-2">
                  <span className="text-xs text-neutral-400">Shift Stock (Sisa)</span>
                  <span className="font-bold text-white">{restockModal.currentShiftStock} Cup</span>
                </div>
                <div className="flex justify-between items-center mb-4">
                  <span className="text-xs text-neutral-400">Master Stock Available</span>
                  <span className="font-bold text-emerald-400">{restockModal.masterStock} Cup</span>
                </div>

                <div className="w-full flex items-center justify-center gap-4 pt-4 border-t border-neutral-800">
                  <button 
                    onClick={() => setRestockModal(prev => ({ ...prev, addedAmount: Math.max(1, prev.addedAmount - 1) }))}
                    className="w-12 h-12 rounded-xl bg-black border border-neutral-800 flex items-center justify-center text-neutral-400 active:bg-neutral-900"
                  >
                    <Minus className="w-5 h-5" />
                  </button>
                  <input 
                    type="number" 
                    min="1" 
                    max={restockModal.masterStock}
                    value={restockModal.addedAmount}
                    onChange={(e) => setRestockModal(prev => ({ ...prev, addedAmount: Math.min(restockModal.masterStock, Math.max(1, parseInt(e.target.value) || 1)) }))}
                    className="bg-transparent text-center text-3xl font-black text-white w-20 outline-none"
                  />
                  <button 
                    onClick={() => setRestockModal(prev => ({ ...prev, addedAmount: Math.min(restockModal.masterStock, prev.addedAmount + 1) }))}
                    className="w-12 h-12 rounded-xl bg-[#EA580C]/10 border border-[#EA580C]/20 flex items-center justify-center text-[#EA580C] active:bg-[#EA580C]/20"
                  >
                    <Plus className="w-5 h-5" />
                  </button>
                </div>
              </div>

              <div className="flex w-full gap-3">
                <button onClick={() => setRestockModal({ isOpen: false, productId: null, productName: "", addedAmount: 1, masterStock: 0, currentShiftStock: 0 })} disabled={loading} className="flex-1 py-4 rounded-2xl bg-[#1A1A1A] text-white font-bold text-sm">Batal</button>
                <button 
                  onClick={executeRestock} 
                  disabled={loading || restockModal.addedAmount > restockModal.masterStock || restockModal.addedAmount <= 0} 
                  className="flex-1 py-4 rounded-2xl bg-[#EA580C] text-white font-bold text-sm flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : "Transfer"}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ================= MODAL KONFIRMASI & AUDIT TUTUP SHIFT (ENTERPRISE POS) ================= */}
      <CloseShiftModal
        isOpen={confirmClose}
        onClose={() => setConfirmClose(false)}
        onSuccessClose={handleSuccessCloseShift}
        shiftId={activeShift?.id || activeShift?.active_shift_id || ""}
        shiftName={activeShift?.shift_name || "Shift POS Reguler"}
        cashierName={workerName || activeShift?.crew_name || activeShift?.cashier_name || "Crew Member"}
        locationName={selectedOutlet || activeShift?.outlet_id || activeShift?.location_name || "Seruling Pasar"}
        openTime={activeShift?.created_at || activeShift?.opened_at || new Date().toISOString()}
        cashRevenue={Number(activeShift?.omset_tunai || activeShift?.cash_revenue || totalOmset)}
        qrisRevenue={Number(activeShift?.omset_qris || activeShift?.qris_revenue || 0)}
        totalTransactions={Number(activeShift?.total_transactions || totalCupTerjual || 1)}
        inventoryData={(liveInventory as InventoryItemSnapshot[]) || []}
      />

      {/* ================= TOAST SUKSES TUTUP SHIFT ================= */}
      <AnimatePresence>
        {showCloseSuccessToast && (
          <motion.div
            initial={{ opacity: 0, y: 50, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 50, scale: 0.9 }}
            className="fixed bottom-6 right-6 z-[200] bg-gradient-to-r from-emerald-950 via-neutral-900 to-black border-2 border-emerald-500 text-white px-6 py-4 rounded-2xl shadow-[0_10px_40px_rgba(16,185,129,0.3)] flex items-center gap-3.5"
          >
            <div className="w-10 h-10 rounded-xl bg-emerald-500 text-black flex items-center justify-center shrink-0 font-black shadow-lg text-lg">
              ✓
            </div>
            <div>
              <p className="text-sm font-black text-white">✅ Shift Berhasil Ditutup</p>
              <p className="text-xs text-emerald-200">Data finansial terekam. Mengalihkan ke halaman login PIN...</p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ================= MODAL KONFIRMASI BUKA SHIFT ================= */}
      <AnimatePresence>
        {confirmOpenModal && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-sm p-5">
            <motion.div initial={{ scale: 0.9, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.9, y: 20 }} className="bg-[#111111] border border-[#1A1A1A] w-full max-w-sm rounded-3xl p-6 shadow-2xl flex flex-col items-center text-center">
              <div className="w-16 h-16 rounded-full bg-[#EA580C]/10 flex items-center justify-center mb-4">
                <Store className="w-8 h-8 text-[#EA580C]" />
              </div>
              <h3 className="text-xl font-black text-white mb-2">Konfirmasi Buka Shift</h3>
              <p className="text-neutral-400 text-sm mb-8">Pastikan stok awal yang Anda masukkan sudah benar.</p>
              
              <div className="flex w-full gap-3">
                <button onClick={() => setConfirmOpenModal(false)} disabled={loading} className="flex-1 py-4 rounded-2xl bg-[#1A1A1A] text-white font-bold text-sm">Batal</button>
                <button onClick={executeBukaShift} disabled={loading} className="flex-1 py-4 rounded-2xl bg-[#EA580C] text-white font-bold text-sm flex items-center justify-center gap-2">
                  {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : "Ya, Buka Shift"}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ================= MODAL SUKSES BUKA SHIFT ================= */}
      <AnimatePresence>
        {successOpenModal && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-sm p-5">
            <motion.div initial={{ scale: 0.9, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.9, y: 20 }} className="bg-[#111111] border border-[#10B981]/20 w-full max-w-sm rounded-3xl p-6 shadow-2xl flex flex-col items-center text-center">
              <div className="w-16 h-16 rounded-full bg-[#10B981]/10 flex items-center justify-center mb-4">
                <CheckCircle2 className="w-8 h-8 text-[#10B981]" />
              </div>
              <h3 className="text-xl font-black text-white mb-2">Pembukaan Shift Sukses!</h3>
              <p className="text-neutral-400 text-sm mb-8">Selamat bekerja dan semangat capai target hari ini!</p>
              
              <button onClick={masukKeKasirLive} className="w-full py-4 rounded-2xl bg-[#EA580C] text-white font-bold text-sm flex items-center justify-center gap-2">
                Mulai Jualan
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* FOOTER */}
      <footer className="w-full text-center py-8 mt-12 border-t border-[#1A1A1A] text-neutral-600 text-xs font-medium uppercase tracking-widest">
        © {new Date().getFullYear()} Seru.ni Coffee • Sistem Kasir Internal
      </footer>
    </div>
  );
}