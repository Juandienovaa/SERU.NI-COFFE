"use client";

import React from "react";
import { MRPRecommendation } from "@/types/inventory";
import { Zap, Flame, Info, CheckCircle, StopCircle } from "lucide-react";

interface RecommendationChipProps {
  recommendation: MRPRecommendation;
  priorityBadgeText: string;
}

export const RecommendationChip: React.FC<RecommendationChipProps> = ({
  recommendation,
  priorityBadgeText
}) => {
  const { actionText, reason, priorityLevel } = recommendation;

  const getStyle = () => {
    switch (priorityLevel) {
      case "HIGHEST":
        return {
          bg: "bg-rose-950/60",
          border: "border-rose-500/45",
          text: "text-rose-200",
          icon: <Flame className="w-4 h-4 text-rose-400 shrink-0 animate-bounce" />,
          badgeBg: "bg-rose-500/25 border-rose-500/50 text-rose-300"
        };
      case "HIGH":
        return {
          bg: "bg-orange-950/60",
          border: "border-orange-500/45",
          text: "text-orange-200",
          icon: <Zap className="w-4 h-4 text-orange-400 shrink-0" />,
          badgeBg: "bg-orange-500/25 border-orange-500/50 text-orange-300"
        };
      case "NORMAL":
        return {
          bg: "bg-amber-950/40",
          border: "border-amber-500/35",
          text: "text-amber-200",
          icon: <Info className="w-4 h-4 text-amber-400 shrink-0" />,
          badgeBg: "bg-amber-500/20 border-amber-500/40 text-amber-300"
        };
      case "SUFFICIENT":
      default:
        if (actionText.includes("Halted") || actionText.includes("Surplus")) {
          return {
            bg: "bg-sky-950/40",
            border: "border-sky-500/35",
            text: "text-sky-200",
            icon: <StopCircle className="w-4 h-4 text-sky-400 shrink-0" />,
            badgeBg: "bg-sky-500/20 border-sky-500/40 text-sky-300"
          };
        }
        return {
          bg: "bg-emerald-950/40",
          border: "border-emerald-500/35",
          text: "text-emerald-200",
          icon: <CheckCircle className="w-4 h-4 text-emerald-400 shrink-0" />,
          badgeBg: "bg-emerald-500/20 border-emerald-500/40 text-emerald-300"
        };
    }
  };

  const style = getStyle();

  return (
    <div className={`p-3.5 rounded-2xl border transition-all ${style.bg} ${style.border}`}>
      <div className="flex items-center justify-between gap-2 mb-1.5">
        <div className="flex items-center gap-2">
          {style.icon}
          <span className={`text-xs font-extrabold font-mono ${style.text}`}>
            {actionText}
          </span>
        </div>
        <span
          className={`text-[9px] px-2 py-0.5 rounded-md font-mono font-black uppercase tracking-wider border ${style.badgeBg}`}
        >
          {priorityBadgeText}
        </span>
      </div>

      <p className="text-[11px] text-neutral-300 font-light leading-relaxed">
        {reason}
      </p>
    </div>
  );
};
