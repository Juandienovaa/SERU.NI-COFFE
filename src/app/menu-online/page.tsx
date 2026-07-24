"use client";

import React, { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { Star, ShoppingCart, Plus, Minus, CheckCircle2, Coffee } from "lucide-react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { fetchAllProducts } from "@/services/productService";
import { getAvailableStockForShift } from "@/app/actions/legacyActions";
import { ProductCatalogItem } from "@/types/product";
import { useOnlineCart } from "@/store/useOnlineCart";
import Swal from "sweetalert2";

export default function MenuOnlinePage() {
  const [products, setProducts] = useState<ProductCatalogItem[]>([]);
  const [stockMap, setStockMap] = useState<Record<number, number>>({});
  const [loading, setLoading] = useState(true);
  const [isMounted, setIsMounted] = useState(false);
  
  // State for filtering
  const [activeCategory, setActiveCategory] = useState<string>("Semua");

  const cartItems = useOnlineCart((state) => state.items);
  const addItem = useOnlineCart((state) => state.addItem);
  const updateQty = useOnlineCart((state) => state.updateQty);
  const removeItem = useOnlineCart((state) => state.removeItem);
  const getTotalItems = useOnlineCart((state) => state.getTotalItems);

  useEffect(() => {
    setIsMounted(true);
    async function loadData() {
      try {
        const [res, stockRes] = await Promise.all([
          fetchAllProducts(),
          getAvailableStockForShift()
        ]);
        
        if (res.success && res.data) {
          setProducts(res.data);
        }

        const map: Record<number, number> = {};
        stockRes.forEach((s: any) => {
          map[s.product_id] = s.current_stock;
        });
        setStockMap(map);
      } catch (error) {
        console.error("Gagal mengambil produk:", error);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  const formatPrice = (price: number = 0) => {
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      minimumFractionDigits: 0,
    }).format(price);
  };

  const handleAddToCart = (product: ProductCatalogItem) => {
    addItem(product);

    // Sleek Apple / GoFood style toast notification
    Swal.fire({
      html: `
        <div style="display: flex; align-items: center; gap: 8px;">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#22c55e" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
            <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
            <polyline points="22 4 12 14.01 9 11.01"></polyline>
          </svg>
          <span style="font-weight: 500; letter-spacing: -0.01em;">${product.product_name} ditambahkan</span>
        </div>
      `,
      toast: true,
      position: 'bottom',
      showConfirmButton: false,
      timer: 1500,
      background: '#171717',
      color: '#ffffff',
      customClass: {
        popup: '!rounded-full shadow-2xl !px-5 !py-2.5 !w-auto !mb-8', 
      }
    });
  };

  const getProductQtyInCart = (productId: number) => {
    const item = cartItems.find((i) => i.product.product_id === productId);
    return item ? item.qty : 0;
  };

  const handleDecreaseQty = (productId: number, currentQty: number) => {
    if (currentQty <= 1) {
      removeItem(productId);
    } else {
      updateQty(productId, currentQty - 1);
    }
  };

  const handleIncreaseQty = (productId: number, currentQty: number) => {
    updateQty(productId, currentQty + 1);
  };

  // Filter products based on activeCategory
  const filteredProducts = products.filter(p => p.status === "ACTIVE" && p.is_offline_only !== true).filter(p => {
    if (activeCategory === "Semua") return true;
    if (activeCategory === "COFFEE") return p.category === "Coffee";
    if (activeCategory === "NON-COFFEE") return p.category === "Non-Coffee";
    return true;
  });

  const categories = [
    { id: "Semua", label: "Semua", icon: null },
    { id: "COFFEE", label: "Coffee", icon: <Coffee className="w-4 h-4" /> },
    { id: "NON-COFFEE", label: "Non-Coffee", icon: null }
  ];

  return (
    <div className="min-h-screen bg-black w-full overflow-x-hidden font-sans flex flex-col">
      <Navbar />

      <main className="flex-grow bg-neutral-50">
        {/* 1. HERO SECTION */}
        {/* Removed pt-20 from main, placed it inside section and added bg-black to body to prevent white flashes */}
        <section className="relative w-full h-[60vh] md:h-[70vh] flex flex-col items-center justify-center text-center px-4 pt-20">
          <Image
            src="/hero-menu-online.png"
            alt="Seru.ni Kopi Menu"
            fill
            priority
            quality={90}
            className="object-cover"
          />
          <div className="absolute inset-0 bg-black/50 z-0" />
          
          <div className="relative z-10 max-w-4xl mx-auto flex flex-col items-center gap-4">
            <h1 className="text-white text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-extrabold tracking-tight leading-[1.1] drop-shadow-xl">
              KAMI <span className="text-orange-500">MERANGKULMU</span> DIMANA SAJA
            </h1>
            <p className="text-gray-200 text-xs md:text-sm uppercase tracking-widest max-w-2xl mt-4 leading-relaxed drop-shadow-md">
              Lebih dari 12 varian rasa premium yang diracik khusus untuk menemani setiap momen Anda.
            </p>
          </div>
        </section>

        {/* 2. PRODUCT GRID SECTION */}
        <section className="relative w-full bg-[#f97316] py-16 px-4 md:px-8 lg:px-16 min-h-screen">
          
          {/* Grid Pattern Overlay */}
          <div 
            className="absolute inset-0 z-0 opacity-20 pointer-events-none mix-blend-overlay"
            style={{
              backgroundImage: `url("data:image/svg+xml,%3Csvg width='40' height='40' viewBox='0 0 40 40' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M0 0h40v40H0V0zm39 39V1H1v38h38z' fill='%23ffffff' fill-opacity='1' fill-rule='evenodd'/%3E%3C/svg%3E")`,
              backgroundSize: "40px 40px"
            }}
          />

          <div className="relative z-10 max-w-7xl mx-auto flex flex-col">
            
            {/* FILTER BAR */}
            <div className="flex flex-wrap items-center justify-center gap-3 mb-10">
              {categories.map((cat) => (
                <button
                  key={cat.id}
                  onClick={() => setActiveCategory(cat.id)}
                  className={`flex items-center gap-2 px-5 py-2.5 rounded-full font-bold text-sm transition-all duration-300 shadow-sm border ${
                    activeCategory === cat.id
                      ? "bg-neutral-900 text-white border-neutral-900 shadow-md scale-105"
                      : "bg-white text-neutral-600 border-neutral-200 hover:bg-neutral-100 hover:text-neutral-900"
                  }`}
                >
                  {cat.icon}
                  {cat.label}
                </button>
              ))}
            </div>

            {loading ? (
              <div className="flex items-center justify-center h-64">
                <div className="animate-spin rounded-full h-12 w-12 border-t-4 border-b-4 border-white"></div>
              </div>
            ) : (
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 md:gap-6">
                {filteredProducts.map((product) => {
                  const imageSrc = product.image && product.image !== "" 
                    ? product.image 
                    : "/cup-placeholder.png";

                  const qtyInCart = isMounted ? getProductQtyInCart(product.product_id) : 0;
                  
                  const isTracked = product.is_stock_tracked !== false;
                  const stock = isTracked ? (stockMap[product.product_id] || 0) : Infinity;
                  const isOutOfStock = isTracked && stock <= 0;

                  return (
                    <div 
                      key={product.product_id} 
                      className={`bg-white rounded-[24px] md:rounded-3xl overflow-hidden shadow-xl hover:shadow-2xl transition-all duration-300 flex flex-col border border-neutral-100 relative group ${isOutOfStock ? 'opacity-50 grayscale' : ''}`}
                    >
                      {/* Image Area */}
                      <div className="relative w-full aspect-square bg-[#F5F5DC] flex items-center justify-center overflow-hidden">
                        <div className="relative w-full h-full flex items-center justify-center transform group-hover:scale-105 transition-transform duration-500">
                          <Image
                            src={imageSrc}
                            alt={product.product_name}
                            fill
                            className="object-cover object-center p-0" // User requested object-cover and no stretching
                            sizes="(max-width: 768px) 50vw, (max-width: 1200px) 33vw, 25vw"
                          />
                        </div>
                        
                        <div className="absolute bottom-2 right-2 md:bottom-3 md:right-3 bg-white px-2.5 py-1 md:px-3 md:py-1.5 rounded-full shadow-lg z-10">
                          <span className="text-black font-extrabold text-[11px] md:text-sm tracking-tight whitespace-nowrap">
                            {formatPrice(product.price)}
                          </span>
                        </div>
                      </div>

                      {/* Content Area */}
                      <div className="p-3 md:p-6 flex flex-col flex-grow">
                        <h3 className="text-sm md:text-xl font-bold text-neutral-900 mb-1.5 md:mb-3 line-clamp-2 md:line-clamp-1 leading-tight">
                          {product.product_name}
                        </h3>

                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 sm:gap-0 mb-3 md:mb-4">
                          <span className="text-orange-600 border border-orange-200 bg-orange-50 px-2 py-0.5 md:px-2.5 md:py-1 rounded text-[9px] md:text-[10px] font-bold tracking-wider uppercase w-fit">
                            {product.category || "COFFEE"}
                          </span>
                          <div className="flex items-center gap-0.5">
                            {[...Array(5)].map((_, i) => (
                              <Star 
                                key={i} 
                                className={`w-2.5 h-2.5 md:w-3.5 md:h-3.5 ${i < 4 ? "text-yellow-400 fill-yellow-400" : "text-gray-300"}`} 
                              />
                            ))}
                            <span className="text-[10px] md:text-xs font-bold text-neutral-700 ml-1">
                              4.8
                            </span>
                          </div>
                        </div>

                        {/* Tags (hidden on very small mobile screens for cleaner look) */}
                        <div className="hidden md:flex flex-wrap gap-1.5 mb-6">
                          {(product.tags && product.tags.length > 0) ? product.tags.map((tag, idx) => (
                            <span 
                              key={idx} 
                              className="bg-neutral-100 text-neutral-600 px-2 py-0.5 rounded-full text-[9px] md:text-[10px] font-semibold tracking-wide uppercase"
                            >
                              {tag}
                            </span>
                          )) : (
                            <span className="bg-neutral-100 text-neutral-600 px-2 py-0.5 rounded-full text-[9px] md:text-[10px] font-semibold tracking-wide uppercase">
                              PREMIUM
                            </span>
                          )}
                        </div>

                        <div className="mt-auto" />

                        {/* ADD TO CART ACTION AREA */}
                        <div className="h-[42px] md:h-[52px] flex items-center justify-center mt-2 md:mt-0">
                          {isOutOfStock ? (
                            <button 
                              disabled
                              className="w-full h-full bg-gray-400 text-white font-bold text-xs md:text-sm rounded-full shadow-md flex items-center justify-center gap-1 md:gap-2 cursor-not-allowed"
                            >
                              HABIS
                            </button>
                          ) : qtyInCart > 0 ? (
                            <div className="flex items-center justify-between w-full bg-orange-50 rounded-full p-1 border border-orange-200 shadow-inner">
                              <button 
                                onClick={() => handleDecreaseQty(product.product_id, qtyInCart)}
                                className="w-8 h-8 md:w-[42px] md:h-[42px] rounded-full bg-white text-orange-600 shadow-sm hover:bg-orange-100 flex items-center justify-center transition-colors active:scale-95"
                              >
                                <Minus className="w-4 h-4 md:w-5 md:h-5" />
                              </button>
                              
                              <span className="font-bold text-orange-800 text-sm md:text-lg w-6 md:w-8 text-center tabular-nums">
                                {qtyInCart}
                              </span>
                              
                              <button 
                                onClick={() => handleIncreaseQty(product.product_id, qtyInCart)}
                                disabled={isTracked && qtyInCart >= stock}
                                className={`w-8 h-8 md:w-[42px] md:h-[42px] rounded-full shadow-sm flex items-center justify-center transition-colors active:scale-95 ${isTracked && qtyInCart >= stock ? 'bg-gray-300 text-gray-500 cursor-not-allowed' : 'bg-orange-500 text-white hover:bg-orange-600'}`}
                              >
                                <Plus className="w-4 h-4 md:w-5 md:h-5" />
                              </button>
                            </div>
                          ) : (
                            <button 
                              onClick={() => handleAddToCart(product)}
                              className="w-full h-full bg-orange-500 hover:bg-orange-600 text-white font-bold text-xs md:text-sm rounded-full transition-colors active:scale-[0.98] shadow-md flex items-center justify-center gap-1 md:gap-2"
                            >
                              <Plus className="w-3.5 h-3.5 md:w-4 md:h-4" />
                              TAMBAH
                            </button>
                          )}
                        </div>

                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </section>
      </main>

      <Footer />

      {/* FLOATING CART BUTTON */}
      {isMounted && getTotalItems() > 0 && (
        <Link 
          href="/checkout"
          className="fixed bottom-6 right-6 md:bottom-10 md:right-10 bg-neutral-900 hover:bg-black text-white p-4 rounded-full shadow-2xl transition-transform hover:scale-110 active:scale-95 z-50 flex items-center justify-center group border-2 border-neutral-800"
        >
          <ShoppingCart className="w-6 h-6 group-hover:text-orange-500 transition-colors" />
          <span className="absolute -top-2 -right-2 bg-orange-500 text-white text-xs font-black w-6 h-6 flex items-center justify-center rounded-full shadow-lg border-2 border-neutral-900">
            {getTotalItems()}
          </span>
        </Link>
      )}
    </div>
  );
}
