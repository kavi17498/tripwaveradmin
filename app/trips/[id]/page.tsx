"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { Navbar } from "@/components/layout/navbar";
import { Footer } from "@/components/layout/footer";
import { RatingStars } from "@/components/common/rating-stars";
import { EmptyState } from "@/components/feedback/empty-state";
import { CardSkeletonGrid } from "@/components/feedback/loading-skeletons";
import { Button } from "@/components/ui/button";
import { reviewService } from "@/lib/services/reviewService";
import { tripService } from "@/lib/services/tripService";
import { Review, Trip } from "@/lib/types";
import { formatCurrencyRs } from "@/lib/utils";

export default function TripDetailsPage() {
  const { id } = useParams<{ id: string }>();
  const [trip, setTrip] = useState<Trip | null>(null);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      const [tripResult, reviewResult] = await Promise.all([
        tripService.getTripById(id),
        reviewService.getReviewsByTrip(id),
      ]);
      setTrip(tripResult.data);
      setReviews(reviewResult.data);
      setLoading(false);
    };

    load();
  }, [id]);

  if (loading) {
    return (
      <div>
        <Navbar />
        <main className="mx-auto max-w-7xl px-4 py-8 md:px-6">
          <CardSkeletonGrid />
        </main>
      </div>
    );
  }

  if (!trip) {
    return (
      <div>
        <Navbar />
        <main className="mx-auto max-w-7xl px-4 py-8 md:px-6">
          <EmptyState title="Trip not found" description="This trip may have been removed or is no longer available." />
        </main>
      </div>
    );
  }

  return (
    <div>
      <Navbar />
      <main className="mx-auto max-w-7xl space-y-8 px-4 py-8 md:px-6">
        <img src={trip.coverImage} alt={trip.title} className="h-[320px] w-full border border-border object-cover" />

        <section className="grid grid-cols-1 gap-6 md:grid-cols-3">
          <div className="space-y-2 md:col-span-2">
            <h1 className="text-3xl font-semibold">{trip.title}</h1>
            <p className="text-muted-foreground">{trip.destination}</p>
            <p className="text-sm text-muted-foreground">{trip.startDate} to {trip.endDate}</p>
            <p className="text-sm text-muted-foreground">Organized by {trip.organizerName}</p>
            <RatingStars rating={trip.organizerRating} />
          </div>
          <div className="border border-border bg-card p-4">
            <p className="text-sm text-muted-foreground">From</p>
            <p className="text-3xl font-semibold">{formatCurrencyRs(trip.price)}</p>
            <p className="mt-2 text-sm text-muted-foreground">{trip.bookedCount}/{trip.capacity} participants</p>
            <Button className="mt-4 w-full" asChild>
              <Link href={`/booking/${trip.id}`}>Join / Request</Link>
            </Button>
          </div>
        </section>

        <section className="grid grid-cols-1 gap-6 md:grid-cols-2">
          <article className="border border-border bg-card p-4">
            <h2 className="text-lg font-semibold">Itinerary</h2>
            <div className="mt-3 space-y-3">
              {trip.itinerary.map((item) => (
                <div key={item.day} className="border-l border-border pl-3">
                  <p className="text-sm font-medium">Day {item.day}: {item.title}</p>
                  <p className="text-sm text-muted-foreground">{item.description}</p>
                </div>
              ))}
            </div>
          </article>
          <article className="space-y-4">
            <div className="border border-border bg-card p-4">
              <h3 className="font-semibold">Included</h3>
              <ul className="mt-2 list-inside list-disc text-sm text-muted-foreground">
                {trip.included.map((item) => <li key={item}>{item}</li>)}
              </ul>
            </div>
            <div className="border border-border bg-card p-4">
              <h3 className="font-semibold">Excluded</h3>
              <ul className="mt-2 list-inside list-disc text-sm text-muted-foreground">
                {trip.excluded.map((item) => <li key={item}>{item}</li>)}
              </ul>
            </div>
            <div className="border border-border bg-card p-4">
              <h3 className="font-semibold">Map</h3>
              <div className="mt-2 h-40 border border-dashed border-border bg-muted/30" />
            </div>
          </article>
        </section>

        <section className="border border-border bg-card p-4">
          <h2 className="text-lg font-semibold">Reviews</h2>
          <div className="mt-4 space-y-3">
            {reviews.map((review) => (
              <article key={review.id} className="border border-border p-3">
                <p className="font-medium">{review.userName}</p>
                <RatingStars rating={review.rating} className="mt-1" />
                <p className="mt-2 text-sm text-muted-foreground">{review.comment}</p>
              </article>
            ))}
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
}
