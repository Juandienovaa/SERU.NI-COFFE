"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { EnterpriseNotificationItem, NotificationCategory } from "@/types/notification";
import { fetchEnterpriseNotifications, saveEnterpriseNotifications } from "@/services/notificationService";

export function useNotifications() {
  const [notifications, setNotifications] = useState<EnterpriseNotificationItem[]>([]);
  const [activeCategory, setActiveCategory] = useState<NotificationCategory | "All">("All");
  const [loading, setLoading] = useState<boolean>(true);

  const loadData = useCallback(async () => {
    setLoading(true);
    const data = await fetchEnterpriseNotifications();
    setNotifications(data);
    setLoading(false);
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const unreadCount = useMemo(() => {
    return notifications.filter((item) => !item.read).length;
  }, [notifications]);

  const filteredNotifications = useMemo(() => {
    if (activeCategory === "All") return notifications;
    return notifications.filter((item) => item.category === activeCategory);
  }, [notifications, activeCategory]);

  const markAsRead = useCallback(async (id: string) => {
    setNotifications((prev) => {
      const next = prev.map((item) => (item.id === id ? { ...item, read: true } : item));
      saveEnterpriseNotifications(next);
      return next;
    });
  }, []);

  const markAllAsRead = useCallback(async () => {
    setNotifications((prev) => {
      const next = prev.map((item) => ({ ...item, read: true }));
      saveEnterpriseNotifications(next);
      return next;
    });
  }, []);

  const clearAll = useCallback(async () => {
    setNotifications([]);
    await saveEnterpriseNotifications([]);
  }, []);

  return {
    notifications,
    filteredNotifications,
    unreadCount,
    activeCategory,
    setActiveCategory,
    loading,
    markAsRead,
    markAllAsRead,
    clearAll,
    refresh: loadData
  };
}
