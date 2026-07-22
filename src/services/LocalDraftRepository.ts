import { ProductionDraftRepository } from "./ProductionDraftRepository";
import { ProductionDraftState } from "@/types/production";

const STORAGE_KEY_PREFIX = "mes_stage2_draft_";
const LATEST_BATCH_ID_KEY = "mes_stage2_latest_draft_id";

/**
 * LocalStorage Implementation of ProductionDraftRepository.
 * Provides high-speed, zero-latency local persistence with offline resilience.
 */
export class LocalDraftRepository implements ProductionDraftRepository {
  async saveDraft(draft: ProductionDraftState): Promise<boolean> {
    if (typeof window === "undefined") return false;
    try {
      const key = `${STORAGE_KEY_PREFIX}${draft.batchId}`;
      const payload: ProductionDraftState = {
        ...draft,
        lastUpdated: new Date().toISOString()
      };
      localStorage.setItem(key, JSON.stringify(payload));
      localStorage.setItem(LATEST_BATCH_ID_KEY, draft.batchId);
      return true;
    } catch (err) {
      console.warn("[LocalDraftRepository] Error saving draft to localStorage:", err);
      return false;
    }
  }

  async loadDraft(batchId?: string): Promise<ProductionDraftState | null> {
    if (typeof window === "undefined") return null;
    try {
      const targetId = batchId || localStorage.getItem(LATEST_BATCH_ID_KEY);
      if (!targetId) return null;

      const key = `${STORAGE_KEY_PREFIX}${targetId}`;
      const raw = localStorage.getItem(key);
      if (!raw) return null;

      const draft: ProductionDraftState = JSON.parse(raw);
      return draft;
    } catch (err) {
      console.warn("[LocalDraftRepository] Error loading draft:", err);
      return null;
    }
  }

  async clearDraft(batchId?: string): Promise<void> {
    if (typeof window === "undefined") return;
    try {
      const targetId = batchId || localStorage.getItem(LATEST_BATCH_ID_KEY);
      if (targetId) {
        localStorage.removeItem(`${STORAGE_KEY_PREFIX}${targetId}`);
        const latestId = localStorage.getItem(LATEST_BATCH_ID_KEY);
        if (latestId === targetId) {
          localStorage.removeItem(LATEST_BATCH_ID_KEY);
        }
      }
    } catch (err) {
      console.warn("[LocalDraftRepository] Error clearing draft:", err);
    }
  }

  async exists(batchId?: string): Promise<boolean> {
    if (typeof window === "undefined") return false;
    const targetId = batchId || localStorage.getItem(LATEST_BATCH_ID_KEY);
    if (!targetId) return false;
    return localStorage.getItem(`${STORAGE_KEY_PREFIX}${targetId}`) !== null;
  }

  async syncDraft(draft: ProductionDraftState): Promise<boolean> {
    // In Local repository, syncDraft updates local storage and can be augmented later to call cloud API
    return this.saveDraft(draft);
  }
}

export const localDraftRepository = new LocalDraftRepository();
