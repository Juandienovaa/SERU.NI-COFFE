"use client";

import { useEffect, useState } from "react";
import Lenis from "lenis";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowLeft, X, ShoppingCart, Plus, Minus, Trash2, Filter, Coffee, Leaf, MapPin, ChevronRight, Loader2 } from "lucide-react";
import Image from "next/image";
import { Playfair_Display, Montserrat } from "next/font/google";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import ProductCard from "@/components/ProductCard";
import { products, Product } from "./data";
import { supabase } from "@/lib/supabase";
import { getOutlets } from "@/app/actions/legacyActions";

const playfair = Playfair_Display({ subsets: ["latin"], style: ["normal", "italic"], weight: ["400", "700"] });
const montserrat = Montserrat({ subsets: ["latin"], weight: ["600", "700", "900"] });

interface CartItem {
  product: Product;
  quantity: number;
}

type FilterCategory = "All" | "Coffee" | "Non-Coffee";

export default function ProdukPage() {
  useEffect(() => {
    const lenis = new Lenis({
      duration: 1.2,
      easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
      orientation: "vertical",
      smoothWheel: true,
    });
    function raf(time: number) {
      lenis.raf(time);
      requestAnimationFrame(raf);
    }
    requestAnimationFrame(raf);
    return () => lenis.destroy();
  }, []);

  const [filter, setFilter] = useState<FilterCategory>("All");
  const filteredProducts = products.filter((p) =>
    filter === "All" ? true : p.category === filter
  );

  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [checkoutStep, setCheckoutStep] = useState<"cart" | "checkout">("cart");
  const [customerName, setCustomerName] = useState("");
  const [selectedOutlet, setSelectedOutlet] = useState("");
  const [isLocationModalOpen, setIsLocationModalOpen] = useState(false);
  const [activeOutlets, setActiveOutlets] = useState<{ id: string; name: string }[]>([]);
  const [isLoadingOutlets, setIsLoadingOutlets] = useState(true);
  const [toastMsg, setToastMsg] = useState("");
  const [liveInventory, setLiveInventory] = useState<any[]>([]);

  const showToast = (msg: string) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(""), 3000);
  };

  useEffect(() => {
    async function fetchActiveOutlets() {
      try {
        setIsLoadingOutlets(true);
        const { data: shifts, error: shiftError } = await supabase
          .from('shifts')
          .select('outlet_id')
          .eq('status', 'OPEN')
          .is('closed_at', null);

        if (shiftError) throw shiftError;
        
        if (!shifts || shifts.length === 0) {
          setActiveOutlets([]);
          return;
        }
        
        const activeOutletIds = [...new Set(shifts.map(s => s.outlet_id))];
        const active = activeOutletIds.map(name => ({ id: name, name: name }));
        setActiveOutlets(active);

      } catch (err) {
        console.error("Failed to fetch active outlets:", err);
        setActiveOutlets([]);
      } finally {
        setIsLoadingOutlets(false);
      }
    }
    fetchActiveOutlets();
  }, []);

  useEffect(() => {
    if (!selectedOutlet) {
      setLiveInventory([]);
      return;
    }
    async function fetchInventory() {
      try {
        const { data, error } = await supabase
          .from("shifts")
          .select("inventory_data")
          .eq("outlet_id", selectedOutlet)
          .eq("status", "OPEN")
          .maybeSingle();

        if (error) throw error;
        if (data && data.inventory_data) {
          setLiveInventory(data.inventory_data);
        } else {
          setLiveInventory([]);
        }
      } catch (err) {
        console.error("Error fetching live inventory:", err);
      }
    }
    fetchInventory();
  }, [selectedOutlet]);

  const handleSelectOutlet = (locName: string) => {
    if (selectedOutlet !== locName && cartItems.length > 0) {
      setCartItems([]);
      showToast("Keranjang dikosongkan karena ganti lokasi.");
    }
    setSelectedOutlet(locName);
    setIsLocationModalOpen(false);
  };

  const addToCart = (product: Product) => {
    if (!selectedOutlet) {
      showToast("Pilih lokasi gerobak terlebih dahulu");
      setIsLocationModalOpen(true);
      return;
    }

    const stockData = liveInventory.find((item: any) => item.product_id === product.id);
    const currentStock = stockData ? stockData.sisa : 0;
    const isSoldOut = currentStock <= 0;

    if (isSoldOut) {
      showToast("Mohon maaf, produk ini sudah habis!");
      return;
    }

    setCartItems((prev) => {
      const existing = prev.find((c) => c.product.id === product.id);
      if (existing) {
        if (existing.quantity >= currentStock) {
          showToast(`Maksimal stok tersisa hanya ${currentStock} cup!`);
          return prev;
        }
        return prev.map((c) => c.product.id === product.id ? { ...c, quantity: c.quantity + 1 } : c);
      }
      return [...prev, { product, quantity: 1 }];
    });
    setIsCartOpen(true);
  };

  const increment = (id: number) => {
    const stockData = liveInventory.find((item: any) => item.product_id === id);
    const maxStock = stockData ? stockData.sisa : 0;
    
    setCartItems((prev) => prev.map((c) => {
      if (c.product.id === id) {
        if (c.quantity >= maxStock) {
          showToast(`Maksimal stok tersisa hanya ${maxStock} cup!`);
          return c;
        }
        return { ...c, quantity: c.quantity + 1 };
      }
      return c;
    }));
  };
  const decrement = (id: number) => setCartItems((prev) => prev.map((c) => c.product.id === id && c.quantity > 1 ? { ...c, quantity: c.quantity - 1 } : c).filter((c) => c.quantity > 0));
  const removeItem = (id: number) => setCartItems((prev) => prev.filter((c) => c.product.id !== id));
  const clearCart = () => setCartItems([]);

  const getNumericPrice = (priceVal: string | number) => {
    if (typeof priceVal === 'number') return priceVal;
    return parseInt(priceVal.replace(/\D/g, "")) || 0;
  };

  const totalPrice = cartItems.reduce((sum, ci) => sum + (getNumericPrice(ci.product.price) * ci.quantity), 0);
  const formatRupiah = (num: number) => "Rp " + num.toLocaleString("id-ID");

  const whatsappLink = () => {
    if (!customerName.trim() || !selectedOutlet) return "#";
    const list = cartItems.map((ci) => `- ${ci.product.name} x${ci.quantity}`).join("%0A");
    const text = `Halo Seru.ni, saya *${customerName}* ingin memesan di outlet *${selectedOutlet}*.%0A%0A*Pesanan:*%0A${list}%0A%0A*Total: ${formatRupiah(totalPrice)}*%0A%0AMohon konfirmasinya.`;
    return `https://wa.me/6283125525115?text=${text}`;
  };

  const handleWA = (e: React.MouseEvent) => {
    if (!customerName.trim() || !selectedOutlet) {
      e.preventDefault();
      alert("Isi Nama dan Outlet dulu ya bro!");
    }
  };

  return (
    <div className="bg-[#FAFAFA] min-h-screen text-neutral-900 selection:bg-[#EA580C] selection:text-white relative overflow-x-hidden">
      <Navbar />

      <button 
        onClick={() => setIsCartOpen(true)}
        className="fixed bottom-6 right-6 md:bottom-10 md:right-10 bg-[#171717] text-white p-4 sm:p-5 rounded-full shadow-2xl z-[999] hover:bg-[#EA580C] hover:scale-110 transition-all duration-300 flex items-center justify-center"
      >
        <ShoppingCart className="w-6 h-6 sm:w-7 sm:h-7" />
        {cartItems.reduce((a, c) => a + c.quantity, 0) > 0 && (
          <span className="absolute -top-2 -right-2 bg-[#EA580C] text-white text-xs font-black w-7 h-7 rounded-full flex items-center justify-center border-[3px] border-[#FAFAFA]">
            {cartItems.reduce((a, c) => a + c.quantity, 0)}
          </span>
        )}
      </button>

      {/* --- HERO SECTION MULAI --- */}
      <section className="relative w-full h-[70vh] md:h-screen flex flex-col items-center justify-center overflow-hidden bg-neutral-950 px-4">
        {/* Background Image & Overlay */}
        <Image src="/hero-menu.jpeg" alt="Coffee Hero" fill className="object-cover object-center" priority />
        <div className="absolute inset-0 bg-neutral-950/50 z-10 pointer-events-none" />

        {/* 1. WRAPPER KHUSUS TOMBOL (Z-50, POINTER-EVENTS-AUTO) */}
        {/* Terpisah dari judul biar 1000% bisa diklik di PC */}
        <div className="relative z-50 mb-8 md:mb-12 pointer-events-auto flex justify-center w-full mt-12 md:mt-0">
          <button 
            onClick={() => setIsLocationModalOpen(true)}
            className={`flex items-center gap-3 px-5 py-3 rounded-full bg-black/60 backdrop-blur-md border border-white/20 hover:border-[#EA580C] hover:bg-black/80 transition-all shadow-2xl cursor-pointer max-w-full group ${montserrat.className}`}
          >
            {/* Dot Hijau */}
            <span className="relative flex h-2.5 w-2.5 shrink-0">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
            </span>
            
            {/* Teks: whitespace-nowrap biar HARAM turun baris */}
            <span className="text-[10px] font-bold text-white tracking-widest uppercase whitespace-nowrap overflow-hidden text-ellipsis max-w-[200px] sm:max-w-[300px]">
              {selectedOutlet ? (
                <>Menyeduh di <span className="text-[#EA580C]">{selectedOutlet}</span></>
              ) : (
                <>{isLoadingOutlets ? "Mencari..." : `${activeOutlets.length} Gerobak Aktif`} <span className="text-white/50 mx-1">•</span> Pilih Lokasi</>
              )}
            </span>

            {/* Panah Kanan */}
            <ChevronRight className="w-4 h-4 text-[#EA580C] group-hover:translate-x-1 transition-transform shrink-0" />
          </button>
        </div>

        {/* 2. WRAPPER KHUSUS TEKS JUDUL (Z-20, POINTER-EVENTS-NONE) */}
        <div className="relative z-20 flex flex-col items-center text-center pointer-events-none">
          <motion.h1 
            initial={{ opacity: 0, y: 40 }} 
            animate={{ opacity: 1, y: 0 }} 
            transition={{ duration: 0.8, ease: "easeOut" }} 
            className={`text-6xl sm:text-7xl md:text-8xl lg:text-[7.5rem] ${playfair.className} text-white leading-[1.1] mb-6 drop-shadow-2xl`}
          >
            <span className="italic font-normal">Cerita di</span> <br className="md:hidden" />
            <span className="text-white font-black uppercase tracking-tighter ml-0 md:ml-4 font-sans">SETIAP SEDUHAN</span>
          </motion.h1>
          <motion.p 
            initial={{ opacity: 0, y: 20 }} 
            animate={{ opacity: 1, y: 0 }} 
            transition={{ duration: 0.8, delay: 0.2, ease: "easeOut" }} 
            className="text-xs md:text-sm lg:text-base font-medium text-white/80 tracking-[0.2em] md:tracking-[0.3em] uppercase max-w-2xl leading-relaxed drop-shadow-md"
          >
            Lebih dari 12 varian rasa premium yang diracik khusus untuk menemani setiap momen Anda.
          </motion.p>
        </div>
      </section>
      {/* --- HERO SECTION SELESAI --- */}

      {/* --- MENU / PRODUCT GRID --- */}
      <div 
        className="relative z-10 pb-12 md:pb-32"
        style={{
          backgroundColor: "#EA580C",
          backgroundImage: `linear-gradient(rgba(255,255,255,0.6) 1.5px, transparent 1.5px), linear-gradient(90deg, rgba(255,255,255,0.6) 1.5px, transparent 1.5px)`,
          backgroundSize: "40px 40px"
        }}
      >
        <nav 
          className="sticky top-[80px] z-40 py-4 shadow-md w-full border-b border-white/30"
          style={{
            backgroundColor: "rgba(234, 88, 12, 0.95)",
            backgroundImage: `linear-gradient(rgba(255,255,255,0.6) 1.5px, transparent 1.5px), linear-gradient(90deg, rgba(255,255,255,0.6) 1.5px, transparent 1.5px)`,
            backgroundSize: "40px 40px",
            backdropFilter: "blur(8px)"
          }}
        >
          <div className="w-full px-4 md:px-0 overflow-x-auto no-scrollbar pb-2 -mb-2">
            <div className="flex w-max mx-auto items-center gap-1 md:gap-2 bg-white p-1.5 md:p-2 rounded-full shadow-xl border border-neutral-100">
            
            {(["All", "Coffee", "Non-Coffee"] as FilterCategory[]).map(category => {
              const count = category === "All" ? products.length : products.filter((p) => p.category === category).length;
              const isActive = filter === category;
              
              const getIcon = () => {
                if (category === "All") return <Filter className="w-4 h-4 md:w-5 md:h-5" />;
                if (category === "Coffee") return <Coffee className="w-4 h-4 md:w-5 md:h-5" />;
                return <Leaf className="w-4 h-4 md:w-5 md:h-5" />;
              };

              const getLabel = () => category === "All" ? "Semua" : category;

              const getBadgeColor = () => {
                if (category === "All") return "bg-neutral-100 text-neutral-600";
                if (category === "Coffee") return "bg-amber-100 text-amber-700";
                return "bg-emerald-100 text-emerald-700";
              };

              return (
                <button
                  key={category}
                  onClick={() => setFilter(category)}
                  className={`group flex items-center gap-1 md:gap-2 px-3 sm:px-5 py-1.5 sm:py-2 md:py-2.5 rounded-full transition-all duration-300 flex-shrink-0 ${
                    isActive 
                      ? "bg-[#EA580C] text-white shadow-md" 
                      : "bg-transparent text-neutral-500 hover:text-neutral-800 hover:bg-neutral-50"
                  }`}
                >
                  {getIcon()}
                  <span className="text-[11px] sm:text-sm font-bold">{getLabel()}</span>
                  <span className={`text-[9px] sm:text-xs font-bold px-1.5 sm:px-2 py-0.5 rounded-full transition-colors ${
                    isActive ? "bg-white/20 text-white" : getBadgeColor()
                  }`}>
                    {count}
                  </span>
                </button>
              );
            })}

            </div>
          </div>
        </nav>

        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-12 py-12 md:py-20">
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6 lg:gap-8">
            {filteredProducts.map((product) => {
              const stockData = liveInventory.find((item: any) => item.product_id === product.id);
              const currentStock = stockData ? stockData.sisa : 0;
              const isSoldOut = selectedOutlet !== "" && currentStock <= 0;

              return (
                <ProductCard
                  key={product.id}
                  product={product}
                  onAdd={() => addToCart(product)}
                  isSoldOut={isSoldOut}
                />
              );
            })}
          </div>
        </main>
      </div>

      <section className="relative w-full h-[70vh] md:h-[90vh] overflow-hidden flex items-center justify-center rounded-t-[40px] md:rounded-t-[80px] shadow-[0_-20px_50px_rgba(0,0,0,0.3)] z-30 -mt-8 md:-mt-16 bg-neutral-900">
        <div 
          className="absolute inset-0 w-full h-full pointer-events-none"
          dangerouslySetInnerHTML={{
            __html: `
              <video 
                src="/video/video-kopi.mp4" 
                autoplay 
                loop 
                muted 
                playsinline 
                preload="auto"
                style="width: 100%; height: 100%; object-fit: cover;"
              ></video>
            `
          }}
        />
        
        <div className="absolute inset-0 bg-neutral-950/50 z-10 pointer-events-none" />
        
        <div className="relative z-20 flex flex-col items-center text-center px-6 w-full max-w-5xl mx-auto pointer-events-none">
          <motion.img
            src="/logo-brand.png" 
            alt="Logo Seru.ni" 
            initial={{ opacity: 0, scale: 0.8 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ duration: 0.8, ease: "easeOut" }}
            className="h-20 md:h-28 w-auto object-contain mb-4 drop-shadow-2xl" 
          />

          <motion.h2 
            initial={{ opacity: 0, y: 40 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ duration: 0.8, delay: 0.1, ease: "easeOut" }}
            className={`text-5xl sm:text-6xl md:text-7xl lg:text-[6rem] ${playfair.className} text-white leading-[1.1] drop-shadow-2xl`}
          >
            <span className="italic font-normal">Taste the</span> <br className="md:hidden"/> <span className="text-[#EA580C] font-bold uppercase tracking-tight">DIFFERENCE</span>
          </motion.h2>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ duration: 0.8, delay: 0.3, ease: "easeOut" }}
            className="mt-6 md:mt-8 text-xs md:text-sm lg:text-base font-medium text-white/80 tracking-[0.3em] uppercase drop-shadow-md"
          >
            Sourced locally, brewed to perfection
          </motion.p>
        </div>
      </section>

      <AnimatePresence>
        {isCartOpen && (
          <>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setIsCartOpen(false)} className="fixed inset-0 bg-black/50 z-[1000] backdrop-blur-sm" />
            <motion.div initial={{ x: "100%" }} animate={{ x: 0 }} exit={{ x: "100%" }} transition={{ type: "tween", duration: 0.3 }} className="fixed inset-y-0 right-0 w-full max-w-md bg-white shadow-[0_-10px_40px_rgba(0,0,0,0.1)] z-[1001] flex flex-col sm:rounded-l-2xl">
              <div className="flex items-center justify-between p-5 border-b border-neutral-100 bg-white">
                <div className="flex items-center gap-3">
                  {checkoutStep === "checkout" ? (
                    <button onClick={() => setCheckoutStep("cart")} className="p-1 hover:bg-neutral-100 rounded-lg"><ArrowLeft className="w-5 h-5" /></button>
                  ) : (
                    <ShoppingCart className="w-5 h-5 text-neutral-800" />
                  )}
                  <h2 className="text-lg font-black tracking-tight text-neutral-900">
                    {checkoutStep === "cart" ? "Keranjang" : "Checkout"} ({cartItems.reduce((a, c) => a + c.quantity, 0)})
                  </h2>
                </div>
                <button onClick={() => setIsCartOpen(false)} className="p-2 bg-neutral-100 hover:bg-neutral-200 rounded-full transition-colors"><X className="w-4 h-4 text-neutral-600" /></button>
              </div>

              {checkoutStep === "cart" ? (
                <div className="flex-1 overflow-y-auto bg-[#FAFAFA] p-4" data-lenis-prevent="true">
                  {cartItems.length === 0 ? (
                    <div className="h-full flex flex-col items-center justify-center text-neutral-400">
                      <ShoppingCart className="w-16 h-16 mb-4 opacity-50" />
                      <p className="font-bold uppercase tracking-widest text-sm">Keranjang kosong</p>
                    </div>
                  ) : (
                    <ul className="space-y-4">
                      {cartItems.map((ci) => (
                        <li key={ci.product.id} className="flex items-center gap-4 p-4 bg-white rounded-2xl shadow-sm border border-neutral-100">
                          <div className="w-16 h-20 relative bg-[#FDF9F1] rounded-xl flex-shrink-0 flex items-center justify-center">
                            <Image src={ci.product.image} alt={ci.product.name} fill className="object-contain p-2 drop-shadow-md" />
                          </div>
                          <div className="flex-1">
                            <h4 className="font-bold text-sm text-neutral-900 leading-tight mb-1">{ci.product.name}</h4>
                            
                            <p className="text-xs text-[#8B4513] font-black mb-2">{formatRupiah(getNumericPrice(ci.product.price))}</p>
                            
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-1 bg-neutral-100 rounded-full px-2 py-1">
                                <button onClick={() => decrement(ci.product.id)} className="w-6 h-6 flex items-center justify-center bg-white rounded-full shadow-sm text-neutral-700 hover:text-black"><Minus className="w-3 h-3" /></button>
                                <span className="text-xs font-bold w-6 text-center text-neutral-900">{ci.quantity}</span>
                                <button onClick={() => increment(ci.product.id)} className="w-6 h-6 flex items-center justify-center bg-[#EA580C] text-white rounded-full shadow-sm"><Plus className="w-3 h-3" /></button>
                              </div>
                              <button onClick={() => removeItem(ci.product.id)} className="p-1.5 text-red-500 bg-red-50 hover:bg-red-100 rounded-lg transition-colors">
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          </div>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              ) : (
                <div className="flex-1 p-5 overflow-y-auto bg-[#FAFAFA]" data-lenis-prevent="true">
                  <div className="bg-white p-5 rounded-2xl border border-neutral-100 shadow-sm mb-6">
                    <h3 className="font-black text-sm mb-4 text-neutral-900">Informasi Pemesan</h3>
                    <div className="mb-4">
                      <label className="block text-xs font-bold text-neutral-500 mb-2 uppercase tracking-wider">Nama Anda *</label>
                      <input type="text" value={customerName} onChange={(e) => setCustomerName(e.target.value)} placeholder="Tulis namamu..." className="w-full border border-neutral-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-[#EA580C] focus:ring-1 focus:ring-[#EA580C] font-medium transition-colors" />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-neutral-500 mb-2 uppercase tracking-wider">Lokasi Pengambilan</label>
                      <div className="flex items-center gap-3 bg-neutral-50 border border-neutral-100 rounded-xl px-4 py-3">
                        <MapPin className="w-5 h-5 text-[#EA580C]" />
                        <span className="text-sm font-bold text-neutral-900">{selectedOutlet || "Belum memilih lokasi"}</span>
                      </div>
                    </div>
                  </div>
                  <div className="bg-white p-5 rounded-2xl border border-neutral-100 shadow-sm">
                    <h3 className="font-black text-sm mb-3 text-neutral-900">Ringkasan</h3>
                    <ul className="space-y-2 mb-4">
                      {cartItems.map((ci) => (
                        <li key={ci.product.id} className="flex justify-between text-xs text-neutral-600 border-b border-neutral-50 pb-2">
                          <span>{ci.product.name} <span className="font-bold">x{ci.quantity}</span></span>
                          <span className="font-semibold text-neutral-900">{formatRupiah(getNumericPrice(ci.product.price) * ci.quantity)}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              )}

              <div className="p-6 bg-white border-t border-neutral-100 shadow-[0_-10px_20px_rgba(0,0,0,0.02)]">
                <div className="flex justify-between items-end mb-4 border-t border-neutral-100 pt-4">
                  <span className="text-sm font-bold text-neutral-500 uppercase tracking-widest">Total Bayar</span>
                  <span className="text-2xl font-black text-[#EA580C]">{formatRupiah(totalPrice)}</span>
                </div>
                {checkoutStep === "cart" ? (
                  <div className="flex flex-col gap-2">
                    <button onClick={() => setCheckoutStep("checkout")} disabled={cartItems.length === 0} className="w-full bg-[#EA580C] hover:bg-[#C2410C] text-white font-black uppercase tracking-widest py-4 rounded-xl disabled:opacity-50 transition-colors shadow-md shadow-orange-500/20">Lanjut Checkout</button>
                    <button onClick={clearCart} disabled={cartItems.length === 0} className="text-sm text-neutral-400 hover:text-neutral-800 font-medium text-center py-2 mt-1 transition-colors">Hapus Semua</button>
                  </div>
                ) : (
                  <div className="flex flex-col gap-3">
                    <button 
                      onClick={(e) => { 
                        if (!selectedOutlet) {
                          e.preventDefault();
                          return;
                        }
                        handleWA(e as any);
                        window.open(whatsappLink(), "_blank");
                      }} 
                      disabled={!selectedOutlet}
                      className={`w-full flex items-center justify-center gap-2 font-black uppercase tracking-widest py-4 rounded-xl transition-colors shadow-md ${selectedOutlet ? 'bg-[#25D366] hover:bg-[#1DA851] text-white shadow-green-500/20' : 'bg-neutral-400 text-neutral-100 cursor-not-allowed shadow-none'}`}
                    >
                      <svg viewBox="0 0 24 24" width="20" height="20" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"/></svg> 
                      {selectedOutlet ? "Kirim ke WhatsApp" : "PILIH LOKASI DAHULU"}
                    </button>
                    <button onClick={() => setCheckoutStep("cart")} className="text-sm text-neutral-400 hover:text-neutral-800 font-medium text-center py-2 transition-colors">
                      Kembali ke Keranjang
                    </button>
                  </div>
                )}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* --- LOCATION MODAL --- */}
      <AnimatePresence>
        {isLocationModalOpen && (
          <>
            <motion.div 
              initial={{ opacity: 0 }} 
              animate={{ opacity: 1 }} 
              exit={{ opacity: 0 }} 
              onClick={() => setIsLocationModalOpen(false)} 
              className="fixed inset-0 bg-black/60 z-[2000] backdrop-blur-sm" 
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 20 }} 
              animate={{ opacity: 1, scale: 1, y: 0 }} 
              exit={{ opacity: 0, scale: 0.95, y: 20 }} 
              transition={{ type: "spring", stiffness: 300, damping: 25 }} 
              className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-[90%] max-w-md bg-neutral-950 border border-neutral-800 rounded-2xl shadow-2xl z-[2001] flex flex-col overflow-hidden"
            >
              {/* Modal Header */}
              <div className="flex flex-col p-5 border-b border-white/10 bg-neutral-900/50">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-white font-black text-lg tracking-tight">Lokasi Gerobak Aktif</h3>
                  <button onClick={() => setIsLocationModalOpen(false)} className="p-2 bg-neutral-800 hover:bg-neutral-700 rounded-full transition-colors group">
                    <X className="w-4 h-4 text-neutral-400 group-hover:text-white" />
                  </button>
                </div>
                <p className="text-sm text-neutral-400 font-medium">Pilih lokasi gerobak terdekat untuk melihat ketersediaan menu dan stok saat ini.</p>
              </div>
              
              {/* Modal Content */}
              <div className="p-5 overflow-y-auto max-h-[60vh] space-y-3" data-lenis-prevent="true">
                {isLoadingOutlets ? (
                  <div className="flex flex-col items-center justify-center py-10 gap-3">
                    <Loader2 className="w-8 h-8 text-[#EA580C] animate-spin" />
                    <p className="text-sm font-medium text-neutral-400">Memuat lokasi gerobak...</p>
                  </div>
                ) : activeOutlets.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-10 text-center px-4">
                    <div className="w-16 h-16 rounded-full bg-neutral-900 flex items-center justify-center mb-4">
                      <MapPin className="w-8 h-8 text-neutral-600" />
                    </div>
                    <p className="text-sm font-medium text-neutral-400">Mohon maaf, saat ini belum ada gerobak Seru.ni yang beroperasi.</p>
                  </div>
                ) : (
                  activeOutlets.map((outlet, i) => (
                    <button 
                      key={i} 
                      onClick={() => handleSelectOutlet(outlet.name)}
                      className="w-full text-left flex items-center gap-4 p-4 bg-[#111111] border border-[#1A1A1A] rounded-xl cursor-pointer hover:border-[#EA580C] hover:bg-neutral-900 transition-all group"
                    >
                      <div className="w-10 h-10 rounded-full bg-[#EA580C]/10 flex items-center justify-center shrink-0 group-hover:bg-[#EA580C]/20 transition-colors">
                        <MapPin className="w-4 h-4 text-[#EA580C]" />
                      </div>
                      <div className="flex-1">
                        <h4 className="text-sm font-bold text-white mb-1 group-hover:text-[#EA580C] transition-colors">{outlet.name}</h4>
                        <p className="text-[10px] text-emerald-500 font-black uppercase tracking-widest flex items-center gap-1.5">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 inline-block animate-pulse" />
                          Buka Sekarang
                        </p>
                      </div>
                    </button>
                  ))
                )}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* TOAST NOTIFICATION */}
      <AnimatePresence>
        {toastMsg && (
          <motion.div 
            initial={{ opacity: 0, y: 50, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.9 }}
            className="fixed bottom-24 left-1/2 -translate-x-1/2 z-[3000] bg-neutral-900 border border-neutral-700 shadow-2xl px-5 py-3 rounded-full flex items-center gap-3"
          >
            <div className="w-2 h-2 rounded-full bg-[#EA580C] animate-pulse" />
            <span className="text-white text-xs font-bold tracking-wide">{toastMsg}</span>
          </motion.div>
        )}
      </AnimatePresence>

      <Footer />
    </div>
  );
}
