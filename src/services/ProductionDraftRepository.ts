import { ProductionDraftState } from "@/types/production";

/**
 * Abstract Repository Interface for Enterprise Production Workstation Drafts.
 * Isolates UI and hooks from direct localStorage or Supabase operations.
 * Allows seamless future migration to Cloud Sync without changing UI components.
 */
export interface ProductionDraftRepository {
  /**
   * Saves or updates the production draft.
   */
  saveDraft(draft: ProductionDraftState): Promise<boolean>;

  /**
   * Loads the existing draft for a specific batch ID or the latest active draft.
   */
  loadDraft(batchId?: string): Promise<ProductionDraftState | null>;

  /**
   * Clears the draft (upon submission or explicit discard).
   */
  clearDraft(batchId?: string): Promise<void>;

  /**
   * Checks if a valid draft exists for a given batch (or any batch if undefined).
   */
  exists(batchId?: string): Promise<boolean>;

  /**
   * Triggers a debounced sync to cloud storage (Supabase).
   * In LocalDraftRepository, this is a no-op or future-ready hook.
   */
  syncDraft(draft: ProductionDraftState): Promise<boolean>;
}
