import { supabase } from "@/lib/supabase";

export interface ReportDataPayload {
  period: string;
  generatedAt: string;
  generatedBy: string;
  summary: {
    totalRevenue: number;
    grossCash: number;
    grossQris: number;
    netCash: number;
    cashDeposit: number;
    crewBonus: number;
    totalOrders: number;
    totalCups: number;
    averageOrderValue: number;
    averageCupsPerTrx: number;
    totalActiveOutlets: number;
    totalActiveCrew: number;
  };
  insights: {
    revenueGrowth: number;
    qrisPercentage: number;
    cashPercentage: number;
    bestOutlet: string;
    bestProduct: string;
    bestCrew: string;
    lowestOutlet: string;
    averageTrx: number;
    peakSalesDay: string;
    mostActiveHour: string;
    topPaymentMethod: string;
  };
  outlets: any[];
  shifts: any[];
  crews: any[];
  products: any[];
  payments: any[];
  online: any;
  ledger: any[];
  settlement: any[];
}

export const reportDataService = {
  async fetchReportData(period: string, generatedBy: string): Promise<ReportDataPayload> {
    const now = new Date();
    let startIso = "";
    let endIso = "";

    const wibDate = { 
      year: now.getFullYear(),
      month: now.getMonth(),
      day: now.getDate()
    };

    if (period === "today") {
      const start = new Date(Date.UTC(wibDate.year, wibDate.month, wibDate.day, -7, 0, 0));
      const end = new Date(Date.UTC(wibDate.year, wibDate.month, wibDate.day, 16, 59, 59, 999));
      startIso = start.toISOString();
      endIso = end.toISOString();
    } else if (period === "7days" || period === "week") {
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

    // Fetch Transactions
    let trxQuery = supabase.from('transactions').select(`
      id, invoice_number, created_at, payment_method, total_amount, subtotal, discount,
      order_type, cashier_id, shift_id, outlet_id, status
    `).eq('payment_status', 'PAID');
    
    let onlineQuery = supabase.from('online_orders').select(`
      id, invoice_number, created_at, payment_method, grand_total, subtotal,
      customer_name, status, order_status
    `).in('payment_status', ['PAID', 'SETTLED']);

    let trxItemsQuery = supabase.from('transaction_items').select(`
      id, transaction_id, product_id, product_name, quantity, unit_price, total_price
    `);

    let onlineItemsQuery = supabase.from('online_order_items').select(`
      id, online_order_id, product_id, product_name, quantity, unit_price, subtotal
    `);

    if (startIso && endIso) {
      trxQuery = trxQuery.gte('created_at', startIso).lte('created_at', endIso);
      onlineQuery = onlineQuery.gte('created_at', startIso).lte('created_at', endIso);
    }

    const [
      { data: trxs },
      { data: onlineOrders },
      { data: trxItems },
      { data: onlineItems },
      { data: users },
      { data: shifts }
    ] = await Promise.all([
      trxQuery,
      onlineQuery,
      trxItemsQuery,
      onlineItemsQuery,
      supabase.from('users').select('id, nama'),
      supabase.from('shifts').select('*')
    ]);

    const userMap = (users || []).reduce((acc: any, u: any) => ({ ...acc, [u.id]: u.nama }), {});
    const shiftMap = (shifts || []).reduce((acc: any, s: any) => ({ ...acc, [s.id]: s }), {});

    // AGGREGATION LOGIC
    let totalRevenue = 0;
    let grossCash = 0;
    let grossQris = 0;
    let totalOrders = (trxs?.length || 0) + (onlineOrders?.length || 0);
    let totalCups = 0;
    
    const outletMap: Record<string, any> = {};
    const crewMap: Record<string, any> = {};
    const productMap: Record<string, any> = {};
    const hourMap: Record<string, number> = {};
    const dayMap: Record<string, number> = {};

    const allTransactions: any[] = [];

    // Process Offline Trx
    (trxs || []).forEach(trx => {
      const shift = shiftMap[trx.shift_id];
      const crewName = userMap[shift?.user_id] || "Unknown";
      const outlet = shift?.outlet_id || trx.outlet_id || "Unknown";
      const payment = trx.payment_method || 'CASH';
      const amount = trx.total_amount || 0;

      totalRevenue += amount;
      if (payment === 'CASH') grossCash += amount;
      if (payment === 'QRIS') grossQris += amount;

      // Tracking hourly & daily
      const d = new Date(trx.created_at);
      const hour = d.getHours() + ":00";
      const day = d.toLocaleDateString("en-US", { weekday: 'long' });
      hourMap[hour] = (hourMap[hour] || 0) + 1;
      dayMap[day] = (dayMap[day] || 0) + amount;

      // Outlets
      if (!outletMap[outlet]) outletMap[outlet] = { name: outlet, orders: 0, cups: 0, cash: 0, qris: 0, gross: 0 };
      outletMap[outlet].orders++;
      outletMap[outlet].gross += amount;
      if (payment === 'CASH') outletMap[outlet].cash += amount;
      if (payment === 'QRIS') outletMap[outlet].qris += amount;

      // Crews
      if (!crewMap[crewName]) crewMap[crewName] = { name: crewName, outlet, orders: 0, cups: 0, gross: 0 };
      crewMap[crewName].orders++;
      crewMap[crewName].gross += amount;

      allTransactions.push({
        invoice: trx.invoice_number,
        date: d.toLocaleDateString("id-ID"),
        time: d.toLocaleTimeString("id-ID"),
        crew: crewName,
        outlet: outlet,
        payment: payment,
        subtotal: trx.subtotal,
        discount: trx.discount,
        total: amount,
        type: 'OFFLINE'
      });
    });

    // Process Online Trx
    (onlineOrders || []).forEach(trx => {
      const payment = trx.payment_method || 'QRIS';
      const amount = trx.grand_total || 0;
      totalRevenue += amount;
      if (payment === 'CASH') grossCash += amount;
      if (payment === 'QRIS') grossQris += amount;

      const d = new Date(trx.created_at);
      const hour = d.getHours() + ":00";
      const day = d.toLocaleDateString("en-US", { weekday: 'long' });
      hourMap[hour] = (hourMap[hour] || 0) + 1;
      dayMap[day] = (dayMap[day] || 0) + amount;

      allTransactions.push({
        invoice: trx.invoice_number,
        date: d.toLocaleDateString("id-ID"),
        time: d.toLocaleTimeString("id-ID"),
        crew: 'Online Platform',
        outlet: 'Seru.ni App',
        payment: payment,
        subtotal: trx.subtotal,
        discount: 0,
        total: amount,
        type: 'ONLINE'
      });
    });

    // Process Items (Offline)
    (trxItems || []).forEach(item => {
      const trx = trxs?.find(t => t.id === item.transaction_id);
      if (!trx) return;
      const shift = shiftMap[trx.shift_id];
      const crewName = userMap[shift?.user_id] || "Unknown";
      const outlet = shift?.outlet_id || trx.outlet_id || "Unknown";

      const qty = item.quantity || 1;
      totalCups += qty;
      
      if (outletMap[outlet]) outletMap[outlet].cups += qty;
      if (crewMap[crewName]) crewMap[crewName].cups += qty;

      const pName = item.product_name;
      if (!productMap[pName]) productMap[pName] = { name: pName, cups: 0, revenue: 0 };
      productMap[pName].cups += qty;
      productMap[pName].revenue += item.total_price || 0;
    });

    // Process Items (Online)
    (onlineItems || []).forEach(item => {
      const qty = item.quantity || 1;
      totalCups += qty;
      const pName = item.product_name;
      if (!productMap[pName]) productMap[pName] = { name: pName, cups: 0, revenue: 0 };
      productMap[pName].cups += qty;
      productMap[pName].revenue += item.subtotal || 0;
    });

    const crewBonus = totalCups * 350; // Business rule
    const netCash = grossCash - crewBonus;
    const cashDeposit = netCash; // Assuming perfect settlement for report baseline

    // Insights Generation
    const outletArray = Object.values(outletMap).sort((a,b) => b.gross - a.gross);
    const productArray = Object.values(productMap).sort((a,b) => b.cups - a.cups);
    const crewArray = Object.values(crewMap).sort((a,b) => b.gross - a.gross);

    let mostActiveHour = "N/A";
    let peakSalesDay = "N/A";
    
    if (Object.keys(hourMap).length > 0) {
      mostActiveHour = Object.keys(hourMap).reduce((a, b) => hourMap[a] > hourMap[b] ? a : b);
    }
    if (Object.keys(dayMap).length > 0) {
      peakSalesDay = Object.keys(dayMap).reduce((a, b) => dayMap[a] > dayMap[b] ? a : b);
    }

    const reportData: ReportDataPayload = {
      period,
      generatedAt: now.toLocaleString('id-ID'),
      generatedBy,
      summary: {
        totalRevenue,
        grossCash,
        grossQris,
        netCash,
        cashDeposit,
        crewBonus,
        totalOrders,
        totalCups,
        averageOrderValue: totalOrders > 0 ? totalRevenue / totalOrders : 0,
        averageCupsPerTrx: totalOrders > 0 ? totalCups / totalOrders : 0,
        totalActiveOutlets: outletArray.length,
        totalActiveCrew: crewArray.length
      },
      insights: {
        revenueGrowth: 0, // Placeholder
        qrisPercentage: totalRevenue > 0 ? (grossQris / totalRevenue) * 100 : 0,
        cashPercentage: totalRevenue > 0 ? (grossCash / totalRevenue) * 100 : 0,
        bestOutlet: outletArray.length > 0 ? outletArray[0].name : "N/A",
        bestProduct: productArray.length > 0 ? productArray[0].name : "N/A",
        bestCrew: crewArray.length > 0 ? crewArray[0].name : "N/A",
        lowestOutlet: outletArray.length > 1 ? outletArray[outletArray.length - 1].name : "N/A",
        averageTrx: totalOrders > 0 ? totalRevenue / totalOrders : 0,
        peakSalesDay,
        mostActiveHour,
        topPaymentMethod: grossQris > grossCash ? "QRIS" : "CASH"
      },
      outlets: outletArray,
      shifts: [], // Simplified for this aggregation
      crews: crewArray,
      products: productArray,
      payments: [
        { method: 'CASH', total: grossCash, percentage: totalRevenue > 0 ? (grossCash / totalRevenue) * 100 : 0 },
        { method: 'QRIS', total: grossQris, percentage: totalRevenue > 0 ? (grossQris / totalRevenue) * 100 : 0 }
      ],
      online: {
        totalRevenue: onlineOrders?.reduce((a:any, b:any) => a + (b.grand_total||0), 0) || 0,
        totalOrders: onlineOrders?.length || 0
      },
      ledger: allTransactions,
      settlement: outletArray.map(o => ({
        outlet: o.name,
        expectedCash: o.cash,
        actualDeposit: o.cash - (o.cups * 350), // Simplified
        bonus: o.cups * 350,
        difference: 0,
        status: "VERIFIED"
      }))
    };

    return reportData;
  }
}
