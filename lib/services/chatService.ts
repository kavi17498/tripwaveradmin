import { ChatMessage, ChatGroup, ServiceResponse } from "@/lib/types";
import { apiClient } from "@/lib/services/apiClient";
import { TripApiItem } from "@/lib/services/tripApiService";
import { UserProfileRecord } from "@/lib/services/userService";

export type TripChatParticipant = {
  participant: {
    participantId?: string;
    parentUserId?: string | null;
    name: string;
    gender: string;
    age: number;
    address?: string;
    phone?: string;
    email?: string;
  };
  profile: UserProfileRecord | null;
};

export type TripChatContext = {
  chatGroup: ChatGroup;
  trip: TripApiItem;
  organizer: UserProfileRecord;
  participants: TripChatParticipant[];
};

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

  async getTripChatContext(tripId: string, token?: string): Promise<ServiceResponse<TripChatContext>> {
    const data = token
      ? await apiClient.authenticatedRequest<TripChatContext>(`/chatgroups/trip/${tripId}/context`, token)
      : await apiClient.request<TripChatContext>(`/chatgroups/trip/${tripId}/context`);

    return { data };
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

  async markGroupRead(chatGroupId: string, token?: string): Promise<ServiceResponse<boolean>> {
    try {
      const res = token
        ? await apiClient.authenticatedRequest<boolean | ServiceResponse<boolean>>(`/chatgroups/${chatGroupId}/mark-read`, token, { method: 'POST' })
        : await apiClient.request<boolean | ServiceResponse<boolean>>(`/chatgroups/${chatGroupId}/mark-read`, { method: 'POST' });

      if (res && typeof res === 'object' && 'data' in res) return res as ServiceResponse<boolean>;
      return { data: (res as boolean) ?? true };
    } catch (err: any) {
      return { data: false, message: err?.message ?? 'Failed to mark group read' };
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

  async createChatGroup(
    payload: {
      tripId: string;
      name: string;
      adminId: string;
      adminName: string;
      description?: string;
      members?: string[];
    },
    token: string
  ): Promise<ServiceResponse<ChatGroup>> {
    const response = await apiClient.authenticatedRequest<ChatGroup | ServiceResponse<ChatGroup>>(
      "/chatgroups",
      token,
      {
        method: "POST",
        body: payload,
      }
    );

    if (response && typeof response === "object" && "data" in response) {
      return response as ServiceResponse<ChatGroup>;
    }

    return { data: response as ChatGroup, message: "Chat group created" };
  },

  async requestCustomTrip(
    payload: {
      guideId: string;
      travelerId: string;
      travelerName: string;
    },
    token: string
  ): Promise<ServiceResponse<ChatGroup>> {
    const response = await apiClient.authenticatedRequest<ChatGroup | ServiceResponse<ChatGroup>>(
      "/chatgroups/custom-request",
      token,
      {
        method: "POST",
        body: payload,
      }
    );

    if (response && typeof response === "object" && "data" in response) {
      return response as ServiceResponse<ChatGroup>;
    }

    return { data: response as ChatGroup, message: "Custom trip request sent successfully" };
  },
};
