"use server";

import { createAdminClient } from "@/lib/supabase-server";

export async function getOutlets() {
  const supabase = createAdminClient();
  const { data, error } = await supabase.from("outlets").select("*").order("name", { ascending: true });
  if (error) throw error;
  return data;
}

export async function getLiveStockByOutlet(outletId: string) {
  const supabase = createAdminClient();
  const { data: activeShifts, error: shiftError } = await supabase
    .from("shifts")
    .select("id")
    .eq("outlet_id", outletId)
    .eq("status", "OPEN")
    .order("created_at", { ascending: false })
    .limit(1);
  
  if (shiftError) throw shiftError;
  if (!activeShifts || activeShifts.length === 0) return [];
  const activeShift = activeShifts[0];
  
  try {
    const { data: enterpriseInv, error } = await supabase.from("shift_inventory").select("*").eq("shift_id", activeShift.id);
    if (error) throw error;
    
    return (enterpriseInv || []).map((item: any) => {
      const qtyAwal = item.qty_awal || 0;
      const qtyAllocated = item.qty_allocated || 0;
      const qtyAdjustment = item.qty_adjustment || 0;
      const qtyRetur = item.qty_retur || 0;
      const qtyTerjual = item.qty_terjual || 0;
      const qtyRusak = item.qty_rusak || 0;
      
      const computedSisa = qtyAwal + qtyAllocated + qtyAdjustment + qtyRetur - qtyTerjual - qtyRusak;

      return {
        product_id: item.product_id,
        stok_awal: qtyAwal,
        terjual: qtyTerjual,
        sisa: computedSisa,
        added_stock: qtyAllocated + qtyAdjustment + qtyRetur
      };
    });
  } catch (err: any) {
    console.error("[getLiveStockByOutlet] Failed to get shift inventory:", err);
    throw err;
  }
}

export async function getLiveStockByShiftId(shiftId: string) {
  const supabase = createAdminClient();
  try {
    const { data: enterpriseInv, error } = await supabase.from("shift_inventory").select("*").eq("shift_id", shiftId);
    if (error) throw error;
    
    return (enterpriseInv || []).map((item: any) => {
      const qtyAwal = item.qty_awal || 0;
      const qtyAllocated = item.qty_allocated || 0;
      const qtyAdjustment = item.qty_adjustment || 0;
      const qtyRetur = item.qty_retur || 0;
      const qtyTerjual = item.qty_terjual || 0;
      const qtyRusak = item.qty_rusak || 0;
      
      const computedSisa = qtyAwal + qtyAllocated + qtyAdjustment + qtyRetur - qtyTerjual - qtyRusak;

      return {
        product_id: item.product_id,
        stok_awal: qtyAwal,
        terjual: qtyTerjual,
        sisa: computedSisa,
        added_stock: qtyAllocated + qtyAdjustment + qtyRetur
      };
    });
  } catch (err: any) {
    console.error("[getLiveStockByShiftId] Failed to get shift inventory:", err);
    return [];
  }
}

export async function getAvailableStockForShift() {
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("product_inventory")
    .select("product_id, product_name, current_stock");
  if (error) throw error;
  return data || [];
}

export async function bukaShift(userId: string, crewName: string, outletId: string, shiftType: "pagi" | "malam", inventoryData: any[]) {
  const supabase = createAdminClient();
  if (!userId) {
    throw new Error("ID User tidak valid untuk membuka shift.");
  }
  
  const insertData: any = { 
    user_id: userId,
    crew_name: crewName,
    outlet_id: outletId, 
    shift_type: shiftType, 
    status: "OPEN",
    inventory_data: inventoryData
  };

  const { data: newShift, error: shiftError } = await supabase.from("shifts").insert([insertData]).select().single();
  if (shiftError) {
    throw shiftError;
  }
  
  for (const item of inventoryData) {
    const qtyToDeduct = item.stok_awal;
    if (qtyToDeduct > 0) {
      await supabase.rpc("rpc_allocate_inventory", {
        p_shift_id: newShift.id,
        p_product_id: item.product_id,
        p_qty: qtyToDeduct
      });
    }
  }
  
  return newShift;
}

export async function getActiveShiftForUser(userId: string, crewName?: string) {
  const supabase = createAdminClient();
  let query = supabase
    .from("shifts")
    .select("*")
    .in("status", ["OPEN", "open", "aktif", "Aktif"]);

  if (userId && !userId.startsWith("mock-")) {
    query = query.eq("user_id", userId);
  } else if (crewName) {
    query = query.eq("crew_name", crewName);
  } else {
    query = query.eq("user_id", userId);
  }

  const { data, error } = await query
    .order("created_at", { ascending: false })
    .limit(1);
    
  if (error) throw error;
  return data && data.length > 0 ? data[0] : null;
}

