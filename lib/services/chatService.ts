import { ChatMessage, ChatGroup, ServiceResponse } from "@/lib/types";
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
  async getTripChatGroup(tripId: string, token?: string): Promise<ServiceResponse<ChatGroup | null>> {
    try {
      const data = token
        ? await apiClient.authenticatedRequest<ChatGroup[] | ChatGroup>(`/chatgroups/trip/${tripId}`, token)
        : await apiClient.request<ChatGroup[] | ChatGroup>(`/chatgroups/trip/${tripId}`);

      if (Array.isArray(data)) {
        return { data: data[0] ?? null };
      }

      return { data: data ?? null };
    } catch (err: any) {
      return { data: null, message: err?.message ?? 'Failed to load chat group' };
    }
  },

  async getMessages(chatGroupId: string, token?: string): Promise<ServiceResponse<ChatMessage[]>> {
    try {
      const data = token
        ? await apiClient.authenticatedRequest<ChatMessage[]>(`/chatgroups/${chatGroupId}/messages`, token)
        : await apiClient.request<ChatMessage[]>(`/chatgroups/${chatGroupId}/messages`);

      return { data };
    } catch (err: any) {
      return { data: [], message: err?.message ?? 'Failed to load chat messages' };
    }
  },

  async sendMessage(
    chatGroupId: string,
    payload: Omit<ChatMessage, "id" | "createdAt" | "chatGroupId">,
    token?: string,
  ): Promise<ServiceResponse<ChatMessage>> {
    const response = token
      ? await apiClient.authenticatedRequest<ChatMessage | ServiceResponse<ChatMessage>>(
          `/chatgroups/${chatGroupId}/messages`,
          token,
          { method: "POST", body: payload },
        )
      : await apiClient.request<ChatMessage | ServiceResponse<ChatMessage>>(`/chatgroups/${chatGroupId}/messages`, {
          method: "POST",
          body: payload,
        });

    if (response && typeof response === "object" && "data" in response) {
      return response as ServiceResponse<ChatMessage>;
    }

    return { data: response as ChatMessage, message: "Message sent" };
  },
};
