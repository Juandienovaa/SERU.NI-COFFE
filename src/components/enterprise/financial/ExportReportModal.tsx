"use client";

import React, { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { motion, AnimatePresence } from "motion/react";
import { FileText, Loader2, CheckCircle2, Download, X, Calendar } from "lucide-react";
import { reportDataService } from "@/services/reportDataService";
import { pdfExecutiveGenerator } from "@/services/pdfExecutiveGenerator";

interface ExportReportModalProps {
  isOpen: boolean;
  onClose: () => void;
  period: string; // Keep as fallback if they want to use period, but here we override it with custom dates
}

export const ExportReportModal: React.FC<ExportReportModalProps> = ({ isOpen, onClose, period }) => {
  const [modalState, setModalState] = useState<"FORM" | "GENERATING" | "DONE">("FORM");
  const [step, setStep] = useState<string>("");
  const [progress, setProgress] = useState<number>(0);

  const [startDate, setStartDate] = useState<string>("");
  const [endDate, setEndDate] = useState<string>("");

  useEffect(() => {
    if (!isOpen) {
      setModalState("FORM");
      setStep("");
      setProgress(0);
      setStartDate("");
      setEndDate("");
    } else {
      // Default dates to today when opened
      const today = new Date().toISOString().split('T')[0];
      setStartDate(today);
      setEndDate(today);
    }
  }, [isOpen]);

  const handleGenerate = async () => {
    if (!startDate || !endDate) {
      alert("Harap pilih rentang tanggal mulai dan akhir.");
      return;
    }

    try {
      setModalState("GENERATING");
      setStep("Collecting Financial Data...");
      setProgress(5);
      
      const data = await reportDataService.fetchReportData(period, "System Administrator", startDate, endDate);
      
      setProgress(30);
      
      const doc = await pdfExecutiveGenerator.generateExecutiveReport(data, (currentStep, currentProgress) => {
        setStep(currentStep);
        setProgress(30 + (currentProgress * 0.7));
      });

      doc.save(`Laporan-Eksekutif-Seruni-${startDate}-sd-${endDate}.pdf`);

      setModalState("DONE");
    } catch (e) {
      console.error(e);
      setStep("Failed to generate report.");
      setModalState("DONE"); // Even if fail, we change state to allow retry/close
    }
  };

  const modalContent = (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[10000] flex items-center justify-center p-4">
          <motion.div 
            initial={{ opacity: 0 }} 
            animate={{ opacity: 1 }} 
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
          />
          <motion.div 
            initial={{ scale: 0.9, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.9, opacity: 0, y: 20 }}
            className="relative bg-[#111111] border border-white/10 p-8 rounded-3xl w-full max-w-md shadow-2xl overflow-hidden"
          >
            <button 
              onClick={onClose}
              className="absolute top-4 right-4 text-neutral-500 hover:text-white transition-colors z-10"
            >
              <X className="w-5 h-5" />
            </button>

            {modalState === "FORM" && (
              <div className="flex flex-col mt-2">
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-12 h-12 rounded-xl bg-orange-500/10 flex items-center justify-center text-orange-500">
                    <FileText className="w-6 h-6" />
                  </div>
                  <div>
                    <h2 className="text-xl font-bold text-white">Export PDF Eksekutif</h2>
                    <p className="text-sm text-neutral-400">Pilih rentang tanggal laporan</p>
                  </div>
                </div>

                <div className="space-y-4 mb-8">
                  <div>
                    <label className="block text-sm text-neutral-400 mb-2">Tanggal Mulai (Start Date)</label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <Calendar className="h-4 w-4 text-neutral-500" />
                      </div>
                      <input 
                        type="date" 
                        value={startDate}
                        onChange={e => setStartDate(e.target.value)}
                        className="w-full bg-[#1A1A1A] border border-white/10 rounded-xl py-3 pl-10 pr-4 text-white focus:outline-none focus:border-orange-500 transition-colors"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm text-neutral-400 mb-2">Tanggal Akhir (End Date)</label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <Calendar className="h-4 w-4 text-neutral-500" />
                      </div>
                      <input 
                        type="date" 
                        value={endDate}
                        onChange={e => setEndDate(e.target.value)}
                        className="w-full bg-[#1A1A1A] border border-white/10 rounded-xl py-3 pl-10 pr-4 text-white focus:outline-none focus:border-orange-500 transition-colors"
                      />
                    </div>
                  </div>
                </div>

                <button 
                  onClick={handleGenerate}
                  className="w-full bg-orange-500 hover:bg-orange-600 text-white py-3 rounded-xl font-bold flex items-center justify-center gap-2 transition-colors"
                >
                  Generate Laporan PDF
                </button>
              </div>
            )}

            {(modalState === "GENERATING" || modalState === "DONE") && (
              <>
                <div className="absolute top-0 left-0 w-full h-1 bg-white/5">
                  <motion.div 
                    className="h-full bg-orange-500"
                    initial={{ width: 0 }}
                    animate={{ width: `${progress}%` }}
                    transition={{ ease: "linear" }}
                  />
                </div>
                
                <div className="flex flex-col items-center text-center mt-4">
                  <div className="w-16 h-16 rounded-full bg-orange-500/10 flex items-center justify-center mb-6 relative">
                    {modalState === "DONE" ? (
                      <CheckCircle2 className="w-8 h-8 text-orange-500" />
                    ) : (
                      <Loader2 className="w-8 h-8 text-orange-500 animate-spin" />
                    )}
                  </div>
                  
                  <h2 className="text-2xl font-black text-white tracking-tight mb-2">
                    {modalState === "DONE" ? "Report Ready!" : "Generating Report"}
                  </h2>
                  
                  <p className="text-neutral-400 font-medium h-6 mb-2">
                    {step}
                  </p>

                  {modalState === "DONE" && (
                    <button 
                      onClick={onClose}
                      className="mt-6 w-full bg-orange-500 hover:bg-orange-600 text-white py-3 rounded-xl font-bold flex items-center justify-center gap-2 transition-colors"
                    >
                      <Download className="w-4 h-4" /> Selesai
                    </button>
                  )}
                </div>
              </>
            )}
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );

  if (typeof document !== "undefined") {
    return createPortal(modalContent, document.body);
  }
  return null;
};
