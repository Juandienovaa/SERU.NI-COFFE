"use server";
import { createAdminClient } from "@/lib/supabase-server";
import { logAudit } from "./auditActions";
export async function catatPenjualanProdukAction(shiftId: string, productId: number, qty_terjual: number, metodeBayar: "CASH" | "QRIS", totalHarga: number, userId?: string) {
  try {
    const supabase = createAdminClient();
    const { data: shift, error: fetchError } = await supabase.from("shifts").select("inventory_data, omset_tunai, omset_qris, total_sales, user_id, outlet_id").eq("id", shiftId).single();
    if (fetchError) throw fetchError;
    const currentInventory = shift.inventory_data || [];
    const updatedInventory = currentInventory.map((item: any) => {
      if (item.product_id === productId) {
        const newSold = item.terjual + qty_terjual;
        const totalStok = item.stok_awal + (item.added_stock || 0);
        const newSisa = Math.max(0, totalStok - newSold);
        return { ...item, terjual: newSold, sisa: newSisa };
      }
      return item;
    });
    const newOmsetTunai = metodeBayar === "CASH" ? Number(shift.omset_tunai || 0) + totalHarga : Number(shift.omset_tunai || 0);
    const newOmsetQris = metodeBayar === "QRIS" ? Number(shift.omset_qris || 0) + totalHarga : Number(shift.omset_qris || 0);
    const newTotalSales = Number(shift.total_sales || 0) + totalHarga;
    const { error: updateError } = await supabase.from("shifts").update({ inventory_data: updatedInventory, omset_tunai: newOmsetTunai, omset_qris: newOmsetQris, total_sales: newTotalSales }).eq("id", shiftId);
    if (updateError) throw updateError;
    const { data: txMaster, error: txMasterError } = await supabase.from("transactions").insert([{ shift_id: shiftId, outlet_id: shift.outlet_id, cashier_id: shift.user_id, payment_method: metodeBayar, cash_amount: metodeBayar === "CASH" ? totalHarga : 0, qris_amount: metodeBayar === "QRIS" ? totalHarga : 0, total_amount: totalHarga, total_items: qty_terjual, is_central_cashier: false, order_type: "OFFLINE", payment_status: "PAID" }]).select("id").single();
    if (txMaster) { await supabase.from("transaction_items").insert([{ transaction_id: txMaster.id, product_id: productId, qty: qty_terjual, price: totalHarga / qty_terjual, subtotal: totalHarga }]); }
    await supabase.rpc("rpc_sell_from_shift", { p_shift_id: shiftId, p_product_id: productId, p_qty: qty_terjual });
    await logAudit(userId || null, null, shiftId, "OFFLINE_SALE", { productId, qty_terjual, totalHarga, metodeBayar });
    return { success: true, data: { inventory_data: updatedInventory, newOmsetTunai, newOmsetQris, newTotalSales } };
  } catch (err: any) { return { success: false, message: err.message }; }
}
