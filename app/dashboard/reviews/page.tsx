"use client";

import { FormEvent, useState } from "react";
import { PageHeader } from "@/components/common/page-header";
import { RatingStars } from "@/components/common/rating-stars";
import { Button } from "@/components/ui/button";
import { reviewService } from "@/lib/services/reviewService";
import { mockReviews } from "@/lib/data/reviews";

export default function ReviewsPage() {
  const [rating, setRating] = useState(4);
  const [comment, setComment] = useState("");

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    if (!comment.trim()) return;
    await reviewService.submitReview({
      tripId: "t1",
      userId: "u1",
      userName: "Maya Fernandes",
      rating,
      comment,
    });
    setComment("");
  };

  return (
    <div className="space-y-6">
      <PageHeader title="Reviews" description="Submit ratings and review your previous trips." />

      <form onSubmit={submit} className="space-y-3 border border-border bg-card p-5">
        <label className="block text-sm font-medium">Rating</label>
        <div className="flex items-center gap-2">
          <input type="range" min={1} max={5} value={rating} onChange={(event) => setRating(Number(event.target.value))} />
          <RatingStars rating={rating} />
        </div>
        <textarea
          value={comment}
          onChange={(event) => setComment(event.target.value)}
          className="min-h-24 w-full border border-input bg-background px-3 py-2 text-sm"
          placeholder="Share your trip experience"
        />
        <Button>Submit review</Button>
      </form>

      <section className="space-y-2">
        {mockReviews.map((review) => (
          <article key={review.id} className="border border-border bg-card p-4">
            <p className="font-medium">{review.userName}</p>
            <RatingStars rating={review.rating} className="mt-1" />
            <p className="mt-2 text-sm text-muted-foreground">{review.comment}</p>
          </article>
        ))}
      </section>
    </div>
  );
}
