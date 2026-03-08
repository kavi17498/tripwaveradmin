import { Payment } from "@/lib/types";

export const mockPayments: Payment[] = [
  {
    id: "p1",
    tripId: "t1",
    bookingId: "b1",
    userId: "u1",
    method: "card",
    amount: 980,
    status: "success",
    paidAt: "2026-03-05T10:00:00Z",
  },
  {
    id: "p2",
    tripId: "t2",
    bookingId: "b2",
    userId: "u1",
    method: "wallet",
    amount: 2840,
    status: "pending",
    paidAt: "2026-03-06T13:40:00Z",
  },
];
