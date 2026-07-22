import { EnterpriseNotificationItem } from "@/types/notification";

const NOTIFICATION_STORAGE_KEY = "enterprise_mes_notifications_v1";

const DEFAULT_NOTIFICATIONS: EnterpriseNotificationItem[] = [
  {
    id: "notif-inv-1",
    category: "Inventory",
    priority: "WARNING",
    title: "Stok Bahan Baku Menipis",
    message: "Apple Americano inventory is running low (Sisa: 12 Cup). Disarankan restock segera.",
    timestamp: new Date(Date.now() - 1000 * 60 * 15).toISOString(), // 15 mins ago
    read: false,
    actionUrl: "/pekerja",
    actionText: "Cek Inventaris"
  },
  {
    id: "notif-prd-1",
    category: "Production",
    priority: "INFO",
    title: "Konversi Batch Selesai",
    message: "Batch PRD-20260717 completed successfully dengan akuntansi presisi 0 selisih.",
    timestamp: new Date(Date.now() - 1000 * 60 * 45).toISOString(), // 45 mins ago
    read: false,
    actionUrl: "/pekerja/produksi",
    actionText: "Lihat Batch"
  },
  {
    id: "notif-shf-1",
    category: "Shift",
    priority: "INFO",
    title: "Pencapaian Milestone Shift",
    message: "Aldi achieved the 100 Cup Bonus pada shift pagi hari ini. Kinerja luar biasa!",
    timestamp: new Date(Date.now() - 1000 * 60 * 120).toISOString(), // 2 hours ago
    read: true
  },
  {
    id: "notif-inv-2",
    category: "Inventory",
    priority: "URGENT",
    title: "Menu Kehabisan Stok (Out of Stock)",
    message: "Matcha Cream Latte is now Out of Stock. Kasir POS telah menonaktifkan pesanan sementara.",
    timestamp: new Date(Date.now() - 1000 * 60 * 180).toISOString(), // 3 hours ago
    read: false,
    actionUrl: "/pekerja/produksi",
    actionText: "Racik Batch Baru"
  },
  {
    id: "notif-sys-1",
    category: "System",
    priority: "INFO",
    title: "Audit Penyesuaian Manajer",
    message: "Inventory adjusted by Manager untuk penyesuaian selisih fisik opname.",
    timestamp: new Date(Date.now() - 1000 * 60 * 240).toISOString(), // 4 hours ago
    read: true
  },
  {
    id: "notif-prd-2",
    category: "Production",
    priority: "RECOMMENDATION",
    title: "Rekomendasi Produksi AI",
    message: "New production recommended: +50 Apple Americano berdasarkan tren penjualan jam sibuk.",
    timestamp: new Date(Date.now() - 1000 * 60 * 300).toISOString(), // 5 hours ago
    read: false,
    actionUrl: "/pekerja/produksi",
    actionText: "Buat Batch +50"
  }
];

export async function fetchEnterpriseNotifications(): Promise<EnterpriseNotificationItem[]> {
  if (typeof window === "undefined") return DEFAULT_NOTIFICATIONS;

  try {
    const raw = localStorage.getItem(NOTIFICATION_STORAGE_KEY);
    if (raw) {
      return JSON.parse(raw) as EnterpriseNotificationItem[];
    }
    localStorage.setItem(NOTIFICATION_STORAGE_KEY, JSON.stringify(DEFAULT_NOTIFICATIONS));
    return DEFAULT_NOTIFICATIONS;
  } catch (e) {
    return DEFAULT_NOTIFICATIONS;
  }
}

export async function saveEnterpriseNotifications(items: EnterpriseNotificationItem[]): Promise<void> {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(NOTIFICATION_STORAGE_KEY, JSON.stringify(items));
  } catch (e) {
    console.warn("Could not save notifications:", e);
  }
}
