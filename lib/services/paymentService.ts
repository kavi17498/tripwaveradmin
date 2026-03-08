import { mockPayments } from "@/lib/data/payments";
import { Payment, ServiceResponse } from "@/lib/types";
import { sleep } from "@/lib/services/serviceUtils";

export const paymentService = {
  async createPayment(payload: Omit<Payment, "id" | "paidAt" | "status">): Promise<ServiceResponse<Payment>> {
    await sleep(900);
    const status = Math.random() > 0.2 ? "success" : "failed";
    return {
      data: {
        ...payload,
        id: `p-${Date.now()}`,
        status,
        paidAt: new Date().toISOString(),
      },
      message: status === "success" ? "Payment successful" : "Payment failed",
    };
  },

  async getPaymentById(id: string): Promise<ServiceResponse<Payment | null>> {
    await sleep(400);
    return { data: mockPayments.find((payment) => payment.id === id) ?? null };
  },
};
