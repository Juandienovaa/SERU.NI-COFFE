"use client";

import React from "react";
import { BatchStatus } from "@/types/productionBatch";
import { Loader2, CheckCircle2, XCircle } from "lucide-react";

interface StatusBadgeProps {
  status: BatchStatus | string;
}

/**
 * Komponen `StatusBadge` berdesain Swiss/Linear/Stripe untuk menunjukkan status batch.
 */
export default function StatusBadge({ status }: StatusBadgeProps) {
  const normalizedStatus = status ? status.toUpperCase() : "PENDING_BARISTA";

  if (normalizedStatus === "PENDING_BARISTA" || normalizedStatus === "PENDING") {
    return (
      <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-500 font-bold text-[11px] uppercase tracking-wider select-none">
        <Loader2 className="w-3.5 h-3.5 animate-spin" />
        <span>Pending Barista</span>
      </div>
    );
  }

  if (normalizedStatus === "COMPLETED" || normalizedStatus === "SELESAI") {
    return (
      <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 font-bold text-[11px] uppercase tracking-wider select-none">
        <CheckCircle2 className="w-3.5 h-3.5" />
        <span>Completed</span>
      </div>
    );
  }
  
  if (normalizedStatus === "CANCELLED" || normalizedStatus === "BATAL") {
    return (
      <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-red-500/10 border border-red-500/20 text-red-500 font-bold text-[11px] uppercase tracking-wider select-none">
        <XCircle className="w-3.5 h-3.5" />
        <span>Cancelled</span>
      </div>
    );
  }

  // Fallback state
  return (
    <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-neutral-800 border border-neutral-700 text-neutral-400 font-bold text-[11px] uppercase tracking-wider select-none">
      <span className="h-2 w-2 rounded-full bg-neutral-500"></span>
      <span>{status || "Unknown"}</span>
    </div>
  );
}
