"use client";

import { useEffect, useRef } from "react";
import Lenis from "lenis";
import { motion, useScroll, useTransform } from "framer-motion";
import Image from "next/image";
import { Playfair_Display } from "next/font/google";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import MagneticButton from "@/components/MagneticButton";
import { ArrowRight } from "lucide-react";

const playfair = Playfair_Display({ subsets: ["latin"], style: ["normal", "italic"], weight: ["400", "700"] });

const InstagramIcon = ({ className }: { className?: string }) => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <rect x="2" y="2" width="20" height="20" rx="5" ry="5"></rect>
    <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"></path>
    <line x1="17.5" y1="6.5" x2="17.51" y2="6.5"></line>
  </svg>
);

const WhatsAppIcon = ({ className }: { className?: string }) => (
  <svg viewBox="0 0 24 24" fill="currentColor" className={className}>
    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.888-.788-1.487-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51a12.8 12.8 0 0 0-.57-.01c-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 0 1-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 0 1-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 0 1 2.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0 0 12.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 0 0 5.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 0 0-3.48-8.413Z"/>
  </svg>
);

export default function ContactPage() {
  // Initialize Lenis smooth scroll
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

  // Scroll Tracking for "The Story"
  const containerRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start start", "end end"],
  });

  // Teks 1: 0% - 25%
  const opacity1 = useTransform(scrollYProgress, [0, 0.15, 0.25], [1, 1, 0]);
  const scale1 = useTransform(scrollYProgress, [0, 0.25], [1, 0.85]);
  const display1 = useTransform(scrollYProgress, (p) => p <= 0.25 ? "flex" : "none");

  // Teks 2: 25% - 50%
  const opacity2 = useTransform(scrollYProgress, [0.25, 0.35, 0.45, 0.50], [0, 1, 1, 0]);
  const x2 = useTransform(scrollYProgress, [0.25, 0.50], ["-5%", "5%"]);
  const display2 = useTransform(scrollYProgress, (p) => (p > 0.25 && p <= 0.50) ? "flex" : "none");

  // Teks 3: 50% - 75%
  const opacity3 = useTransform(scrollYProgress, [0.50, 0.60, 0.70, 0.75], [0, 1, 1, 0]);
  const x3 = useTransform(scrollYProgress, [0.50, 0.75], ["5%", "-5%"]);
  const display3 = useTransform(scrollYProgress, (p) => (p > 0.50 && p <= 0.75) ? "flex" : "none");

  // Teks 4: 75% - 100%
  const opacity4 = useTransform(scrollYProgress, [0.75, 0.85, 1], [0, 1, 1]);
  const y4 = useTransform(scrollYProgress, [0.75, 1], ["10%", "0%"]);
  const display4 = useTransform(scrollYProgress, (p) => p > 0.75 ? "flex" : "none");

  return (
    <div className="bg-[#FAFAFA] min-h-screen text-neutral-900 selection:bg-[#EA580C] selection:text-white">
      <Navbar />

      {/* --- HERO SECTION --- */}
      <section className="relative w-full h-[70vh] md:h-screen flex items-center justify-center overflow-hidden bg-neutral-950">
        <video 
          src="/video/hero-contact.mp4"
          autoPlay
          loop
          muted
          playsInline
          className="absolute inset-0 w-full h-full object-cover object-center"
        />
        <div className="absolute inset-0 bg-neutral-950/60 z-10" />
        <div className="relative z-20 flex flex-col items-center text-center px-6 mt-12 md:mt-0">
          <motion.h1 
            initial={{ opacity: 0, y: 40 }} 
            animate={{ opacity: 1, y: 0 }} 
            transition={{ duration: 0.8, ease: "easeOut" }} 
            className={`text-6xl sm:text-7xl md:text-8xl lg:text-[7.5rem] ${playfair.className} text-white leading-[1.1] mb-6 drop-shadow-2xl`}
          >
            <span className="italic font-normal">Get in</span> <br className="md:hidden" /> 
            <span className="text-[#EA580C] font-black uppercase tracking-tighter ml-0 md:ml-4 font-sans">TOUCH</span>
          </motion.h1>
          <motion.p 
            initial={{ opacity: 0, y: 20 }} 
            animate={{ opacity: 1, y: 0 }} 
            transition={{ duration: 0.8, delay: 0.2, ease: "easeOut" }} 
            className="text-xs md:text-sm lg:text-base font-medium text-white/80 tracking-[0.2em] md:tracking-[0.3em] uppercase max-w-2xl leading-relaxed drop-shadow-md"
          >
            We'd love to hear from you. Let's brew something great together.
          </motion.p>
        </div>
      </section>

      {/* --- SCROLLYTELLING TEXT OVERLAYS --- */}
      <section ref={containerRef} className="relative h-[400vh] bg-neutral-950">
        <div className="sticky top-0 h-screen w-full flex items-center justify-center overflow-hidden">
          
          {/* Background Image Container that stays sticky */}
          <div className="absolute inset-0 z-0">
            <Image 
              src="/hero-menu.jpeg" 
              alt="Background" 
              fill 
              className="object-cover opacity-30"
            />
            <div className="absolute inset-0 bg-neutral-950/70" />
          </div>

          {/* OVERLAY 1: Center */}
          <motion.div 
            style={{ opacity: opacity1, scale: scale1, display: display1 }} 
            className="absolute z-10 flex-col items-center text-center px-4 w-full"
          >
            <h2 className={`text-[12vw] md:text-[10vw] ${playfair.className} leading-none text-white drop-shadow-2xl`}>
              <span className="italic font-normal">Our</span> <span className="text-[#EA580C] font-black uppercase tracking-tighter font-sans ml-2 md:ml-4">STORY</span>
            </h2>
            <p className="mt-4 text-xs md:text-xl text-white/80 font-medium tracking-[0.3em] uppercase drop-shadow-md">
              More than just coffee
            </p>
          </motion.div>

          {/* OVERLAY 2: Left Aligned */}
          <motion.div 
            style={{ opacity: opacity2, x: x2, display: display2 }} 
            className="absolute z-10 left-4 md:left-12 flex-col items-start w-full max-w-[90vw]"
          >
            <h2 className={`text-[12vw] md:text-[10vw] ${playfair.className} leading-none text-white drop-shadow-2xl text-left`}>
              <span className="italic font-normal">Crafted</span> <br/> 
              <span className="text-[#EA580C] font-black uppercase tracking-tighter font-sans">WITH PASSION</span>
            </h2>
          </motion.div>

          {/* OVERLAY 3: Right Aligned */}
          <motion.div 
            style={{ opacity: opacity3, x: x3, display: display3 }} 
            className="absolute z-10 right-4 md:right-12 flex-col items-end w-full max-w-[90vw]"
          >
            <h2 className={`text-[12vw] md:text-[10vw] ${playfair.className} leading-[0.9] text-white drop-shadow-2xl text-right`}>
              <span className="italic font-normal">Brewed</span> <br/> 
              <span className="text-[#EA580C] font-black uppercase tracking-tighter font-sans">FOR YOU</span>
            </h2>
          </motion.div>

          {/* OVERLAY 4: Center CTA */}
          <motion.div 
            style={{ opacity: opacity4, y: y4, display: display4 }} 
            className="absolute z-10 flex-col items-center text-center px-4 w-full"
          >
            <h2 className={`text-[10vw] md:text-[8vw] ${playfair.className} leading-none text-white mb-8 md:mb-12 drop-shadow-2xl`}>
              <span className="italic font-normal">Ready to</span> <br className="md:hidden" /> <span className="text-[#EA580C] font-black uppercase tracking-tighter font-sans ml-0 md:ml-4">COLLAB?</span>
            </h2>
            
            <div className="flex flex-col items-center gap-6 md:gap-8">
              <MagneticButton className="bg-[#EA580C] text-white px-8 py-5 md:px-12 md:py-6 rounded-full font-black tracking-widest uppercase text-sm md:text-base hover:bg-white hover:text-neutral-900 transition-colors shadow-2xl flex items-center gap-3">
                Drop Us A Line <ArrowRight className="w-5 h-5" />
              </MagneticButton>
              
              {/* SOCIAL LINKS */}
              <div className="flex items-center gap-4">
                <a 
                  href="https://instagram.com/kopiseru.ni" 
                  target="_blank" 
                  rel="noopener noreferrer" 
                  className="bg-white/10 hover:bg-[#EA580C] hover:scale-110 p-4 rounded-full backdrop-blur-md transition-all duration-300 shadow-xl group"
                >
                  <InstagramIcon className="w-6 h-6 text-white group-hover:text-white" />
                </a>
                <a 
                  href="https://wa.me/6283125525115" 
                  target="_blank" 
                  rel="noopener noreferrer" 
                  className="bg-white/10 hover:bg-[#25D366] hover:scale-110 p-4 rounded-full backdrop-blur-md transition-all duration-300 shadow-xl group"
                >
                  <WhatsAppIcon className="w-6 h-6 text-white group-hover:text-white" />
                </a>
              </div>
            </div>
          </motion.div>

        </div>
      </section>

      {/* --- FOOTER SPACING (Ensure footer appears after sticky) --- */}
      <div className="relative z-10 bg-white">
        <Footer />
      </div>
    </div>
  );
}
