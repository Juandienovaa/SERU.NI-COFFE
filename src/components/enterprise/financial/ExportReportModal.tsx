import React, { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { motion, AnimatePresence } from "framer-motion";
import { FileText, Loader2, CheckCircle2, Download, X } from "lucide-react";
import { reportDataService } from "@/services/reportDataService";
import { pdfExecutiveGenerator } from "@/services/pdfExecutiveGenerator";

interface ExportReportModalProps {
  isOpen: boolean;
  onClose: () => void;
  period: string;
}

export const ExportReportModal: React.FC<ExportReportModalProps> = ({ isOpen, onClose, period }) => {
  const [step, setStep] = useState<string>("Initializing...");
  const [progress, setProgress] = useState<number>(0);
  const [isDone, setIsDone] = useState(false);

  useEffect(() => {
    if (!isOpen) {
      setStep("Initializing...");
      setProgress(0);
      setIsDone(false);
      return;
    }

    const generate = async () => {
      try {
        setStep("Collecting Financial Data...");
        setProgress(5);
        // We pretend to be a specific manager for the signature
        const data = await reportDataService.fetchReportData(period, "System Administrator");
        
        setProgress(30);
        
        const doc = await pdfExecutiveGenerator.generateExecutiveReport(data, (currentStep, currentProgress) => {
          setStep(currentStep);
          // Scale progress from 30 to 100 based on PDF generator progress
          setProgress(30 + (currentProgress * 0.7));
        });

        doc.save(`Laporan-Eksekutif-Seruni-${period}.pdf`);

        setIsDone(true);
      } catch (e) {
        console.error(e);
        setStep("Failed to generate report.");
      }
    };

    generate();
  }, [isOpen, period]);

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
            {/* Close Button */}
            <button 
              onClick={onClose}
              className="absolute top-4 right-4 text-neutral-500 hover:text-white transition-colors"
            >
              <X className="w-5 h-5" />
            </button>

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
                {isDone ? (
                  <CheckCircle2 className="w-8 h-8 text-orange-500" />
                ) : (
                  <Loader2 className="w-8 h-8 text-orange-500 animate-spin" />
                )}
              </div>
              
              <h2 className="text-2xl font-black text-white tracking-tight mb-2">
                {isDone ? "Report Ready!" : "Generating Report"}
              </h2>
              
              <p className="text-neutral-400 font-medium h-6 mb-2">
                {step}
              </p>

              {isDone && (
                <button 
                  onClick={onClose}
                  className="mt-6 w-full bg-orange-500 hover:bg-orange-600 text-white py-3 rounded-xl font-bold flex items-center justify-center gap-2 transition-colors"
                >
                  <Download className="w-4 h-4" /> Selesai
                </button>
              )}
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );

  // Use Portal to escape any parent transform contexts that break fixed positioning
  if (typeof document !== "undefined") {
    return createPortal(modalContent, document.body);
  }
  return null;
};
