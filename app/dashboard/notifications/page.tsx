"use client";

import { useEffect, useMemo, useState } from "react";
import { PageHeader } from "@/components/common/page-header";
import { Button } from "@/components/ui/button";
import { NotificationItem } from "@/components/notifications/notification-item";
import { notificationService } from "@/lib/services/notificationService";
import { Notification } from "@/lib/types";
import { useAuthCacheStore } from "@/lib/stores/useAuthCacheStore";
import { userSessionService } from "@/lib/services/userSessionService";

type Tab = "all" | "unread" | "payment";

export default function NotificationsPage() {
  const [tab, setTab] = useState<Tab>("all");
  const [items, setItems] = useState<Notification[]>([]);
  const currentUser = useAuthCacheStore((state) => state.currentUser);

  useEffect(() => {
    let mounted = true;

    const load = async () => {
      const token = userSessionService.getToken();
      if (!token && !currentUser) {
        setItems([]);
        return;
      }

      const result = await notificationService.getNotifications(currentUser?.id);
      if (mounted) setItems(result.data);
    };

    void load();
    const intervalId = window.setInterval(() => {
      void load();
    }, 30000);

    return () => {
      mounted = false;
      window.clearInterval(intervalId);
    };
  }, [currentUser]);

  const filteredItems = useMemo(() => {
    if (tab === "unread") return items.filter((item) => !item.read);
    if (tab === "payment") return items.filter((item) => item.type === "payment");
    return items;
  }, [items, tab]);

  const markItemAsRead = async (item: Notification) => {
    if (item.read) return;

    await notificationService.markAsRead(item.id);
    setItems((currentItems) => currentItems.map((currentItem) => (currentItem.id === item.id ? { ...currentItem, read: true } : currentItem)));
  };

  return (
    <div className="space-y-6">
      <PageHeader title="Notifications" description="Track trip updates, reminders, and account alerts." />
      <div className="flex gap-2">
        <Button variant={tab === "all" ? "default" : "outline"} onClick={() => setTab("all")}>All</Button>
        <Button variant={tab === "unread" ? "default" : "outline"} onClick={() => setTab("unread")}>Unread</Button>
        <Button variant={tab === "payment" ? "default" : "outline"} onClick={() => setTab("payment")}>Payments</Button>
      </div>
      <div className="space-y-2">
        {filteredItems.map((item) => (
          <NotificationItem key={item.id} item={item} onClick={markItemAsRead} />
        ))}
      </div>
    </div>
  );
}
