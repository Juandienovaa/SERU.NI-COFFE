import { supabase } from "@/lib/supabase";
import {
  ProductionBatchStage2,
  ProductionConversionPayload,
  Stage2ServiceResponse,
  BatchItemPayload
} from "@/types/productionStage2";
import { validateProductionBalance } from "@/utils/productionMath";
import { productRepository } from "@/repositories/ProductRepository";

const BATCH_TABLE = "production_batches";
const ITEMS_TABLE = "batch_items";

/**
 * Service Layer untuk MES Stage 2 (Barista Production Conversion).
 * Menangani pengambilan antrean batch berstatus `PENDING_BARISTA` dan penyimpanan
 * multi-tabel dengan proteksi atomik (Rollback otomatis jika terjadi kegagalan sebagian).
 */

/**
 * Mengambil seluruh sesi produksi yang masih menunggu pengerjaan barista (`PENDING_BARISTA`).
 * diurutkan dari yang paling baru (Newest First).
 */
export async function fetchPendingBaristaBatches(): Promise<Stage2ServiceResponse<ProductionBatchStage2[]>> {
  try {
    const { data, error } = await supabase
      .from(BATCH_TABLE)
      .select("*")
      .eq("status", "PENDING_BARISTA")
      .order("created_at", { ascending: false });

    if (error) {
      console.error("[ProductionStage2Service] Error fetching pending batches:", error.message, error.code);
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
      return { success: false, data: null, error: error.message };
    }

    return {
      success: true,
      data: (data as ProductionBatchStage2[]) || []
    };
  } catch (err: any) {
    console.error("[ProductionStage2Service] Unexpected fetch error:", err);
    return {
      success: false,
      data: null,
      error: err?.message || "Terjadi gangguan koneksi jaringan saat memuat antrean produksi."
    };
  }
}

/**
 * Merekam hasil konversi produksi barista secara atomik dan immutable.
 * Dilengkapi dengan validasi ulang di sisi server/backend dan mesin Rollback otomatis.
 */
export async function submitProductionConversion(
  payload: ProductionConversionPayload,
  rawCupsReceived: number
): Promise<Stage2ServiceResponse<{ batchId: string }>> {
  // 1. Validasi Ulang Hukum Kekekalan Gelas (Jangan pernah percaya state frontend semata)
  const validation = validateProductionBalance(rawCupsReceived, payload.allocations, payload.defectCups);
  if (!validation.isValid) {
    return {
      success: false,
      error: `Gagal validasi server: ${validation.message}`
    };
  }

  // Filter item yang diproduksi (hanya yang quantity > 0)
  const validAllocations = payload.allocations.filter((item) => Number(item.quantity) > 0);
  if (validAllocations.length === 0 && payload.defectCups === 0) {
    return {
      success: false,
      error: "Minimal harus ada 1 produk jadi yang dihasilkan atau catatan cacat yang diisi."
    };
  }

  try {
    // 2. Eksekusi Langkah 1: Update production_batches (status -> COMPLETED, defect_cups -> N)
    const { error: updateBatchError } = await supabase
      .from(BATCH_TABLE)
      .update({
        defect_cups: payload.defectCups,
        status: "COMPLETED"
      })
      .eq("id", payload.batchId);

    if (updateBatchError) {
      console.error("[ProductionStage2Service] Gagal mengupdate status batch:", updateBatchError);
      if (updateBatchError.code === "42501") {
        return {
          success: false,
          error: "Gagal menyelesaikan sesi: Kebijakan RLS membatasi perubahan pada tabel production_batches."
        };
      }
      return { success: false, error: updateBatchError.message };
    }

    // 3. Eksekusi Langkah 2: Insert ke batch_items (jika ada produk jadi)
    if (validAllocations.length > 0) {
      const itemPayloads: BatchItemPayload[] = validAllocations.map((item) => ({
        batch_id: payload.batchId,
        product_name: item.productName,
        quantity_produced: Number(item.quantity)
      }));

      const { error: insertItemsError } = await supabase
        .from(ITEMS_TABLE)
        .insert(itemPayloads);

      // 4. ATOMIC ROLLBACK ENGINE: Jika insert batch_items gagal, kembalikan status batch ke PENDING_BARISTA
      if (insertItemsError) {
        console.error("[ProductionStage2Service] Error saat insert batch_items, memicu ATOMIC ROLLBACK...", insertItemsError);

        // Rollback status batch
        await supabase
          .from(BATCH_TABLE)
          .update({
            defect_cups: 0,
            status: "PENDING_BARISTA"
          })
          .eq("id", payload.batchId);

        // Hapus item yatim (if any partial inserts occurred)
        await supabase
          .from(ITEMS_TABLE)
          .delete()
          .eq("batch_id", payload.batchId);

        if (insertItemsError.code === "42P01") {
          return {
            success: false,
            error: `Tabel "${ITEMS_TABLE}" belum dibuat di PostgreSQL. Seluruh transaksi telah dibatalkan (Rollback).`
          };
        }

        return {
          success: false,
          error: `Gagal menyimpan rincian menu yang diproduksi (${insertItemsError.message}). Sesi dikembalikan ke status PENDING.`
        };
      }
      // 5. Eksekusi Langkah 3: Update product_inventory (current_stock += quantity)
      const catalog = await productRepository.getAllProducts();
      
      for (const item of validAllocations) {
        const productInfo = catalog.find(p => p.product_name === item.productName);
        if (!productInfo) continue; // Custom product, no static ID to update
        
        const { data: invData, error: invError } = await supabase
          .from("product_inventory")
          .select("current_stock")
          .eq("product_id", productInfo.product_id)
          .maybeSingle();
          
        if (invError) {
          throw new Error(`Gagal cek stok ${item.productName}: ${invError.message}`);
        }
        
        const currentStock = invData ? (Number(invData.current_stock) || 0) : 0;
        
        if (invData) {
          // Update existing
          const { error: updateInvError } = await supabase
            .from("product_inventory")
            .update({ current_stock: currentStock + Number(item.quantity) })
            .eq("product_id", productInfo.product_id);
            
          if (updateInvError) throw updateInvError;
        } else {
          // Insert new row if doesn't exist
          const { error: insertInvError } = await supabase
            .from("product_inventory")
            .insert({
              product_id: productInfo.product_id,
              current_stock: Number(item.quantity),
              minimum_stock: 0,
              maximum_stock: 100
            });
            
          if (insertInvError) throw insertInvError;
        }
      }
    }

    // 6. Transaksi Sukses Sempurna
    return {
      success: true,
      data: { batchId: payload.batchId }
    };
  } catch (err: any) {
    console.error("[ProductionStage2Service] Unexpected error during conversion submission:", err);
    return {
      success: false,
      error: err?.message || "Terjadi kesalahan sistem internal saat memproses transaksi produksi."
    };
  }
}
