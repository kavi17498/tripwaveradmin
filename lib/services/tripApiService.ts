import { apiClient } from "@/lib/services/apiClient";
import { userSessionService } from "@/lib/services/userSessionService";
import { CreateTripApiPayload, ServiceResponse } from "@/lib/types";

export type TripApiDestination = {
  name: string;
  description: string;
  geoCode: {
    latitude: number;
    longitude: number;
  };
  photos: string[];
};

export type TripApiItem = {
  id: string;
  tripName: string;
  tripCategory: CreateTripApiPayload["tripCategory"] | string;
  paymentMethods?: CreateTripApiPayload["paymentMethods"];
  destinations: TripApiDestination[];
  mainDestinations?: Array<{
    name: string;
    lat: number;
    lng: number;
  }>;
  startDate: string;
  endDate: string;
  startTime?: string;
  endTime?: string;
  startLocation: string;
  organizer: string;
  organizerName?: string;
  price: number;
  itinerary?: {
    days?: Array<{
      day: number;
      title: string;
      activities?: Array<{
        title: string;
        timeSlot: {
          startTime: string;
          endTime: string;
        };
        notes?: string[];
        isAIGenerated?: boolean;
      }>;
    }>;
  };
  included?: {
    hotelFacilities?: string[];
    transportFacilities?: string[];
    otherInclusions?: string[];
    exclusions?: string[];
  };
  participants?: unknown[];
  photos?: string[];
  coverImage?: string;
  description?: string;
  maxParticipants?: number;
  createdAt?: unknown;
  updatedAt?: unknown;
  status?: string;
};

export const tripApiService = {
  async createTrip(payload: CreateTripApiPayload, token: string): Promise<ServiceResponse<unknown>> {
    const response = await apiClient.authenticatedRequest<unknown | ServiceResponse<unknown>>("/trips", token, {
      method: "POST",
      body: payload,
    });

    if (response && typeof response === "object" && "data" in response) {
      return response as ServiceResponse<unknown>;
    }

    return {
      data: response,
      message: "Trip created successfully",
    };
  },

  async getMyTrips(token: string): Promise<ServiceResponse<TripApiItem[]>> {
    const response = await apiClient.authenticatedRequest<TripApiItem[] | ServiceResponse<TripApiItem[]>>("/trips", token, {
      method: "GET",
    });

    if (response && typeof response === "object" && "data" in response) {
      return response as ServiceResponse<TripApiItem[]>;
    }

    return {
      data: response,
      message: "Trips loaded successfully",
    };
  },

  async getTripById(id: string, token: string): Promise<ServiceResponse<TripApiItem | null>> {
    const response = await apiClient.authenticatedRequest<TripApiItem | ServiceResponse<TripApiItem | null>>(`/trips/${id}`, token, {
      method: "GET",
    });

    if (response && typeof response === "object" && "data" in response) {
      return response as ServiceResponse<TripApiItem | null>;
    }

    return {
      data: response ?? null,
      message: "Trip loaded successfully",
    };
  },

  async updateTrip(id: string, payload: CreateTripApiPayload, token: string): Promise<ServiceResponse<unknown>> {
    const response = await apiClient.authenticatedRequest<unknown | ServiceResponse<unknown>>(`/trips/${id}`, token, {
      method: "PUT",
      body: payload,
    });

    if (response && typeof response === "object" && "data" in response) {
      return response as ServiceResponse<unknown>;
    }

    return {
      data: response,
      message: "Trip updated successfully",
    };
  },

  async getApprovedPublicTrips(
    filters?: Record<string, string | number | undefined>,
    token?: string
  ): Promise<ServiceResponse<TripApiItem[]>> {
    const qs = filters
      ? "?" +
        Object.entries(filters)
          .filter(([, v]) => v !== undefined && v !== "")
          .map(([k, v]) => `${encodeURIComponent(k)}=${encodeURIComponent(String(v))}`)
          .join("&")
      : "";

    const path = `/trips/approvedpublictrips${qs}`;
    
    // Auto-retrieve token from session if not provided
    const authToken = token || userSessionService.getToken();
    
    const response = authToken
      ? await apiClient.authenticatedRequest<TripApiItem[] | ServiceResponse<TripApiItem[]>>(path, authToken, { method: "GET" })
      : await apiClient.request<TripApiItem[] | ServiceResponse<TripApiItem[]>>(path, { method: "GET" });

    if (response && typeof response === "object" && "data" in response) {
      return response as ServiceResponse<TripApiItem[]>;
    }

    return {
      data: response as TripApiItem[],
      message: "Approved public trips loaded",
    };
  },

  async getParticipatedTrips(token: string): Promise<ServiceResponse<TripApiItem[]>> {
    const response = await apiClient.authenticatedRequest<TripApiItem[] | ServiceResponse<TripApiItem[]>>(
      "/trips/participated",
      token,
      { method: "GET" },
    );

    if (response && typeof response === "object" && "data" in response) {
      return response as ServiceResponse<TripApiItem[]>;
    }

    return {
      data: response as TripApiItem[],
      message: "Participated trips loaded successfully",
    };
  },

  async cancelBooking(tripId: string, token: string): Promise<ServiceResponse<TripApiItem | null>> {
    const response = await apiClient.authenticatedRequest<TripApiItem | ServiceResponse<TripApiItem | null>>(
      `/trips/${tripId}/booking`,
      token,
      { method: "DELETE" },
    );

    if (response && typeof response === "object" && "data" in response) {
      return response as ServiceResponse<TripApiItem | null>;
    }

    return {
      data: response ?? null,
      message: "Booking canceled successfully",
    };
  },

  async updateParticipantsStatus(
    tripId: string,
    participantIds: string[],
    status: "accepted" | "rejected",
    token: string
  ): Promise<ServiceResponse<unknown>> {
    const response = await apiClient.authenticatedRequest<unknown | ServiceResponse<unknown>>(
      `/trips/${tripId}/participants/status`,
      token,
      {
        method: "PATCH",
        body: { participantIds, status },
      }
    );

    if (response && typeof response === "object" && "data" in response) {
      return response as ServiceResponse<unknown>;
    }

    return {
      data: response,
      message: `Participants status updated to ${status}`,
    };
  },
};

