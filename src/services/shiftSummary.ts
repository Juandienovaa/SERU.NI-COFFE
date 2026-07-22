import { supabase } from "@/lib/supabase";

export async function getShiftCheckoutSummary(shiftId: string) {
  if (!shiftId) return null;

  // 1. Verify Active Shift
  const { data: shift, error: shiftError } = await supabase
    .from("shifts")
    .select("status, inventory_data")
    .eq("id", shiftId)
    .single();

  if (shiftError || !shift || shift.status !== "OPEN") {
    throw new Error("Tidak ada shift aktif atau shift sudah ditutup.");
  }

  // 2. Aggregate Transactions ONLY for this shift_id
  const { data: txs, error: txError } = await supabase
    .from("transactions")
    .select("total_items, total_amount, payment_method, qty, total_harga, metode_bayar")
    .eq("shift_id", shiftId);

  if (txError) {
    throw txError;
  }

  let cashRevenue = 0;
  let qrisRevenue = 0;
  let totalCupsSold = 0;
  let totalTransactions = txs?.length || 0;

  txs?.forEach((tx) => {
    const method = (tx.payment_method || tx.metode_bayar || "").toUpperCase();
    const price = Number(tx.total_amount) || Number(tx.total_harga) || 0;
    const qty = Number(tx.total_items) || Number(tx.qty) || 0;

    if (method === "CASH" || method === "TUNAI") {
      cashRevenue += price;
    } else if (method === "QRIS") {
      qrisRevenue += price;
    } else {
      cashRevenue += price; // fallback
    }

    totalCupsSold += qty;
  });

  const totalRevenue = cashRevenue + qrisRevenue;

  // 3. Inventory Calculation from shift_inventory (legacy uses shifts.inventory_data)
  const { data: shiftInv, error: invErr } = await supabase
    .from("shift_inventory")
    .select("product_id, qty_allocated, qty_adjustment, qty_retur, qty_terjual")
    .eq("shift_id", shiftId);

  // If using new architecture
  let totalPhysicalStock = 0;
  if (shiftInv && shiftInv.length > 0) {
    shiftInv.forEach((inv) => {
      const allocated = Number(inv.qty_allocated || 0);
      const adjustment = Number(inv.qty_adjustment || 0);
      const retur = Number(inv.qty_retur || 0);
      const sold = Number(inv.qty_terjual || 0);
      
      const remaining = Math.max(0, allocated + adjustment + retur - sold);
      totalPhysicalStock += remaining;
    });
  } else {
    // Fallback to legacy
    const invData = shift.inventory_data || [];
    totalPhysicalStock = invData.reduce((sum: number, item: any) => sum + (Number(item.sisa) || 0), 0);
  }

  // Bonus Calculation (100 cups -> 50.000)
  const isBonusAchieved = totalCupsSold >= 100;
  const bonusAmount = isBonusAchieved ? 50000 : 0;
  const cashDeposit = Math.max(0, cashRevenue - bonusAmount);

  return {
    cashRevenue,
    qrisRevenue,
    totalRevenue,
    totalCupsSold,
    totalTransactions,
    totalPhysicalStock,
    isBonusAchieved,
    bonusAmount,
    cashDeposit,
  };
}
