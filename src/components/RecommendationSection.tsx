import React from "react";
import Image from "next/image";

interface ProductRecommendation {
  id: number;
  name: string;
  price: number;
  image: string;
}

const DUMMY_PRODUCTS: ProductRecommendation[] = [
  { id: 1, name: "APPLE AMERICANO", price: 25000, image: "/produk/apple-americano.png" },
  { id: 2, name: "CREAMY LATTE", price: 28000, image: "/produk/creamy-latte.png" },
  { id: 3, name: "MATCHA FUSION", price: 30000, image: "/produk/matcha-fusion.png" },
  { id: 4, name: "BERRY BLISS", price: 32000, image: "/produk/berry-bliss.png" },
];

export default function RecommendationSection() {
  const formatPrice = (price: number) => {
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      minimumFractionDigits: 0,
    }).format(price);
  };

  return (
    <section className="w-full bg-white py-12 px-4 md:px-8 lg:px-16">
      <div className="max-w-7xl mx-auto">
        <h2 className="text-center text-red-600 font-black text-2xl md:text-3xl uppercase tracking-widest mb-8">
          RECOMMENDATION
        </h2>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {DUMMY_PRODUCTS.map((product) => (
            <div key={product.id} className="flex flex-col bg-white">
              <div className="w-full aspect-[3/4] bg-gray-200 relative p-4 mb-3">
                <Image
                  src={product.image}
                  alt={product.name}
                  fill
                  className="object-contain p-4"
                  sizes="(max-width: 768px) 50vw, 25vw"
                />
              </div>
              <div className="text-left mb-3 flex-grow flex flex-col justify-start">
                <h3 className="text-red-600 font-bold uppercase text-sm md:text-base leading-tight mb-1">
                  {product.name}
                </h3>
                <span className="text-black font-semibold text-sm">
                  {formatPrice(product.price)}
                </span>
              </div>
              <button className="w-full bg-black text-white rounded-none py-3 font-bold uppercase text-xs tracking-wider hover:bg-neutral-800 transition-colors active:scale-95">
                ADD TO CART
              </button>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
