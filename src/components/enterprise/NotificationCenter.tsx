"use client";

import React from "react";
import { motion, AnimatePresence } from "motion/react";
import Link from "next/link";
import {
  EnterpriseNotificationItem,
  NotificationCategory,
  NotificationPriority
} from "@/types/notification";
import {
  Bell,
  X,
  CheckCheck,
  Trash2,
  Factory,
  Boxes,
  CircleAlert,
  CircleCheck,
  CircleX,
  Sparkles,
  ArrowRight
} from "lucide-react";

interface NotificationCenterProps {
  isOpen: boolean;
  onClose: () => void;
  notifications: EnterpriseNotificationItem[];
  filteredNotifications: EnterpriseNotificationItem[];
  unreadCount: number;
  activeCategory: NotificationCategory | "All";
  onSelectCategory: (category: NotificationCategory | "All") => void;
  onMarkAsRead: (id: string) => void;
  onMarkAllAsRead: () => void;
  onClearAll: () => void;
}

export const NotificationCenter: React.FC<NotificationCenterProps> = ({
  isOpen,
  onClose,
  notifications,
  filteredNotifications,
  unreadCount,
  activeCategory,
  onSelectCategory,
  onMarkAsRead,
  onMarkAllAsRead,
  onClearAll
}) => {
  const categories: (NotificationCategory | "All")[] = [
    "All",
    "Production",
    "Inventory",
    "Shift",
    "Sales",
    "System"
  ];

  const renderIcon = (item: EnterpriseNotificationItem) => {
    switch (item.category) {
      case "Production":
        return <Factory className="w-5 h-5 text-[#F97316]" />;
      case "Inventory":
        return item.priority === "URGENT" ? (
          <CircleX className="w-5 h-5 text-rose-400" />
        ) : (
          <CircleAlert className="w-5 h-5 text-amber-400" />
        );
      case "Shift":
        return <Sparkles className="w-5 h-5 text-sky-400" />;
      case "System":
        return <CircleCheck className="w-5 h-5 text-emerald-400" />;
      default:
        return <Boxes className="w-5 h-5 text-neutral-400" />;
    }
  };

  const renderPriorityBadge = (priority: NotificationPriority) => {
    switch (priority) {
      case "URGENT":
        return (
          <span className="px-2 py-0.5 rounded-full bg-rose-500/15 border border-rose-500/30 text-[10px] font-extrabold text-rose-400 tracking-wider">
            URGENT
          </span>
        );
      case "WARNING":
        return (
          <span className="px-2 py-0.5 rounded-full bg-amber-500/15 border border-amber-500/30 text-[10px] font-extrabold text-amber-400 tracking-wider">
            WARNING
          </span>
        );
      case "RECOMMENDATION":
        return (
          <span className="px-2 py-0.5 rounded-full bg-[#F97316]/15 border border-[#F97316]/30 text-[10px] font-extrabold text-[#F97316] tracking-wider">
            AI RECOMMENDATION
          </span>
        );
      default:
        return (
          <span className="px-2 py-0.5 rounded-full bg-sky-500/15 border border-sky-500/30 text-[10px] font-extrabold text-sky-400 tracking-wider">
            INFO
          </span>
        );
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 z-50 bg-black/70 backdrop-blur-md"
          />

          {/* Slide-Over Drawer */}
          <motion.aside
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ type: "spring", stiffness: 350, damping: 30 }}
            className="fixed top-0 right-0 z-50 h-full w-full max-w-lg bg-[#111113]/95 border-l border-white/[0.08] shadow-2xl backdrop-blur-2xl flex flex-col justify-between"
          >
            {/* Header */}
            <div className="p-6 sm:p-7 border-b border-white/[0.08]">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-2xl bg-[#F97316]/15 border border-[#F97316]/30 flex items-center justify-center text-[#F97316]">
                    <Bell className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-lg font-black text-white tracking-tight">
                      Notification Center
                    </h3>
                    <p className="text-xs text-neutral-400 font-medium mt-0.5">
                      {unreadCount > 0 ? `${unreadCount} pemberitahuan belum dibaca` : "Semua bersih"}
                    </p>
                  </div>
                </div>

                <button
                  onClick={onClose}
                  className="p-2 rounded-2xl bg-white/5 hover:bg-white/10 text-neutral-400 hover:text-white transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Action Bar */}
              <div className="flex items-center justify-between gap-2 pt-2">
                <button
                  onClick={onMarkAllAsRead}
                  disabled={unreadCount === 0}
                  className="flex items-center gap-1.5 text-xs font-bold text-neutral-300 hover:text-white disabled:opacity-30 transition-colors"
                >
                  <CheckCheck className="w-4 h-4 text-emerald-400" />
                  <span>Tandai Semua Dibaca</span>
                </button>

                <button
                  onClick={onClearAll}
                  disabled={notifications.length === 0}
                  className="flex items-center gap-1.5 text-xs font-bold text-rose-400 hover:text-rose-300 disabled:opacity-30 transition-colors"
                >
                  <Trash2 className="w-4 h-4" />
                  <span>Bersihkan Semua</span>
                </button>
              </div>

              {/* Category Tabs */}
              <div className="flex items-center gap-1.5 overflow-x-auto pt-5 pb-1 no-scrollbar">
                {categories.map((cat) => {
                  const count =
                    cat === "All"
                      ? notifications.length
                      : notifications.filter((i) => i.category === cat).length;
                  return (
                    <button
                      key={cat}
                      onClick={() => onSelectCategory(cat)}
                      className={`px-3.5 py-2 rounded-2xl text-xs font-extrabold whitespace-nowrap transition-all flex items-center gap-1.5 ${
                        activeCategory === cat
                          ? "bg-white text-black font-black shadow-md"
                          : "bg-white/[0.04] hover:bg-white/[0.08] text-neutral-400 hover:text-white border border-white/[0.06]"
                      }`}
                    >
                      <span>{cat}</span>
                      <span
                        className={`px-1.5 py-0.5 rounded-full text-[10px] font-mono ${
                          activeCategory === cat
                            ? "bg-black/15 text-black"
                            : "bg-white/10 text-neutral-400"
                        }`}
                      >
                        {count}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Notification List Body */}
            <div className="flex-1 overflow-y-auto p-6 sm:p-7 space-y-4">
              {filteredNotifications.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-center py-16">
                  <div className="w-16 h-16 rounded-3xl bg-neutral-900 border border-white/[0.08] flex items-center justify-center text-neutral-600 mb-4 shadow-xl">
                    <Bell className="w-7 h-7" />
                  </div>
                  <h4 className="text-base font-bold text-white">Tidak Ada Pemberitahuan</h4>
                  <p className="text-xs text-neutral-400 font-light max-w-xs mt-1 leading-relaxed">
                    Kategori {activeCategory === "All" ? "semua" : activeCategory} saat ini kosong atau telah dibersihkan.
                  </p>
                </div>
              ) : (
                filteredNotifications.map((item) => (
                  <motion.div
                    key={item.id}
                    layout
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    onClick={() => !item.read && onMarkAsRead(item.id)}
                    className={`p-5 rounded-3xl border transition-all cursor-pointer relative overflow-hidden ${
                      item.read
                        ? "bg-[#18181B]/60 border-white/[0.04] opacity-75"
                        : "bg-[#18181B] border-white/[0.12] hover:border-white/[0.22] shadow-xl"
                    }`}
                  >
                    {!item.read && (
                      <span className="absolute top-5 right-5 w-2 h-2 rounded-full bg-[#F97316] animate-pulse" />
                    )}

                    <div className="flex items-start gap-4">
                      <div className="w-11 h-11 rounded-2xl bg-black/60 border border-white/10 flex items-center justify-center shrink-0">
                        {renderIcon(item)}
                      </div>

                      <div className="flex-1 min-w-0 pr-4">
                        <div className="flex items-center gap-2 mb-1">
                          {renderPriorityBadge(item.priority)}
                          <span className="text-[10px] font-mono text-neutral-500">
                            {new Date(item.timestamp).toLocaleTimeString("id-ID", {
                              hour: "2-digit",
                              minute: "2-digit"
                            })}{" "}
                            WIB
                          </span>
                        </div>

                        <h4 className="text-sm font-bold text-white leading-tight">
                          {item.title}
                        </h4>
                        <p className="text-xs text-neutral-300 font-light mt-1 leading-relaxed">
                          {item.message}
                        </p>

                        {item.actionUrl && item.actionText && (
                          <div className="mt-3">
                            <Link
                              href={item.actionUrl}
                              onClick={() => {
                                onMarkAsRead(item.id);
                                onClose();
                              }}
                              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/[0.06] hover:bg-white/[0.12] text-xs font-bold text-white border border-white/[0.08] transition-all"
                            >
                              <span>{item.actionText}</span>
                              <ArrowRight className="w-3.5 h-3.5 text-[#F97316]" />
                            </Link>
                          </div>
                        )}
                      </div>
                    </div>
                  </motion.div>
                ))
              )}
            </div>

            {/* Sticky Footer */}
            <div className="p-5 border-t border-white/[0.08] bg-[#111113]/80 flex items-center justify-between text-[11px] font-mono text-neutral-500">
              <span>MES Realtime Audit • Active</span>
              <span className="flex items-center gap-1.5 text-emerald-400">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                Connected to Supabase
              </span>
            </div>
          </motion.aside>
        </>
      )}
    </AnimatePresence>
  );
};
