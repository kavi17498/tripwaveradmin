import { apiClient } from "@/lib/services/apiClient";
import { userSessionService } from "@/lib/services/userSessionService";
import { Payment, ServiceResponse } from "@/lib/types";

export type CreatePaymentPayload = {
  tripId?: string;
  bookingId?: string;
  userId?: string;
  method: Payment["method"];
  amount: number;
  firstName?: string;
  lastName?: string;
  email?: string;
  phone?: string;
};

export type CreatePaymentResult = {
  id: string;
  status: string;
  provider?: string;
  checkoutUrl?: string;
  [k: string]: unknown;
};

export type TripEarningsBreakdown = {
  tripId: string;
  tripName: string;
  startDate: string;
  endDate: string;
  status: string;
  participantCount: number;
  onlineParticipantCount: number;
  payToGuideParticipantCount: number;
  totalEarned: number;
  onlineEarned: number;
  payToGuideEarned: number;
  uncategorizedEarned: number;
  pickupEarned: number;
  baseTripEarned: number;
};

export type OrganizerEarningsSummary = {
  totalEarned: number;
  onlineEarned: number;
  payToGuideEarned: number;
  uncategorizedEarned: number;
  totalPickupEarned: number;
  totalBaseTripEarned: number;
  tripsCount: number;
  trips: TripEarningsBreakdown[];
};

export const paymentService = {
  async createPayment(payload: CreatePaymentPayload, token?: string): Promise<ServiceResponse<CreatePaymentResult>> {
    const authToken = token || userSessionService.getToken() || undefined;

    // Build request body in the shape expected by the backend / payment provider
    const sessionProfile = userSessionService.getUserProfile<Record<string, any>>();
    const requestBody: Record<string, unknown> = {
      amount: payload.amount,
      first_name: payload.firstName ?? sessionProfile?.firstName ?? sessionProfile?.name ?? "",
      last_name: payload.lastName ?? sessionProfile?.lastName ?? "",
      email: payload.email ?? sessionProfile?.email ?? "",
      phone: payload.phone ?? sessionProfile?.phone ?? "",
    };

    // intentionally do not send a `metadata` property — backend expects top-level payment fields only

    const response = await apiClient.request<CreatePaymentResult | ServiceResponse<CreatePaymentResult>>(
      "/payments/create",
      {
        method: "POST",
        body: requestBody,
        token: authToken,
      },
    );

    if (response && typeof response === "object" && "data" in response) {
      return response as ServiceResponse<CreatePaymentResult>;
    }

    return {
      data: response as CreatePaymentResult,
      message: "Payment created",
    };
  },

  async getPaymentById(id: string, token?: string): Promise<ServiceResponse<Payment | null>> {
    const authToken = token || userSessionService.getToken() || undefined;
    const response = await apiClient.request<Payment | ServiceResponse<Payment | null>>(
      `/payments/${id}`,
      { method: "GET", token: authToken },
    );

    if (response && typeof response === "object" && "data" in response) {
      return response as ServiceResponse<Payment | null>;
    }

    return { data: response as Payment | null, message: "Payment loaded" };
  },

  async getOrganizerEarnings(token?: string): Promise<ServiceResponse<OrganizerEarningsSummary>> {
    const authToken = token || userSessionService.getToken() || undefined;
    const response = await apiClient.request<OrganizerEarningsSummary | ServiceResponse<OrganizerEarningsSummary>>(
      "/payments/earnings/organizer",
      { method: "GET", token: authToken },
    );

    if (response && typeof response === "object" && "data" in response) {
      return response as ServiceResponse<OrganizerEarningsSummary>;
    }

    return {
      data: response as OrganizerEarningsSummary,
      message: "Organizer earnings loaded",
    };
  },
};

export default paymentService;
