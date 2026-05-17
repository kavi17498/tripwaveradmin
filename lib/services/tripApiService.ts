import { apiClient } from "@/lib/services/apiClient";
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
    const response = token
      ? await apiClient.authenticatedRequest<TripApiItem[] | ServiceResponse<TripApiItem[]>>(path, token, { method: "GET" })
      : await apiClient.request<TripApiItem[] | ServiceResponse<TripApiItem[]>>(path, { method: "GET" });

    if (response && typeof response === "object" && "data" in response) {
      return response as ServiceResponse<TripApiItem[]>;
    }

    return {
      data: response as TripApiItem[],
      message: "Approved public trips loaded",
    };
  },
};