export async function catatPenjualanProduk(
  shiftId: string, 
  productId: number, 
  qty_terjual: number,
  metodeBayar: 'CASH' | 'QRIS' = 'CASH',
  totalHarga: number = 0
) {
  const supabase = createAdminClient();
  const { data: shift, error: fetchError } = await supabase
    .from("shifts")
    .select("inventory_data, omset_tunai, omset_qris, total_sales, user_id, outlet_id")
    .eq("id", shiftId)
    .single();
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

  const currentOmsetTunai = Number(shift.omset_tunai || 0);
  const currentOmsetQris = Number(shift.omset_qris || 0);
  const currentTotalSales = Number(shift.total_sales || 0);

  const newOmsetTunai = metodeBayar === 'CASH' ? currentOmsetTunai + totalHarga : currentOmsetTunai;
  const newOmsetQris = metodeBayar === 'QRIS' ? currentOmsetQris + totalHarga : currentOmsetQris;
  const newTotalSales = currentTotalSales + totalHarga;

  const { error: updateError } = await supabase
    .from("shifts")
    .update({ 
      inventory_data: updatedInventory,
      omset_tunai: newOmsetTunai,
      omset_qris: newOmsetQris,
      total_sales: newTotalSales
    })
    .eq("id", shiftId);
  if (updateError) throw updateError;

  const { data: txMaster, error: txMasterError } = await supabase
    .from("transactions")
    .insert([{
      shift_id: shiftId,
      outlet_id: shift.outlet_id, 
      cashier_id: shift.user_id,
      payment_method: metodeBayar,
      metode_bayar: metodeBayar, 
      cash_amount: metodeBayar === 'CASH' ? totalHarga : 0,
      qris_amount: metodeBayar === 'QRIS' ? totalHarga : 0,
      total_amount: totalHarga,
      total_harga: totalHarga,   
      total_items: qty_terjual,
      qty: qty_terjual,          
      is_central_cashier: false,
      order_type: 'OFFLINE',
      payment_status: 'PAID',
      created_at: new Date().toISOString()
    }])
    .select("id")
    .single();

  if (txMaster) {
    await supabase.from("transaction_items").insert([{
        transaction_id: txMaster.id,
        product_id: productId,
        qty: qty_terjual,
        price: totalHarga / qty_terjual,
        subtotal: totalHarga,
        created_at: new Date().toISOString()
    }]);
  }

  await supabase.rpc("rpc_sell_from_shift", {
    p_shift_id: shiftId,
    p_product_id: productId,
    p_qty: qty_terjual
  });

  const targetItem = updatedInventory.find((i: any) => i.product_id === productId);
  return { 
    newCurrentStock: targetItem?.sisa || 0, 
    isEmpty: (targetItem?.sisa || 0) <= 0,
    omset_tunai: newOmsetTunai,
    omset_qris: newOmsetQris,
    total_sales: newTotalSales,
    inventory_data: updatedInventory
  };
}

export async function tutupShift(payloadOrShiftId: any, totalOmset?: number, finalInventoryData?: any[]) {
  const supabase = createAdminClient();
  let shiftId: string;
  if (typeof payloadOrShiftId === "object" && payloadOrShiftId !== null) {
    shiftId = payloadOrShiftId.shift_id;
  } else {
    shiftId = String(payloadOrShiftId);
  }
  if (!shiftId) throw new Error("Invalid shift ID provided to tutupShift.");

  const { data, error } = await supabase.rpc("rpc_close_shift_atomic", { p_shift_id: shiftId });

  if (error) {
    if (error.message?.includes("Could not find the function") || error.code === "PGRST202") {
      let updateData: any = {
        status: "CLOSED",
        closed_at: new Date().toISOString(),
      };
      if (typeof payloadOrShiftId === "object" && payloadOrShiftId !== null) {
        updateData = {
          ...updateData,
          closed_at: payloadOrShiftId.closed_at || updateData.closed_at,
          total_sales: payloadOrShiftId.total_sales,
          inventory_data: payloadOrShiftId.inventory_data,
          cash_revenue: payloadOrShiftId.cash_revenue,
          qris_revenue: payloadOrShiftId.qris_revenue,
          total_cups: payloadOrShiftId.total_cups,
          bonus_amount: payloadOrShiftId.bonus_amount,
          is_bonus_achieved: payloadOrShiftId.is_bonus_achieved,
          cash_deposit: payloadOrShiftId.cash_deposit,
          omset_tunai: payloadOrShiftId.cash_revenue,
          omset_qris: payloadOrShiftId.qris_revenue,
        };
      } else {
        updateData.total_sales = totalOmset || 0;
        if (finalInventoryData) updateData.inventory_data = finalInventoryData;
      }
      
      await supabase.rpc("rpc_close_shift", { p_shift_id: shiftId });

      const { data: fallbackData, error: fallbackError } = await supabase
        .from("shifts")
        .update(updateData)
        .eq("id", shiftId)
        .select()
        .single();
      if (fallbackError) throw fallbackError;
      return fallbackData;
    }
    throw error;
  }
  return data;
}

