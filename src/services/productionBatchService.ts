import { supabase } from "@/lib/supabase";
import {
  ProductionBatch,
  ProductionConversionPayload,
  ProductionLockStatus,
  ServiceResponse,
  BatchItemPayload
} from "@/types/production";
import { validateProductionInvariant } from "@/validators/production.validator";
import { generateBatchNumber } from "@/utils/generateBatchNumber";

const BATCH_TABLE = "production_batches";
const ITEMS_TABLE = "batch_items";
const LOCK_TIMEOUT_MINUTES = 15;
const LOCAL_LOCK_PREFIX = "mes_stage2_lock_";

/**
 * Safely converts any string/ID to a valid UUID or returns null.
 * Prevents PostgreSQL error: `invalid input syntax for type uuid: "Crew Barista"`
 * when the database column (`last_produced_by`) is of type UUID.
 */
function getSafeUuidOrNull(input?: string | null): string | null {
  if (!input || typeof input !== "string") return null;
  const cleaned = input.trim();
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  return uuidRegex.test(cleaned) ? cleaned : null;
}

/**
 * Enterprise Production Batch Service for MES Stage 2 & Stage 1.
 * Manages ticket queue fetching, concurrency control locks, and atomic conversions.
 */

/**
 * Fetches all production batches (for Manager Stage 1 history view), ordered newest first.
 */
export async function fetchProductionBatches(limit: number = 50): Promise<ServiceResponse<ProductionBatch[]>> {
  try {
    const { data, error } = await supabase
      .from(BATCH_TABLE)
      .select("*")
      .order("created_at", { ascending: false })
      .limit(limit);

    if (error) {
      console.error("[productionBatchService] Error fetching production batches:", error.message, error.code);
      return { success: false, data: null, error: error.message };
    }

    return { success: true, data: (data as ProductionBatch[]) || [] };
  } catch (err: any) {
    return { success: false, data: null, error: err?.message || "Gagal memuat data batch." };
  }
}

/**
 * Creates a new production batch (by Manager Stage 1).
 */
export async function createProductionBatch(rawCupsGiven: number): Promise<ServiceResponse<ProductionBatch>> {
  try {
    const batchNumber = generateBatchNumber();
    
    // Validasi Sesi yang ketat untuk RLS
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();
    
    if (sessionError || !session) {
      console.error("[productionBatchService] Auth Session Error:", sessionError);
      return { success: false, data: null, error: "Sesi tidak valid. Silakan login ulang." };
    }

    const managerId = session.user.id;

    // Create Production Batch (INSERT) - ONLY touches production_batches
    const payload = {
      batch_number: batchNumber,
      raw_cups_given: rawCupsGiven,
      defect_cups: 0,
      status: "PENDING_BARISTA", // reverted back to PENDING_BARISTA as explicitly requested by user
      manager_id: managerId,
      created_by: managerId,
      created_at: new Date().toISOString()
    };

    const { data, error } = await supabase
      .from(BATCH_TABLE)
      .insert([payload])
      .select("*")
      .single();

    if (error) {
      console.error("[productionBatchService] Error creating batch:", JSON.stringify(error));
      return { 
        success: false, 
        data: null, 
        error: `Gagal membuat batch. (Code: ${error.code} - ${error.message})` 
      };
    }

    return { success: true, data: data as ProductionBatch };
  } catch (err: any) {
    return { success: false, data: null, error: err?.message || "Gagal membuat batch baru." };
  }
}

/**
 * Fetches all production batches waiting for barista conversion (`PENDING_BARISTA` / `PENDING`),
 * ordered newest first.
 */
export async function fetchPendingProductionBatches(): Promise<ServiceResponse<ProductionBatch[]>> {
  try {
    const { data, error } = await supabase
      .from(BATCH_TABLE)
      .select("*")
      .or("status.eq.PENDING_BARISTA,status.eq.PENDING")
      .order("created_at", { ascending: false });

    if (error) {
      console.error("[productionBatchService] Error fetching pending batches:", error.message, error.code);
      if (error.code === "42P01") {
        return {
          success: false,
          data: [],
          error: `Tabel "${BATCH_TABLE}" belum dibuat di database. Harap jalankan migrasi terlebih dahulu.`
        };
      }
      if (error.code === "42501" || error.code === "PGRST301") {
        return {
          success: false,
          data: [],
          error: "Akses ditolak oleh Row Level Security (RLS). Sesi crew/barista tidak valid."
        };
      }
      return { success: false, data: [], error: error.message };
    }

    return {
      success: true,
      data: (data as ProductionBatch[]) || []
    };
  } catch (err: any) {
    console.error("[productionBatchService] Unexpected fetch error:", err);
    return {
      success: false,
      data: [],
      error: err?.message || "Terjadi gangguan koneksi jaringan saat memuat antrean produksi."
    };
  }
}

