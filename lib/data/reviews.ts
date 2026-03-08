import { Review } from "@/lib/types";

export const mockReviews: Review[] = [
  {
    id: "r1",
    tripId: "t1",
    userId: "u1",
    userName: "Maya Fernandes",
    rating: 5,
    comment: "Very organized and practical itinerary with enough flexibility.",
    createdAt: "2026-02-14",
  },
  {
    id: "r2",
    tripId: "t1",
    userId: "u3",
    userName: "Daniel Ross",
    rating: 4,
    comment: "Great guide quality and logistics. Hotel could be improved.",
    createdAt: "2026-02-20",
  },
  {
    id: "r3",
    tripId: "t2",
    userId: "u2",
    userName: "Aisha Khan",
    rating: 5,
    comment: "Clean communication and excellent local support.",
    createdAt: "2026-01-09",
  },
];
