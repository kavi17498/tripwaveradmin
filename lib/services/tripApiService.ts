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
  startDate: string;
  endDate: string;
  startTime?: string;
  startLocation: string;
  organizer: string;
  price: number;
  itinerary?: {
    days?: Array<{
      day: number;
      title: string;
      timeSlot?: {
        startTime?: string;
        endTime?: string;
      };
      activities?: string[];
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
};
