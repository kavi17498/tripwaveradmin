import { apiClient } from "@/lib/services/apiClient";
import { AdminUserRecord, ServiceResponse, UserModulePayload } from "@/lib/types";

export type UserProfileRecord = AdminUserRecord;

export type UpdateUserProfilePayload = Partial<Omit<AdminUserRecord, "id" | "email" | "createdAt" | "isVerified">>;

export const userService = {
  async createUserProfile(payload: UserModulePayload, token: string): Promise<ServiceResponse<UserModulePayload>> {
    const response = await apiClient.authenticatedRequest<UserModulePayload | ServiceResponse<UserModulePayload>>("/users", token, {
      method: "POST",
      body: payload,
    });

    if (response && typeof response === "object" && "data" in response) {
      return response as ServiceResponse<UserModulePayload>;
    }

    return {
      data: response as UserModulePayload,
      message: "User profile created successfully",
    };
  },

  async getUserProfileById(userId: string, token: string): Promise<ServiceResponse<UserProfileRecord>> {
    const response = await apiClient.authenticatedRequest<UserProfileRecord | ServiceResponse<UserProfileRecord>>(
      `/users/${userId}`,
      token,
      {
        method: "GET",
      },
    );

    if (response && typeof response === "object" && "data" in response) {
      return response as ServiceResponse<UserProfileRecord>;
    }

    return {
      data: response as UserProfileRecord,
      message: "User profile fetched successfully",
    };
  },

  async updateUserProfile(
    userId: string,
    payload: UpdateUserProfilePayload,
    token: string,
  ): Promise<ServiceResponse<UserProfileRecord>> {
    const response = await apiClient.authenticatedRequest<UserProfileRecord | ServiceResponse<UserProfileRecord>>(
      `/users/${userId}`,
      token,
      {
        method: "PUT",
        body: payload,
      },
    );

    if (response && typeof response === "object" && "data" in response) {
      return response as ServiceResponse<UserProfileRecord>;
    }

    return {
      data: response as UserProfileRecord,
      message: "User profile updated successfully",
    };
  },

  async getOrganizerProfile(organizerId: string): Promise<ServiceResponse<any>> {
    const response = await apiClient.request<any | ServiceResponse<any>>(`/users/organizer/${organizerId}`, {
      method: "GET",
    });

    if (response && typeof response === "object" && "data" in response) {
      return response as ServiceResponse<any>;
    }

    return {
      data: response,
      message: "Organizer profile fetched successfully",
    };
  },
};
