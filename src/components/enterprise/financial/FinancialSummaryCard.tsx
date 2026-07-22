import React, { useEffect, useState } from "react";
import { motion, useAnimation } from "motion/react";
import { TrendingUp, TrendingDown } from "lucide-react";

interface FinancialSummaryCardProps {
  title: string;
  subtitle: string;
  value: number;
  trend: number;
  accent: "orange" | "emerald" | "cyan";
  icon: React.ReactNode;
  prefix?: string;
  suffix?: string;
}

export const FinancialSummaryCard: React.FC<FinancialSummaryCardProps> = ({
  title,
  subtitle,
  value,
  trend,
  accent,
  icon,
  prefix = "Rp ",
  suffix = "",
}) => {
  const [displayValue, setDisplayValue] = useState(0);
  const controls = useAnimation();

  // Animated Counter Effect
  useEffect(() => {
    let start = 0;
    const duration = 800; // ms
    const increment = value / (duration / 16);
    
    const animate = () => {
      start += increment;
      if (start < value) {
        setDisplayValue(Math.floor(start));
        requestAnimationFrame(animate);
      } else {
        setDisplayValue(value);
      }
    };
    animate();
  }, [value]);

  const accentColors = {
    orange: "text-orange-500 bg-orange-500/10 shadow-orange-500/20",
    emerald: "text-emerald-500 bg-emerald-500/10 shadow-emerald-500/20",
    cyan: "text-cyan-500 bg-cyan-500/10 shadow-cyan-500/20",
  };

  const accentGlow = {
    orange: "bg-orange-500/5 group-hover:bg-orange-500/10",
    emerald: "bg-emerald-500/5 group-hover:bg-emerald-500/10",
    cyan: "bg-cyan-500/5 group-hover:bg-cyan-500/10",
  };

  return (
    <motion.div
      whileHover={{ y: -4 }}
      className="group relative bg-[#18181B] border border-white/[0.05] hover:border-white/[0.1] rounded-[24px] p-6 transition-all duration-300 overflow-hidden"
    >
      {/* Background Glow */}
      <div className={`absolute top-0 right-0 w-32 h-32 rounded-full blur-[60px] -mr-10 -mt-10 transition-colors duration-500 ${accentGlow[accent]}`} />
      
      <div className="relative z-10 flex flex-col h-full justify-between">
        <div className="flex items-start justify-between mb-8">
          <div>
            <h3 className="text-sm font-bold text-neutral-400 uppercase tracking-widest mb-1">{title}</h3>
            <p className="text-xs text-neutral-500 font-medium">{subtitle}</p>
          </div>
          <div className={`w-10 h-10 rounded-2xl flex items-center justify-center shrink-0 shadow-lg ${accentColors[accent]}`}>
            {icon}
          </div>
        </div>

        <div>
          <div className="flex items-end gap-3 mb-2">
            <h2 className="text-3xl md:text-4xl font-black text-white tracking-tighter">
              {prefix}{displayValue.toLocaleString("id-ID")}{suffix}
            </h2>
          </div>
          
          <div className="flex items-center gap-2">
            <div className={`flex items-center gap-1 text-xs font-bold px-2 py-1 rounded-lg ${trend >= 0 ? "text-emerald-400 bg-emerald-500/10" : "text-rose-400 bg-rose-500/10"}`}>
              {trend >= 0 ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
              <span>{Math.abs(trend)}%</span>
            </div>
            <span className="text-xs text-neutral-500">vs periode sebelumnya</span>
          </div>
        </div>
      </div>
    </motion.div>
  );
};