export async function tambahStokProduk(shiftId: string, productId: number, addedAmount: number) {
  const supabase = createAdminClient();
  const { data: shift, error: fetchError } = await supabase.from("shifts").select("inventory_data").eq("id", shiftId).single();
  if (fetchError) throw fetchError;
  
  const currentInventory = shift.inventory_data || [];
  const updatedInventory = currentInventory.map((item: any) => {
    if (item.product_id === productId) {
      const currentAdded = item.added_stock || 0;
      return { 
        ...item, 
        sisa: item.sisa + addedAmount,
        added_stock: currentAdded + addedAmount
      };
    }
    return item;
  });

  const { error: updateError } = await supabase.from("shifts").update({ inventory_data: updatedInventory }).eq("id", shiftId);
  if (updateError) throw updateError;
  return true;
}

export async function transferAdditionalStock(shiftId: string, productId: number, requestedQty: number, crewName: string) {
  const supabase = createAdminClient();
  if (requestedQty <= 0) throw new Error("Kuantitas harus lebih dari 0.");

  const { data, error } = await supabase.rpc("rpc_mid_shift_refill", {
    p_shift_id: shiftId,
    p_product_id: productId,
    p_qty: requestedQty,
    p_crew_name: crewName
  });

  if (error) {
    if (error.message?.includes("Insufficient stock") || error.code === "P0001") {
      throw new Error("Stok Master tidak mencukupi.");
    }
    const { data: master, error: masterErr } = await supabase.from("product_inventory").select("current_stock").eq("product_id", productId).maybeSingle();
    if (masterErr || !master) throw new Error("Transfer gagal. Master Inventory NOT FOUND");
    if (master.current_stock < requestedQty) throw new Error("Stok Master tidak mencukupi.");
    
    await supabase.from("product_inventory").update({ current_stock: master.current_stock - requestedQty }).eq("product_id", productId);
    
    const { data: entInv } = await supabase.from("shift_inventory").select("id, qty_adjustment").eq("shift_id", shiftId).eq("product_id", productId).single();
    if (entInv) {
      await supabase.from("shift_inventory").update({
        qty_adjustment: (entInv.qty_adjustment || 0) + requestedQty
      }).eq("id", entInv.id);
    }
    await supabase.from("stock_mutations").insert([{
      product_id: productId, mutation_type: 'MID_SHIFT_REFILL', quantity: requestedQty, reference_id: shiftId, notes: 'Refill for shift via JS Fallback', created_by: crewName
    }]);
  }

  const { data: shift, error: fetchError } = await supabase.from("shifts").select("inventory_data").eq("id", shiftId).single();
  if (fetchError) throw new Error(`Transfer berhasil tapi UI gagal update: ${fetchError.message}`);
  
  let foundInShift = false;
  const updatedInventory = (shift.inventory_data || []).map((item: any) => {
    if (Number(item.product_id) === Number(productId)) {
      foundInShift = true;
      return { 
        ...item, 
        sisa: Number(item.sisa || 0) + requestedQty,
        added_stock: Number(item.added_stock || 0) + requestedQty
      };
    }
    return item;
  });

  if (!foundInShift) {
    throw new Error(`Transfer gagal. Product ID: ${productId} tidak ditemukan di dalam JSON keranjang.`);
  }

  await supabase.from("shifts").update({ inventory_data: updatedInventory }).eq("id", shiftId);
  return updatedInventory;
}

export async function getMasterInventoryStock(productId: number) {
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("product_inventory")
    .select("current_stock")
    .eq("product_id", productId)
    .single();
    
  if (error) throw error;
  return data?.current_stock || 0;
}