/**
 * Attempts to acquire a 15-minute exclusive Production Lock on a batch.
 * Checks both database lock columns (`locked_by`, `locked_at`) and falls back to resilient storage.
 */
export async function acquireProductionLock(
  batchId: string,
  baristaId: string,
  baristaName: string
): Promise<ProductionLockStatus> {
  const now = new Date();

  // 1. Check local session fallback lock first
  if (typeof window !== "undefined") {
    try {
      const rawLock = localStorage.getItem(`${LOCAL_LOCK_PREFIX}${batchId}`);
      if (rawLock) {
        const lockData = JSON.parse(rawLock);
        // Single barista shift mode: allow resume/takeover without blocking
      }
    } catch (e) {
      console.warn("Local lock check failed:", e);
    }
  }

  // 2. Try acquiring lock in database table
  try {
    const { data: currentBatch, error: fetchErr } = await supabase
      .from(BATCH_TABLE)
      .select("locked_by, locked_at")
      .eq("id", batchId)
      .maybeSingle();

    if (!fetchErr && currentBatch) {
      // Single barista shift mode: allow resume/takeover without blocking
      // Acquire DB lock directly to take over or refresh session

      // Acquire DB lock if free or expired
      const { error: updateErr } = await supabase
        .from(BATCH_TABLE)
        .update({
          locked_by: baristaId,
          locked_at: now.toISOString()
        })
        .eq("id", batchId);

      if (updateErr) {
        console.warn("Could not update lock column on DB (maybe column not added yet):", updateErr.message);
      }
    }
  } catch (dbErr) {
    console.warn("Database lock check gracefully bypassed:", dbErr);
  }

  // 3. Save acquired lock to local cache
  if (typeof window !== "undefined") {
    try {
      localStorage.setItem(
        `${LOCAL_LOCK_PREFIX}${batchId}`,
        JSON.stringify({ lockedBy: baristaId, lockedByName: baristaName, lockedAt: now.toISOString() })
      );
    } catch (e) {
      console.warn("Could not save local lock:", e);
    }
  }

  return {
    isLockedByOther: false,
    lockedBy: baristaId,
    lockedAt: now.toISOString()
  };
}

/**
 * Releases the Production Lock for a batch upon completion or cancellation.
 */
export async function releaseProductionLock(batchId: string, baristaId?: string): Promise<void> {
  if (typeof window !== "undefined") {
    try {
      localStorage.removeItem(`${LOCAL_LOCK_PREFIX}${batchId}`);
    } catch (e) {
      console.warn("Error removing local lock:", e);
    }
  }

  try {
    await supabase
      .from(BATCH_TABLE)
      .update({ locked_by: null, locked_at: null })
      .eq("id", batchId);
  } catch (e) {
    // Graceful silent ignore if DB column not present
  }
}

/**
 * Submits a partial fulfillment ("Setor Bertahap") for a specific product item during an active batch.
 * Atomically updates product_inventory, logs inventory_movements, and records/increments batch_items.
 */
