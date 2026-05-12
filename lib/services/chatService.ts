import { mockChatMessages } from "@/lib/data/chatMessages";
import { ChatMessage, ChatGroup, ServiceResponse } from "@/lib/types";
import { sleep } from "@/lib/services/serviceUtils";
import { apiClient } from "@/lib/services/apiClient";

export const chatService = {
  async getChatGroups(token?: string): Promise<ServiceResponse<ChatGroup[]>> {
    try {
      const data = token
        ? await apiClient.authenticatedRequest<ChatGroup[]>('/chatgroups', token)
        : await apiClient.request<ChatGroup[]>('/chatgroups');

      return { data };
    } catch (err: any) {
      return { data: [], message: err?.message ?? 'Failed to load chat groups' };
    }
  },
  async getTripMessages(tripId: string): Promise<ServiceResponse<ChatMessage[]>> {
    await sleep(300);
    return { data: mockChatMessages.filter((message) => message.tripId === tripId) };
  },

  async sendMessage(payload: Omit<ChatMessage, "id" | "createdAt">): Promise<ServiceResponse<ChatMessage>> {
    await sleep(200);
    return {
      data: {
        ...payload,
        id: `m-${Date.now()}`,
        createdAt: new Date().toISOString(),
      },
      message: "Message sent",
    };
  },
};
