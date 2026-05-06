import { apiClient } from "@/lib/services/apiClient";

export type TripPlanDestination = {
  name: string;
  lat: number;
  lng: number;
  imageUrl: string | null;
  description: string;
};

export type TripPlanLocationResult = {
  location: string;
  destinations: TripPlanDestination[];
};

export const tripPlanService = {
  async getDestinations(locations: string[], token: string): Promise<TripPlanLocationResult[]> {
    return apiClient.authenticatedRequest<TripPlanLocationResult[]>("/trip-plan/destinations", token, {
      method: "POST",
      body: { locations },
    });
  },
};
