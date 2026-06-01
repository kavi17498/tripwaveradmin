import { apiClient } from "@/lib/services/apiClient";
import { ServiceResponse } from "@/lib/types";
import type { TripApiItem } from "@/lib/services/tripApiService";
import type { OnDemandTripTemplateApiItem } from "@/lib/services/onDemandTripService";

export type ComprehensiveSearchResponse = {
  query: string;
  totals: {
    trips: number;
    onDemandTrips: number;
    total: number;
  };
  trips: TripApiItem[];
  onDemandTrips: OnDemandTripTemplateApiItem[];
};

export const searchService = {
  async comprehensiveSearch(params: {
    q?: string;
    tripLimit?: number;
    onDemandLimit?: number;
  }): Promise<ServiceResponse<ComprehensiveSearchResponse>> {
    const query = new URLSearchParams();

    if (params.q) query.set("q", params.q);
    if (params.tripLimit) query.set("tripLimit", String(params.tripLimit));
    if (params.onDemandLimit) query.set("onDemandLimit", String(params.onDemandLimit));

    const path = `/search/comprehensive${query.toString() ? `?${query.toString()}` : ""}`;
    const response = await apiClient.request<ComprehensiveSearchResponse | ServiceResponse<ComprehensiveSearchResponse>>(path, {
      method: "GET",
    });

    if (response && typeof response === "object" && "data" in response) {
      return response as ServiceResponse<ComprehensiveSearchResponse>;
    }

    return {
      data: response as ComprehensiveSearchResponse,
      message: "Search results loaded successfully",
    };
  },
};
