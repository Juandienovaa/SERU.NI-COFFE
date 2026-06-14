"use client";

import { useRef } from "react";
import { motion, useScroll, useTransform } from "motion/react";

export default function AboutSection() {
  const sectionRef = useRef<HTMLDivElement>(null);
  
  const { scrollYProgress } = useScroll({
    target: sectionRef,
    offset: ["start end", "end start"],
  });

  // Efek Parallax tipis-tipis buat teksnya pas di-scroll
  const yText = useTransform(scrollYProgress, [0, 1], [50, -50]);

  return (
    <section
      id="tentang"
      ref={sectionRef}
      className="relative w-full min-h-screen overflow-hidden bg-white text-neutral-900 flex flex-col md:flex-row items-center justify-between px-8 sm:px-16 md:px-24 py-20 gap-12"
    >
      {/* KOLOM KIRI: KONTEN TEKS */}
      <motion.div
        style={{ y: yText }}
        className="w-full md:w-1/2 flex flex-col gap-8 z-10"
      >
        {/* Garis & Indikator Section */}
        <div className="flex items-center gap-3">
          <span className="w-12 h-[2px] bg-[#DC7331]" />
          <span className="text-sm font-bold tracking-widest text-[#DC7331] uppercase">
            Cerita Seru.ni
          </span>
        </div>

        {/* Judul Utama */}
        <h2 className="text-5xl md:text-6xl lg:text-7xl font-extrabold tracking-tight leading-[1.1] text-neutral-900">
          #NGOPI ASIK <br />
          <span className="text-[#DC7331]">DENGAN SERU.NI</span>
        </h2>

        {/* Paragraf Penjelasan */}
        <p className="text-lg md:text-xl text-neutral-600 max-w-lg leading-relaxed">
          Kami percaya menikmati secangkir kopi berkualitas premium tidak harus dibatasi oleh dinding kafe yang megah ataupun harga yang tinggi. Melalui armada gerobak modern seru.ni, rasa mewah kini hadir menemani amunisi harimu secara praktis di jalanan.
        </p>

        {/* USP (Keunggulan) */}
        <div className="grid grid-cols-2 gap-6 mt-2 border-t border-neutral-200 pt-8">
          <div>
            <h4 className="text-3xl font-bold text-neutral-900">100%</h4>
            <p className="text-xs text-neutral-500 font-bold uppercase tracking-wider mt-1">
              Biji Arabika Pilihan
            </p>
          </div>
          <div>
            <h4 className="text-3xl font-bold text-neutral-900">0%</h4>
            <p className="text-xs text-neutral-500 font-bold uppercase tracking-wider mt-1">
              Sekat & Jarak Antrean
            </p>
          </div>
        </div>
      </motion.div>

      {/* KOLOM KANAN: VIDEO TANGAN KOPI */}
      <motion.div 
        initial={{ opacity: 0, x: 50 }}
        whileInView={{ opacity: 1, x: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.8, ease: "easeOut" }}
        className="w-full md:w-1/2 h-[50vh] md:h-[70vh] relative rounded-3xl overflow-hidden shadow-2xl"
      >
        <video
          src="/video/video-tangan-kopi.mp4"
          autoPlay
          loop
          muted
          playsInline
          className="absolute inset-0 w-full h-full object-cover"
        />
      </motion.div>
    </section>
  );
}