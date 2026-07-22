import { supabase } from "@/lib/supabase";

export interface OfflineLedgerItem {
  id: string; // virtual id
  group_key: string;
  date: string;
  outlet: string;
  shift: string;
  shiftInfo?: {
    crewName: string;
    shiftType: string;
    jamBuka?: string;
    jamTutup?: string;
    status?: string;
  };
  crewName: string;
  cupSold: number;
  cash: number;
  qris: number;
  bonus: number;
  netCash: number;
  totalTransaction: number;
  status: "SETTLED" | "PENDING" | "VERIFIED";
}

export interface OnlineLedgerItem {
  id: string;
  invoice: string;
  customerName: string;
  deliveryFee: number;
  grandTotal: number;
  paymentMethod: string;
  status: string;
  date: string;
}

export interface FinancialSummaryData {
  totalCash: number;
  totalQris: number;
  totalCup: number;
  totalBonus: number;
  totalNetCash: number;
}

export interface OnlineSummaryData {
  totalOrder: number;
  totalDeliveryFee: number;
  averageOrder: number;
  grandTotal: number;
  totalQris: number;
}

export class FinancialService {
  async getFinancialData(period: string) {
    try {
      let startIso = "";
      let endIso = "";

      const formatter = new Intl.DateTimeFormat("en-US", { timeZone: "Asia/Jakarta", year: "numeric", month: "2-digit", day: "2-digit" });
      const wibParts = formatter.formatToParts(new Date());
      const wibDate = { 
        year: parseInt(wibParts.find(p => p.type === 'year')!.value),
        month: parseInt(wibParts.find(p => p.type === 'month')!.value) - 1,
        day: parseInt(wibParts.find(p => p.type === 'day')!.value)
      };

      if (period === "today") {
        const start = new Date(Date.UTC(wibDate.year, wibDate.month, wibDate.day, -7, 0, 0));
        const end = new Date(Date.UTC(wibDate.year, wibDate.month, wibDate.day, 16, 59, 59, 999));
        startIso = start.toISOString();
        endIso = end.toISOString();
      } else if (period === "week") {
        const start = new Date(Date.UTC(wibDate.year, wibDate.month, wibDate.day - 7, -7, 0, 0));
        const end = new Date(Date.UTC(wibDate.year, wibDate.month, wibDate.day, 16, 59, 59, 999));
        startIso = start.toISOString();
        endIso = end.toISOString();
      } else if (period === "month") {
        const start = new Date(Date.UTC(wibDate.year, wibDate.month, 1, -7, 0, 0));
        const end = new Date(Date.UTC(wibDate.year, wibDate.month + 1, 0, 16, 59, 59, 999));
        startIso = start.toISOString();
        endIso = end.toISOString();
      } else if (period === "year") {
        const start = new Date(Date.UTC(wibDate.year, 0, 1, -7, 0, 0));
        const end = new Date(Date.UTC(wibDate.year + 1, 0, 0, 16, 59, 59, 999));
        startIso = start.toISOString();
        endIso = end.toISOString();
      }
      
      // ==========================================
      // OFFLINE LEDGER (Grouped from transactions)
      // ==========================================
      let offlineQuery = supabase
        .from('transactions')
        .select('*')
        .eq('order_type', 'OFFLINE')
        .eq('payment_status', 'PAID')
        .order('created_at', { ascending: false });

      if (startIso && endIso) {
        offlineQuery = offlineQuery.gte('created_at', startIso).lte('created_at', endIso);
      }
      
      const { data: offlineData, error: offlineErr } = await offlineQuery;
      if (offlineErr) {
        console.error("Error fetching offline transactions:", offlineErr);
      }

      // Fetch mappings for Outlets, Shifts, and Users
      const [
        { data: usersData },
        { data: shiftsData }
      ] = await Promise.all([
        supabase.from('users').select('id, nama'),
        supabase.from('shifts').select('id, user_id, outlet_id, shift_type, crew_name, status, created_at, closed_at')
      ]);

      // DEBUG WAJIB
      console.log("=== DEBUG MAPPING LEDGER ===");
      console.table(usersData);
      console.table(shiftsData);
      console.table(offlineData);

      const userMap = (usersData || []).reduce((acc: any, u: any) => {
        acc[u.id] = u;
        return acc;
      }, {});

      const shiftMap = (shiftsData || []).reduce((acc: any, s: any) => {
        acc[s.id] = s;
        return acc;
      }, {});

      // Grouping logic in memory
      const groupMap: Record<string, OfflineLedgerItem> = {};

      (offlineData || []).forEach(trx => {
        const tDate = new Date(trx.created_at).toLocaleDateString("id-ID");
        const cashierId = trx.cashier_id;
        const shiftId = trx.shift_id;
        const outletId = trx.outlet_id;

        const mappedCrew = userMap[shiftMap[shiftId]?.user_id]?.nama ?? "-";
        
        const mappedOutlet = shiftMap[shiftId]?.outlet_id ?? "-";
        
        let mappedShift = shiftMap[shiftId]?.shift_type ?? "Non Shift";
        if (mappedShift !== "Non Shift") {
           mappedShift = `Shift ${mappedShift.charAt(0).toUpperCase() + mappedShift.slice(1)}`;
        }

        if (trx.is_central_cashier) {
           // Jika ini adalah central cashier, mungkin kita ingin membiarkan outletnya terisi.
           // Namun user meminta HAPUS SEMUA HARCODE GEROBAK, Unknown.
           // Jika central cashier, kita akan map sesuai data aslinya jika ada.
        }

        if (mappedCrew === "-" || mappedOutlet === "-") {
          console.warn("Mapping Gagal:", {
            cashier_id: cashierId,
            shift_id: shiftId,
            outlet_id: outletId
          });
        }

        console.log("Trace Mapping:", {
          cashier_id: cashierId,
          shift_id: shiftId,
          outlet_id: outletId,
          mappedCrew,
          mappedOutlet,
          mappedShift
        });

        // Karena shiftInfo digunakan oleh UI untuk popover (opsional)
        const shiftInfoObj = shiftMap[shiftId] ? {
            crewName: shiftMap[shiftId].crew_name ?? mappedCrew,
            shiftType: mappedShift,
            jamBuka: new Date(shiftMap[shiftId].created_at).toLocaleTimeString("id-ID", { hour: '2-digit', minute: '2-digit' }),
            jamTutup: shiftMap[shiftId].closed_at ? new Date(shiftMap[shiftId].closed_at).toLocaleTimeString("id-ID", { hour: '2-digit', minute: '2-digit' }) : "-",
            status: shiftMap[shiftId].status || "OPEN"
        } : undefined;

        const groupKey = `${tDate}_${trx.is_central_cashier}_${shiftId || 'noshift'}_${cashierId || 'nocashier'}`;

        if (!groupMap[groupKey]) {
          groupMap[groupKey] = {
            id: groupKey,
            group_key: groupKey,
            date: tDate,
            outlet: trx.is_central_cashier ? "SERUNI POS CENTER" : mappedOutlet, // Pengecualian hanya untuk POS Center
            shift: mappedShift,
            shiftInfo: shiftInfoObj,
            crewName: trx.is_central_cashier ? "Kasir Pusat" : mappedCrew, // Pengecualian Kasir Pusat
            cupSold: 0,
            cash: 0,
            qris: 0,
            bonus: 0,
            netCash: 0,
            totalTransaction: 0,
            status: "SETTLED"
          };
        }

        groupMap[groupKey].cupSold += (trx.total_items || trx.qty || 0);
        groupMap[groupKey].cash += (trx.cash_amount || 0);
        groupMap[groupKey].qris += (trx.qris_amount || 0);
        groupMap[groupKey].totalTransaction += 1;
      });

      const offlineLedger = Object.values(groupMap).map(row => {
        if (row.cupSold >= 100 && row.outlet !== "SERUNI POS CENTER") {
          row.bonus = 50000;
        }
        row.netCash = Math.max(0, row.cash - row.bonus);
        return row;
      });

      // Sort descending by date
      offlineLedger.sort((a, b) => {
        const dA = a.date.split('/').reverse().join('');
        const dB = b.date.split('/').reverse().join('');
        return dB.localeCompare(dA);
      });

      // ==========================================
      // ONLINE SECTION
      // ==========================================
      let onlineQuery = supabase
        .from('online_orders')
        .select('*')
        .neq('order_status', 'CANCELLED')
        .order('created_at', { ascending: false });

      if (startIso && endIso) {
        onlineQuery = onlineQuery.gte('created_at', startIso).lte('created_at', endIso);
      }
      
      const { data: onlineData, error: onlineErr } = await onlineQuery;
      if (onlineErr) {
        console.error("Error fetching online orders:", onlineErr);
      }

      const onlineLedger: OnlineLedgerItem[] = (onlineData || []).map(row => ({
        id: row.id,
        invoice: row.invoice_number || row.id.substring(0,8),
        customerName: row.customer_name || "Online Customer",
        deliveryFee: row.delivery_fee || 0,
        grandTotal: row.grand_total || row.total_amount || 0,
        paymentMethod: row.payment_method || "MIXED",
        status: row.order_status || row.payment_status || "COMPLETED",
        date: new Date(row.created_at).toLocaleDateString("id-ID")
      }));

      // Summaries
      const offlineSummary: FinancialSummaryData = {
        totalCash: offlineLedger.reduce((acc, l) => acc + l.cash, 0),
        totalQris: offlineLedger.reduce((acc, l) => acc + l.qris, 0),
        totalCup: offlineLedger.reduce((acc, l) => acc + l.cupSold, 0),
        totalBonus: offlineLedger.reduce((acc, l) => acc + l.bonus, 0),
        totalNetCash: offlineLedger.reduce((acc, l) => acc + l.netCash, 0)
      };

      const onlineTotalOrder = onlineLedger.length;
      const onlineGrandTotal = onlineLedger.reduce((acc, l) => acc + l.grandTotal, 0);
      const onlineSummary: OnlineSummaryData = {
        totalOrder: onlineTotalOrder,
        totalDeliveryFee: onlineLedger.reduce((acc, l) => acc + l.deliveryFee, 0),
        averageOrder: onlineTotalOrder > 0 ? onlineGrandTotal / onlineTotalOrder : 0,
        grandTotal: onlineGrandTotal,
        totalQris: onlineLedger.filter(l => l.status === 'PAID' || l.status === 'COMPLETED').reduce((acc, l) => acc + l.grandTotal, 0)
      };

      return { offlineLedger, onlineLedger, offlineSummary, onlineSummary };
      
    } catch (err) {
      console.error("Error fetching financial data:", err);
      return { 
        offlineLedger: [], 
        onlineLedger: [], 
        offlineSummary: { totalCash: 0, totalQris: 0, totalCup: 0, totalBonus: 0, totalNetCash: 0 },
        onlineSummary: { totalOrder: 0, totalDeliveryFee: 0, averageOrder: 0, grandTotal: 0, totalQris: 0 }
      };
    }
  }

