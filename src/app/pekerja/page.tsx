"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "motion/react";
import { products } from "@/app/produk/data";
import { 
  getOutlets, 
  getLiveStockByOutlet, 
  bukaShift, 
  catatPenjualanProduk, 
  tutupShift,
  getActiveShiftForUser,
  tambahStokProduk
} from "@/services/backendService";
import { supabase } from "@/lib/supabase";
import { LogOut, Plus, Minus, X, User, Loader2, AlertTriangle, CheckCircle2, Store } from "lucide-react";
import CinematicLoader from "@/components/CinematicLoader";

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
  const [userEmail, setUserEmail] = useState<string>("");
  const [workerName, setWorkerName] = useState<string>("");
  const [shiftType, setShiftType] = useState<"pagi" | "malam">("pagi");
  
  const [stocks, setStocks] = useState<{ productId: number; stock: number }[]>(
    products.map(p => ({ productId: p.id, stock: 0 }))
  );

  const [activeShift, setActiveShift] = useState<any>(null);
  const [liveInventory, setLiveInventory] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  // States UI Konfirmasi (Pop-up)
  const [confirmSale, setConfirmSale] = useState<{ isOpen: boolean; productId: number | null; productName: string }>({ isOpen: false, productId: null, productName: "" });
  const [restockModal, setRestockModal] = useState<{ isOpen: boolean; productId: number | null; productName: string; addedAmount: number }>({ isOpen: false, productId: null, productName: "", addedAmount: 1 });
  const [confirmClose, setConfirmClose] = useState(false);
  const [confirmOpenModal, setConfirmOpenModal] = useState(false);
  const [successOpenModal, setSuccessOpenModal] = useState(false);
  const [pendingShiftData, setPendingShiftData] = useState<any>(null);

  // Init Auth & Auto-Resume
  useEffect(() => {
    let isMounted = true;
    async function init() {
      try {
        setAuthLoading(true);
        const { data: { session } } = await supabase.auth.getSession();
        
        if (!session) {
          router.push("/login");
          return;
        }

        const userId = session.user.id;
        const email = session.user.email || "";
        setUserEmail(email);
        
        const mappedLocation = locationMap[email];
        if (mappedLocation) {
          setSelectedOutlet(mappedLocation);
        }

        const [outletsData, activeUserShift] = await Promise.all([
          getOutlets().catch(() => []),
          getActiveShiftForUser(userId).catch(() => null)
        ]);

        if (!isMounted) return;
        setOutlets(outletsData);

        if (activeUserShift) {
          setSelectedOutlet(activeUserShift.outlet_id);
          setWorkerName(activeUserShift.crew_name);
          setActiveShift(activeUserShift);
          
          const inv = await getLiveStockByOutlet(activeUserShift.outlet_id);
          if (isMounted) setLiveInventory(inv);
        }

      } catch (err: any) {
        console.error("Init failed:", err);
      } finally {
        if (isMounted) setAuthLoading(false);
      }
    }
    init();
    return () => { isMounted = false; };
  }, [router]);

  // Handler Stok Awal
  const incrementStock = (productId: number) => setStocks(prev => prev.map(s => s.productId === productId ? { ...s, stock: s.stock + 1 } : s));
  const decrementStock = (productId: number) => setStocks(prev => prev.map(s => (s.productId === productId && s.stock > 0) ? { ...s, stock: s.stock - 1 } : s));

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
      const inventoryDataPayload = products.map(p => {
        const stockInput = stocks.find(s => s.productId === p.id)?.stock || 0;
        return { product_id: p.id, nama: p.name, stok_awal: stockInput, terjual: 0, sisa: stockInput };
      });
      const newShift = await bukaShift(workerName, selectedOutlet, shiftType, inventoryDataPayload);
      
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
    if (selectedOutlet) {
      const inv = await getLiveStockByOutlet(selectedOutlet);
      setLiveInventory(inv);
    }
  };

  // Fungsi Jual (Dijalankan dari Modal)
  const executeJual = async () => {
    if (!activeShift || !confirmSale.productId) return;
    try {
      setLoading(true);
      await catatPenjualanProduk(activeShift.id, confirmSale.productId, 1);
      const inv = await getLiveStockByOutlet(selectedOutlet);
      setLiveInventory(inv);
      // Tutup modal setelah sukses
      setConfirmSale({ isOpen: false, productId: null, productName: "" });
    } catch (err: any) {
      alert("Gagal mencatat penjualan: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  // Fungsi Tambah Stok (Dijalankan dari Modal Restock)
  const executeRestock = async () => {
    if (!activeShift || !restockModal.productId || restockModal.addedAmount <= 0) return;
    try {
      setLoading(true);
      await tambahStokProduk(activeShift.id, restockModal.productId, restockModal.addedAmount);
      const inv = await getLiveStockByOutlet(selectedOutlet);
      setLiveInventory(inv);
      setRestockModal({ isOpen: false, productId: null, productName: "", addedAmount: 1 });
    } catch (err: any) {
      alert("Gagal menambahkan stok: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  // ================= HITUNG RINGKASAN SHIFT =================
  const getPrice = (productId: any) => {
    const p = products.find(prod => String(prod.id) === String(productId));
    if (!p) return 0;
    return typeof p.price === 'number' ? p.price : parseInt(String(p.price).replace(/\D/g, '')) || 0;
  };

  const totalOmset = liveInventory.reduce((sum, item) => sum + ((item.terjual || 0) * getPrice(item.product_id)), 0);
  const totalCupTerjual = liveInventory.reduce((sum, item) => sum + (item.terjual || 0), 0);
  const totalSisaStok = liveInventory.reduce((sum, item) => sum + (item.sisa || 0), 0);

  const formatRupiah = (num: number) => {
    return new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", maximumFractionDigits: 0 }).format(num);
  };

  // Fungsi Tutup Shift (Dijalankan dari Modal)
  const executeTutupShift = async () => {
    if (!activeShift) return;
    try {
      setLoading(true);
      await tutupShift(activeShift.id, totalOmset, liveInventory);
      setActiveShift(null);
      setLiveInventory([]);
      setConfirmClose(false);
    } catch (err: any) {
      alert("Gagal menutup shift: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    setAuthLoading(true);
    await supabase.auth.signOut();
    router.push("/login");
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
            <motion.div key="buka-shift" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} className="w-full">
              
              {/* HERO BANNER */}
              <div className="relative w-full h-48 md:h-64 rounded-3xl overflow-hidden mb-8 shadow-2xl">
                <img src="/hero-menu.jpeg" alt="Hero" className="w-full h-full object-cover" loading="lazy" />
                <div className="absolute inset-0 bg-gradient-to-r from-black via-black/80 to-transparent" />
                <div className="absolute inset-0 flex flex-col justify-center p-8 md:p-12">
                  <div className="flex items-center gap-2 mb-3">
                    <span className="w-8 h-[2px] bg-[#EA580C]" />
                    <h2 className="text-xs font-black text-[#EA580C] uppercase tracking-[0.3em]">Portal Sistem</h2>
                  </div>
                  <h1 className="text-3xl md:text-5xl font-black text-white leading-tight tracking-tight">SELAMAT DATANG<br/>CREW</h1>
                </div>
              </div>

              {/* FORM SECTION */}
              <form onSubmit={handleBukaShift} className="w-full">
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 md:gap-10 items-start">
                  
                  {/* KOLOM KIRI (5 KOLOM): DATA CREW */}
                  <div className="lg:col-span-5 space-y-6 bg-[#111] p-6 md:p-8 rounded-3xl border border-white/5 shadow-xl">
                    <div className="flex flex-col gap-2">
                      <label className="text-[10px] font-black text-neutral-500 uppercase tracking-widest ml-1">Lokasi Tugas (Otomatis)</label>
                      <div className="w-full bg-[#1A1A1A] border border-neutral-800 rounded-2xl px-5 py-4 text-white text-sm font-bold flex items-center gap-3">
                        <span className="text-xl">📍</span> 
                        {selectedOutlet ? <span>{selectedOutlet}</span> : <span className="text-red-400">Akun tidak memiliki lokasi tugas</span>}
                      </div>
                    </div>
                    
                    <div className="flex flex-col gap-2">
                      <label className="text-[10px] font-black text-neutral-500 uppercase tracking-widest ml-1">Tipe Shift</label>
                      <div className="relative flex w-full bg-[#1A1A1A] p-1 rounded-2xl border border-neutral-800">
                        <div className={`absolute top-1 bottom-1 w-[calc(50%-4px)] bg-[#EA580C] rounded-xl transition-all duration-300 ease-in-out shadow-md ${shiftType === 'pagi' ? 'left-1' : 'left-[calc(50%+2px)]'}`}></div>
                        <button 
                          type="button" 
                          onClick={() => setShiftType('pagi')}
                          className={`relative z-10 w-1/2 py-3.5 text-sm font-bold tracking-wide rounded-xl transition-colors duration-300 ${shiftType === 'pagi' ? 'text-white' : 'text-neutral-500 hover:text-neutral-300'}`}
                        >
                          Pagi
                        </button>
                        <button 
                          type="button" 
                          onClick={() => setShiftType('malam')}
                          className={`relative z-10 w-1/2 py-3.5 text-sm font-bold tracking-wide rounded-xl transition-colors duration-300 ${shiftType === 'malam' ? 'text-white' : 'text-neutral-500 hover:text-neutral-300'}`}
                        >
                          Malam
                        </button>
                      </div>
                    </div>

                    <div className="flex flex-col gap-2">
                      <label className="text-[10px] font-black text-neutral-500 uppercase tracking-widest ml-1">Nama Crew</label>
                      <input 
                        type="text" 
                        placeholder="Masukkan nama Anda..."
                        value={workerName}
                        onChange={(e) => setWorkerName(e.target.value)}
                        className="bg-[#1A1A1A] text-white border border-neutral-800 rounded-2xl px-6 py-4 w-full focus:ring-2 focus:ring-[#EA580C] focus:border-[#EA580C] transition-all outline-none text-sm font-bold"
                      />
                    </div>

                    <button type="submit" disabled={loading} className="w-full mt-6 py-4 bg-[#EA580C] hover:bg-[#d04e0a] text-white text-sm font-bold rounded-2xl tracking-widest uppercase transition-all whitespace-nowrap flex justify-center items-center gap-3 disabled:opacity-50">
                      {loading ? <div className="w-5 h-5 rounded-full border-2 border-white/20 border-t-white animate-spin" /> : "BUKA SHIFT SEKARANG"}
                    </button>
                  </div>

                  {/* KOLOM KANAN (7 KOLOM): STOK CUP */}
                  <div className="lg:col-span-7 bg-[#111] p-6 md:p-8 rounded-3xl border border-white/5 shadow-xl">
                    <label className="text-[10px] font-black text-[#EA580C] uppercase tracking-widest ml-1 block flex items-center gap-2 mb-6">
                      <div className="w-1.5 h-1.5 rounded-full bg-[#EA580C]" /> Hitung Stok Awal Cup
                    </label>
                    
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      {products.map((p) => (
                        <div key={p.id} className="flex items-center justify-between bg-[#0A0A0A] border border-neutral-800 rounded-2xl p-3">
                          <div className="flex items-center gap-4">
                            <div className="relative w-12 h-12 rounded-xl bg-[#1A1A1A] border border-neutral-800 overflow-hidden shrink-0">
                              <img src={p.image} alt={p.name} className="w-full h-full object-cover" loading="lazy" />
                            </div>
                            <span className="text-xs font-bold text-white max-w-[80px] truncate">{p.name}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <button type="button" onClick={() => decrementStock(p.id)} className="w-8 h-8 rounded-xl bg-[#1A1A1A] border border-neutral-800 flex items-center justify-center text-neutral-400 active:bg-neutral-800">
                              <Minus className="w-3 h-3" />
                            </button>
                            <input 
                              type="number"
                              min="0"
                              value={String(stocks.find(s => s.productId === p.id)?.stock || 0)}
                              onChange={(e) => {
                                // Hapus angka 0 di depan agar tidak menumpuk jadi "034"
                                const rawValue = e.target.value.replace(/^0+/, '');
                                const val = parseInt(rawValue);
                                setStocks(prev => prev.map(s => s.productId === p.id ? { ...s, stock: isNaN(val) ? 0 : Math.max(0, val) } : s));
                              }}
                              className="w-8 p-0 m-0 text-center text-sm font-black text-white bg-transparent outline-none focus:ring-0 border-none [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                            />
                            <button type="button" onClick={() => incrementStock(p.id)} className="w-8 h-8 rounded-xl bg-[#EA580C]/10 border border-[#EA580C]/20 flex items-center justify-center text-[#EA580C] active:bg-[#EA580C]/20">
                              <Plus className="w-3 h-3" />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

              </form>
            </motion.div>
          ) : (
            /* ================= STATE 2: KASIR LIVE ================= */
            <motion.div key="jualan" initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }} className="w-full mb-28">
              
              <div className="bg-[#111111] border border-[#1A1A1A] p-6 rounded-3xl relative overflow-hidden mb-8 shadow-xl">
                <div className="absolute top-5 right-5 z-[60] cursor-pointer pointer-events-auto">
                  <button onClick={() => setConfirmClose(true)} className="px-4 py-2.5 bg-red-500/10 border border-red-500/20 text-red-500 text-[10px] font-black uppercase tracking-widest rounded-xl hover:bg-red-500 hover:text-white transition-all active:scale-95">
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
                   const invItem = liveInventory.find(inv => inv.product_id === p.id);
                   const currentStock = invItem ? invItem.sisa : 0;
                   const soldCount = invItem ? invItem.terjual : 0;
                   const isEmpty = !invItem || currentStock <= 0;

                   return (
                     <div key={p.id} className={`bg-[#111111] border ${isEmpty ? 'border-red-500/20' : 'border-[#1A1A1A]'} p-4 rounded-3xl flex gap-5 items-center relative overflow-hidden`}>
                        {isEmpty && <div className="absolute inset-0 bg-[#0A0A0A]/50 z-10 pointer-events-none" />}
                        
                        <div className="relative w-24 h-28 rounded-2xl bg-[#1A1A1A] border border-neutral-800 shrink-0 z-0 overflow-hidden">
                          {/* Fix Image: Ganti img biasa biar tidak blank di HP */}
                          <img src={p.image} alt={p.name} className={`w-full h-full object-cover ${isEmpty ? 'grayscale opacity-50' : ''}`} loading="lazy" />
                        </div>
                        
                        <div className="flex-1 flex flex-col h-full py-1 z-0">
                          <h3 className={`font-black text-lg leading-tight mb-2 ${isEmpty ? 'text-neutral-500' : 'text-white'}`}>{p.name}</h3>
                          
                          <div className="flex items-center gap-3 mt-1 mb-4">
                            <div className="flex items-center gap-2">
                              <div className={`flex items-center gap-2 px-3 py-1.5 rounded-xl border ${isEmpty ? 'bg-red-500/5 border-red-500/10' : 'bg-[#EA580C]/5 border-[#EA580C]/10'}`}>
                                <span className="text-[10px] font-bold text-neutral-500 uppercase tracking-wider">Sisa</span>
                                <span className={`text-base font-black ${isEmpty ? 'text-red-500' : 'text-[#EA580C]'}`}>{currentStock}</span>
                              </div>
                              <button
                                onClick={() => setRestockModal({ isOpen: true, productId: p.id, productName: p.name, addedAmount: 1 })}
                                disabled={loading}
                                className="w-8 h-8 flex items-center justify-center rounded-xl border border-neutral-700 bg-transparent text-neutral-400 hover:border-neutral-500 hover:text-white transition-all duration-200 active:scale-95 z-20 pointer-events-auto"
                                title="Tambah Stok"
                              >
                                <Plus className="w-4 h-4" />
                              </button>
                            </div>
                            <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-[#10B981]/5 border border-[#10B981]/10">
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
                                onClick={() => setRestockModal({ isOpen: true, productId: p.id, productName: p.name, addedAmount: 1 })}
                                disabled={loading}
                                className="flex-1 flex items-center justify-center gap-1 py-3.5 rounded-xl font-black text-[10px] tracking-widest uppercase text-[#EA580C] border border-[#EA580C] hover:bg-[#EA580C]/10 transition-colors active:scale-95"
                              >
                                + STOK
                              </button>
                            </div>
                          ) : (
                            <button 
                              onClick={() => setConfirmSale({ isOpen: true, productId: p.id, productName: p.name })} 
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
              <p className="text-neutral-400 text-sm mb-8">Kurangi 1 stok <strong className="text-white">{confirmSale.productName}</strong> dari gerobak?</p>
              
              <div className="flex w-full gap-3">
                <button onClick={() => setConfirmSale({ isOpen: false, productId: null, productName: "" })} disabled={loading} className="flex-1 py-4 rounded-2xl bg-[#1A1A1A] text-white font-bold text-sm">Batal</button>
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
              <div className="w-16 h-16 rounded-full bg-[#EA580C]/10 flex items-center justify-center mb-4">
                <Plus className="w-8 h-8 text-[#EA580C]" />
              </div>
              <h3 className="text-xl font-black text-white mb-2">Tambah Stok Baru</h3>
              <p className="text-neutral-400 text-sm mb-6">Berapa banyak stok <strong className="text-white">{restockModal.productName}</strong> yang ingin ditambahkan?</p>
              
              <div className="w-full flex items-center justify-center gap-4 mb-8">
                <button 
                  onClick={() => setRestockModal(prev => ({ ...prev, addedAmount: Math.max(1, prev.addedAmount - 1) }))}
                  className="w-12 h-12 rounded-xl bg-[#1A1A1A] border border-neutral-800 flex items-center justify-center text-neutral-400 active:bg-neutral-800"
                >
                  <Minus className="w-5 h-5" />
                </button>
                <input 
                  type="number" 
                  min="1" 
                  value={restockModal.addedAmount}
                  onChange={(e) => setRestockModal(prev => ({ ...prev, addedAmount: parseInt(e.target.value) || 1 }))}
                  className="bg-transparent text-center text-3xl font-black text-white w-20 outline-none"
                />
                <button 
                  onClick={() => setRestockModal(prev => ({ ...prev, addedAmount: prev.addedAmount + 1 }))}
                  className="w-12 h-12 rounded-xl bg-[#EA580C]/10 border border-[#EA580C]/20 flex items-center justify-center text-[#EA580C] active:bg-[#EA580C]/20"
                >
                  <Plus className="w-5 h-5" />
                </button>
              </div>

              <div className="flex w-full gap-3">
                <button onClick={() => setRestockModal({ isOpen: false, productId: null, productName: "", addedAmount: 1 })} disabled={loading} className="flex-1 py-4 rounded-2xl bg-[#1A1A1A] text-white font-bold text-sm">Batal</button>
                <button onClick={executeRestock} disabled={loading} className="flex-1 py-4 rounded-2xl bg-[#EA580C] text-white font-bold text-sm flex items-center justify-center gap-2">
                  {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : "Simpan Stok"}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ================= MODAL KONFIRMASI TUTUP SHIFT ================= */}
      <AnimatePresence>
        {confirmClose && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-sm p-5">
            <motion.div initial={{ scale: 0.9, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.9, y: 20 }} className="bg-[#111111] border border-red-500/20 w-full max-w-sm rounded-3xl p-6 shadow-2xl flex flex-col items-center text-center">
              <div className="w-16 h-16 rounded-full bg-red-500/10 flex items-center justify-center mb-4">
                <AlertTriangle className="w-8 h-8 text-red-500" />
              </div>
              <h3 className="text-xl font-black text-white mb-2">Tutup Shift Sekarang?</h3>
              <p className="text-neutral-400 text-xs mb-6">Data stok akhir akan dikunci dan Anda akan keluar dari mode kasir.</p>
              
              <div className="w-full bg-[#1A1A1A] border border-neutral-800 rounded-2xl p-4 mb-8">
                <div className="flex justify-between items-center pb-3 border-b border-neutral-800">
                  <span className="text-xs font-bold text-neutral-500">Total Omset</span>
                  <span className="text-sm font-black text-[#EA580C]">{formatRupiah(totalOmset)}</span>
                </div>
                <div className="flex justify-between items-center py-3 border-b border-neutral-800">
                  <span className="text-xs font-bold text-neutral-500">Cup Terjual</span>
                  <span className="text-sm font-black text-[#10B981]">{totalCupTerjual} Cup</span>
                </div>
                <div className="flex justify-between items-center pt-3">
                  <span className="text-xs font-bold text-neutral-500">Sisa Stok Fisik</span>
                  <span className="text-sm font-black text-red-500">{totalSisaStok} Item</span>
                </div>
              </div>

              <div className="flex w-full gap-3">
                <button onClick={() => setConfirmClose(false)} disabled={loading} className="flex-1 py-4 rounded-2xl bg-[#1A1A1A] text-white font-bold text-sm hover:bg-neutral-800 transition-colors">Batal</button>
                <button onClick={executeTutupShift} disabled={loading} className="flex-1 py-4 rounded-2xl bg-red-500 text-white font-bold text-sm flex items-center justify-center gap-2 hover:bg-red-600 transition-colors">
                  {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : "Konfirmasi Tutup"}
                </button>
              </div>
            </motion.div>
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