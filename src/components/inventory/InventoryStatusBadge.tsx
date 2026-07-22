"use client";

import React from "react";
import { InventoryStatusType } from "@/types/inventory";
import {
  AlertOctagon,
  AlertTriangle,
  CheckCircle2,
  HelpCircle,
  TrendingUp,
  ShieldAlert
} from "lucide-react";

interface InventoryStatusBadgeProps {
  statusLevel: InventoryStatusType;
  statusText?: string;
  className?: string;
}

export const InventoryStatusBadge: React.FC<InventoryStatusBadgeProps> = ({
  statusLevel,
  statusText,
  className = ""
}) => {
  const getBadgeStyle = () => {
    switch (statusLevel) {
      case "OUT_OF_STOCK":
        return {
          bg: "bg-rose-500/15",
          border: "border-rose-500/35",
          text: "text-rose-400",
          icon: <AlertOctagon className="w-3.5 h-3.5 text-rose-400 shrink-0" />,
          label: statusText || "🔴 Out of Stock",
          animate: "animate-pulse"
        };
      case "LOW_STOCK":
        return {
          bg: "bg-orange-500/15",
          border: "border-orange-500/35",
          text: "text-orange-400",
          icon: <AlertTriangle className="w-3.5 h-3.5 text-orange-400 shrink-0" />,
          label: statusText || "🟠 Low Stock",
          animate: ""
        };
      case "MEDIUM":
        return {
          bg: "bg-amber-500/15",
          border: "border-amber-500/35",
          text: "text-amber-400",
          icon: <ShieldAlert className="w-3.5 h-3.5 text-amber-400 shrink-0" />,
          label: statusText || "🟡 Medium",
          animate: ""
        };
      case "OVERSTOCK":
        return {
          bg: "bg-sky-500/15",
          border: "border-sky-500/35",
          text: "text-sky-400",
          icon: <TrendingUp className="w-3.5 h-3.5 text-sky-400 shrink-0" />,
          label: statusText || "🔵 Overstock",
          animate: ""
        };
      case "HEALTHY":
      default:
        return {
          bg: "bg-emerald-500/15",
          border: "border-emerald-500/35",
          text: "text-emerald-400",
          icon: <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />,
          label: statusText || "🟢 Healthy",
          animate: ""
        };
    }
  };

  const style = getBadgeStyle();

  return (
    <div
      className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full border text-xs font-bold font-mono shadow-sm transition-all ${style.bg} ${style.border} ${style.text} ${style.animate} ${className}`}
    >
      {statusLevel === "OUT_OF_STOCK" && (
        <span className="w-1.5 h-1.5 rounded-full bg-rose-500 animate-ping mr-0.5" />
      )}
      {statusLevel === "LOW_STOCK" && (
        <span className="w-1.5 h-1.5 rounded-full bg-orange-500 animate-pulse mr-0.5" />
      )}
      {style.icon}
      <span>{style.label}</span>
    </div>
  );
};
