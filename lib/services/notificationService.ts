import { mockNotifications } from "@/lib/data/notifications";
import { apiClient } from "@/lib/services/apiClient";
import { userSessionService } from "@/lib/services/userSessionService";
import { Notification, ServiceResponse } from "@/lib/types";
import { sleep } from "@/lib/services/serviceUtils";

const NOTIFICATION_CHANGE_EVENT = "tripwaver:notifications-changed";

let cachedMockNotifications = mockNotifications.map((notification) => ({ ...notification }));

type LocalNotificationInput = Omit<Notification, "id" | "createdAt"> & {
  createdAt?: string;
};

const sortNotifications = (notifications: Notification[]) => {
  return [...notifications].sort((left, right) => right.createdAt.localeCompare(left.createdAt));
};

const getMockNotificationsForUser = (userId?: string) => {
  return cachedMockNotifications.filter((item) => !userId || item.userId === userId);
};

const mergeNotifications = (remoteNotifications: Notification[], userId?: string) => {
  const merged = new Map<string, Notification>();

  for (const notification of remoteNotifications) {
    merged.set(notification.id, notification);
  }

  for (const notification of getMockNotificationsForUser(userId)) {
    if (!merged.has(notification.id)) {
      merged.set(notification.id, notification);
    }
  }

  return sortNotifications([...merged.values()]);
};

const markMockNotificationAsRead = (id: string) => {
  let updated = false;

  cachedMockNotifications = cachedMockNotifications.map((notification) =>
    notification.id === id ? ((updated = true), { ...notification, read: true }) : notification,
  );

  return updated;
};

const queueMockNotification = (payload: LocalNotificationInput) => {
  const existingNotification = cachedMockNotifications.find(
    (notification) =>
      notification.userId === payload.userId &&
      notification.tripId === payload.tripId &&
      notification.type === payload.type &&
      notification.title === payload.title,
  );

  if (existingNotification) {
    return existingNotification;
  }

  const notification: Notification = {
    ...payload,
    id: `local-notification-${Date.now()}-${cachedMockNotifications.length + 1}`,
    createdAt: payload.createdAt ?? new Date().toISOString(),
  };

  cachedMockNotifications = [notification, ...cachedMockNotifications];
  notifyNotificationChange();
  return notification;
};

const notifyNotificationChange = () => {
  if (typeof window === "undefined") return;

  window.dispatchEvent(new Event(NOTIFICATION_CHANGE_EVENT));
};

const getResolvedNotifications = async (userId?: string) => {
  const token = userSessionService.getToken();

  if (token) {
    try {
      const response = await apiClient.authenticatedRequest<Notification[] | ServiceResponse<Notification[]>>("/notifications/me", token, {
        method: "GET",
      });

      if (response && typeof response === "object" && "data" in response) {
        return mergeNotifications(response.data ?? [], userId);
      }

      return mergeNotifications((response as Notification[]) ?? [], userId);
    } catch {
      return sortNotifications(getMockNotificationsForUser(userId));
    }
  }

  await sleep(250);
  return sortNotifications(getMockNotificationsForUser(userId));
};

export const notificationService = {
  async getNotifications(userId?: string): Promise<ServiceResponse<Notification[]>> {
    return { data: await getResolvedNotifications(userId) };
  },

  async getUnreadCount(userId?: string): Promise<ServiceResponse<number>> {
    const notifications = await getResolvedNotifications(userId);
    return {
      data: notifications.filter((item) => !item.read).length,
    };
  },

  async markAsRead(id: string): Promise<ServiceResponse<boolean>> {
    const token = userSessionService.getToken();

    if (markMockNotificationAsRead(id)) {
      notifyNotificationChange();
      return { data: true, message: `Notification ${id} marked as read` };
    }

    if (token) {
      await apiClient.authenticatedRequest<Notification>(`/notifications/${id}/read`, token, {
        method: "PATCH",
      });

      notifyNotificationChange();
      return { data: true, message: `Notification ${id} marked as read` };
    }

    await sleep(150);
    notifyNotificationChange();
    return { data: true, message: `Notification ${id} marked as read` };
  },

  queueMockNotification,
};
