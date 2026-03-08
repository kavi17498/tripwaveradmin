import { mockChatMessages } from "@/lib/data/chatMessages";
import { ChatMessage, ServiceResponse } from "@/lib/types";
import { sleep } from "@/lib/services/serviceUtils";

export const chatService = {
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
