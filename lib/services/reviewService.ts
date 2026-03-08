import { mockReviews } from "@/lib/data/reviews";
import { Review, ServiceResponse } from "@/lib/types";
import { sleep } from "@/lib/services/serviceUtils";

export const reviewService = {
  async getReviewsByTrip(tripId: string): Promise<ServiceResponse<Review[]>> {
    await sleep(400);
    return { data: mockReviews.filter((review) => review.tripId === tripId) };
  },

  async submitReview(payload: Omit<Review, "id" | "createdAt">): Promise<ServiceResponse<Review>> {
    await sleep(450);
    return {
      data: {
        ...payload,
        id: `r-${Date.now()}`,
        createdAt: new Date().toISOString(),
      },
      message: "Review submitted",
    };
  },
};
