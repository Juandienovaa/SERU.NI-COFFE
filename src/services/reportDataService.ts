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
    totalExpenses: number;
    netRevenue: number;
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
  posCenterDaily: any[];
  expensesDaily: any[];
  posCenterTotal: {
    totalRevenue: number;
    totalOrders: number;
    totalCups: number;
    grossCash: number;
    grossQris: number;
  };
  crewTotal: {
    totalRevenue: number;
    totalOrders: number;
    totalCups: number;
    grossCash: number;
    grossQris: number;
  };
  onlineTotal: {
    totalRevenue: number;
    totalOrders: number;
    totalCups: number;
  };
}

export const reportDataService = {
  async fetchReportData(period: string, generatedBy: string, customStartDate?: string, customEndDate?: string): Promise<ReportDataPayload> {
    const now = new Date();
    let startIso = "";
    let endIso = "";

    const wibDate = { 
      year: now.getFullYear(),
      month: now.getMonth(),
      day: now.getDate()
    };

    if (customStartDate && customEndDate) {
      startIso = new Date(`${customStartDate}T00:00:00+07:00`).toISOString();
      endIso = new Date(`${customEndDate}T23:59:59+07:00`).toISOString();
    } else if (period === "today") {
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
      id, invoice_number, created_at, payment_method, total_amount, subtotal_products, discount,
      order_type, cashier_id, shift_id, outlet_id, payment_status, is_central_cashier
    `).eq('payment_status', 'PAID');
    
    let onlineQuery = supabase.from('online_orders').select(`
      id, invoice_number, created_at, payment_method, grand_total, subtotal,
      customer_name, payment_status, order_status
    `).in('payment_status', ['PAID', 'SETTLED']);

    let trxItemsQuery = supabase.from('transaction_items').select(`
      id, transaction_id, product_id, qty, price, subtotal, products(product_name),
      transactions!inner(created_at)
    `);

    let onlineItemsQuery = supabase.from('online_order_items').select(`
      id, order_id, product_id, product_name, quantity, price, subtotal,
      online_orders!inner(created_at)
    `);

    let expenseQuery = supabase.from('operational_expenses').select('*');

    if (startIso && endIso) {
      trxQuery = trxQuery.gte('created_at', startIso).lte('created_at', endIso);
      onlineQuery = onlineQuery.gte('created_at', startIso).lte('created_at', endIso);
      expenseQuery = expenseQuery.gte('created_at', startIso).lte('created_at', endIso);
      trxItemsQuery = trxItemsQuery.gte('transactions.created_at', startIso).lte('transactions.created_at', endIso);
      onlineItemsQuery = onlineItemsQuery.gte('online_orders.created_at', startIso).lte('online_orders.created_at', endIso);
    }

    const [
      { data: trxs },
      { data: onlineOrders },
      { data: trxItems },
      { data: onlineItems },
      { data: users },
      { data: shifts },
      { data: expenses }
    ] = await Promise.all([
      trxQuery,
      onlineQuery,
      trxItemsQuery,
      onlineItemsQuery,
      supabase.from('users').select('id, nama'),
      supabase.from('shifts').select('*'),
      expenseQuery
    ]);

    const userMap = (users || []).reduce((acc: any, u: any) => ({ ...acc, [u.id]: u.nama }), {});
    const shiftMap = (shifts || []).reduce((acc: any, s: any) => ({ ...acc, [s.id]: s }), {});

    // AGGREGATION LOGIC
    let totalRevenue = 0;
    let grossCash = 0;
    let grossQris = 0;
    let totalOrders = (trxs?.length || 0) + (onlineOrders?.length || 0);
    let totalCups = 0;
    
    let totalExpenses = 0;
    const expenseDailyMap: Record<string, { date: string, items: any[], total: number }> = {};
    
    (expenses || []).forEach(exp => {
      const amount = exp.amount || 0;
      totalExpenses += amount;
      
      const d = new Date(exp.created_at);
      const pDay = d.toLocaleDateString("id-ID");
      
      if (!expenseDailyMap[pDay]) {
        expenseDailyMap[pDay] = { date: pDay, items: [], total: 0 };
      }
      
      expenseDailyMap[pDay].items.push({
        description: exp.description || 'Pengeluaran',
        amount: amount,
        category: exp.expense_category || 'Lainnya'
      });
      expenseDailyMap[pDay].total += amount;
    });
    
    const expensesDaily = Object.values(expenseDailyMap).sort((a,b) => b.date.localeCompare(a.date));

    const outletMap: Record<string, any> = {};
    const crewMap: Record<string, any> = {};
    const productMap: Record<string, any> = {};
    const hourMap: Record<string, number> = {};
    const dayMap: Record<string, number> = {};

    const allTransactions: any[] = [];

    const posCenterDailyMap: Record<string, any> = {};
    const posCenterTotal = { totalRevenue: 0, totalOrders: 0, totalCups: 0, grossCash: 0, grossQris: 0 };
    const crewTotal = { totalRevenue: 0, totalOrders: 0, totalCups: 0, grossCash: 0, grossQris: 0 };
    const onlineTotal = { totalRevenue: 0, totalOrders: 0, totalCups: 0 };

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

      if (trx.is_central_cashier) {
        posCenterTotal.totalRevenue += amount;
        posCenterTotal.totalOrders++;
        if (payment === 'CASH') posCenterTotal.grossCash += amount;
        if (payment === 'QRIS') posCenterTotal.grossQris += amount;

        const pDay = d.toLocaleDateString("id-ID");
        if (!posCenterDailyMap[pDay]) posCenterDailyMap[pDay] = { date: pDay, trx: 0, cash: 0, qris: 0, total: 0 };
        posCenterDailyMap[pDay].trx++;
        posCenterDailyMap[pDay].total += amount;
        if (payment === 'CASH') posCenterDailyMap[pDay].cash += amount;
        if (payment === 'QRIS') posCenterDailyMap[pDay].qris += amount;
      } else {
        crewTotal.totalRevenue += amount;
        crewTotal.totalOrders++;
        if (payment === 'CASH') crewTotal.grossCash += amount;
        if (payment === 'QRIS') crewTotal.grossQris += amount;
      }

      allTransactions.push({
        invoice: trx.invoice_number,
        date: d.toLocaleDateString("id-ID"),
        time: d.toLocaleTimeString("id-ID"),
        crew: crewName,
        outlet: outlet,
        payment: payment,
        subtotal: trx.subtotal_products,
        discount: trx.discount,
        total: amount,
        type: 'OFFLINE',
        is_central_cashier: trx.is_central_cashier || false
      });
    });

    // Process Online Trx
    (onlineOrders || []).forEach(trx => {
      const payment = trx.payment_method || 'QRIS';
      const amount = trx.grand_total || 0;
      totalRevenue += amount;
      if (payment === 'CASH') grossCash += amount;
      if (payment === 'QRIS') grossQris += amount;

      onlineTotal.totalRevenue += amount;
      onlineTotal.totalOrders++;

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

    // Pre-calculate Map using reduce for O(1) lookups (Fix N+1/O(N^2) Performance Bottleneck)
    const trxMapById = (trxs || []).reduce((acc: any, trx: any) => {
      acc[trx.id] = trx;
      return acc;
    }, {});

    // Process Items (Offline)
    (trxItems || []).forEach(item => {
      const trx = trxMapById[item.transaction_id];
      if (!trx) return;
      const shift = shiftMap[trx.shift_id];
      const crewName = userMap[shift?.user_id] || "Unknown";
      const outlet = shift?.outlet_id || trx.outlet_id || "Unknown";

      const qty = item.qty || 1;
      totalCups += qty;
      
      if (trx.is_central_cashier) {
        posCenterTotal.totalCups += qty;
      } else {
        crewTotal.totalCups += qty;
      }
      
      if (outletMap[outlet]) outletMap[outlet].cups += qty;
      if (crewMap[crewName]) crewMap[crewName].cups += qty;

      const pName = (item.products as any)?.product_name || (Array.isArray(item.products) ? (item.products[0] as any)?.product_name : undefined) || `Product ${item.product_id}`;
      if (!productMap[pName]) productMap[pName] = { name: pName, cups: 0, revenue: 0 };
      productMap[pName].cups += qty;
      productMap[pName].revenue += item.subtotal || 0;
    });

    // Process Items (Online)
    (onlineItems || []).forEach(item => {
      const qty = item.quantity || 1;
      totalCups += qty;
      onlineTotal.totalCups += qty;
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
        totalActiveCrew: crewArray.length,
        totalExpenses: totalExpenses,
        netRevenue: totalRevenue - totalExpenses
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
      })),
      posCenterDaily: Object.values(posCenterDailyMap).reverse(),
      expensesDaily: expensesDaily,
      posCenterTotal,
      crewTotal,
      onlineTotal
    };

    return reportData;
  }
}
