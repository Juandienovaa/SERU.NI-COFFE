"use client";

import { useEffect, useState, useRef } from "react";
import { useInView, motion } from "motion/react";

interface CountUpProps {
  to: number;
  duration?: number;
  decimals?: number;
}

function CountUp({ to, duration = 1.8, decimals = 0 }: CountUpProps) {
  const [count, setCount] = useState(0);
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, amount: 0.1, margin: "0px 0px -15% 0px" });

  useEffect(() => {
    if (!isInView) return;

    let startTimestamp: number | null = null;
    const step = (timestamp: number) => {
      if (!startTimestamp) startTimestamp = timestamp;
      const progress = Math.min((timestamp - startTimestamp) / (duration * 1000), 1);
      
      // Easing function: easeOutExpo
      const easeProgress = progress === 1 ? 1 : 1 - Math.pow(2, -10 * progress);
      const currentVal = easeProgress * to;
      setCount(currentVal);

      if (progress < 1) {
        window.requestAnimationFrame(step);
      }
    };

    window.requestAnimationFrame(step);
  }, [isInView, to, duration]);

  const formattedValue = count.toLocaleString("id-ID", {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  });

  return <span ref={ref}>{formattedValue}</span>;
}

const stats = [
  {
    value: 5000,
    suffix: "+",
    label: "Seduhan Terjual",
    sub: "Kopi segar disajikan di kawasan perkantoran",
    decimals: 0
  },
  {
    value: 10,
    suffix: "+",
    label: "Armada Gerobak",
    sub: "Tersebar aktif di seluruh koridor Yos Sudarso",
    decimals: 0
  },
  {
    value: 100,
    suffix: "%",
    label: "Bahan Organik",
    sub: "Menggunakan gelas kompos ramah lingkungan",
    decimals: 0
  },
  {
    value: 4.9,
    suffix: "/5",
    label: "Rating Kepuasan",
    sub: "Berdasarkan ulasan penikmat kopi jalanan",
    decimals: 1
  }
];

export default function StatsCountUp() {
  return (
    <section className="w-full py-20 bg-neutral-50 border-y border-neutral-100 px-6 sm:px-12 md:px-16">
      <div className="max-w-7xl mx-auto">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-12 sm:gap-8 lg:gap-12">
          {stats.map((stat, idx) => (
            <motion.div
              key={idx}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.1, margin: "0px 0px -15% 0px" }}
              transition={{ duration: 0.5, delay: idx * 0.1 }}
              className="flex flex-col gap-3 p-6 rounded-2xl bg-white border border-neutral-200/40 shadow-[0_4px_20px_rgba(0,0,0,0.01)] hover:shadow-md transition-shadow"
            >
              <span className="text-xs font-semibold tracking-widest text-neutral-400 uppercase">
                {stat.label}
              </span>
              
              {/* Animated number */}
              <div className="text-4xl sm:text-5xl font-extrabold tracking-tighter-custom text-neutral-900 flex items-baseline leading-none">
                <CountUp to={stat.value} decimals={stat.decimals} />
                <span className="text-accent">{stat.suffix}</span>
              </div>
              
              <p className="text-xs sm:text-sm text-neutral-500 font-light leading-relaxed mt-2">
                {stat.sub}
              </p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
