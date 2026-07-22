import { supabase } from "@/lib/supabase";

import { allocateShiftInventory, closeShiftInventory, getLiveShiftInventory } from "./inventoryService";

export async function getOutlets() {
  const { data, error } = await supabase.from("outlets").select("*").order("name", { ascending: true });
  if (error) throw error;
  return data;
}

export async function getLiveStockByOutlet(outletId: string) {
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
  
  // Bridge Enterprise Architecture to Frontend Shape
  try {
    const enterpriseInv = await getLiveShiftInventory(activeShift.id);
    return enterpriseInv.map((item: any) => {
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
  try {
    const enterpriseInv = await getLiveShiftInventory(shiftId);
    return enterpriseInv.map((item: any) => {
      const qtyAwal = item.qty_awal || 0;
      const qtyAllocated = item.qty_allocated || 0;
      const qtyAdjustment = item.qty_adjustment || 0;
      const qtyRetur = item.qty_retur || 0;
      const qtyTerjual = item.qty_terjual || 0;
      const qtyRusak = item.qty_rusak || 0;
      
      // Calculate remaining stock strictly from atomic database counters
      // because some DB functions (like restock) might forget to update the sisa_stok column.
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
  const { data, error } = await supabase
    .from("product_inventory")
    .select("product_id, product_name, current_stock");
  if (error) throw error;
  return data || [];
}

export async function bukaShift(userId: string, crewName: string, outletId: string, shiftType: "pagi" | "malam", inventoryData: any[]) {
  if (!userId) {
    throw new Error("ID User tidak valid untuk membuka shift.");
  }
  
  // VALIDATION & INVENTORY DEDUCTION (Now handled natively by PostgreSQL via allocateShiftInventory RPC AFTER shift insert)

  const insertData: any = { 
    user_id: userId,
    crew_name: crewName,
    outlet_id: outletId, 
    shift_type: shiftType, 
    status: "OPEN",
    inventory_data: inventoryData
  };

  console.log("PAYLOAD BUKA SHIFT:", JSON.stringify(insertData, null, 2));

  const { data: newShift, error: shiftError } = await supabase.from("shifts").insert([insertData]).select().single();
  if (shiftError) {
    console.error("Insert Buka Shift Error Detail:\n", JSON.stringify(shiftError, null, 2));
    throw shiftError;
  }
  
  // CALL ENTERPRISE INVENTORY SERVICE
  for (const item of inventoryData) {
    const qtyToDeduct = item.stok_awal;
    if (qtyToDeduct > 0) {
      await allocateShiftInventory(newShift.id, item.product_id, qtyToDeduct);
    }
  }
  
  return newShift;
}

export async function getActiveShiftForUser(userId: string, crewName?: string) {
  // Cek shift yang statusnya OPEN/aktif atau belum ditutup (closed_at/waktu_tutup is null)
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
  // 1. Ambil data shift (termasuk inventory_data, omset_tunai, omset_qris, user_id, outlet_id)
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

  // Hitung omset terpisah dan total sales
  const currentOmsetTunai = Number(shift.omset_tunai || 0);
  const currentOmsetQris = Number(shift.omset_qris || 0);
  const currentTotalSales = Number(shift.total_sales || 0);

  const newOmsetTunai = metodeBayar === 'CASH' ? currentOmsetTunai + totalHarga : currentOmsetTunai;
  const newOmsetQris = metodeBayar === 'QRIS' ? currentOmsetQris + totalHarga : currentOmsetQris;
  const newTotalSales = currentTotalSales + totalHarga;

  // 2. Update tabel shifts (stok & omset terpisah)
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

  // 3. Catat ke tabel transactions (Master Data)
  const { data: txMaster, error: txMasterError } = await supabase
    .from("transactions")
    .insert([{
      shift_id: shiftId,
      outlet_id: shift.outlet_id, 
      cashier_id: shift.user_id,
      payment_method: metodeBayar,
      metode_bayar: metodeBayar, // Backward compatibility
      cash_amount: metodeBayar === 'CASH' ? totalHarga : 0,
      qris_amount: metodeBayar === 'QRIS' ? totalHarga : 0,
      total_amount: totalHarga,
      total_harga: totalHarga,   // Backward compatibility
      total_items: qty_terjual,
      qty: qty_terjual,          // Backward compatibility
      is_central_cashier: false,
      order_type: 'OFFLINE',
      payment_status: 'PAID',
      created_at: new Date().toISOString()
    }])
    .select("id")
    .single();

  if (txMasterError) {
    throw new Error("Gagal Master Transaksi: " + txMasterError.message + " | " + txMasterError.details + " | " + txMasterError.hint);
  } else if (txMaster) {
    // 4. Catat detail ke transaction_items
    const { error: txItemError } = await supabase
      .from("transaction_items")
      .insert([{
        transaction_id: txMaster.id,
        product_id: productId,
        qty: qty_terjual,
        price: totalHarga / qty_terjual,
        subtotal: totalHarga,
        created_at: new Date().toISOString()
      }]);
    if (txItemError) {
      console.warn("Gagal mencatat transaction_items:", txItemError.message);
    }
  }

  // 5. Potong stok dari shift_inventory (SSOT Shift) secara atomik
  const { error: rpcError } = await supabase.rpc("rpc_sell_from_shift", {
    p_shift_id: shiftId,
    p_product_id: productId,
    p_qty: qty_terjual
  });
  
  if (rpcError) {
    console.warn("Gagal rpc_sell_from_shift:", rpcError?.message);
    // Fallback: manual update shift_inventory if RPC missing
    const { data: entInv, error: selectErr } = await supabase
      .from("shift_inventory")
      .select("id, qty_terjual, sisa_stok")
      .eq("shift_id", shiftId)
      .eq("product_id", productId)
      .single();
      
    if (entInv) {
      const terjualBefore = entInv.qty_terjual || 0;
      const terjualAfter = terjualBefore + qty_terjual;

      console.log("=== CHECKOUT INVENTORY UPDATE LOG (BEFORE) ===");
      console.log("shift_id:", shiftId);
      console.log("product_id:", productId);
      console.log("qty purchased:", qty_terjual);
      console.log("existing row:", entInv);
      console.log("==============================================");

      const { data: updateData, error: updateErr } = await supabase.from("shift_inventory").update({
        qty_terjual: terjualAfter
      }).eq("id", entInv.id).select('*');
      
      console.log("=== CHECKOUT INVENTORY UPDATE LOG (AFTER) ===");
      console.log("affected rows:", updateData ? updateData.length : 0);
      console.log("new qty_terjual:", updateData?.[0]?.qty_terjual ?? terjualAfter);
      console.log("new sisa_stok:", updateData?.[0]?.sisa_stok ?? 'GENERATED');
      console.log("database error:", updateErr ? updateErr.message : "None");
      console.log("=============================================");
    } else {
      console.log("=== CHECKOUT INVENTORY LOG ===");
      console.log("Failed to find shift_inventory. Error:", selectErr?.message);
    }
  }

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

export async function tutupShift(
  payloadOrShiftId: any,
  totalOmset?: number,
  finalInventoryData?: any[]
) {
  let shiftId: string;

  if (typeof payloadOrShiftId === "object" && payloadOrShiftId !== null) {
    shiftId = payloadOrShiftId.shift_id;
  } else {
    shiftId = String(payloadOrShiftId);
  }

  if (!shiftId) throw new Error("Invalid shift ID provided to tutupShift.");

  // Attempt to call the atomic close shift RPC (Preferred)
  const { data, error } = await supabase.rpc("rpc_close_shift_atomic", { p_shift_id: shiftId });

  if (error) {
    // If the RPC is not found in Supabase (user hasn't executed the SQL script)
    if (error.message?.includes("Could not find the function") || error.code === "PGRST202") {
      console.warn("⚠️ RPC rpc_close_shift_atomic tidak ditemukan. Menggunakan fallback JavaScript.");
      
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

      await closeShiftInventory(shiftId);

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

  // The RPC returns the calculated JSON data. We return it back.
  return data;
}

export async function tambahStokProduk(shiftId: string, productId: number, addedAmount: number) {
  // 1. Update JSON inventory_data di tabel shifts
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

/**
 * Validates and deducts from Master Inventory (product_inventory),
 * then adds it to the Shift Inventory (shifts.inventory_data)
 * using an atomic PostgreSQL RPC to prevent race conditions.
 */
export async function transferAdditionalStock(shiftId: string, productId: number, requestedQty: number, crewName: string) {
  if (requestedQty <= 0) throw new Error("Kuantitas harus lebih dari 0.");

  // Memanggil RPC di Supabase yang sudah kita buat
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
    
    // JS FALLBACK IF RPC IS MISSING
    console.warn("⚠️ Menggunakan fallback JavaScript untuk mutasi.");
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

  // --- SELALU UPDATE JSON UNTUK UI ---
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

  return updatedInventory; // Harus selalu mereturn array JSON terbaru untuk UI!


}

export async function getMasterInventoryStock(productId: number) {
  const { data, error } = await supabase
    .from("product_inventory")
    .select("current_stock")
    .eq("product_id", productId)
    .single();
    
  if (error) throw error;
  return data?.current_stock || 0;
}

// --- NEW DATA AGGREGATION FOR DASHBOARD OWNER ---
export async function getLaporanOwner() {
  // Fetch data
  const { data: outlets, error: outletErr } = await supabase.from("outlets").select("*");
  const { data: shifts, error: shiftErr } = await supabase.from("shifts").select("*");
  const { data: inventory, error: invErr } = await supabase.from("inventory").select("*");

  // Jika error atau DB kosong, return fallback data agar UI tetap bisa di-render untuk preview
  const safeOutlets = outlets || [];
  const safeShifts = shifts || [];
  const safeInventory = inventory || [];

  // 1. Ringkasan KPI
  const getLocalDateStr = (d: Date) => {
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };
  const todayDateStr = getLocalDateStr(new Date());
  
  const shiftsClosedToday = safeShifts.filter(s => s.status === 'closed' && s.closed_at?.startsWith(todayDateStr));
  const activeShifts = safeShifts.filter(s => s.status === "open");
  
  // Total Omset Hari Ini (dari shift tertutup HARI INI)
  const totalOmsetHariIni = shiftsClosedToday.reduce((sum, s) => sum + (s.total_sales_amount || 0), 0);
  
  // Total Cup Terjual (dari shift aktif)
  const activeShiftIds = activeShifts.map(s => s.id);
  const totalCupTerjual = safeInventory
    .filter(inv => activeShiftIds.includes(inv.shift_id))
    .reduce((sum, inv) => sum + (inv.sold || 0), 0);

  const gerobakAktifCount = activeShifts.length;
  const rataRataPenjualan = gerobakAktifCount > 0 ? totalOmsetHariIni / gerobakAktifCount : 0;

  // 2. Data Visualisasi Grafik (REAL DATA DARI SUPABASE)
  // Area Chart (Tren Penjualan 7 Hari - Berdasarkan closed_at)
  const trenPenjualan = [];
  for (let i = 6; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    const dateStr = getLocalDateStr(d);
    
    // Filter shifts tertutup di tanggal tersebut
    const dailyShifts = safeShifts.filter(s => s.status === 'closed' && s.closed_at?.startsWith(dateStr));
    const dailyOmset = dailyShifts.reduce((sum, s) => sum + (s.total_sales_amount || 0), 0);
    
    trenPenjualan.push({
      name: d.toLocaleDateString("id-ID", { weekday: 'short' }),
      omset: dailyOmset
    });
  }

  // Bar Chart (Performa antar Gerobak HARI INI - Berdasarkan closed_at)
  const performaGerobak = safeOutlets.map(outlet => {
    const outletShiftsToday = safeShifts.filter(s => 
      s.outlet_id === outlet.id && 
      s.status === 'closed' && 
      s.closed_at?.startsWith(todayDateStr)
    );
    const totalOmsetToday = outletShiftsToday.reduce((sum, s) => sum + (s.total_sales_amount || 0), 0);
    
    return {
      id: outlet.id,
      name: outlet.name,
      omset: totalOmsetToday
    };
  }).sort((a, b) => b.omset - a.omset);

  // 3. Live Outlet Monitoring
  const liveOutlets = activeShifts.map(shift => {
    const outlet = safeOutlets.find(o => o.id === shift.outlet_id);
    const shiftInv = safeInventory.filter(inv => inv.shift_id === shift.id);
    const soldCups = shiftInv.reduce((sum, inv) => sum + (inv.sold || 0), 0);
    // Asumsi harga rata-rata 25000 untuk omset sementara
    const omsetSementara = soldCups * 25000; 
    
    return {
      id: shift.id,
      outletName: outlet?.name || "Unknown Outlet",
      workerName: shift.worker_name,
      waktuBuka: shift.created_at || new Date().toISOString(),
      omsetSementara
    };
  });

  // 4. Star Outlets & Attention Needed
  const starOutlets = performaGerobak.slice(0, 3);
  const attentionNeeded = performaGerobak.slice(-3).reverse();

  return {
    kpi: {
      totalOmsetHariIni,
      totalCupTerjual,
      gerobakAktifCount,
      rataRataPenjualan
    },
    charts: {
      trenPenjualan,
      performaGerobak
    },
    liveOutlets,
    insights: {
      starOutlets,
      attentionNeeded
    }
  };
}
