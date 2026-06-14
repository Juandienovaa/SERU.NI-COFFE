"use client";

import Image from "next/image";
import { motion } from "framer-motion";
import { Star, Plus } from "lucide-react";
import { Product } from "@/app/produk/data";

interface ProductCardProps {
  product: Product;
  onAdd: () => void;
  isSoldOut?: boolean;
}

export default function ProductCard({ product, onAdd, isSoldOut }: ProductCardProps) {
  const renderStars = () => {
    return [...Array(5)].map((_, i) => (
      <Star 
        key={i} 
        className={`w-3 h-3 sm:w-4 sm:h-4 ${
          i < Math.floor(product.rating) 
            ? "fill-[#F2994A] text-[#F2994A]" 
            : "fill-neutral-200 text-neutral-200"
        }`} 
      />
    ));
  };

  const displayPrice = typeof product.price === 'number' 
    ? `Rp.${product.price.toLocaleString("id-ID")}` 
    : product.price;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-10%" }}
      transition={{ duration: 0.4 }}
      className="bg-white rounded-2xl sm:rounded-3xl flex flex-col group border border-neutral-100 shadow-sm hover:shadow-xl transition-all duration-300 overflow-hidden h-full"
    >
      <div className="w-full relative h-[200px] sm:h-[260px] bg-[#FDF9F1] overflow-hidden flex-shrink-0">
        <Image
          src={product.image}
          alt={product.name}
          fill
          unoptimized
          className={`object-cover object-center transition-transform duration-500 group-hover:scale-110 ${isSoldOut ? "grayscale opacity-60" : ""}`}
          sizes="(max-width: 768px) 50vw, 25vw"
        />
        
        {/* Floating Price Tag */}
        <div className="absolute bottom-3 right-3 sm:bottom-4 sm:right-4 bg-white px-3 py-1 sm:px-4 sm:py-1.5 rounded-lg sm:rounded-xl shadow-md border border-neutral-100 z-10 transition-transform duration-300 group-hover:-translate-y-1">
          <span className="text-[#8B4513] font-black text-[11px] sm:text-base tracking-tight">
            {displayPrice}
          </span>
        </div>
      </div>

      {/* Bottom Info Section */}
      <div className="p-4 sm:p-5 pt-6 sm:pt-8 flex flex-col flex-1 bg-white">
        
        <h3 className="text-sm sm:text-lg font-black tracking-tight text-neutral-900 mb-3 leading-tight line-clamp-2">
          {product.name}
        </h3>
        
        <div className="flex items-center justify-between mb-3 sm:mb-4">
          <span className={`text-[9px] sm:text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider ${
            product.category === "Non-Coffee" 
              ? "bg-[#E8F5E9] text-[#2E7D32]" 
              : "bg-[#FFF4E5] text-[#D48806]" 
          }`}>
            {product.category}
          </span>
          
          <div className="flex items-center gap-1">
            <div className="flex gap-0.5">
              {renderStars()}
            </div>
            <span className="text-[10px] sm:text-xs font-bold text-neutral-600 ml-0.5">{product.rating}</span>
          </div>
        </div>

        <div className="flex flex-wrap gap-1.5 sm:gap-2 mb-4 sm:mb-6">
          {product.tags.map((tag, idx) => (
            <span key={idx} className="border border-[#F2C94C] text-[#D48806] text-[8px] sm:text-[10px] px-1.5 py-0.5 sm:px-2 rounded-md font-medium uppercase tracking-wider">
              {tag}
            </span>
          ))}
        </div>

        <div className="mt-auto pt-3 sm:pt-4 border-t border-neutral-50">
          <button 
            onClick={onAdd}
            disabled={isSoldOut}
            className={`w-full flex items-center justify-center gap-1.5 text-[11px] sm:text-sm font-black uppercase tracking-widest py-2.5 sm:py-3 rounded-xl sm:rounded-full transition-all duration-300 active:scale-95 shadow-md ${
              isSoldOut 
                ? "bg-neutral-300 text-neutral-500 cursor-not-allowed shadow-none hover:bg-neutral-300"
                : "bg-[#EA580C] hover:bg-[#C2410C] text-white shadow-orange-500/20"
            }`}
          >
            {isSoldOut ? (
              "SOLD OUT"
            ) : (
              <><Plus className="w-3 h-3 sm:w-4 sm:h-4" /> Tambah</>
            )}
          </button>
        </div>
      </div>
    </motion.div>
  );
}