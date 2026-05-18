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
  metadata?: Record<string, unknown>;
};

export type CreatePaymentResult = {
  id: string;
  status: string;
  provider?: string;
  checkoutUrl?: string;
  [k: string]: unknown;
};

export const paymentService = {
  async createPayment(payload: CreatePaymentPayload, token?: string): Promise<ServiceResponse<CreatePaymentResult>> {
    const authToken = token || userSessionService.getToken() || undefined;

    const response = await apiClient.request<CreatePaymentResult | ServiceResponse<CreatePaymentResult>>(
      "/payments/create",
      {
        method: "POST",
        body: payload,
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

  async getPaymentById(id: string, token?: string): Promise<ServiceResponse<CreatePaymentResult | null>> {
    const authToken = token || userSessionService.getToken() || undefined;
    const response = await apiClient.request<CreatePaymentResult | ServiceResponse<CreatePaymentResult | null>>(
      `/payments/${id}`,
      { method: "GET", token: authToken },
    );

    if (response && typeof response === "object" && "data" in response) {
      return response as ServiceResponse<CreatePaymentResult | null>;
    }

    return { data: response as CreatePaymentResult | null, message: "Payment loaded" };
  },
};

export default paymentService;
