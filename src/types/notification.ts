/**
 * Enterprise Notification Center Types (`notification.ts`).
 * Adheres to strict categorization, auditability, and priority tagging across MES & ERP.
 */

export type NotificationCategory = "Production" | "Inventory" | "Shift" | "Sales" | "System";
export type NotificationPriority = "URGENT" | "WARNING" | "INFO" | "RECOMMENDATION";

export interface EnterpriseNotificationItem {
  id: string;
  category: NotificationCategory;
  priority: NotificationPriority;
  title: string;
  message: string;
  timestamp: string;
  read: boolean;
  actionUrl?: string;
  actionText?: string;
}
