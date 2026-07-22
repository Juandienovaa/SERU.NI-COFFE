"use client";

import React, { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { fetchAllProducts } from "@/services/productService";
import { getAvailableStockForShift } from "@/services/backendService";
import { ProductCatalogItem } from "@/types/product";
import { useOnlineCart } from "@/store/useOnlineCart";
import { 
  ShoppingBag, 
  Heart, 
  Plus, 
  Minus, 
  ArrowRight,
  MapPin,
  Clock,
  Sparkles,
  ChevronRight,
  X,
  CreditCard,
  Coffee,
  Navigation,
  Star
} from "lucide-react";

const CATEGORIES = [
  { id: "Semua", icon: "☕" },
  { id: "Coffee", icon: "🥤" },
  { id: "Non Coffee", icon: "🍵" },
  { id: "Signature", icon: "✨" },
  { id: "Best Seller", icon: "🔥" }
];

export default function MenuOnlinePage() {
  const [products, setProducts] = useState<ProductCatalogItem[]>([]);
  const [stockMap, setStockMap] = useState<Record<number, number>>({});
  const [loading, setLoading] = useState(true);
  const [activeCategory, setActiveCategory] = useState("Semua");
  const [favorites, setFavorites] = useState<Record<number, boolean>>({});
  
  const [isCartOpen, setIsCartOpen] = useState(false);

  const cart = useOnlineCart((state) => state.items);
  const addItem = useOnlineCart((state) => state.addItem);
  const removeItem = useOnlineCart((state) => state.removeItem);
  const updateQty = useOnlineCart((state) => state.updateQty);
  const getTotalItems = useOnlineCart((state) => state.getTotalItems);
  const getSubtotal = useOnlineCart((state) => state.getSubtotal);

  useEffect(() => {
    async function loadData() {
      try {
        const [prodRes, stockRes] = await Promise.all([
          fetchAllProducts(),
          getAvailableStockForShift()
        ]);
        
        if (prodRes.success) setProducts(prodRes.data || []);
        
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

  const toggleFavorite = (id: number, e: React.MouseEvent) => {
    e.stopPropagation();
    setFavorites(prev => ({ ...prev, [id]: !prev[id] }));
  };

  const filteredProducts = products.filter(p => {
    if (activeCategory === "Semua") return true;
    if (activeCategory === "Best Seller") return p.price && p.price > 20000;
    return p.category === activeCategory;
  });

  const featuredProducts = products.slice(0, 3); // Mock featured

  const subtotal = getSubtotal();
  const deliveryFee = subtotal > 50000 ? 0 : 10000;
  const total = subtotal + deliveryFee;
  const isCartEmpty = cart.length === 0;
  const totalItems = getTotalItems();

  const formatRp = (num: number) => new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", minimumFractionDigits: 0 }).format(num);

  return (
    <div className="min-h-screen bg-[#09090B] text-white overflow-x-hidden selection:bg-orange-500/30 relative font-sans">
      
      {/* Background Engineering Grid & Glows */}
      <div 
        className="fixed inset-0 pointer-events-none z-0"
        style={{
          backgroundImage: `
            linear-gradient(rgba(249, 115, 22, 0.05) 1px, transparent 1px),
            linear-gradient(90deg, rgba(249, 115, 22, 0.05) 1px, transparent 1px)
          `,
          backgroundSize: '40px 40px'
        }}
      />
      
      {/* Noise Texture */}
      <div 
        className="fixed inset-0 pointer-events-none z-0 opacity-[0.03] mix-blend-overlay"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.65' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E")`
        }}
      />

      <div className="fixed top-[-20%] right-[-10%] w-[600px] h-[600px] bg-orange-500/20 rounded-full blur-[120px] pointer-events-none z-0" />
      <div className="fixed top-[40%] left-[-10%] w-[500px] h-[500px] bg-orange-600/10 rounded-full blur-[100px] pointer-events-none z-0" />

      {/* 1. HERO SECTION */}
      <section className="relative w-full min-h-[85vh] lg:h-[80vh] flex flex-col lg:flex-row items-center justify-between px-6 lg:px-24 pt-32 lg:pt-20 pb-16 z-10 overflow-hidden">
        
        {/* Left: Text & Badges */}
        <div className="w-full lg:w-1/2 flex flex-col gap-6 lg:gap-8 relative z-20">
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
          >
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/5 border border-white/10 backdrop-blur-md mb-6">
              <Sparkles className="w-4 h-4 text-orange-400" />
              <span className="text-xs font-bold text-orange-50 uppercase tracking-widest">Premium Ordering</span>
            </div>
            
            <h1 className="text-5xl md:text-7xl lg:text-8xl font-black leading-[1.05] tracking-tight text-white mb-6">
              Pesanan Anda,<br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-orange-400 to-orange-600">
                Segera Tiba.
              </span>
            </h1>
            
            <p className="text-lg md:text-xl text-neutral-400 max-w-lg leading-relaxed mb-8">
              Nikmati kopi premium Seru.ni Coffee yang dibuat langsung oleh barista dan diantar ke lokasi Anda dengan cepat.
            </p>

            {/* Badges */}
            <div className="flex flex-wrap gap-3 mb-10">
              {[
                { icon: Navigation, label: "Live GPS" },
                { icon: Clock, label: "Delivery Cepat" },
                { icon: CreditCard, label: "QRIS" },
                { icon: Coffee, label: "Freshly Brewed" },
                { icon: Star, label: "Premium Coffee" }
              ].map((badge, i) => (
                <div key={i} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/5 border border-white/10 text-xs md:text-sm text-neutral-300">
                  <badge.icon className="w-4 h-4 text-orange-400" />
                  {badge.label}
                </div>
              ))}
            </div>

            <div className="flex flex-col sm:flex-row gap-4">
              <button 
                onClick={() => {
                  document.getElementById('menu-section')?.scrollIntoView({ behavior: 'smooth' });
                }}
                className="px-8 py-4 rounded-full bg-orange-500 text-white font-bold text-lg hover:bg-orange-400 hover:scale-105 active:scale-95 transition-all shadow-[0_0_30px_rgba(249,115,22,0.3)] flex items-center justify-center gap-2"
              >
                Pesan Sekarang
                <ArrowRight className="w-5 h-5" />
              </button>
            </div>
          </motion.div>
        </div>

        {/* Right: Floating Cup */}
        <div className="hidden lg:flex w-full lg:w-1/2 h-full items-center justify-center relative mt-16 lg:mt-0 z-10">
          <motion.div
            initial={{ opacity: 0, scale: 0.8, rotate: 10, y: 50 }}
            animate={{ opacity: 1, scale: 1, rotate: 0, y: 0 }}
            transition={{ duration: 1.2, delay: 0.2, ease: [0.16, 1, 0.3, 1] }}
            className="relative w-[70vw] max-w-[400px] lg:max-w-[600px] aspect-square drop-shadow-2xl"
          >
            {/* Soft Glow behind cup */}
            <div className="absolute inset-0 bg-orange-500/30 blur-[80px] rounded-full scale-75" />
            
            <Image
              src="/images/kopi-hero.png"
              alt="Seru.ni Coffee Premium"
              fill
              className="object-contain relative z-10 animate-[float_6s_ease-in-out_infinite]"
            />
          </motion.div>
        </div>
      </section>

      {/* 2. MENU SECTION */}
      <section id="menu-section" className="relative z-20 w-full min-h-screen px-4 md:px-8 lg:px-24 py-20">
        
        {/* Floating Category Bar */}
        <div className="sticky top-6 z-40 flex justify-center mb-16 pointer-events-none">
          <div className="pointer-events-auto flex items-center gap-2 p-2 rounded-full bg-white/10 backdrop-blur-xl border border-white/20 shadow-[0_10px_40px_rgba(0,0,0,0.5)] overflow-x-auto max-w-full scrollbar-hide">
            {CATEGORIES.map((cat) => (
              <button
                key={cat.id}
                onClick={() => setActiveCategory(cat.id)}
                className={`relative flex items-center gap-2 px-5 py-3 rounded-full text-sm font-bold whitespace-nowrap transition-all duration-300 ${
                  activeCategory === cat.id 
                  ? "text-white" 
                  : "text-neutral-400 hover:text-white hover:bg-white/5"
                }`}
              >
                {activeCategory === cat.id && (
                  <motion.div 
                    layoutId="activeCategoryPill"
                    className="absolute inset-0 bg-orange-500 rounded-full shadow-[0_0_15px_rgba(249,115,22,0.4)]"
                    style={{ zIndex: -1 }}
                  />
                )}
                <span>{cat.icon}</span>
                {cat.id}
              </button>
            ))}
          </div>
        </div>

        {/* Featured Section (Menu Favorit Hari Ini) */}
        {activeCategory === "Semua" && !loading && featuredProducts.length > 0 && (
          <div className="mb-20">
            <h2 className="text-3xl font-black text-white mb-2 tracking-tight">Menu Favorit Hari Ini</h2>
            <p className="text-neutral-400 mb-8 font-medium">Pilihan terbaik yang wajib Anda coba.</p>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {featuredProducts.map(product => (
                <div key={`feat-${product.product_id}`} className="group flex items-center gap-4 bg-white/5 border border-white/10 hover:border-orange-500/50 p-4 rounded-3xl backdrop-blur-sm transition-all duration-300 cursor-pointer">
                  <div className="w-24 h-24 rounded-2xl bg-black/30 overflow-hidden relative shrink-0">
                    {product.image && <Image src={product.image} alt={product.product_name} fill className="object-cover group-hover:scale-110 transition-transform duration-500" />}
                  </div>
                  <div className="flex-1">
                    <h3 className="font-bold text-lg text-white mb-1 line-clamp-1">{product.product_name}</h3>
                    <p className="text-orange-400 font-bold mb-3">{formatRp(product.price || 0)}</p>
                    <button 
                      onClick={() => addItem(product)}
                      className="text-xs font-bold px-4 py-2 rounded-full bg-white/10 hover:bg-orange-500 text-white transition-colors"
                    >
                      + Tambah
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Product Grid */}
        <div className="mb-12">
          {activeCategory !== "Semua" && (
            <h2 className="text-3xl font-black text-white mb-8 tracking-tight">{activeCategory}</h2>
          )}
          
          {loading ? (
            <div className="flex justify-center py-32">
              <div className="w-12 h-12 border-4 border-white/10 border-t-orange-500 rounded-full animate-spin" />
            </div>
          ) : (
            <motion.div layout className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
              <AnimatePresence mode="popLayout">
                {filteredProducts.map((product) => {
                  const stock = stockMap[product.product_id] || 0;
                  const isSoldOut = stock <= 0;
                  const isFavorite = favorites[product.product_id];

                  return (
                    <motion.div
                      layout
                      initial={{ opacity: 0, scale: 0.9, y: 20 }}
                      animate={{ opacity: 1, scale: 1, y: 0 }}
                      exit={{ opacity: 0, scale: 0.9, y: 20 }}
                      transition={{ duration: 0.4 }}
                      key={product.product_id}
                      className="group relative bg-[#121217]/60 backdrop-blur-md border border-white/5 hover:border-orange-500/50 hover:shadow-[0_0_40px_rgba(249,115,22,0.15)] rounded-3xl p-5 overflow-hidden transition-all duration-500 flex flex-col hover:-translate-y-2"
                    >
                      {/* Floating Favorite */}
                      <button 
                        onClick={(e) => toggleFavorite(product.product_id, e)}
                        className="absolute top-5 right-5 z-20 w-10 h-10 rounded-full bg-black/20 backdrop-blur-md border border-white/10 flex items-center justify-center hover:bg-white/10 transition-colors"
                      >
                        <Heart className={`w-5 h-5 transition-colors ${isFavorite ? "fill-orange-500 text-orange-500" : "text-white"}`} />
                      </button>

                      {/* Image Area */}
                      <div className="relative w-full aspect-[4/5] rounded-2xl overflow-hidden bg-black/40 mb-6 flex items-center justify-center">
                        {/* Glow Behind Image */}
                        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent z-10" />
                        
                        {product.image ? (
                          <Image 
                            src={product.image} 
                            alt={product.product_name} 
                            fill 
                            className="object-cover group-hover:scale-110 transition-transform duration-700 ease-out z-0" 
                          />
                        ) : (
                          <Coffee className="w-16 h-16 text-white/20 z-0" />
                        )}

                        {/* Price Badge inside image */}
                        <div className="absolute bottom-4 right-4 z-20 bg-white text-black px-4 py-2 rounded-xl font-black text-lg shadow-[0_10px_20px_rgba(0,0,0,0.3)]">
                          {formatRp(product.price || 0)}
                        </div>

                        {/* Stock Badge */}
                        {isSoldOut ? (
                          <div className="absolute top-4 left-4 z-20 bg-red-500 text-white text-xs font-bold px-3 py-1.5 rounded-full shadow-lg backdrop-blur-md">
                            Habis
                          </div>
                        ) : stock < 10 ? (
                          <div className="absolute top-4 left-4 z-20 bg-orange-500/80 text-white text-xs font-bold px-3 py-1.5 rounded-full shadow-lg backdrop-blur-md border border-orange-400">
                            Sisa {stock}
                          </div>
                        ) : null}
                      </div>

                      {/* Content */}
                      <div className="flex-1 flex flex-col">
                        <div className="flex items-center gap-2 mb-2">
                          <Star className="w-4 h-4 text-orange-400 fill-orange-400" />
                          <span className="text-sm font-bold text-neutral-300">4.9</span>
                        </div>
                        <h3 className="text-xl font-bold text-white mb-2 line-clamp-1 group-hover:text-orange-400 transition-colors">
                          {product.product_name}
                        </h3>
                        <p className="text-sm text-neutral-400 line-clamp-2 mb-6 flex-1 font-medium leading-relaxed">
                          Nikmati kesegaran dan cita rasa otentik dari pilihan menu spesial kami.
                        </p>

                        {/* Add to Cart Button */}
                        <button
                          disabled={isSoldOut}
                          onClick={() => addItem(product)}
                          className={`w-full py-4 rounded-2xl font-bold text-sm flex items-center justify-center gap-2 transition-all duration-300 ${
                            isSoldOut 
                            ? "bg-white/5 text-neutral-500 cursor-not-allowed" 
                            : "bg-white/10 hover:bg-orange-500 text-white hover:shadow-[0_0_20px_rgba(249,115,22,0.4)]"
                          }`}
                        >
                          {isSoldOut ? "Stok Habis" : (
                            <>
                              <Plus className="w-5 h-5" />
                              Tambah ke Pesanan
                            </>
                          )}
                        </button>
                      </div>
                    </motion.div>
                  );
                })}
              </AnimatePresence>
            </motion.div>
          )}
        </div>
      </section>

      {/* 3. FLOATING CART BUTTON */}
      <AnimatePresence>
        {!isCartOpen && (
          <motion.button
            initial={{ opacity: 0, scale: 0.8, y: 50 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.8, y: 50 }}
            onClick={() => setIsCartOpen(true)}
            className="fixed bottom-6 lg:bottom-10 right-6 lg:right-10 z-50 bg-orange-500 text-white rounded-full p-4 lg:p-5 shadow-[0_10px_40px_rgba(249,115,22,0.5)] hover:bg-orange-400 hover:scale-105 active:scale-95 transition-all group border border-orange-400/50"
          >
            <div className="relative">
              <ShoppingBag className="w-6 h-6 lg:w-7 lg:h-7" />
              {totalItems > 0 && (
                <span className="absolute -top-2 -right-2 bg-white text-orange-600 text-xs font-black w-5 h-5 rounded-full flex items-center justify-center shadow-md">
                  {totalItems}
                </span>
              )}
            </div>
          </motion.button>
        )}
      </AnimatePresence>

      {/* 4. CART DRAWER */}
      <AnimatePresence>
        {isCartOpen && (
          <>
            {/* Backdrop */}
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsCartOpen(false)}
              className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100]"
            />

            {/* Drawer Container (Right side desktop, Bottom sheet mobile) */}
            <motion.div 
              initial={{ opacity: 0, x: '100%' }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: '100%' }}
              transition={{ type: "spring", damping: 25, stiffness: 200 }}
              className="fixed top-0 right-0 h-full w-full sm:w-[450px] bg-[#121217] border-l border-white/10 shadow-[0_0_50px_rgba(0,0,0,0.8)] z-[110] flex flex-col"
            >
              {/* Header */}
              <div className="flex items-center justify-between p-6 border-b border-white/10 bg-[#121217]/80 backdrop-blur-md z-10 relative">
                <div className="absolute top-0 right-0 w-64 h-64 bg-orange-500/10 blur-[100px] pointer-events-none rounded-full" />
                <div className="flex items-center gap-4 relative z-10">
                  <div className="w-12 h-12 rounded-full bg-orange-500/20 flex items-center justify-center border border-orange-500/30">
                    <ShoppingBag className="w-6 h-6 text-orange-400" />
                  </div>
                  <div>
                    <h2 className="text-xl font-black text-white tracking-tight">Pesanan Anda</h2>
                    <p className="text-sm font-medium text-orange-400">{totalItems} Item terpilih</p>
                  </div>
                </div>
                <button 
                  onClick={() => setIsCartOpen(false)}
                  className="w-10 h-10 rounded-full bg-white/5 hover:bg-white/10 flex items-center justify-center text-neutral-400 hover:text-white transition-colors relative z-10"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Items List */}
              <div className="flex-1 overflow-y-auto p-6 scrollbar-hide z-10">
                <AnimatePresence mode="popLayout">
                  {isCartEmpty ? (
                    <motion.div 
                      initial={{ opacity: 0, scale: 0.9 }} 
                      animate={{ opacity: 1, scale: 1 }} 
                      exit={{ opacity: 0, scale: 0.9 }}
                      className="flex flex-col items-center justify-center h-full text-center gap-6"
                    >
                      <div className="relative w-48 h-48">
                        <div className="absolute inset-0 bg-orange-500/20 blur-[50px] rounded-full" />
                        <Image 
                          src="/images/kopi-hero.png" 
                          alt="Empty Cart" 
                          fill 
                          className="object-contain opacity-50 grayscale mix-blend-luminosity" 
                        />
                      </div>
                      <div>
                        <h3 className="text-2xl font-black text-white mb-2">Keranjang Masih Kosong</h3>
                        <p className="text-neutral-400 font-medium">Yuk pilih kopi favoritmu dan rasakan sensasinya.</p>
                      </div>
                      <button 
                        onClick={() => setIsCartOpen(false)}
                        className="px-8 py-3 rounded-full bg-white/10 text-white font-bold hover:bg-white/20 transition-colors"
                      >
                        Mulai Belanja
                      </button>
                    </motion.div>
                  ) : (
                    <div className="space-y-4">
                      {cart.map((item) => (
                        <motion.div 
                          layout
                          initial={{ opacity: 0, y: 20 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, scale: 0.9 }}
                          key={item.product.product_id}
                          className="flex gap-4 bg-white/5 rounded-2xl p-3 border border-white/5 relative group hover:bg-white/10 transition-colors"
                        >
                          <div className="w-20 h-20 rounded-xl bg-black/40 overflow-hidden relative shrink-0">
                            {item.product.image ? (
                              <Image src={item.product.image} alt={item.product.product_name} fill className="object-cover" />
                            ) : (
                              <Coffee className="w-8 h-8 text-white/20 absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" />
                            )}
                          </div>
                          
                          <div className="flex-1 flex flex-col justify-between py-1">
                            <div>
                              <h4 className="text-base font-bold text-white line-clamp-1">{item.product.product_name}</h4>
                              <p className="text-sm text-orange-400 font-bold mt-1">{formatRp(item.product.price || 0)}</p>
                            </div>
                            
                            <div className="flex items-center justify-between mt-2">
                              <div className="flex items-center gap-3 bg-black/40 rounded-full p-1 border border-white/10">
                                <button 
                                  onClick={() => updateQty(item.product.product_id, item.qty - 1)}
                                  className="w-7 h-7 rounded-full bg-white/10 hover:bg-orange-500 text-white flex items-center justify-center transition-colors"
                                >
                                  <Minus className="w-4 h-4" />
                                </button>
                                <span className="text-sm font-bold w-4 text-center text-white">{item.qty}</span>
                                <button 
                                  onClick={() => {
                                    const stock = stockMap[item.product.product_id] || 0;
                                    if (item.qty < stock) updateQty(item.product.product_id, item.qty + 1);
                                  }}
                                  className="w-7 h-7 rounded-full bg-white/10 hover:bg-orange-500 text-white flex items-center justify-center transition-colors"
                                >
                                  <Plus className="w-4 h-4" />
                                </button>
                              </div>

                              <button 
                                onClick={() => removeItem(item.product.product_id)}
                                className="text-xs font-bold text-red-400 hover:text-red-300 px-3 py-1"
                              >
                                Hapus
                              </button>
                            </div>
                          </div>
                        </motion.div>
                      ))}
                    </div>
                  )}
                </AnimatePresence>
              </div>

              {/* Checkout Footer */}
              {!isCartEmpty && (
                <div className="p-6 bg-[#121217]/90 backdrop-blur-xl border-t border-white/10 z-20">
                  <div className="space-y-3 mb-6 bg-black/20 p-4 rounded-2xl border border-white/5">
                    <div className="flex justify-between text-sm text-neutral-400 font-medium">
                      <span>Subtotal</span>
                      <span className="text-white">{formatRp(subtotal)}</span>
                    </div>
                    <div className="flex justify-between text-sm text-neutral-400 font-medium">
                      <span>Delivery</span>
                      {deliveryFee === 0 ? (
                        <span className="text-emerald-400 bg-emerald-400/10 px-2 py-0.5 rounded-md font-bold">GRATIS</span>
                      ) : (
                        <span className="text-white">{formatRp(deliveryFee)}</span>
                      )}
                    </div>
                    <div className="h-px w-full bg-white/10 my-2" />
                    <div className="flex justify-between items-center">
                      <span className="text-white font-bold">Total Pembayaran</span>
                      <span className="text-2xl font-black text-orange-400">
                        {formatRp(total)}
                      </span>
                    </div>
                  </div>

                  <Link 
                    href="/checkout"
                    onClick={() => setIsCartOpen(false)}
                    className="group flex items-center justify-center gap-2 w-full py-4 rounded-full font-black text-lg transition-all duration-300 bg-orange-500 hover:bg-orange-400 text-white shadow-[0_0_30px_rgba(249,115,22,0.4)] hover:scale-[1.02]"
                  >
                    Checkout Sekarang
                    <ChevronRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                  </Link>
                </div>
              )}
            </motion.div>
          </>
        )}
      </AnimatePresence>

      <style jsx global>{`
        @keyframes float {
          0%, 100% { transform: translateY(0px) rotate(0deg); }
          50% { transform: translateY(-20px) rotate(2deg); }
        }
      `}</style>
    </div>
  );
}
