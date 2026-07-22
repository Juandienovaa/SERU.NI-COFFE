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
    const orange = [234, 88, 12] as [number, number, number]; // Tailwind orange-600
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
    
    data.ledger.forEach((trx) => {
      // trx.date is already formatted as "DD/MM/YYYY" or similar from reportDataService
      const date = trx.date;
      if (!dailyData[date]) {
        dailyData[date] = { date, trx: 0, cash: 0, qris: 0, total: 0 };
      }
      dailyData[date].trx++;
      dailyData[date].total += trx.total;
      if (trx.payment === 'CASH') dailyData[date].cash += trx.total;
      if (trx.payment === 'QRIS') dailyData[date].qris += trx.total;
    });

    const dailyArray = Object.values(dailyData);
    // Note: sorting assumes format DD/MM/YYYY. For robustness, if it's string based, we keep it as is,
    // assuming ledger is already mostly chronological, but we can attempt to sort if needed.
    // However, JS Date parsing of "DD/MM/YYYY" is inconsistent. We'll rely on the existing ledger order 
    // which comes from the database (descending or ascending). We'll sort it ascending based on order of appearance (reverse ledger).
    dailyArray.reverse(); 

    let periodLabel = "Tidak Diketahui";
    if (data.period === "today") periodLabel = "Hari Ini";
    else if (data.period === "7days" || data.period === "week") periodLabel = "7 Hari Terakhir";
    else if (data.period === "month") periodLabel = "Bulan Ini";
    else if (data.period === "year") periodLabel = "Tahun Ini";

    // ==========================================
    // HALAMAN 1: LAPORAN EKSEKUTIF KEUANGAN
    // ==========================================
    onProgress?.("Membangun Halaman Eksekutif...", 40);
    
    // Header
    doc.setFont("helvetica", "bold");
    doc.setFontSize(28);
    doc.setTextColor(...black);
    doc.text("LAPORAN EKSEKUTIF KEUANGAN", 14, 30);
    
    doc.setFontSize(14);
    doc.setTextColor(...orange);
    doc.text("SERU.NI COFFEE", 14, 40);

    // Meta Information
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

    // Separator line
    doc.setDrawColor(220, 220, 220);
    doc.setLineWidth(0.5);
    doc.line(14, 85, pageWidth - 14, 85);

    // RINGKASAN EKSEKUTIF
    doc.setFontSize(18);
    doc.setTextColor(...black);
    doc.setFont("helvetica", "bold");
    doc.text("RINGKASAN EKSEKUTIF", 14, 100);

    const kpiY = 115;
    const kpiWidth = (pageWidth - 28) / 4;
    
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
    drawSimpleKpi("Pendapatan Bersih", formatRp(data.summary.totalRevenue), 14 + (kpiWidth * 3));

    // ==========================================
    // SECTION 2: RINGKASAN PENDAPATAN HARIAN
    // ==========================================
    onProgress?.("Membangun Tabel Pendapatan Harian...", 60);
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
        formatRp(d.total)
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
    // SECTION 3: RINCIAN PENDAPATAN TUNAI
    // ==========================================
    onProgress?.("Membangun Rincian Tunai...", 75);
    let finalY = (doc as any).lastAutoTable.finalY + 20;
    
    // Check if we need a new page for the title
    if (finalY > pageHeight - 40) {
      doc.addPage();
      finalY = 20;
    }

    doc.setFontSize(16);
    doc.setTextColor(...black);
    doc.setFont("helvetica", "bold");
    doc.text("RINCIAN PENDAPATAN TUNAI", 14, finalY);

    autoTable(doc, {
      startY: finalY + 7,
      head: [['Tanggal', 'Jml Transaksi', 'Persentase', 'Total Tunai', 'Subtotal']],
      body: dailyArray.map(d => {
        const percentage = data.summary.totalRevenue > 0 ? ((d.cash / data.summary.totalRevenue) * 100).toFixed(1) + "%" : "0%";
        return [
          d.date, 
          d.trx.toString(), 
          percentage,
          formatRp(d.cash), 
          formatRp(d.cash)
        ];
      }),
      foot: [['TOTAL', '-', '-', formatRp(data.summary.grossCash), formatRp(data.summary.grossCash)]],
      theme: 'striped',
      headStyles: { fillColor: grayDark, textColor: 255, fontStyle: 'bold', fontSize: 9 },
      bodyStyles: { textColor: black, fontSize: 9 },
      footStyles: { fillColor: black, textColor: 255, fontStyle: 'bold', fontSize: 9 },
      alternateRowStyles: { fillColor: grayLight },
      columnStyles: {
        1: { halign: 'center' },
        2: { halign: 'center' },
        3: { halign: 'right' },
        4: { halign: 'right' },
      },
      margin: { left: 14, right: 14 }
    });

    // ==========================================
    // SECTION 4: RINCIAN PENDAPATAN QRIS
    // ==========================================
    onProgress?.("Membangun Rincian QRIS...", 85);
    finalY = (doc as any).lastAutoTable.finalY + 20;
    
    if (finalY > pageHeight - 40) {
      doc.addPage();
      finalY = 20;
    }

    doc.setFontSize(16);
    doc.setTextColor(...black);
    doc.setFont("helvetica", "bold");
    doc.text("RINCIAN PENDAPATAN QRIS", 14, finalY);

    autoTable(doc, {
      startY: finalY + 7,
      head: [['Tanggal', 'Jml Transaksi', 'Persentase', 'Total QRIS', 'Subtotal']],
      body: dailyArray.map(d => {
        const percentage = data.summary.totalRevenue > 0 ? ((d.qris / data.summary.totalRevenue) * 100).toFixed(1) + "%" : "0%";
        return [
          d.date, 
          d.trx.toString(), 
          percentage,
          formatRp(d.qris), 
          formatRp(d.qris)
        ];
      }),
      foot: [['TOTAL', '-', '-', formatRp(data.summary.grossQris), formatRp(data.summary.grossQris)]],
      theme: 'striped',
      headStyles: { fillColor: grayDark, textColor: 255, fontStyle: 'bold', fontSize: 9 },
      bodyStyles: { textColor: black, fontSize: 9 },
      footStyles: { fillColor: black, textColor: 255, fontStyle: 'bold', fontSize: 9 },
      alternateRowStyles: { fillColor: grayLight },
      columnStyles: {
        1: { halign: 'center' },
        2: { halign: 'center' },
        3: { halign: 'right' },
        4: { halign: 'right' },
      },
      margin: { left: 14, right: 14 }
    });

    // ==========================================
    // SECTION 5: RINGKASAN KEUANGAN
    // ==========================================
    onProgress?.("Finalisasi Dokumen...", 95);
    finalY = (doc as any).lastAutoTable.finalY + 20;
    
    if (finalY > pageHeight - 60) {
      doc.addPage();
      finalY = 20;
    }

    // A subtle border for the final summary
    doc.setDrawColor(220, 220, 220);
    doc.setLineWidth(1);
    doc.line(14, finalY, pageWidth - 14, finalY);
    
    finalY += 10;
    doc.setFontSize(16);
    doc.setTextColor(...black);
    doc.setFont("helvetica", "bold");
    doc.text("RINGKASAN KEUANGAN", 14, finalY);

    doc.setFontSize(10);
    doc.setFont("helvetica", "normal");
    
    const summaryLabels = ["Total Pendapatan", "Total Tunai", "Total QRIS", "Pendapatan Bersih"];
    const summaryValues = [
      formatRp(data.summary.totalRevenue), 
      formatRp(data.summary.grossCash), 
      formatRp(data.summary.grossQris), 
      formatRp(data.summary.totalRevenue)
    ];

    let currentY = finalY + 12;
    for (let i = 0; i < summaryLabels.length; i++) {
      doc.setTextColor(...grayDark);
      doc.text(summaryLabels[i], 14, currentY);
      
      doc.setTextColor(...black);
      doc.setFont("helvetica", "bold");
      // Right align the values
      doc.text(summaryValues[i], pageWidth - 14, currentY, { align: "right" });
      
      // Dashed line
      doc.setDrawColor(230, 230, 230);
      doc.setLineDashPattern([1, 2], 0);
      doc.line(14, currentY + 3, pageWidth - 14, currentY + 3);
      doc.setLineDashPattern([], 0); // reset
      
      currentY += 10;
      doc.setFont("helvetica", "normal");
    }

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
