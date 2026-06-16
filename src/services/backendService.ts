import { supabase } from "@/lib/supabase";

export async function getOutlets() {
  const { data, error } = await supabase.from("outlets").select("*").order("name", { ascending: true });
  if (error) throw error;
  return data;
}

export async function getLiveStockByOutlet(outletId: string) {
  const { data: activeShift, error: shiftError } = await supabase.from("shifts").select("id, inventory_data").eq("outlet_id", outletId).eq("status", "OPEN").maybeSingle();
  if (shiftError) throw shiftError;
  if (!activeShift) return [];
  return activeShift.inventory_data || [];
}

export async function bukaShift(crewName: string, outletId: string, shiftType: "pagi" | "malam", inventoryData: any[]) {
  const { data: { session } } = await supabase.auth.getSession();
  
  const insertData: any = { 
    user_id: session?.user?.id || null,
    crew_name: crewName,
    outlet_id: outletId, 
    shift_type: shiftType, 
    status: "OPEN",
    inventory_data: inventoryData
  };

  const { data: newShift, error: shiftError } = await supabase.from("shifts").insert([insertData]).select().single();
  if (shiftError) {
    console.error("Insert Buka Shift Error:", shiftError);
    throw shiftError;
  }
  return newShift;
}

export async function getActiveShiftForUser(userId: string) {
  const { data, error } = await supabase
    .from("shifts")
    .select("*")
    .eq("user_id", userId)
    .eq("status", "OPEN")
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();
    
  if (error) throw error;
  return data;
}

export async function catatPenjualanProduk(shiftId: string, productId: number, qtySold: number) {
  const { data: shift, error: fetchError } = await supabase.from("shifts").select("inventory_data").eq("id", shiftId).single();
  if (fetchError) throw fetchError;
  
  const currentInventory = shift.inventory_data || [];
  const updatedInventory = currentInventory.map((item: any) => {
    if (item.product_id === productId) {
      const newSold = item.terjual + qtySold;
      const newSisa = Math.max(0, item.stok_awal - newSold);
      return { ...item, terjual: newSold, sisa: newSisa };
    }
    return item;
  });

  const { error: updateError } = await supabase.from("shifts").update({ inventory_data: updatedInventory }).eq("id", shiftId);
  if (updateError) throw updateError;
  
  const targetItem = updatedInventory.find((i: any) => i.product_id === productId);
  return { newCurrentStock: targetItem?.sisa || 0, isEmpty: (targetItem?.sisa || 0) <= 0 };
}

export async function tutupShift(shiftId: string, totalOmset: number, finalInventoryData: any[]) {
  const { data, error } = await supabase.from("shifts").update({ 
    status: "CLOSED", 
    closed_at: new Date().toISOString(), 
    total_sales: totalOmset,
    inventory_data: finalInventoryData
  }).eq("id", shiftId).select().single();
  if (error) throw error;
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

  // 2. Update tabel inventory (standalone)
  const { data: invRow } = await supabase
    .from("inventory")
    .select("id, current_stock, added_stock")
    .eq("shift_id", shiftId)
    .eq("product_id", productId)
    .maybeSingle();

  if (invRow) {
    const newAddedStock = (invRow.added_stock || 0) + addedAmount;
    const newCurrentStock = (invRow.current_stock || 0) + addedAmount;
    await supabase.from("inventory").update({ 
      added_stock: newAddedStock,
      current_stock: newCurrentStock
    }).eq("id", invRow.id);
  }

  // 3. Insert ke restock_logs
  await supabase.from("restock_logs").insert([{
    shift_id: shiftId,
    product_id: productId,
    added_amount: addedAmount
  }]);

  return true;
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
