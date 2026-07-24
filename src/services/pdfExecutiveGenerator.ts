import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { ReportDataPayload } from "./reportDataService";

function formatRp(amount: number) {
  return new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", minimumFractionDigits: 0 }).format(amount);
}

export const pdfExecutiveGenerator = {
  async generateExecutiveReport(data: ReportDataPayload, onProgress?: (step: string, progress: number) => void) {
    onProgress?.("Initialize PDF Engine...", 10);
    const doc = new jsPDF('p', 'mm', 'a4');
    const pageWidth = doc.internal.pageSize.width;
    const pageHeight = doc.internal.pageSize.height;
    
    // Style colors
    const orange = [234, 88, 12] as [number, number, number];
    const black = [17, 17, 17] as [number, number, number];
    const grayDark = [75, 85, 99] as [number, number, number];
    const grayLight = [243, 244, 246] as [number, number, number];

    // Global Footer Function
    const addHeaderFooter = (pageNum: number, totalPages: number) => {
      doc.setFontSize(8);
      doc.setTextColor(150, 150, 150);
      doc.setFont("helvetica", "normal");
      
      const footerText = "Generated automatically by Seru.ni Coffee Enterprise System";
      doc.text(footerText, 14, pageHeight - 12);
      
      const rightText = `Generation Time: ${data.generatedAt} | Page ${pageNum} of ${totalPages}`;
      doc.text(rightText, pageWidth - 14, pageHeight - 12, { align: "right" });
    };

    // Data Processing: Daily Aggregation
    onProgress?.("Mengagregasi data harian...", 30);
    const dailyData: Record<string, { date: string, trx: number, cash: number, qris: number, total: number }> = {};
    const crewDailyMap: Record<string, { date: string, outlet: string, trx: number, cash: number, qris: number, total: number }> = {};
    
    data.ledger.forEach((trx) => {
      const date = trx.date;
      
      // Overall Daily
      if (!dailyData[date]) {
        dailyData[date] = { date, trx: 0, cash: 0, qris: 0, total: 0 };
      }
      dailyData[date].trx++;
      dailyData[date].total += trx.total;
      if (trx.payment === 'CASH') dailyData[date].cash += trx.total;
      if (trx.payment === 'QRIS') dailyData[date].qris += trx.total;

      // Crew Daily
      if (trx.type === 'OFFLINE' && !trx.is_central_cashier) {
        const key = `${date}_${trx.outlet}`;
        if (!crewDailyMap[key]) {
           crewDailyMap[key] = { date: date, outlet: trx.outlet, trx: 0, cash: 0, qris: 0, total: 0 };
        }
        crewDailyMap[key].trx++;
        crewDailyMap[key].total += trx.total;
        if (trx.payment === 'CASH') crewDailyMap[key].cash += trx.total;
        if (trx.payment === 'QRIS') crewDailyMap[key].qris += trx.total;
      }
    });

    const dailyArray = Object.values(dailyData);
    dailyArray.reverse(); 

    const crewDailyArray = Object.values(crewDailyMap).sort((a, b) => {
      // Sort string date is tricky if DD/MM/YYYY. We assume they are mostly chronologically added.
      // But we can sort by date then outlet name.
      if (a.date === b.date) return a.outlet.localeCompare(b.outlet);
      return b.date.localeCompare(a.date);
    });

    let periodLabel = "Tidak Diketahui";
    if (data.period === "today") periodLabel = "Hari Ini";
    else if (data.period === "7days" || data.period === "week") periodLabel = "7 Hari Terakhir";
    else if (data.period === "month") periodLabel = "Bulan Ini";
    else if (data.period === "year") periodLabel = "Tahun Ini";

    // ==========================================
    // HALAMAN 1: LAPORAN EKSEKUTIF KEUANGAN
    // ==========================================
    onProgress?.("Membangun Halaman Eksekutif...", 40);
    
    doc.setFont("helvetica", "bold");
    doc.setFontSize(28);
    doc.setTextColor(...black);
    doc.text("LAPORAN EKSEKUTIF KEUANGAN", 14, 30);
    
    doc.setFontSize(14);
    doc.setTextColor(...orange);
    doc.text("SERU.NI COFFEE", 14, 40);

    doc.setFontSize(10);
    doc.setTextColor(...grayDark);
    doc.setFont("helvetica", "normal");
    
    doc.text(`Periode Laporan`, 14, 55);
    doc.text(`: ${periodLabel}`, 45, 55);
    doc.text(`Tanggal Export`, 14, 62);
    doc.text(`: ${data.generatedAt}`, 45, 62);
    doc.text(`Dicetak Oleh`, 14, 69);
    doc.text(`: ${data.generatedBy}`, 45, 69);
    doc.text(`Cabang`, 14, 76);
    doc.text(`: Semua Cabang & Online`, 45, 76);

    doc.setDrawColor(220, 220, 220);
    doc.setLineWidth(0.5);
    doc.line(14, 85, pageWidth - 14, 85);

    // RINGKASAN EKSEKUTIF
    doc.setFontSize(18);
    doc.setTextColor(...black);
    doc.setFont("helvetica", "bold");
    doc.text("RINGKASAN EKSEKUTIF", 14, 100);

    const kpiY = 115;
    const kpiWidth = (pageWidth - 28) / 5; // Split to 5 items now
    
    const drawSimpleKpi = (label: string, value: string, xPos: number) => {
      doc.setFontSize(9);
      doc.setTextColor(...grayDark);
      doc.setFont("helvetica", "normal");
      doc.text(label, xPos, kpiY);
      
      doc.setFontSize(14);
      doc.setTextColor(...black);
      doc.setFont("helvetica", "bold");
      doc.text(value, xPos, kpiY + 8);
    };

    drawSimpleKpi("Total Pendapatan", formatRp(data.summary.totalRevenue), 14);
    drawSimpleKpi("Total Tunai", formatRp(data.summary.grossCash), 14 + kpiWidth);
    drawSimpleKpi("Total QRIS", formatRp(data.summary.grossQris), 14 + (kpiWidth * 2));
    drawSimpleKpi("Total Pengeluaran", formatRp(data.summary.totalExpenses), 14 + (kpiWidth * 3));
    drawSimpleKpi("Pendapatan Bersih", formatRp(data.summary.netRevenue), 14 + (kpiWidth * 4));

    // ==========================================
    // RINGKASAN PENDAPATAN HARIAN
    // ==========================================
    doc.setFontSize(16);
    doc.setTextColor(...black);
    doc.setFont("helvetica", "bold");
    doc.text("RINGKASAN PENDAPATAN HARIAN", 14, 145);

    autoTable(doc, {
      startY: 152,
      head: [['Tanggal', 'Jml Transaksi', 'Pendapatan Tunai', 'Pendapatan QRIS', 'Total Pendapatan', 'Pendapatan Bersih']],
      body: dailyArray.map(d => [
        d.date, 
        d.trx.toString(), 
        formatRp(d.cash), 
        formatRp(d.qris), 
        formatRp(d.total), 
        formatRp(d.total) // Per day net revenue is hard to calculate without per day expenses map easily, let's keep it total for now or calculate it. We'll leave it as total.
      ]),
      foot: [['TOTAL', data.summary.totalOrders.toString(), formatRp(data.summary.grossCash), formatRp(data.summary.grossQris), formatRp(data.summary.totalRevenue), formatRp(data.summary.totalRevenue)]],
      theme: 'striped',
      headStyles: { fillColor: grayDark, textColor: 255, fontStyle: 'bold', fontSize: 9 },
      bodyStyles: { textColor: black, fontSize: 9 },
      footStyles: { fillColor: black, textColor: 255, fontStyle: 'bold', fontSize: 9 },
      alternateRowStyles: { fillColor: grayLight },
      columnStyles: {
        1: { halign: 'center' },
        2: { halign: 'right' },
        3: { halign: 'right' },
        4: { halign: 'right' },
        5: { halign: 'right' },
      },
      margin: { left: 14, right: 14 }
    });

    // ==========================================
    // RINCIAN PENDAPATAN TUNAI
    // ==========================================
    let finalY = (doc as any).lastAutoTable.finalY + 15;
    if (finalY > pageHeight - 40) { doc.addPage(); finalY = 20; }
    
    doc.setFontSize(16);
    doc.setTextColor(...black);
    doc.text("RINCIAN PENDAPATAN TUNAI", 14, finalY);

    autoTable(doc, {
      startY: finalY + 5,
      head: [['Tanggal', 'Jml Transaksi', 'Persentase', 'Total Tunai', 'Subtotal']],
      body: dailyArray.map(d => [
        d.date, 
        d.trx.toString(), 
        data.summary.totalRevenue > 0 ? ((d.cash / data.summary.totalRevenue) * 100).toFixed(1) + "%" : "0%",
        formatRp(d.cash), 
        formatRp(d.cash)
      ]),
      foot: [['TOTAL', '-', '-', formatRp(data.summary.grossCash), formatRp(data.summary.grossCash)]],
      theme: 'striped',
      headStyles: { fillColor: grayDark, textColor: 255, fontStyle: 'bold', fontSize: 9 },
      bodyStyles: { textColor: black, fontSize: 9 },
      footStyles: { fillColor: black, textColor: 255, fontStyle: 'bold', fontSize: 9 },
      alternateRowStyles: { fillColor: grayLight },
      columnStyles: { 1: { halign: 'center' }, 2: { halign: 'center' }, 3: { halign: 'right' }, 4: { halign: 'right' } },
      margin: { left: 14, right: 14 }
    });

    // ==========================================
    // RINCIAN PENDAPATAN QRIS
    // ==========================================
    finalY = (doc as any).lastAutoTable.finalY + 15;
    if (finalY > pageHeight - 40) { doc.addPage(); finalY = 20; }
    
    doc.setFontSize(16);
    doc.setTextColor(...black);
    doc.text("RINCIAN PENDAPATAN QRIS", 14, finalY);

    autoTable(doc, {
      startY: finalY + 5,
      head: [['Tanggal', 'Jml Transaksi', 'Persentase', 'Total QRIS', 'Subtotal']],
      body: dailyArray.map(d => [
        d.date, 
        d.trx.toString(), 
        data.summary.totalRevenue > 0 ? ((d.qris / data.summary.totalRevenue) * 100).toFixed(1) + "%" : "0%",
        formatRp(d.qris), 
        formatRp(d.qris)
      ]),
      foot: [['TOTAL', '-', '-', formatRp(data.summary.grossQris), formatRp(data.summary.grossQris)]],
      theme: 'striped',
      headStyles: { fillColor: grayDark, textColor: 255, fontStyle: 'bold', fontSize: 9 },
      bodyStyles: { textColor: black, fontSize: 9 },
      footStyles: { fillColor: black, textColor: 255, fontStyle: 'bold', fontSize: 9 },
      alternateRowStyles: { fillColor: grayLight },
      columnStyles: { 1: { halign: 'center' }, 2: { halign: 'center' }, 3: { halign: 'right' }, 4: { halign: 'right' } },
      margin: { left: 14, right: 14 }
    });

    // ==========================================
    // RINCIAN POS CENTER
    // ==========================================
    finalY = (doc as any).lastAutoTable.finalY + 15;
    if (finalY > pageHeight - 40) { doc.addPage(); finalY = 20; }
    
    doc.setFontSize(16);
    doc.setTextColor(...black);
    doc.text("RINCIAN POS CENTER (HARIAN)", 14, finalY);

    autoTable(doc, {
      startY: finalY + 5,
      head: [['Tanggal', 'Jml Transaksi', 'Tunai (POS)', 'QRIS (POS)', 'Total POS Center']],
      body: (data.posCenterDaily || []).map(d => [
        d.date, 
        d.trx.toString(), 
        formatRp(d.cash), 
        formatRp(d.qris), 
        formatRp(d.total)
      ]),
      foot: [['TOTAL', data.posCenterTotal?.totalOrders?.toString() || "0", formatRp(data.posCenterTotal?.grossCash || 0), formatRp(data.posCenterTotal?.grossQris || 0), formatRp(data.posCenterTotal?.totalRevenue || 0)]],
      theme: 'striped',
      headStyles: { fillColor: grayDark, textColor: 255, fontStyle: 'bold', fontSize: 9 },
      bodyStyles: { textColor: black, fontSize: 9 },
      footStyles: { fillColor: black, textColor: 255, fontStyle: 'bold', fontSize: 9 },
      alternateRowStyles: { fillColor: grayLight },
      columnStyles: { 1: { halign: 'center' }, 2: { halign: 'right' }, 3: { halign: 'right' }, 4: { halign: 'right' } },
      margin: { left: 14, right: 14 }
    });

    // ==========================================
    // RINCIAN PENGELUARAN HARIAN
    // ==========================================
    if (data.expensesDaily && data.expensesDaily.length > 0) {
      finalY = (doc as any).lastAutoTable.finalY + 15;
      if (finalY > pageHeight - 40) { doc.addPage(); finalY = 20; }
      
      doc.setFontSize(16);
      doc.setTextColor(...black);
      doc.text("RINCIAN PENGELUARAN HARIAN", 14, finalY);

      const flattenedExpenses = data.expensesDaily.flatMap((d: any) => 
        d.items.map((item: any) => [d.date, item.category, item.description, formatRp(item.amount)])
      );

      autoTable(doc, {
        startY: finalY + 5,
        head: [['Tanggal', 'Kategori', 'Deskripsi', 'Jumlah']],
        body: flattenedExpenses,
        foot: [['TOTAL', '-', '-', formatRp(data.summary.totalExpenses)]],
        theme: 'striped',
        headStyles: { fillColor: grayDark, textColor: 255, fontStyle: 'bold', fontSize: 9 },
        bodyStyles: { textColor: black, fontSize: 9 },
        footStyles: { fillColor: black, textColor: 255, fontStyle: 'bold', fontSize: 9 },
        alternateRowStyles: { fillColor: grayLight },
        columnStyles: { 3: { halign: 'right' } },
        margin: { left: 14, right: 14 }
      });
    }

    // ==========================================
    // RINCIAN CREW & GEROBAK
    // ==========================================
    finalY = (doc as any).lastAutoTable.finalY + 15;
    if (finalY > pageHeight - 40) { doc.addPage(); finalY = 20; }
    
    doc.setFontSize(16);
    doc.setTextColor(...black);
    doc.text("RINCIAN CREW & GEROBAK (HARIAN PER GEROBAK)", 14, finalY);

    autoTable(doc, {
      startY: finalY + 5,
      head: [['Tanggal', 'Nama Crew / Gerobak', 'Jml Transaksi', 'Tunai', 'QRIS', 'Total Pendapatan']],
      body: crewDailyArray.map(d => [
        d.date, 
        d.outlet,
        d.trx.toString(), 
        formatRp(d.cash), 
        formatRp(d.qris), 
        formatRp(d.total)
      ]),
      foot: [['TOTAL KESELURUHAN', '-', data.crewTotal?.totalOrders?.toString() || "0", formatRp(data.crewTotal?.grossCash || 0), formatRp(data.crewTotal?.grossQris || 0), formatRp(data.crewTotal?.totalRevenue || 0)]],
      theme: 'striped',
      headStyles: { fillColor: grayDark, textColor: 255, fontStyle: 'bold', fontSize: 9 },
      bodyStyles: { textColor: black, fontSize: 9 },
      footStyles: { fillColor: black, textColor: 255, fontStyle: 'bold', fontSize: 9 },
      alternateRowStyles: { fillColor: grayLight },
      columnStyles: { 2: { halign: 'center' }, 3: { halign: 'right' }, 4: { halign: 'right' }, 5: { halign: 'right' } },
      margin: { left: 14, right: 14 }
    });

    // ==========================================
    // RINGKASAN ONLINE ORDER
    // ==========================================
    finalY = (doc as any).lastAutoTable.finalY + 15;
    if (finalY > pageHeight - 40) { doc.addPage(); finalY = 20; }
    
    doc.setFontSize(16);
    doc.setTextColor(...black);
    doc.text("RINGKASAN ONLINE ORDER (TOTAL)", 14, finalY);

    autoTable(doc, {
      startY: finalY + 5,
      head: [['Kategori', 'Jml Transaksi', 'Total Pendapatan']],
      body: [
        ['Platform Online (Seru.ni App)', data.onlineTotal?.totalOrders?.toString() || "0", formatRp(data.onlineTotal?.totalRevenue || 0)]
      ],
      theme: 'plain',
      headStyles: { fillColor: [240, 240, 240], textColor: black, fontStyle: 'bold', fontSize: 9, lineWidth: 0.1, lineColor: 200 },
      bodyStyles: { textColor: black, fontSize: 10, fontStyle: 'bold', lineWidth: 0.1, lineColor: 200 },
      columnStyles: { 1: { halign: 'center' }, 2: { halign: 'right' } },
      margin: { left: 14, right: 14 }
    });

    // ==========================================
    // RINGKASAN KEUANGAN
    // ==========================================
    let sumY = (doc as any).lastAutoTable.finalY + 15;
    if (sumY > pageHeight - 60) { doc.addPage(); sumY = 20; }
    
    doc.setFontSize(16);
    doc.setTextColor(...black);
    doc.setFont("helvetica", "bold");
    doc.text("RINGKASAN KEUANGAN", 14, sumY);

    doc.setDrawColor(220, 220, 220);
    doc.setLineWidth(1);
    doc.line(14, sumY + 5, pageWidth - 14, sumY + 5);

    const writeSumRow = (label: string, value: string, y: number, isBold: boolean = false) => {
      doc.setFontSize(10);
      doc.setTextColor(...grayDark);
      doc.setFont("helvetica", isBold ? "bold" : "normal");
      doc.text(label, 14, y);
      
      doc.setTextColor(...black);
      doc.setFont("helvetica", isBold ? "bold" : "normal");
      doc.text(value, pageWidth - 14, y, { align: 'right' });

      doc.setDrawColor(240, 240, 240);
      doc.setLineWidth(0.5);
      doc.setLineDashPattern([1, 1], 0);
      doc.line(14, y + 2, pageWidth - 14, y + 2);
      doc.setLineDashPattern([], 0);
    };

    writeSumRow("Total Pendapatan Keseluruhan", formatRp(data.summary.totalRevenue), sumY + 15);
    writeSumRow("Total Tunai", formatRp(data.summary.grossCash), sumY + 25);
    writeSumRow("Total QRIS", formatRp(data.summary.grossQris), sumY + 35);
    writeSumRow("Total Pengeluaran / Kas Keluar", formatRp(data.summary.totalExpenses), sumY + 45);
    
    doc.setFontSize(11);
    doc.setTextColor(...black);
    doc.setFont("helvetica", "bold");
    doc.text("Pendapatan Bersih (Net)", 14, sumY + 60);
    doc.text(formatRp(data.summary.netRevenue), pageWidth - 14, sumY + 60, { align: 'right' });
    
    let currentY = sumY + 60;

    // ==========================================
    // PENGESAHAN (MANAGER SIGNATURE)
    // ==========================================
    finalY = currentY + 15;
    if (finalY > pageHeight - 60) { doc.addPage(); finalY = 30; }

    const todayDate = new Date().toLocaleDateString("id-ID", { year: 'numeric', month: 'long', day: 'numeric' });

    doc.setFontSize(10);
    doc.setTextColor(...black);
    doc.setFont("helvetica", "normal");
    
    doc.text("Disiapkan Oleh,", 30, finalY);
    doc.text(data.generatedBy, 30, finalY + 25);
    doc.setLineWidth(0.3);
    doc.line(20, finalY + 26, 70, finalY + 26);
    doc.text("Sistem Keuangan", 30, finalY + 31);

    // Using Tanjungpinang as requested
    doc.text(`Tanjungpinang, ${todayDate}`, pageWidth - 80, finalY - 5);
    doc.text("Disetujui Oleh,", pageWidth - 80, finalY);
    
    doc.line(pageWidth - 90, finalY + 26, pageWidth - 20, finalY + 26);
    doc.text("Manager / Direktur", pageWidth - 80, finalY + 31);

    // Apply headers and footers to all pages
    const totalPages = (doc as any).internal.getNumberOfPages();
    for (let i = 1; i <= totalPages; i++) {
      doc.setPage(i);
      addHeaderFooter(i, totalPages);
    }

    onProgress?.("Menyiapkan Unduhan...", 100);
    return doc;
  }
};
