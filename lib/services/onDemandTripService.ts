import { apiClient } from "@/lib/services/apiClient";
import { ServiceResponse } from "@/lib/types";

export type OnDemandTripTemplateApiItem = {
  id: string;
  tripName: string;
  durationLabel: string;
  durationDays: number;
  tripCategory?: string;
  description: string;
  organizer: string;
  organizerName?: string;
  organizerRating?: number | null;
  totalReviews?: number;
  price: number;
  destinations: Array<{
    name: string;
    description: string;
    geoCode: { latitude: number; longitude: number };
    photos: string[];
  }>;
  mainDestinations?: Array<{ name: string; lat: number; lng: number }>;
  startLocation: string;
  itinerary?: {
    days?: Array<{
      day: number;
      title: string;
      activities?: Array<{
        title: string;
        timeSlot?: { startTime: string; endTime: string };
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
  paymentMethods?: string[];
  maxParticipants: number;
  photos?: string[];
  coverImage?: string;
  pickupType?: string;
  pickupCostPerKm?: number;
  pickupStartLocation?: { name: string; lat: number; lng: number };
  isHidden?: boolean;
  status?: string;
  createdAt?: unknown;
  updatedAt?: unknown;
};

export type CreateOnDemandTripTemplatePayload = Omit<
  OnDemandTripTemplateApiItem,
  "id" | "organizerName" | "organizerRating" | "totalReviews" | "isHidden" | "status" | "createdAt" | "updatedAt"
> & {
  organizer: string;
  status?: string;
};

export type OnDemandTripAvailability = {
  busyDates: string[];
  busyRanges: Array<{ startDate: string; endDate: string }>;
};

export const onDemandTripService = {
  async createTemplate(payload: CreateOnDemandTripTemplatePayload, token: string): Promise<ServiceResponse<OnDemandTripTemplateApiItem>> {
    const response = await apiClient.authenticatedRequest<OnDemandTripTemplateApiItem | ServiceResponse<OnDemandTripTemplateApiItem>>(
      "/on-demand-trips",
      token,
      {
        method: "POST",
        body: payload,
      },
    );

    if (response && typeof response === "object" && "data" in response) {
      return response as ServiceResponse<OnDemandTripTemplateApiItem>;
    }

    return { data: response as OnDemandTripTemplateApiItem, message: "On-demand trip template created successfully" };
  },

  async updateTemplate(id: string, payload: Partial<CreateOnDemandTripTemplatePayload>, token: string): Promise<ServiceResponse<OnDemandTripTemplateApiItem>> {
    const response = await apiClient.authenticatedRequest<OnDemandTripTemplateApiItem | ServiceResponse<OnDemandTripTemplateApiItem>>(
      `/on-demand-trips/${id}`,
      token,
      {
        method: "PATCH",
        body: payload,
      },
    );

    if (response && typeof response === "object" && "data" in response) {
      return response as ServiceResponse<OnDemandTripTemplateApiItem>;
    }

    return { data: response as OnDemandTripTemplateApiItem, message: "On-demand trip template updated successfully" };
  },

  async getPublicTemplates(organizerId?: string): Promise<ServiceResponse<OnDemandTripTemplateApiItem[]>> {
    const qs = organizerId ? `?organizerId=${encodeURIComponent(organizerId)}` : "";
    const response = await apiClient.request<OnDemandTripTemplateApiItem[] | ServiceResponse<OnDemandTripTemplateApiItem[]>>(
      `/on-demand-trips/public${qs}`,
      { method: "GET" },
    );

    if (response && typeof response === "object" && "data" in response) {
      return response as ServiceResponse<OnDemandTripTemplateApiItem[]>;
    }

    return { data: response as OnDemandTripTemplateApiItem[], message: "On-demand trips loaded successfully" };
  },

  async getTemplatesByOrganizer(organizerId: string, token?: string): Promise<ServiceResponse<OnDemandTripTemplateApiItem[]>> {
    const response = token
      ? await apiClient.authenticatedRequest<OnDemandTripTemplateApiItem[] | ServiceResponse<OnDemandTripTemplateApiItem[]>>(
          `/on-demand-trips/organizer/${encodeURIComponent(organizerId)}`,
          token,
          { method: "GET" },
        )
      : await apiClient.request<OnDemandTripTemplateApiItem[] | ServiceResponse<OnDemandTripTemplateApiItem[]>>(
          `/on-demand-trips/organizer/${encodeURIComponent(organizerId)}`,
          { method: "GET" },
        );

    if (response && typeof response === "object" && "data" in response) {
      return response as ServiceResponse<OnDemandTripTemplateApiItem[]>;
    }

    return { data: response as OnDemandTripTemplateApiItem[], message: "On-demand trips loaded successfully" };
  },

  async getTemplateById(id: string): Promise<ServiceResponse<OnDemandTripTemplateApiItem>> {
    const response = await apiClient.request<OnDemandTripTemplateApiItem | ServiceResponse<OnDemandTripTemplateApiItem>>(
      `/on-demand-trips/${id}`,
      { method: "GET" },
    );

    if (response && typeof response === "object" && "data" in response) {
      return response as ServiceResponse<OnDemandTripTemplateApiItem>;
    }

    return { data: response as OnDemandTripTemplateApiItem, message: "On-demand trip loaded successfully" };
  },

  async getAvailability(id: string): Promise<ServiceResponse<OnDemandTripAvailability>> {
    const response = await apiClient.request<OnDemandTripAvailability | ServiceResponse<OnDemandTripAvailability>>(
      `/on-demand-trips/${id}/availability`,
      { method: "GET" },
    );

    if (response && typeof response === "object" && "data" in response) {
      return response as ServiceResponse<OnDemandTripAvailability>;
    }

    return { data: response as OnDemandTripAvailability, message: "Availability loaded successfully" };
  },

  async bookTemplate(id: string, payload: { startDate: string; startTime: string; note?: string }, token: string): Promise<ServiceResponse<{ tripId: string }>> {
    const response = await apiClient.authenticatedRequest<{ tripId: string } | ServiceResponse<{ tripId: string }>>(
      `/on-demand-trips/${id}/book`,
      token,
      {
        method: "POST",
        body: payload,
      },
    );

    if (response && typeof response === "object" && "data" in response) {
      return response as ServiceResponse<{ tripId: string }>;
    }

    return { data: response as { tripId: string }, message: "On-demand booking created successfully" };
  },

  async deleteTemplate(id: string, token: string): Promise<ServiceResponse<null>> {
    const response = await apiClient.authenticatedRequest<null | ServiceResponse<null>>(`/on-demand-trips/${id}`, token, {
      method: "DELETE",
    });

    if (response && typeof response === "object" && "data" in response) {
      return response as ServiceResponse<null>;
    }

    return { data: null, message: "On-demand trip template deleted successfully" };
  },
};