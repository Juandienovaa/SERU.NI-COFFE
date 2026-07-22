"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { ProductionDraftState } from "@/types/production";
import { localDraftRepository } from "@/services/LocalDraftRepository";

/**
 * Custom Hook for Enterprise Production Draft Management.
 * Implements 300ms debounced auto-saving to the repository abstraction
 * and detects existing drafts upon page load or refresh for session recovery.
 */
export function useProductionDraft() {
  const [existingDraft, setExistingDraft] = useState<ProductionDraftState | null>(null);
  const [hasRecoveryDraft, setHasRecoveryDraft] = useState<boolean>(false);
  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Check on mount if an uncommitted draft exists
  const checkForExistingDraft = useCallback(async (specificBatchId?: string) => {
    try {
      const exists = await localDraftRepository.exists(specificBatchId);
      if (exists) {
        const draft = await localDraftRepository.loadDraft(specificBatchId);
        if (draft && draft.batchId) {
          setExistingDraft(draft);
          setHasRecoveryDraft(true);
          return draft;
        }
      }
    } catch (err) {
      console.warn("Error checking existing draft:", err);
    }
    setExistingDraft(null);
    setHasRecoveryDraft(false);
    return null;
  }, []);

  useEffect(() => {
    checkForExistingDraft();
  }, [checkForExistingDraft]);

  // Debounced auto-save (Layer 2 of Hybrid Save Architecture)
  const saveDebouncedDraft = useCallback((draft: ProductionDraftState) => {
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }

    debounceTimerRef.current = setTimeout(async () => {
      try {
        await localDraftRepository.saveDraft(draft);
      } catch (err) {
        console.warn("Debounced draft save failed:", err);
      }
    }, 300);
  }, []);

  // Immediate save (e.g., when closing tab or manually triggering)
  const saveImmediateDraft = useCallback(async (draft: ProductionDraftState) => {
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }
    return await localDraftRepository.saveDraft(draft);
  }, []);

  // Discard / clear draft from storage
  const discardDraft = useCallback(async (batchId?: string) => {
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }
    await localDraftRepository.clearDraft(batchId);
    setExistingDraft(null);
    setHasRecoveryDraft(false);
  }, []);

  return {
    existingDraft,
    hasRecoveryDraft,
    checkForExistingDraft,
    saveDebouncedDraft,
    saveImmediateDraft,
    discardDraft,
    setHasRecoveryDraft
  };
}
