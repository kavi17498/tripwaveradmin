import { Notification } from "@/lib/types";

export const mockNotifications: Notification[] = [
  {
    id: "n1",
    userId: "u1",
    type: "join-request",
    title: "Join request approved",
    description: "Your request for Coastal Escape in Portugal was approved.",
    read: false,
    createdAt: "2026-03-05T09:10:00Z",
  },
  {
    id: "n2",
    userId: "u1",
    type: "payment",
    title: "Payment received",
    description: "Payment for booking #BKG-1002 was received successfully.",
    read: true,
    createdAt: "2026-03-04T13:20:00Z",
  },
  {
    id: "n3",
    userId: "u1",
    type: "reminder",
    title: "Trip starts in 5 days",
    description: "Prepare your travel documents and arrival details.",
    read: false,
    createdAt: "2026-03-03T06:50:00Z",
  },
  {
    id: "n4",
    userId: "u1",
    type: "account-alert",
    title: "Security alert",
    description: "New sign-in detected from a different browser.",
    read: true,
    createdAt: "2026-03-01T18:30:00Z",
  },
];
