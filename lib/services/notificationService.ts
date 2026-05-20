import { mockNotifications } from "@/lib/data/notifications";
import { apiClient } from "@/lib/services/apiClient";
import { userSessionService } from "@/lib/services/userSessionService";
import { Notification, ServiceResponse } from "@/lib/types";
import { sleep } from "@/lib/services/serviceUtils";

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
    return { data: mockNotifications.filter((item) => !userId || item.userId === userId) };
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
      data: mockNotifications.filter((item) => (!userId || item.userId === userId) && !item.read).length,
    };
  },

  async markAsRead(id: string): Promise<ServiceResponse<boolean>> {
    const token = userSessionService.getToken();

    if (token) {
      await apiClient.authenticatedRequest<Notification>(`/notifications/${id}/read`, token, {
        method: "PATCH",
      });

      return { data: true, message: `Notification ${id} marked as read` };
    }

    await sleep(150);
    return { data: true, message: `Notification ${id} marked as read` };
  },
};
