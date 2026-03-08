import { mockNotifications } from "@/lib/data/notifications";
import { Notification, ServiceResponse } from "@/lib/types";
import { sleep } from "@/lib/services/serviceUtils";

export const notificationService = {
  async getNotifications(userId: string): Promise<ServiceResponse<Notification[]>> {
    await sleep(450);
    return { data: mockNotifications.filter((item) => item.userId === userId) };
  },

  async markAsRead(id: string): Promise<ServiceResponse<boolean>> {
    await sleep(200);
    return { data: true, message: `Notification ${id} marked as read` };
  },
};
