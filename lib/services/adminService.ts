import { apiClient } from "@/lib/services/apiClient";
import {
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

export const adminService = {
  async getUsers(): Promise<ServiceResponse<AdminUserRecord[]>> {
    const response = await apiClient.request<ApiListResponse<AdminUserRecord>>("/users");
    return unwrapListResponse(response);
  },

  async getTripById(tripId: string): Promise<ServiceResponse<AdminTripRecord | null>> {
    const response = await apiClient.request<AdminTripRecord | ServiceResponse<AdminTripRecord | null>>(`/admin/trips/${tripId}`);

    if (response && typeof response === "object" && "data" in response) {
      return response as ServiceResponse<AdminTripRecord | null>;
    }

    return {
      data: response as AdminTripRecord,
      message: "Trip fetched successfully",
    };
  },

  async getTrips(status?: AdminTripStatus): Promise<ServiceResponse<AdminTripRecord[]>> {
    const path = status ? `/admin/trips?status=${encodeURIComponent(status)}` : "/admin/trips";
    const response = await apiClient.request<ApiListResponse<AdminTripRecord>>(path);
    return unwrapListResponse(response);
  },

  async updateTripStatus(tripId: string, status: Exclude<AdminTripStatus, "draft">): Promise<ServiceResponse<AdminTripRecord>> {
    const response = await apiClient.request<AdminTripRecord | ServiceResponse<AdminTripRecord>>(`/admin/trips/${tripId}`, {
      method: "PATCH",
      body: { status },
    });

    if (response && typeof response === "object" && "data" in response) {
      return response as ServiceResponse<AdminTripRecord>;
    }

    return {
      data: response as AdminTripRecord,
      message: "Trip status updated successfully",
    };
  },
};