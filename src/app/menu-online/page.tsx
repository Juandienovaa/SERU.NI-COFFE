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
  X
} from "lucide-react";

const CATEGORIES = ["Semua", "Coffee", "Non Coffee", "Signature", "Best Seller"];

export default function MenuOnlinePage() {
  const [products, setProducts] = useState<ProductCatalogItem[]>([]);
  const [stockMap, setStockMap] = useState<Record<number, number>>({});
  const [loading, setLoading] = useState(true);
  const [activeCategory, setActiveCategory] = useState("Semua");
  const [favorites, setFavorites] = useState<Record<number, boolean>>({});
  
  const [isMobileCartOpen, setIsMobileCartOpen] = useState(false);

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

  const toggleFavorite = (id: number) => {
    setFavorites(prev => ({ ...prev, [id]: !prev[id] }));
  };

  const filteredProducts = products.filter(p => {
    if (activeCategory === "Semua") return true;
    if (activeCategory === "Best Seller") return p.price && p.price > 20000; // Mock best seller logic
    return p.category === activeCategory;
  });

  const subtotal = getSubtotal();
  const deliveryFee = subtotal > 50000 ? 0 : 10000; // Free delivery above 50k
  const total = subtotal + deliveryFee;
  const isCartEmpty = cart.length === 0;

  const formatRp = (num: number) => new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", minimumFractionDigits: 0 }).format(num);

  const CartContent = () => (
    <div className="flex flex-col h-full bg-[#121217] border-l border-white/5 shadow-2xl relative overflow-hidden">
      <div className="absolute top-0 right-0 w-64 h-64 bg-orange-500/10 blur-[100px] pointer-events-none rounded-full" />
      
      <div className="p-6 border-b border-white/5 flex items-center justify-between z-10 bg-[#121217]/80 backdrop-blur-md">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-orange-500/10 flex items-center justify-center">
            <ShoppingBag className="w-5 h-5 text-orange-500" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-white">Keranjang</h2>
            <p className="text-xs text-neutral-400">{getTotalItems()} Item</p>
          </div>
        </div>
        
        <button 
          onClick={() => setIsMobileCartOpen(false)}
          className="lg:hidden w-8 h-8 rounded-full bg-white/5 flex items-center justify-center text-neutral-400 hover:text-white hover:bg-white/10 transition-colors"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-6 space-y-4 z-10 scrollbar-hide">
        <AnimatePresence mode="popLayout">
          {isCartEmpty ? (
            <motion.div 
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="flex flex-col items-center justify-center h-full text-center text-neutral-500 gap-4"
            >
              <div className="w-20 h-20 rounded-full bg-white/5 flex items-center justify-center">
                <ShoppingBag className="w-8 h-8 opacity-50" />
              </div>
              <p className="text-sm">Keranjang belanja Anda masih kosong</p>
            </motion.div>
          ) : (
            cart.map((item) => (
              <motion.div 
                layout
                initial={{ opacity: 0, y: 20, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95, transition: { duration: 0.2 } }}
                key={item.product.product_id}
                className="flex gap-4 bg-white/5 rounded-2xl p-3 border border-white/5"
              >
                <div className="w-16 h-16 rounded-xl bg-black/20 shrink-0 overflow-hidden relative">
                  {item.product.image ? (
                    <Image src={item.product.image} alt={item.product.product_name} fill className="object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-xs text-neutral-600">No Img</div>
                  )}
                </div>
                
                <div className="flex-1 flex flex-col justify-between py-1">
                  <div>
                    <h4 className="text-sm font-semibold text-white line-clamp-1">{item.product.product_name}</h4>
                    <p className="text-xs text-orange-400 font-medium">{formatRp(item.product.price || 0)}</p>
                  </div>
                  
                  <div className="flex items-center gap-3">
                    <button 
                      onClick={() => updateQty(item.product.product_id, item.qty - 1)}
                      className="w-6 h-6 rounded-full bg-white/10 hover:bg-orange-500 text-white flex items-center justify-center transition-colors"
                    >
                      <Minus className="w-3 h-3" />
                    </button>
                    <span className="text-xs font-bold w-4 text-center text-white">{item.qty}</span>
                    <button 
                      onClick={() => {
                        const stock = stockMap[item.product.product_id] || 0;
                        if (item.qty < stock) updateQty(item.product.product_id, item.qty + 1);
                      }}
                      className="w-6 h-6 rounded-full bg-white/10 hover:bg-orange-500 text-white flex items-center justify-center transition-colors"
                    >
                      <Plus className="w-3 h-3" />
                    </button>
                  </div>
                </div>
              </motion.div>
            ))
          )}
        </AnimatePresence>
      </div>

      <div className="p-6 bg-[#121217] border-t border-white/5 z-20 shadow-[0_-20px_40px_rgba(0,0,0,0.5)]">
        <div className="space-y-3 mb-6">
          <div className="flex justify-between text-sm text-neutral-400">
            <span>Subtotal</span>
            <span className="text-white font-medium">{formatRp(subtotal)}</span>
          </div>
          <div className="flex justify-between text-sm text-neutral-400">
            <span>Delivery</span>
            {deliveryFee === 0 ? (
              <span className="text-emerald-400 font-medium tracking-wide text-xs px-2 py-0.5 bg-emerald-500/10 rounded-full">FREE</span>
            ) : (
              <span className="text-white font-medium">{formatRp(deliveryFee)}</span>
            )}
          </div>
          <div className="h-px w-full bg-white/10 my-2" />
          <div className="flex justify-between items-center">
            <span className="text-white font-medium">Total</span>
            <span className="text-2xl font-black text-transparent bg-clip-text bg-gradient-to-r from-orange-400 to-orange-600">
              {formatRp(total)}
            </span>
          </div>
        </div>

        <Link 
          href={isCartEmpty ? "#" : "/checkout"}
          className={`group flex items-center justify-center gap-2 w-full py-4 rounded-xl font-bold text-sm transition-all duration-300 ${
            isCartEmpty 
            ? "bg-white/5 text-neutral-500 cursor-not-allowed" 
            : "bg-orange-500 hover:bg-orange-400 text-white shadow-[0_0_20px_rgba(249,115,22,0.3)] hover:shadow-[0_0_30px_rgba(249,115,22,0.5)] hover:scale-[1.02]"
          }`}
        >
          Checkout
          {!isCartEmpty && <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />}
        </Link>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-[#09090B] flex overflow-hidden selection:bg-orange-500/30">
      
      {/* Main Content Area */}
      <main className="flex-1 overflow-y-auto scrollbar-hide relative pb-32 lg:pb-0">
        
        {/* Decorative Background */}
        <div className="absolute top-0 left-0 w-full h-[500px] bg-gradient-to-b from-orange-500/10 to-transparent pointer-events-none" />
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[400px] bg-orange-500/20 blur-[150px] pointer-events-none rounded-full" />
        
        {/* Header Hero */}
        <div className="pt-24 px-6 sm:px-12 md:px-16 lg:px-24 pb-12 relative z-10">
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
            className="flex flex-col gap-6"
          >
            <div className="inline-flex items-center gap-2 bg-orange-500/10 border border-orange-500/20 text-orange-400 px-4 py-2 rounded-full text-xs font-bold tracking-wide w-fit backdrop-blur-md">
              <Sparkles className="w-3.5 h-3.5" />
              Delivery Eksklusif Seru.ni
            </div>
            
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black text-white leading-[1.1] tracking-tight max-w-2xl">
              Pesanan Anda,<br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-orange-400 to-orange-600">
                Segera Tiba.
              </span>
            </h1>
            
            <p className="text-neutral-400 max-w-lg leading-relaxed font-medium">
              Eksplorasi pilihan kopi premium kami. Nikmati gratis ongkos kirim untuk pesanan di atas Rp 50.000.
            </p>
          </motion.div>
        </div>

        {/* Categories (Sticky) */}
        <div className="sticky top-0 z-40 bg-[#09090B]/80 backdrop-blur-xl border-y border-white/5 px-6 sm:px-12 md:px-16 lg:px-24 py-4 mb-8">
          <div className="flex gap-3 overflow-x-auto scrollbar-hide pb-2 -mb-2">
            {CATEGORIES.map((cat, i) => (
              <motion.button
                key={cat}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.1 }}
                onClick={() => setActiveCategory(cat)}
                className={`relative px-6 py-2.5 rounded-full text-sm font-semibold whitespace-nowrap transition-all duration-300 ${
                  activeCategory === cat 
                  ? "text-white" 
                  : "text-neutral-400 hover:text-white hover:bg-white/5"
                }`}
              >
                {activeCategory === cat && (
                  <motion.div 
                    layoutId="activeCategory"
                    className="absolute inset-0 bg-orange-500 rounded-full shadow-[0_0_15px_rgba(249,115,22,0.4)]"
                    style={{ zIndex: -1 }}
                  />
                )}
                {cat}
              </motion.button>
            ))}
          </div>
        </div>

        {/* Product Grid */}
        <div className="px-6 sm:px-12 md:px-16 lg:px-24 pb-24 relative z-10">
          {loading ? (
            <div className="flex items-center justify-center py-20">
              <div className="w-10 h-10 border-4 border-white/10 border-t-orange-500 rounded-full animate-spin" />
            </div>
          ) : (
            <motion.div 
              layout
              className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-6"
            >
              <AnimatePresence mode="popLayout">
                {filteredProducts.map((product) => {
                  const stock = stockMap[product.product_id] || 0;
                  const isSoldOut = stock <= 0;
                  const cartItem = cart.find(c => c.product.product_id === product.product_id);
                  const qtyInCart = cartItem?.qty || 0;
                  const isFavorite = favorites[product.product_id];

                  return (
                    <motion.div
                      layout
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.9 }}
                      transition={{ duration: 0.3 }}
                      key={product.product_id}
                      className="group relative bg-[#121217]/50 backdrop-blur-sm border border-white/5 rounded-3xl p-4 overflow-hidden hover:bg-white/[0.03] hover:border-white/10 transition-all duration-500"
                    >
                      {/* Product Image */}
                      <div className="relative aspect-[4/3] rounded-2xl overflow-hidden bg-black/20 mb-4">
                        {product.image ? (
                          <Image 
                            src={product.image} 
                            alt={product.product_name} 
                            fill 
                            className="object-cover transform group-hover:scale-105 transition-transform duration-700" 
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-neutral-600">No Image</div>
                        )}
                        
                        <div className="absolute top-3 left-3 flex flex-col gap-2">
                          {isSoldOut && (
                            <div className="bg-red-500/90 text-white text-[10px] font-bold px-3 py-1 rounded-full backdrop-blur-md">
                              HABIS
                            </div>
                          )}
                          {product.price && product.price > 20000 && !isSoldOut && (
                            <div className="bg-emerald-500/90 text-white text-[10px] font-bold px-3 py-1 rounded-full backdrop-blur-md shadow-lg">
                              TERLARIS
                            </div>
                          )}
                        </div>

                        <button 
                          onClick={() => toggleFavorite(product.product_id)}
                          className="absolute top-3 right-3 w-8 h-8 rounded-full bg-black/30 backdrop-blur-md flex items-center justify-center text-white hover:bg-black/50 transition-colors z-10"
                        >
                          <Heart className={`w-4 h-4 transition-colors ${isFavorite ? "fill-orange-500 text-orange-500" : ""}`} />
                        </button>
                      </div>

                      {/* Content */}
                      <div>
                        <h3 className="text-lg font-bold text-white mb-1 group-hover:text-orange-400 transition-colors">{product.product_name}</h3>
                        <p className="text-sm text-neutral-400 line-clamp-2 mb-4 h-10">Premium taste.</p>
                        
                        <div className="flex items-center justify-between mt-auto">
                          <div>
                            <p className="text-xs text-neutral-500 mb-0.5">Mulai dari</p>
                            <p className="text-lg font-black text-white">{formatRp(product.price || 0)}</p>
                          </div>
                          
                          {qtyInCart > 0 ? (
                            <div className="flex items-center gap-3 bg-white/5 rounded-full p-1 border border-white/10">
                              <button 
                                onClick={() => updateQty(product.product_id, qtyInCart - 1)}
                                className="w-8 h-8 rounded-full bg-white/10 hover:bg-orange-500 flex items-center justify-center text-white transition-colors"
                              >
                                <Minus className="w-4 h-4" />
                              </button>
                              <span className="w-4 text-center font-bold text-white">{qtyInCart}</span>
                              <button 
                                onClick={() => qtyInCart < stock && updateQty(product.product_id, qtyInCart + 1)}
                                className="w-8 h-8 rounded-full bg-white/10 hover:bg-orange-500 flex items-center justify-center text-white transition-colors"
                              >
                                <Plus className="w-4 h-4" />
                              </button>
                            </div>
                          ) : (
                            <button
                              disabled={isSoldOut}
                              onClick={() => addItem(product)}
                              className={`w-10 h-10 rounded-full flex items-center justify-center transition-all duration-300 ${
                                isSoldOut 
                                ? "bg-white/5 text-neutral-600 cursor-not-allowed" 
                                : "bg-white/10 text-white hover:bg-orange-500 hover:scale-110 hover:shadow-[0_0_20px_rgba(249,115,22,0.4)]"
                              }`}
                            >
                              <Plus className="w-5 h-5" />
                            </button>
                          )}
                        </div>
                      </div>
                    </motion.div>
                  );
                })}
              </AnimatePresence>
            </motion.div>
          )}
        </div>
      </main>

      {/* Desktop Cart Sidebar (Right) */}
      <aside className="hidden lg:block w-[400px] shrink-0 z-50">
        <CartContent />
      </aside>

      {/* Mobile Floating Cart Button */}
      {!isMobileCartOpen && !isCartEmpty && (
        <motion.div 
          initial={{ y: 100 }} animate={{ y: 0 }}
          className="lg:hidden fixed bottom-6 left-6 right-6 z-50"
        >
          <button 
            onClick={() => setIsMobileCartOpen(true)}
            className="w-full bg-orange-500 text-white p-4 rounded-2xl shadow-[0_10px_40px_rgba(249,115,22,0.4)] flex items-center justify-between"
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center">
                <ShoppingBag className="w-5 h-5" />
              </div>
              <div className="text-left">
                <p className="text-xs font-medium text-white/80">{getTotalItems()} Item</p>
                <p className="font-bold">{formatRp(subtotal)}</p>
              </div>
            </div>
            <div className="flex items-center gap-2 text-sm font-bold bg-black/20 px-4 py-2 rounded-full">
              Checkout <ArrowRight className="w-4 h-4" />
            </div>
          </button>
        </motion.div>
      )}

      {/* Mobile Cart Bottom Sheet */}
      <AnimatePresence>
        {isMobileCartOpen && (
          <>
            <motion.div 
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onClick={() => setIsMobileCartOpen(false)}
              className="lg:hidden fixed inset-0 bg-black/60 backdrop-blur-sm z-[60]"
            />
            <motion.div 
              initial={{ y: "100%" }} animate={{ y: 0 }} exit={{ y: "100%" }}
              transition={{ type: "spring", damping: 25, stiffness: 200 }}
              className="lg:hidden fixed bottom-0 left-0 right-0 h-[85vh] bg-[#121217] rounded-t-3xl z-[70] flex flex-col overflow-hidden"
            >
              <CartContent />
            </motion.div>
          </>
        )}
      </AnimatePresence>

    </div>
  );
}
