import { ChatMessage } from "@/lib/types";

export const mockChatMessages: ChatMessage[] = [
  {
    id: "m1",
    tripId: "t1",
    senderId: "u2",
    senderName: "Ethan Cole",
    message: "Welcome everyone. Please share your flight arrivals.",
    createdAt: "2026-03-05T08:15:00Z",
  },
  {
    id: "m2",
    tripId: "t1",
    senderId: "u1",
    senderName: "Maya Fernandes",
    message: "Landing on Monday 9:40 AM. Looking forward to it.",
    createdAt: "2026-03-05T08:20:00Z",
  },
  {
    id: "m3",
    tripId: "t1",
    senderId: "u2",
    senderName: "Ethan Cole",
    message: "Great. Airport pickup windows will be shared tonight.",
    createdAt: "2026-03-05T08:22:00Z",
  },
];