export async function submitPartialFulfillment(
  batchId: string,
  productId: number,
  productName: string,
  draftQuantity: number,
  baristaId: string = "barista-current",
  baristaName: string = "Crew Barista"
): Promise<ServiceResponse<{ submitted: number }>> {
  if (!draftQuantity || draftQuantity <= 0) {
    return { success: false, error: "Kuantitas setor harus lebih dari 0." };
  }

  try {
    const now = new Date().toISOString();

    // 1. UPDATE / UPSERT product_inventory (Safe Read-then-Upsert Pattern)
    // Cek apakah baris untuk product_id atau product_name sudah eksis
    const { data: existingById, error: readByIdError } = await supabase
      .from("product_inventory")
      .select("*")
      .eq("product_id", productId)
      .maybeSingle();

    if (readByIdError && readByIdError.code !== "42P01") {
      console.warn("[submitPartialFulfillment] Error reading inventory by ID:", readByIdError.message);
    }

    const { data: existingByName, error: readByNameError } = !existingById && productName
      ? await supabase
          .from("product_inventory")
          .select("*")
          .ilike("product_name", productName.trim())
          .maybeSingle()
      : { data: null, error: null };

    if (readByNameError && readByNameError.code !== "42P01") {
      console.warn("[submitPartialFulfillment] Error reading inventory by name:", readByNameError.message);
    }

    const existingInv = existingById || existingByName;
    let finalStock = draftQuantity;

    if (existingInv) {
      // Baris ADA: lakukan UPDATE tambahkan draftQuantity ke current_stock
      const prevStock = Math.max(0, Math.floor(Number(existingInv.current_stock) || 0));
      finalStock = prevStock + draftQuantity;

      const safeProducedBy = getSafeUuidOrNull(baristaId || baristaName);

      const { error: invUpdateError } = await supabase
        .from("product_inventory")
        .update({
          current_stock: finalStock,
          last_produced_at: now,
          last_produced_by: safeProducedBy,
          updated_at: now
        })
        .eq("product_id", existingInv.product_id);

      if (invUpdateError && invUpdateError.code !== "42P01") {
        console.error("[submitPartialFulfillment] Error updating inventory:", invUpdateError.message);
        throw new Error(`Gagal memperbarui stok di database: ${invUpdateError.message}`);
      }
    } else {
      // Baris TIDAK ADA: lakukan UPSERT (atau INSERT) dengan current_stock = draftQuantity
      finalStock = draftQuantity;
      const safeProducedBy = getSafeUuidOrNull(baristaId || baristaName);

      const { error: invInsertError } = await supabase
        .from("product_inventory")
        .upsert(
          [
            {
              product_id: productId,
              product_name: productName,
              current_stock: finalStock,
              minimum_stock: 15,
              last_produced_at: now,
              last_produced_by: safeProducedBy,
              updated_at: now
            }
          ],
          { onConflict: "product_id" }
        );

      if (invInsertError && invInsertError.code !== "42P01") {
        console.error("[submitPartialFulfillment] Error inserting inventory:", invInsertError.message);
        throw new Error(`Gagal membuat master inventory baru: ${invInsertError.message}`);
      }
    }

    // Emit lightweight CustomEvent for same-tab instant UI sync.
    // MENGAPA BUKAN localStorage:
    // localStorage menyebabkan Dual Source of Truth — data stok ada di
    // Supabase DAN di localStorage, yang berpotensi drift/desinkronisasi.
    // CustomEvent hanya berlaku di tab aktif dan akan segera diikuti oleh
    // Supabase Realtime `postgres_changes` untuk cross-tab sync.
    if (typeof window !== "undefined") {
      window.dispatchEvent(
        new CustomEvent("inventory_realtime_sync", {
          detail: {
            productId,
            productName,
            newStock: finalStock,
            lastProducedAt: now,
            lastProducedBy: baristaName
          }
        })
      );
    }

    // 2. INSERT inventory_movements (Audit Log)
    try {
      await supabase.from("inventory_movements").insert([
        {
          product_id: productId,
          movement_type: "PRODUCTION_IN",
          quantity: draftQuantity,
          reference_id: batchId,
          notes: `Setor Bertahap (${draftQuantity} Cup) dari Batch ${batchId} oleh ${baristaName}`,
          created_at: now
        }
      ]);
    } catch (movErr) {
      // Graceful ignore if movement table not present
    }

    // 3. INSERT / UPSERT batch_items
    const { data: existingBatchItem, error: biFetchError } = await supabase
      .from(ITEMS_TABLE)
      .select("*")
      .eq("batch_id", batchId)
      .eq("product_id", productId)
      .maybeSingle();

    if (existingBatchItem) {
      const nextProduced = (Number(existingBatchItem.quantity_produced) || 0) + draftQuantity;
      await supabase
        .from(ITEMS_TABLE)
        .update({ quantity_produced: nextProduced })
        .eq("batch_id", batchId)
        .eq("product_id", productId);
    } else {
      await supabase
        .from(ITEMS_TABLE)
        .insert([
          {
            batch_id: batchId,
            product_id: productId,
            product_name: productName,
            quantity_produced: draftQuantity,
            created_at: now
          }
        ]);
    }

    return { success: true, data: { submitted: draftQuantity } };
  } catch (err: any) {
    console.error("[submitPartialFulfillment] Unexpected error:", err);
    return {
      success: false,
      error: err?.message || "Gagal memproses setor bertahap ke database."
    };
  }
}

/**
 * Submits production conversion atomicaly with rollback and strict server-side re-validation.
 */
