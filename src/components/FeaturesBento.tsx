"use client";

import { motion } from "motion/react";
import Image from "next/image";
import { Coffee, ShieldCheck, Truck, Sparkles } from "lucide-react";
import BrandMarquee from "./BrandMarquee";

export default function FeaturesBento() {
  return (
    <section id="fitur" className="w-full py-16 md:py-24 bg-white text-neutral-900 overflow-hidden">
      
      {/* --- WRAPPER 1: HEADER (Gambar Kaleng) --- */}
      <div className="max-w-7xl mx-auto px-6 sm:px-12 md:px-16 flex flex-col md:flex-row items-start md:items-center justify-between gap-8 md:gap-12 pb-16 md:pb-24">
        {/* KOLOM KIRI: TEKS */}
        <div className="w-full md:w-1/2 flex flex-col gap-6">
          <div className="flex items-center gap-2">
            <span className="w-8 h-[1px] bg-neutral-950" />
            <span className="text-xs sm:text-sm font-semibold tracking-widest text-neutral-950 uppercase">
              THE SERU.NI EXPERIENCE
            </span>
          </div>
          <h2 className="text-5xl md:text-6xl font-extrabold tracking-tighter-custom leading-[1.1] text-neutral-950 flex flex-col gap-y-1">
            <span>Ngopi</span>
            <span className="text-[#EA580C]">SERU-seruan disiNI</span>
          </h2>
          <p className="text-sm sm:text-base text-neutral-500 font-light max-w-xl md:max-w-lg leading-relaxed mt-2">
            Dari biji kopi premium hingga kemasan ramah lingkungan, setiap detail seru.ni dipikirkan secara matang untuk kepuasan Anda. Didesain untuk pengalaman seduh terbaik.
          </p>
          <div className="mt-4">
            <a href="/produk" className="inline-flex items-center gap-3 bg-neutral-950 text-white px-8 py-4 rounded-full font-bold text-sm tracking-widest uppercase hover:bg-[#DC7331] hover:scale-105 transition-all duration-300 shadow-xl shadow-black/10">
              Pesan Sekarang <span className="text-xl leading-none">&rarr;</span>
            </a>
          </div>
        </div>

        {/* KOLOM KANAN: VIDEO */}
        <div className="w-full md:w-1/2 mt-8 md:mt-0">
          <div className="relative aspect-video rounded-3xl overflow-hidden shadow-2xl border border-neutral-100">
            <video
              src="/video/video-tangan-kopi.mp4"
              autoPlay
              loop
              muted
              playsInline
              className="absolute inset-0 w-full h-full object-cover"
            ></video>
          </div>
        </div>
      </div>


      {/* --- MARQUEE DISISIPKAN DI SINI (Full Width) --- */}
      <BrandMarquee />


      {/* --- WRAPPER 2: BENTO GRID --- */}
      <div className="max-w-7xl mx-auto px-6 sm:px-12 md:px-16 flex flex-col gap-10 mt-16 md:mt-24">
        
        {/* Header Bento */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-8 border-b border-neutral-100 pb-10">
          <div className="flex flex-col gap-4 max-w-xl">
            <div className="flex items-center gap-2">
              <span className="w-8 h-[1px] bg-neutral-950" />
              <span className="text-xs sm:text-sm font-semibold tracking-widest text-neutral-950 uppercase">
                THE SERU.NI EXPERIENCE
              </span>
            </div>
            <h2 className="text-4xl sm:text-5xl font-bold tracking-tighter-custom text-neutral-950 leading-none">
              Didesain Untuk Pengalaman Seduh Terbaik.
            </h2>
          </div>
          <p className="text-sm sm:text-base text-neutral-500 font-light max-w-xs md:max-w-sm leading-relaxed">
            Dari biji kopi premium hingga kemasan ramah lingkungan, setiap detail seru.ni dipikirkan secara matang untuk kepuasan Anda.
          </p>
        </div>

        {/* Kotak-Kotak Bento */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 auto-rows-[280px] sm:auto-rows-[340px]">
          
          {/* Card 1: Beans */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.1, margin: "0px 0px -15% 0px" }}
            transition={{ duration: 0.6 }}
            className="md:col-span-2 relative rounded-3xl overflow-hidden border border-neutral-100 bg-neutral-50 p-8 flex flex-col justify-between group shadow-sm hover:shadow-md transition-all duration-300"
          >
            <div className="absolute inset-0 z-0 opacity-95 group-hover:scale-105 group-hover:opacity-100 transition-all duration-700">
              <Image src="/images/ramdani.jpeg" alt="Seni di Setiap Seduhan" fill className="object-cover" sizes="(max-width: 768px) 100vw, 66vw" />
            </div>
            <div className="absolute inset-0 bg-gradient-to-t from-neutral-50/90 via-neutral-50/20 to-transparent z-10" />
            <div className="relative z-20 flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-white border border-neutral-200/50 flex items-center justify-center shadow-sm">
                <Coffee className="w-5 h-5 text-accent-dark" />
              </div>
              <span className="text-xs font-bold tracking-widest text-neutral-800 uppercase">Biji Kopi Pilihan</span>
            </div>
            <div className="relative z-20 max-w-md mt-auto">
              <h3 className="text-2xl font-bold tracking-tight text-neutral-900 mb-2">Seni di Setiap Seduhan</h3>
              <p className="text-sm text-neutral-600 font-light leading-relaxed">Saksikan ketelitian barista kami menyiapkan setiap seruput Matcha premium Anda. Dari Kopi Susu hingga racikan spesial, dedikasi kami memastikan kesempurnaan di setiap gelas Seru.ni.</p>
            </div>
          </motion.div>

          {/* Card 2: Mobile Cart */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.1, margin: "0px 0px -15% 0px" }}
            transition={{ duration: 0.6, delay: 0.15 }}
            className="md:row-span-2 relative rounded-3xl overflow-hidden border border-neutral-100 bg-neutral-900 p-8 flex flex-col justify-between group shadow-sm text-white"
          >
            <div className="absolute inset-0 z-0 opacity-80 group-hover:scale-105 group-hover:opacity-100 transition-all duration-700">
              <Image src="/images/bento_mobile_cart.png" alt="Armada Gerobak Keliling" fill className="object-cover" sizes="(max-width: 768px) 100vw, 33vw" />
            </div>
            <div className="absolute inset-0 bg-gradient-to-t from-neutral-950/90 via-neutral-950/40 to-transparent z-10" />
            <div className="relative z-20 flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-neutral-800 border border-neutral-700 flex items-center justify-center shadow-sm">
                <Truck className="w-5 h-5 text-[#DC7331]" />
              </div>
              <span className="text-xs font-bold tracking-widest text-neutral-300 uppercase">Mobilitas Jalanan</span>
            </div>
            <div className="relative z-20 mt-auto">
              <h3 className="text-2xl font-bold tracking-tight text-white mb-2 leading-tight">Armada Gerobak Tanpa Sekat</h3>
              <p className="text-sm text-neutral-300 font-light leading-relaxed">Kami hadir lebih dekat dengan Anda. Tidak perlu lagi masuk mal atau memesan parkir berbayar, temukan barista keliling kami tepat di trotoar jalan favorit Anda.</p>
            </div>
          </motion.div>

          {/* Card 3: Drip process */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.1, margin: "0px 0px -15% 0px" }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="relative rounded-3xl overflow-hidden border border-neutral-100 bg-neutral-50 p-8 flex flex-col justify-between group shadow-sm hover:shadow-md transition-all duration-300"
          >
            <div className="absolute inset-0 z-0 opacity-95 group-hover:scale-105 group-hover:opacity-100 transition-all duration-700">
              <Image src="/images/mesin-kopi.jpg" alt="Pembangkit Energi Otentik" fill className="object-cover" sizes="(max-width: 768px) 100vw, 33vw" />
            </div>
            <div className="absolute inset-0 bg-gradient-to-t from-neutral-50/90 via-neutral-50/20 to-transparent z-10" />
            <div className="relative z-20 flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-white border border-neutral-200/50 flex items-center justify-center shadow-sm">
                <Sparkles className="w-5 h-5 text-accent-dark" />
              </div>
              <span className="text-xs font-bold tracking-widest text-neutral-800 uppercase">Proses Seduh</span>
            </div>
            <div className="relative z-20 mt-auto">
              <h3 className="text-xl font-bold tracking-tight text-neutral-900 mb-1">Pembangkit Energi Otentik</h3>
              <p className="text-xs text-neutral-600 font-light leading-relaxed">Jantung rasa Seru.ni. Kami menggunakan mesin espresso komersial performa tinggi untuk mengekstraksi rasa kaya dan konsisten dari biji kopi premium kami setiap harinya.</p>
            </div>
          </motion.div>

          {/* Card 4: Eco cup */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.1, margin: "0px 0px -15% 0px" }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="relative rounded-3xl overflow-hidden border border-neutral-100 bg-neutral-50 p-8 flex flex-col justify-between group shadow-sm hover:shadow-md transition-all duration-300"
          >
            <div className="absolute inset-0 z-0 opacity-95 group-hover:scale-105 group-hover:opacity-100 transition-all duration-700">
              <Image src="/images/bento_coffee_cup.png" alt="Kemasan Premium" fill className="object-cover" sizes="(max-width: 768px) 100vw, 66vw" />
            </div>
            <div className="absolute inset-0 bg-gradient-to-t from-neutral-50/90 via-neutral-50/20 to-transparent z-10" />
            <div className="relative z-20 flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-white border border-neutral-200/50 flex items-center justify-center shadow-sm">
                <ShieldCheck className="w-5 h-5 text-accent-dark" />
              </div>
              <span className="text-xs font-bold tracking-widest text-neutral-800 uppercase">Kemasan Hijau</span>
            </div>
            <div className="relative z-20 max-w-md mt-auto">
              <h3 className="text-2xl font-bold tracking-tight text-neutral-900 mb-2">100% Gelas Kompos & Ramah Lingkungan</h3>
              <p className="text-sm text-neutral-600 font-light leading-relaxed">Kami sangat peduli pada bumi. Gelas seru.ni menggunakan material biodegradable yang ramah lingkungan dan bersertifikasi compostable.</p>
            </div>
          </motion.div>

        </div>
      </div>
    </section>
  );
}