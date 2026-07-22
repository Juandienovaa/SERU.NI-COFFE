import { supabase } from "@/lib/supabase";
import { RawProductInventoryRecord } from "@/types/inventory";

const TABLE_NAME = "product_inventory";

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
 * Enterprise Single Source of Truth Inventory Repository.
 *
 * PRINSIP ARSITEKTUR:
 * - Repository ini HANYA mengambil data dari Supabase database (`product_inventory`).
 * - TIDAK ADA mock data, dummy fallback, atau hardcoded inventory baseline.
 * - Jika tabel `product_inventory` kosong atau belum diinisialisasi, repository
 *   mengembalikan array kosong (`[]`). Ini adalah perilaku yang BENAR untuk
 *   Enterprise Single Source of Truth — UI harus menampilkan "0 Products" jika
 *   memang belum ada data stok di database.
 * - Sinkronisasi Realtime dilakukan melalui Supabase `postgres_changes` WebSocket.
 */
export class InventoryRepository {
  /**
   * Mengambil seluruh record inventaris dari tabel Supabase `product_inventory`.
   *
   * MENGAPA TIDAK ADA FALLBACK MOCK DATA:
   * Dalam sistem manufaktur enterprise (SAP MES, Oracle Manufacturing Cloud),
   * antarmuka operasional dilarang keras mengarang data palsu. Jika database
   * belum terisi, UI harus menunjukkan keadaan sebenarnya (kosong/0 produk).
   */
  async getAllInventory(): Promise<RawProductInventoryRecord[]> {
    try {
      const { data, error } = await supabase
        .from(TABLE_NAME)
        .select("*")
        .order("product_id", { ascending: true });

      if (error) {
        console.warn(
          `[InventoryRepository] Supabase query error (${error.code || "UNKNOWN"}): ${error.message}`
        );
        return [];
      }

      let inventoryList = (data as RawProductInventoryRecord[]) || [];
      const totalStock = inventoryList.reduce((sum, item) => sum + Math.max(0, Number(item.current_stock) || 0), 0);

      // WMS Self-Healing Reconciliation dihapus agar tidak menarik data lama (Ghost Data)
      // dari tabel batch_items ketika stok di-reset menjadi 0.
      // Kini murni mengembalikan data asli dari product_inventory.

      return inventoryList;
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Unknown error";
      console.error("[InventoryRepository] Exception querying inventory:", message);
      return [];
    }
  }

  /**
   * Memperbarui stok empiris untuk `product_id` tertentu.
   * Menggunakan `Math.max(0, ...)` untuk mencegah stok negatif.
   */
  async updateStock(
    productId: number,
    newStock: number,
    producedBy: string = "Crew Barista POS"
  ): Promise<boolean> {
    try {
      const now = new Date().toISOString();

      // MENGAPA `Math.max(0, ...)`:
      // Stok fisik tidak mungkin negatif. Jika perhitungan menghasilkan angka
      // negatif (misal karena race condition), kita clamp ke 0.
      const safeStock = Math.max(0, Math.floor(Number(newStock) || 0));

      const safeProducedBy = getSafeUuidOrNull(producedBy);

      const { error } = await supabase
        .from(TABLE_NAME)
        .update({
          current_stock: safeStock,
          last_produced_at: now,
          last_produced_by: safeProducedBy,
          updated_at: now
        })
        .eq("product_id", productId);

      if (error) {
        console.error(
          `[InventoryRepository] Error updating stock for product ${productId}:`,
          error.message
        );
        return false;
      }
      return true;
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Unknown error";
      console.error("[InventoryRepository] Exception inside updateStock:", message);
      return false;
    }
  }

  /**
   * Berlangganan perubahan Realtime Supabase (`postgres_changes`) pada `product_inventory`.
   *
   * MENGAPA REALTIME SUBSCRIPTION:
   * Setiap kali Barista melakukan "Setor Bertahap" yang mengubah `product_inventory`,
   * event Realtime akan dikirim ke semua listener (Manager Dashboard, Kasir POS, dll).
   * Ini menghilangkan kebutuhan manual refresh atau polling agresif.
   *
   * Mengembalikan fungsi unsubscribe untuk cleanup di `useEffect`.
   */
  subscribeToInventoryChanges(
    onUpdateCallback: (payload: { new: RawProductInventoryRecord; old: RawProductInventoryRecord }) => void
  ): () => void {
    const channel = supabase
      .channel("public:product_inventory:changes")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: TABLE_NAME
        },
        (payload) => {
          console.log("[InventoryRepository] Realtime change detected:", payload.eventType);
          onUpdateCallback(payload as any);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }
}

export const inventoryRepository = new InventoryRepository();
