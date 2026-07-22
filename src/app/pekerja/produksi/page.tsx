"use client";

import React, { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "motion/react";
import { ProductionBatch, ProductionDraftState } from "@/types/production";
import { fetchPendingProductionBatches } from "@/services/productionBatchService";
import { useProductionAllocation } from "@/hooks/useProductionAllocation";
import { useProductionDraft } from "@/hooks/useProductionDraft";
import { useProducts } from "@/hooks/useProducts";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { ProductionQueue } from "@/components/production/ProductionQueue";
import { ProductionWorkspace } from "@/components/production/ProductionWorkspace";
import { ResumeDraftDialog } from "@/components/production/ResumeDraftDialog";
import { EnterpriseHeader } from "@/components/enterprise/EnterpriseHeader";
import { calculateProgressPercentage } from "@/utils/allocation";
import { CheckCircle2, ShieldAlert } from "lucide-react";

/**
 * Enterprise Operator Console (`/pekerja/produksi`).
 * Backed by Centralized Product Repository (`useProducts`) and Enterprise Notification Center.
 */
export default function EnterpriseManufacturingConsolePage() {
  const router = useRouter();
  const [batches, setBatches] = useState<ProductionBatch[]>([]);
  const [loadingQueue, setLoadingQueue] = useState<boolean>(true);
  const [queueError, setQueueError] = useState<string | null>(null);
  const [crewName, setCrewName] = useState<string>("Crew Barista");
  const [baristaId, setBaristaId] = useState<string>("barista-current");
  const [showSuccessToast, setShowSuccessToast] = useState<boolean>(false);
  const [errorToast, setErrorToast] = useState<string | null>(null);

  const { products } = useProducts();

  const {
    existingDraft,
    hasRecoveryDraft,
    checkForExistingDraft,
    discardDraft,
    setHasRecoveryDraft
  } = useProductionDraft();

  const {
    activeBatch,
    allocations,
    defectCups,
    lockStatus,
    balanceResult,
    submitting,
    clampingToast,
    startBatchProduction,
    resumeFromDraft,
    updateAllocationQuantity,
    incrementAllocation,
    updateDefectCups,
    addCustomProduct,
    handlePartialSubmit,
    exitWorkspace,
    submitCurrentBatch
  } = useProductionAllocation();

  // Load active shift info from localStorage
  useEffect(() => {
    if (typeof window !== "undefined") {
      try {
        const sessionStr = localStorage.getItem("pos_shift_session") || localStorage.getItem("active_shift");
        if (sessionStr) {
          const parsed = JSON.parse(sessionStr);
          if (parsed.crewName || parsed.user_name || parsed.cashier_name) {
            setCrewName(parsed.crewName || parsed.user_name || parsed.cashier_name);
          }
          if (parsed.userId || parsed.id || parsed.cashier_id) {
            setBaristaId(parsed.userId || parsed.id || parsed.cashier_id);
          }
        }
      } catch (e) {
        console.error("Error reading session:", e);
      }
    }
  }, []);

  // Fetch queue from Supabase / service
  const loadQueue = useCallback(async () => {
    setLoadingQueue(true);
    setQueueError(null);
    const res = await fetchPendingProductionBatches();
    if (res.success && res.data) {
      setBatches(res.data);
    } else {
      setQueueError(res.error || "Gagal memuat antrean produksi.");
    }
    setLoadingQueue(false);
  }, []);

  useEffect(() => {
    loadQueue();
  }, [loadQueue]);

  // Step 1 to Step 2 transition: Start Production with Centralized Catalog
  const handleStartProduction = async (batch: ProductionBatch) => {
    setErrorToast(null);
    const res = await startBatchProduction(batch, baristaId, crewName, products);
    if (!res.success && res.message) {
      setErrorToast(res.message);
      setTimeout(() => setErrorToast(null), 5000);
    }
  };

  // Resume session from draft dialog
  const handleResumeDraft = async (draft: ProductionDraftState) => {
    setHasRecoveryDraft(false);
    const res = await resumeFromDraft(draft, baristaId, crewName);
    if (!res.success && res.message) {
      setErrorToast(res.message);
      setTimeout(() => setErrorToast(null), 5000);
    }
  };

  // Discard session draft from dialog
  const handleDiscardDraft = async (batchId: string) => {
    await discardDraft(batchId);
    setHasRecoveryDraft(false);
  };

  // Exit console back to queue
  const handleExitConsole = async () => {
    await exitWorkspace();
    await loadQueue();
  };

  // Submit current batch conversion
  const handleSubmission = async () => {
    setErrorToast(null);
    const res = await submitCurrentBatch(baristaId, crewName);
    if (res.success) {
      setShowSuccessToast(true);
      setTimeout(() => setShowSuccessToast(false), 5000);
      await loadQueue();
    } else if (res.error) {
      setErrorToast(res.error);
      setTimeout(() => setErrorToast(null), 6000);
    }
  };

  const handleLogout = async () => {
    try {
      await supabase.auth.signOut();
      localStorage.clear();
      sessionStorage.clear();
      router.replace("/auth-pin");
    } catch (e) {
      console.error("Logout failed:", e);
      router.replace("/auth-pin");
    }
  };

  const progressPercentage = activeBatch
    ? calculateProgressPercentage(activeBatch.raw_cups_given, allocations, defectCups)
    : 0;

  return (
    <div className="min-h-screen bg-[#09090B] text-white flex flex-col font-sans antialiased selection:bg-[#F97316] selection:text-white">
      {/* 1. ENTERPRISE HEADER WITH NOTIFICATION CENTER & SHIFT PILL */}
      <EnterpriseHeader
        title={activeBatch ? `Batch Workstation • ${activeBatch.batch_number}` : "Barista Production Console"}
        subtitle="MES Stage 2"
        onBackClick={activeBatch ? undefined : handleLogout}
        backLabel="Keluar / Logout"
        crewName={crewName}
        roleLabel="Barista Operator"
      />

      {/* 2. ERROR BANNER */}
      <AnimatePresence>
        {errorToast && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="max-w-[1500px] mx-auto w-full px-6 sm:px-10 pt-4"
          >
            <div className="p-4 rounded-2xl bg-rose-950/90 border border-rose-500/50 text-rose-200 text-xs sm:text-sm flex items-center justify-between gap-3 shadow-xl">
              <div className="flex items-center gap-3">
                <ShieldAlert className="w-5 h-5 text-rose-400 shrink-0" />
                <span className="font-semibold">{errorToast}</span>
              </div>
              <button onClick={() => setErrorToast(null)} className="text-rose-400 font-bold text-xs px-2 py-1">
                Tutup
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* 3. MAIN CONSOLE LAYOUT */}
      <main className="max-w-[1500px] mx-auto w-full px-6 sm:px-10 pt-8 sm:pt-10 flex-1">
        <AnimatePresence mode="wait">
          {!activeBatch ? (
            /* STEP 1: QUEUE ONLY */
            <motion.div
              key="queue"
              initial={{ opacity: 0, x: -15 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -15 }}
              transition={{ duration: 0.2 }}
            >
              <ProductionQueue
                batches={batches}
                loading={loadingQueue}
                errorMsg={queueError}
                onStartProduction={handleStartProduction}
                onRefresh={loadQueue}
              />
            </motion.div>
          ) : (
            /* STEP 2/3: WORKSTATION CONSOLE ONLY */
            <motion.div
              key="workspace"
              initial={{ opacity: 0, x: 15 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 15 }}
              transition={{ duration: 0.2 }}
            >
              <ProductionWorkspace
                batch={activeBatch}
                allocations={allocations}
                defectCups={defectCups}
                balanceResult={balanceResult}
                progressPercentage={progressPercentage}
                lockStatus={lockStatus}
                submitting={submitting}
                clampingToast={clampingToast}
                onChangeQuantity={updateAllocationQuantity}
                onIncrement={incrementAllocation}
                onChangeDefect={updateDefectCups}
                onAddCustomProduct={addCustomProduct}
                onPartialSubmit={(prodId) => handlePartialSubmit(prodId, baristaId, crewName)}
                onExit={handleExitConsole}
                onSubmit={handleSubmission}
              />
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      {/* 4. RESUME DRAFT DIALOG */}
      <ResumeDraftDialog
        draft={existingDraft}
        isOpen={hasRecoveryDraft && !activeBatch}
        onResume={handleResumeDraft}
        onDiscard={handleDiscardDraft}
      />

      {/* 5. SUCCESS TOAST */}
      <AnimatePresence>
        {showSuccessToast && (
          <motion.div
            initial={{ opacity: 0, y: 50, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            className="fixed bottom-8 right-8 z-50 max-w-md bg-[#18181B]/95 backdrop-blur-2xl border border-emerald-500/50 p-6 rounded-3xl shadow-[0_20px_60px_rgba(16,185,129,0.25)] flex items-start gap-4"
          >
            <CheckCircle2 className="w-6 h-6 text-emerald-400 shrink-0 mt-0.5" />
            <div className="flex-1">
              <h4 className="text-sm font-bold text-white">
                Produksi Berhasil Dikunci & Disimpan
              </h4>
              <p className="text-xs text-neutral-300 mt-1 leading-relaxed">
                Akuntansi bahan baku dan alokasi produk jadi telah tersimpan secara presisi dengan identitas kunci product_id.
              </p>
            </div>
            <button
              onClick={() => setShowSuccessToast(false)}
              className="text-emerald-400 hover:text-white text-xs font-bold p-1"
            >
              Tutup
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
