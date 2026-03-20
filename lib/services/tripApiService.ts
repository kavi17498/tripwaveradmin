import { apiClient } from "@/lib/services/apiClient";
import { CreateTripApiPayload, ServiceResponse } from "@/lib/types";

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
};