  async getSettlementDetails(settlementId: string, groupKey: string): Promise<{ transactions: any[], auditTrails: any[] }> {
    try {
      const parts = groupKey.split('_');
      const dateStr = parts[0]; // e.g. "21/7/2026"
      const isCentralCashier = parts[1] === 'true';
      const shiftId = parts[2];
      const cashierId = parts[3];

      let trxsQuery = supabase
        .from('transactions')
        .select('*')
        .eq('order_type', 'OFFLINE')
        .eq('payment_status', 'PAID')
        .eq('cashier_id', cashierId)
        .eq('is_central_cashier', isCentralCashier);

      if (shiftId && shiftId !== 'noshift') {
        trxsQuery = trxsQuery.eq('shift_id', shiftId);
      }
      
      // Parse DD/MM/YYYY to ISO Date bounds for safe querying
      const [day, month, year] = dateStr.split('/');
      const paddedDay = day.padStart(2, '0');
      const paddedMonth = month.padStart(2, '0');
      const isoDateStr = `${year}-${paddedMonth}-${paddedDay}`;
      
      // Query transactions between 00:00:00 to 23:59:59 in WIB (+07:00)
      trxsQuery = trxsQuery
        .gte('created_at', `${isoDateStr}T00:00:00+07:00`)
        .lte('created_at', `${isoDateStr}T23:59:59+07:00`)
        .order('created_at', { ascending: false });

      const { data: rawTrxs, error } = await trxsQuery;
      
      if (error) {
        console.error("Error fetching detailed transactions:", error);
      }

      let transactions = rawTrxs || [];

      // Fetch transaction_items separately because there might be no explicit FK constraint
      if (transactions.length > 0) {
        const txIds = transactions.map(t => t.id);
        const { data: rawItems } = await supabase
          .from('transaction_items')
          .select('transaction_id, product_id, qty, price, subtotal')
          .in('transaction_id', txIds);
          
        if (rawItems && rawItems.length > 0) {
          transactions = transactions.map(t => {
            return {
              ...t,
              transaction_items: rawItems.filter(i => i.transaction_id === t.id)
            };
          });
        } else {
          transactions = transactions.map(t => ({ ...t, transaction_items: [] }));
        }
      }

      return { transactions, auditTrails: [] };
    } catch (err) {
      console.error("Error fetching settlement details", err);
      return { transactions: [], auditTrails: [] };
    }
  }

  // Backward compatibility placeholders (since we removed settlements table)
  async updateSettlementStatus(...args: any[]) {
    return true;
  }
}

export const financialService = new FinancialService();
