import { mockNotifications } from "@/lib/data/notifications";
import { apiClient } from "@/lib/services/apiClient";
import { userSessionService } from "@/lib/services/userSessionService";
import { Notification, ServiceResponse } from "@/lib/types";
import { sleep } from "@/lib/services/serviceUtils";

const NOTIFICATION_CHANGE_EVENT = "tripwaver:notifications-changed";

let cachedMockNotifications = mockNotifications.map((notification) => ({ ...notification }));

const getMockNotificationsForUser = (userId?: string) => {
  return cachedMockNotifications.filter((item) => !userId || item.userId === userId);
};

const markMockNotificationAsRead = (id: string) => {
  cachedMockNotifications = cachedMockNotifications.map((notification) =>
    notification.id === id ? { ...notification, read: true } : notification,
  );
};

const notifyNotificationChange = () => {
  if (typeof window === "undefined") return;

  window.dispatchEvent(new Event(NOTIFICATION_CHANGE_EVENT));
};

export const notificationService = {
  async getNotifications(userId?: string): Promise<ServiceResponse<Notification[]>> {
    const token = userSessionService.getToken();

    if (token) {
      const response = await apiClient.authenticatedRequest<Notification[] | ServiceResponse<Notification[]>>("/notifications/me", token, {
        method: "GET",
      });

      if (response && typeof response === "object" && "data" in response) {
        return response as ServiceResponse<Notification[]>;
      }

      return { data: response as Notification[] };
    }

    await sleep(250);
    return { data: getMockNotificationsForUser(userId) };
  },

  async getUnreadCount(userId?: string): Promise<ServiceResponse<number>> {
    const token = userSessionService.getToken();

    if (token) {
      const response = await apiClient.authenticatedRequest<{ count: number }>("/notifications/me/unread-count", token, {
        method: "GET",
      });

      return { data: response.count ?? 0 };
    }

    await sleep(150);
    return {
      data: getMockNotificationsForUser(userId).filter((item) => !item.read).length,
    };
  },

  async markAsRead(id: string): Promise<ServiceResponse<boolean>> {
    const token = userSessionService.getToken();

    if (token) {
      await apiClient.authenticatedRequest<Notification>(`/notifications/${id}/read`, token, {
        method: "PATCH",
      });

      notifyNotificationChange();
      return { data: true, message: `Notification ${id} marked as read` };
    }

    await sleep(150);
    markMockNotificationAsRead(id);
    notifyNotificationChange();
    return { data: true, message: `Notification ${id} marked as read` };
  },
};