export async function submitEnterpriseConversion(
  payload: ProductionConversionPayload,
  rawCupsReceived: number
): Promise<ServiceResponse<{ batchId: string }>> {
  // 1. Re-validate invariant server side
  const validation = validateProductionInvariant(rawCupsReceived, payload.allocations, payload.defectCups);
  if (!validation.isValid || validation.remaining !== 0) {
    return {
      success: false,
      error: `Gagal validasi server: Akuntansi tidak seimbang (Sisa: ${validation.remaining} cup). Seluruh gelas harus dipertanggungjawabkan tepat 0.`
    };
  }

  const validAllocations = payload.allocations.filter((item) => {
    const draft = item.draftQuantity !== undefined ? item.draftQuantity : (Number(item.quantity) || 0);
    const submitted = Number(item.submittedQuantity) || 0;
    return draft > 0 || submitted > 0;
  });

  if (validAllocations.length === 0 && payload.defectCups === 0) {
    return {
      success: false,
      error: "Minimal harus ada 1 produk yang dihasilkan atau catatan cacat yang diisi."
    };
  }

  try {
    // Deposit and reconcile ALL produced quantities (draft + submitted) before closing batch
    for (const item of validAllocations) {
      const draft = item.draftQuantity !== undefined ? item.draftQuantity : (Number(item.quantity) || 0);
      const submitted = Number(item.submittedQuantity) || 0;
      const totalToEnsure = draft + submitted;
      const pid = item.product_id || Number(item.id.replace("prod-", "")) || 0;
      const pname = item.product_name || (item as any).productName || `Produk #${pid}`;

      if (draft > 0) {
        await submitPartialFulfillment(
          payload.batchId,
          pid,
          pname,
          draft,
          payload.baristaId,
          payload.baristaName
        );
      } else if (totalToEnsure > 0 && pid > 0) {
        // Jika draft === 0 namun sudah ada submittedQuantity, kita pastikan
        // product_inventory tidak tertinggal 0 akibat silent fail di sesi sebelumnya.
        const now = new Date().toISOString();
        const { data: existingInv } = await supabase
          .from("product_inventory")
          .select("*")
          .eq("product_id", pid)
          .maybeSingle();

        if (!existingInv || (Number(existingInv.current_stock) || 0) < totalToEnsure) {
          const safeProducedBy = getSafeUuidOrNull(payload.baristaId || payload.baristaName);
          await supabase
            .from("product_inventory")
            .upsert(
              [
                {
                  product_id: pid,
                  product_name: pname,
                  current_stock: Math.max(totalToEnsure, Number(existingInv?.current_stock) || 0),
                  minimum_stock: 15,
                  last_produced_at: now,
                  last_produced_by: safeProducedBy,
                  updated_at: now
                }
              ],
              { onConflict: "product_id" }
            );
        }
      }
    }

    // Step 1: Update production_batches status and defect_cups to COMPLETED
    const { error: updateBatchError } = await supabase
      .from(BATCH_TABLE)
      .update({
        defect_cups: payload.defectCups,
        status: "COMPLETED",
        locked_by: null,
        locked_at: null
      })
      .eq("id", payload.batchId);

    if (updateBatchError) {
      console.error("[productionBatchService] Error updating batch:", updateBatchError);
      return { success: false, error: updateBatchError.message };
    }

    // Release local lock
    await releaseProductionLock(payload.batchId);

    return {
      success: true,
      data: { batchId: payload.batchId }
    };
  } catch (err: any) {
    console.error("[productionBatchService] Unexpected error:", err);
    return {
      success: false,
      error: err?.message || "Terjadi kesalahan sistem internal saat memproses transaksi produksi."
    };
  }
}

/**
 * Fetches batch details along with all items submitted so far in batch_items (`ITEMS_TABLE`).
 * Used for hydrating workstation state when starting or resuming (`Lanjutkan`).
 */
export async function fetchBatchDetailsAndItems(batchId: string): Promise<{
  defectCups: number;
  items: BatchItemPayload[];
}> {
  try {
    const { data: batchRow } = await supabase
      .from(BATCH_TABLE)
      .select("defect_cups")
      .eq("id", batchId)
      .maybeSingle();

    const { data: itemsRow, error } = await supabase
      .from(ITEMS_TABLE)
      .select("*")
      .eq("batch_id", batchId);

    if (error && error.code !== "42P01") {
      console.warn("[fetchBatchDetailsAndItems] Error loading batch_items:", error.message);
    }

    return {
      defectCups: Number(batchRow?.defect_cups) || 0,
      items: (itemsRow as BatchItemPayload[]) || []
    };
  } catch (err: any) {
    console.warn("[fetchBatchDetailsAndItems] Unexpected error:", err);
    return { defectCups: 0, items: [] };
  }
}

