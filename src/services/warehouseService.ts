import { supabase } from "@/lib/supabase";

export interface RawMaterial {
  product_id: number;
  product_name: string;
  current_stock: number;
  last_produced_by: string;
}

export class WarehouseService {
  /**
   * Upserts the raw material stock. If it exists, adds to current quantity.
   */
  async addRawMaterialStock(productId: number, name: string, quantityToAdd: number): Promise<boolean> {
    if (quantityToAdd <= 0) return false;

    try {
      // Validasi Sesi
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      if (sessionError || !session) {
        console.error("Sesi tidak valid");
        return false;
      }

      // 1. Check if exists
      const { data: existing, error: fetchError } = await supabase
        .from("product_inventory")
        .select("current_stock")
        .eq("product_id", productId)
        .single();

      if (fetchError && fetchError.code !== "PGRST116") { // PGRST116 is 'not found' in Supabase
        console.warn("Could not fetch raw material, assuming not exist:", fetchError);
      }

      const newTotal = (existing?.current_stock || 0) + quantityToAdd;

      // 2. Upsert
      const { error: upsertError } = await supabase
        .from("product_inventory")
        .upsert({
          product_id: productId,
          product_name: name,
          current_stock: newTotal,
          minimum_stock: 100,
          last_produced_by: session.user.id
        }, { onConflict: "product_id" });

      if (upsertError) {
        console.error("Failed to upsert raw material:", JSON.stringify(upsertError));
        return false;
      }

      return true;
    } catch (err) {
      console.error("Exception in addRawMaterialStock:", err);
      return false;
    }
  }

  async getRawMaterials(): Promise<RawMaterial[]> {
    try {
      const { data, error } = await supabase
        .from("product_inventory")
        .select("product_id, product_name, current_stock, last_produced_by")
        .eq("product_id", 9999); // 9999 is our designated Raw Material Cup ID

      if (error) {
        console.error("Error fetching raw materials:", error);
        return [];
      }

      return data as RawMaterial[];
    } catch (err) {
      console.error("Exception fetching raw materials:", err);
      return [];
    }
  }
}

export const warehouseService = new WarehouseService();
