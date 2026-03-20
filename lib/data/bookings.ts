import { Booking } from "@/lib/types";

export const mockBookings: Booking[] = [
  {
    id: "b1",
    tripId: "t1",
    userId: "u1",
    participantName: "Maya Fernandes",
    participantEmail: "maya@tripwaver.com",
    seats: 1,
    totalAmount: 185000,
    status: "approved",
    requestedAt: "2026-03-01",
  },
  {
    id: "b2",
    tripId: "t2",
    userId: "u1",
    participantName: "Maya Fernandes",
    participantEmail: "maya@tripwaver.com",
    seats: 2,
    totalAmount: 324000,
    status: "requested",
    requestedAt: "2026-03-04",
  },
];
