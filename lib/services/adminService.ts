import { onAuthStateChanged } from "firebase/auth";

import { auth } from "@/lib/config/firebase";
import { apiClient } from "@/lib/services/apiClient";
import {
  AdminOnDemandTripRecord,
  AdminTripRecord,
  AdminTripStatus,
  AdminUserRecord,
  ServiceResponse,
} from "@/lib/types";

type ApiListResponse<T> = T[] | ServiceResponse<T[]>;

const unwrapListResponse = <T>(response: ApiListResponse<T>): ServiceResponse<T[]> => {
  if (response && typeof response === "object" && "data" in response) {
    return response as ServiceResponse<T[]>;
  }

  return {
    data: response as T[],
  };
};

const waitForAuthToken = async () => {
  const currentUser = auth.currentUser;
  if (currentUser) {
    return currentUser.getIdToken();
  }

  return new Promise<string>((resolve, reject) => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      unsubscribe();
      if (!user) {
        reject(new Error("Authentication required. Please sign in again."));
        return;
      }

      resolve(await user.getIdToken());
    });
  });
};

export const adminService = {
  async getUsers(): Promise<ServiceResponse<AdminUserRecord[]>> {
    const token = await waitForAuthToken();
    const response = await apiClient.authenticatedRequest<ApiListResponse<AdminUserRecord>>("/users", token);
    return unwrapListResponse(response);
  },

  async getTripById(tripId: string): Promise<ServiceResponse<AdminTripRecord | null>> {
    const token = await waitForAuthToken();
    const response = await apiClient.authenticatedRequest<AdminTripRecord | ServiceResponse<AdminTripRecord | null>>(
      `/admin/trips/${tripId}`,
      token,
    );

    if (response && typeof response === "object" && "data" in response) {
      return response as ServiceResponse<AdminTripRecord | null>;
    }

    return {
      data: response as AdminTripRecord,
      message: "Trip fetched successfully",
    };
  },

  async getTrips(status?: AdminTripStatus): Promise<ServiceResponse<AdminTripRecord[]>> {
    const token = await waitForAuthToken();
    const path = status ? `/admin/trips?status=${encodeURIComponent(status)}` : "/admin/trips";
    const response = await apiClient.authenticatedRequest<ApiListResponse<AdminTripRecord>>(path, token);
    return unwrapListResponse(response);
  },

  async getOnDemandTrips(status?: AdminTripStatus): Promise<ServiceResponse<AdminOnDemandTripRecord[]>> {
    const token = await waitForAuthToken();
    const path = status ? `/admin/on-demand-trips?status=${encodeURIComponent(status)}` : "/admin/on-demand-trips";
    const response = await apiClient.authenticatedRequest<ApiListResponse<AdminOnDemandTripRecord>>(path, token);
    return unwrapListResponse(response);
  },

  async getOnDemandTripById(tripId: string): Promise<ServiceResponse<AdminOnDemandTripRecord | null>> {
    const token = await waitForAuthToken();
    const response = await apiClient.authenticatedRequest<AdminOnDemandTripRecord | ServiceResponse<AdminOnDemandTripRecord | null>>(
      `/admin/on-demand-trips/${tripId}`,
      token,
    );

    if (response && typeof response === "object" && "data" in response) {
      return response as ServiceResponse<AdminOnDemandTripRecord | null>;
    }

    return {
      data: response as AdminOnDemandTripRecord,
      message: "On-demand trip fetched successfully",
    };
  },

  async updateOnDemandTripStatus(
    tripId: string,
    status: Exclude<AdminTripStatus, "draft">,
    reason?: string,
  ): Promise<ServiceResponse<AdminOnDemandTripRecord>> {
    const token = await waitForAuthToken();
    const nextReason = reason?.trim() || (status === "in review" ? "Moved to the review queue." : "Status updated by admin.");
    const response = await apiClient.authenticatedRequest<AdminOnDemandTripRecord | ServiceResponse<AdminOnDemandTripRecord>>(
      `/admin/on-demand-trips/${tripId}`,
      token,
      {
        method: "PATCH",
        body: { status, reason: nextReason },
      },
    );

    if (response && typeof response === "object" && "data" in response) {
      return response as ServiceResponse<AdminOnDemandTripRecord>;
    }

    return {
      data: response as AdminOnDemandTripRecord,
      message: "On-demand trip status updated successfully",
    };
  },

  async updateTripStatus(
    tripId: string,
    status: Exclude<AdminTripStatus, "draft">,
    reason?: string,
  ): Promise<ServiceResponse<AdminTripRecord>> {
    const token = await waitForAuthToken();
    const nextReason = reason?.trim() || (status === "in review" ? "Moved to the review queue." : "Status updated by admin.");
    const response = await apiClient.authenticatedRequest<AdminTripRecord | ServiceResponse<AdminTripRecord>>(
      `/admin/trips/${tripId}`,
      token,
      {
        method: "PATCH",
        body: { status, reason: nextReason },
      },
    );

    if (response && typeof response === "object" && "data" in response) {
      return response as ServiceResponse<AdminTripRecord>;
    }

    return {
      data: response as AdminTripRecord,
      message: "Trip status updated successfully",
    };
  },

  async assignRole(userId: string, role: "user" | "guide") {
    const token = await waitForAuthToken();
    return apiClient.authenticatedRequest<{ status: string; assigned: string[]; failed: Array<{ userId: string; reason: string }> }>(
      "/users/assign-roles",
      token,
      {
        method: "POST",
        body: {
          userIds: userId,
          role,
        },
      },
    );
  },
};