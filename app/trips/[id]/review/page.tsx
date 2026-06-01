"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { Navbar } from "@/components/layout/navbar";
import { Footer } from "@/components/layout/footer";
import { EmptyState } from "@/components/feedback/empty-state";
import { CardSkeletonGrid } from "@/components/feedback/loading-skeletons";
import { PageHeader } from "@/components/common/page-header";
import { RatingStars } from "@/components/common/rating-stars";
import { Button } from "@/components/ui/button";
import { tripApiService, type TripApiItem } from "@/lib/services/tripApiService";
import { reviewService } from "@/lib/services/review-service";
import type { ParticipantReviewSummary } from "@/lib/services/review-service";
import { userSessionService } from "@/lib/services/userSessionService";

type ReviewDraft = {
  rating: number;
  comment: string;
};

const formatDate = (value: string) => {
  const parsedDate = new Date(value);
  if (Number.isNaN(parsedDate.getTime())) return value;

  return parsedDate.toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
};

const formatDateTime = (date: string, time?: string) => {
  if (!time) return formatDate(date);
  return `${formatDate(date)} · ${time}`;
};

const formatDestination = (trip: TripApiItem) => trip.mainDestinations?.[0]?.name || trip.destinations?.[0]?.name || trip.startLocation || "Unknown destination";

const isTripEnded = (trip: TripApiItem) => {
  const endTime = trip.endTime || "23:59:59.999";
  const endDateTime = new Date(`${trip.endDate}T${endTime}`);
  return !Number.isNaN(endDateTime.getTime()) && new Date() > endDateTime;
};

export default function TripReviewPage() {
  const router = useRouter();
  const { id } = useParams<{ id: string }>();
  const [trip, setTrip] = useState<TripApiItem | null>(null);
  const [reviews, setReviews] = useState<ParticipantReviewSummary["reviews"]>([] as ParticipantReviewSummary["reviews"]);
  const [myReview, setMyReview] = useState<ParticipantReviewSummary["myReview"]>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [draft, setDraft] = useState<ReviewDraft>({ rating: 4, comment: "" });

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      setError("");

      const token = userSessionService.getToken();
      if (!token) {
        setError("You must be logged in to submit a review.");
        setLoading(false);
        return;
      }

      try {
        const [tripResponse, reviewResponse] = await Promise.all([
          tripApiService.getTripById(id, token),
          reviewService.getReviewsByTrip(id),
        ]);

        if (!tripResponse.data) {
          setTrip(null);
          setError("Trip not found. It may have been removed or you don't have access.");
          setLoading(false);
          return;
        }

        setTrip(tripResponse.data);
        setReviews(reviewResponse.data);
        setMyReview(reviewResponse.data.find((review) => review.userId === userSessionService.getUserProfile<{ id?: string }>()?.id) ?? null);
        if (reviewResponse.data.length > 0) {
          const latestUserReview = reviewResponse.data.find((review) => review.userId === userSessionService.getUserProfile<{ id?: string }>()?.id);
          if (latestUserReview) {
            setDraft({ rating: latestUserReview.rating, comment: latestUserReview.comment });
          }
        }
      } catch (loadError) {
        setError(loadError instanceof Error ? loadError.message : "Failed to load trip review details.");
        setTrip(null);
      } finally {
        setLoading(false);
      }
    };

    if (id) {
      load();
    }
  }, [id]);

  const canSubmit = useMemo(() => {
    if (!trip) return false;
    if (!isTripEnded(trip)) return false;
    return true;
  }, [trip]);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();

    const token = userSessionService.getToken();
    const profile = userSessionService.getUserProfile<{ id?: string; name?: string; firstName?: string; lastName?: string }>();

    if (!token) {
      setError("You must be logged in to submit a review.");
      return;
    }

    if (!trip) {
      setError("Trip not found.");
      return;
    }

    setSaving(true);
    setError("");

    try {
      await reviewService.submitReview({
        tripId: trip.id,
        userId: typeof profile?.id === "string" ? profile.id : "u1",
        userName: [profile?.firstName, profile?.lastName].filter(Boolean).join(" ").trim() || profile?.name || "Traveler",
        rating: draft.rating,
        comment: draft.comment.trim() || undefined,
      });

      const refreshed = await reviewService.getReviewsByTrip(trip.id);
      setReviews(refreshed.data);
      setMyReview(refreshed.data.find((review) => review.userId === (typeof profile?.id === "string" ? profile.id : "u1")) ?? null);
      setDraft((currentDraft) => ({ ...currentDraft, comment: "" }));
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : "Failed to submit your review.");
    } finally {
      setSaving(false);
    }
  };

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

  if (error && !trip) {
    return (
      <div>
        <Navbar />
        <main className="mx-auto max-w-7xl px-4 py-8 md:px-6">
          <EmptyState
            title={error === "You must be logged in to submit a review." ? "Authentication required" : "Trip not found"}
            description={error}
            action={
              error === "You must be logged in to submit a review." ? (
                <Button asChild>
                  <Link href="/login">Go to Login</Link>
                </Button>
              ) : (
                <Button variant="outline" onClick={() => router.back()}>
                  Go Back
                </Button>
              )
            }
          />
        </main>
      </div>
    );
  }

  if (!trip) {
    return null;
  }

  const ended = isTripEnded(trip);
  const destination = formatDestination(trip);
  const hasCurrentReview = Boolean(myReview);

  return (
    <div>
      <Navbar />
      <main className="mx-auto max-w-7xl space-y-8 px-4 py-8 md:px-6">
        <PageHeader
          title="Submit Review"
          description="Leave your rating for this trip. Your written feedback is optional, but the star rating is required."
        />

        <section className="grid gap-6 lg:grid-cols-[1.3fr_0.7fr]">
          <article className="space-y-6">
            <div className="border border-border bg-card p-6">
              <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                <div className="space-y-2">
                  <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">Trip details</p>
                  <h1 className="text-3xl font-semibold">{trip.tripName}</h1>
                  <p className="text-sm text-muted-foreground">{trip.description || "Trip review details and participant feedback."}</p>
                </div>
                <div className="flex flex-wrap gap-2 text-xs font-medium">
                  <span className={`rounded-full px-3 py-1 ${ended ? "bg-emerald-500/10 text-emerald-700" : "bg-amber-500/10 text-amber-700"}`}>
                    {ended ? "Completed" : "Upcoming"}
                  </span>
                  <span className="rounded-full bg-muted px-3 py-1 text-muted-foreground">{trip.status || "Trip"}</span>
                </div>
              </div>

              <div className="mt-5 grid gap-3 md:grid-cols-2">
                <div className="border border-border bg-background p-4">
                  <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">Destination</p>
                  <p className="mt-1 text-sm font-medium">{destination}</p>
                </div>
                <div className="border border-border bg-background p-4">
                  <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">Trip timing</p>
                  <p className="mt-1 text-sm font-medium">{formatDateTime(trip.startDate, trip.startTime)}</p>
                  <p className="text-sm text-muted-foreground">Ends {formatDateTime(trip.endDate, trip.endTime)}</p>
                </div>
                <div className="border border-border bg-background p-4">
                  <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">Organizer</p>
                  <p className="mt-1 text-sm font-medium">{trip.organizer}</p>
                </div>
                <div className="border border-border bg-background p-4">
                  <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">Capacity</p>
                  <p className="mt-1 text-sm font-medium">{trip.maxParticipants ?? "Not specified"}</p>
                </div>
              </div>
            </div>

            <div className="border border-border bg-card p-6">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">Your review</p>
                  <h2 className="text-xl font-semibold">Rate your experience</h2>
                </div>
                {hasCurrentReview ? <span className="rounded-full bg-emerald-500/10 px-3 py-1 text-xs font-medium text-emerald-700">Review already submitted</span> : null}
              </div>

              {canSubmit ? (
                <form className="mt-5 space-y-4" onSubmit={(event) => void handleSubmit(event)}>
                  <div className="space-y-2">
                    <label className="block text-sm font-medium">Your rating</label>
                    <div className="flex flex-wrap items-center gap-3">
                      <input
                        type="range"
                        min={1}
                        max={5}
                        value={draft.rating}
                        onChange={(event) => setDraft((currentDraft) => ({ ...currentDraft, rating: Number(event.target.value) }))}
                        className="w-full max-w-xs"
                      />
                      <RatingStars rating={draft.rating} />
                    </div>
                  </div>

                  <textarea
                    value={draft.comment}
                    onChange={(event) => setDraft((currentDraft) => ({ ...currentDraft, comment: event.target.value }))}
                    className="min-h-32 w-full border border-input bg-background px-3 py-2 text-sm"
                    placeholder="Optional feedback for other participants"
                  />

                  <div className="flex flex-wrap items-center gap-3">
                    <Button type="submit" disabled={saving}>
                      {saving ? "Submitting..." : hasCurrentReview ? "Update review" : "Submit review"}
                    </Button>
                    <p className="text-xs text-muted-foreground">Only the star rating is required. Written feedback is optional.</p>
                  </div>
                </form>
              ) : (
                <div className="mt-5 border border-border bg-muted/20 p-4 text-sm text-muted-foreground">
                  You can submit a review after the trip has ended.
                </div>
              )}

              {error ? <p className="mt-4 text-sm text-destructive">{error}</p> : null}
            </div>
          </article>

          <aside className="space-y-4">
            <div className="border border-border bg-card p-6">
              <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">Trip details</p>
              <div className="mt-3 space-y-2 text-sm text-muted-foreground">
                <p><span className="font-medium text-foreground">Trip:</span> {trip.tripName}</p>
                <p><span className="font-medium text-foreground">Destination:</span> {destination}</p>
                <p><span className="font-medium text-foreground">Dates:</span> {trip.startDate} to {trip.endDate}</p>
                <p><span className="font-medium text-foreground">Time:</span> {trip.startTime || "All day"} - {trip.endTime || "End of day"}</p>
                <p><span className="font-medium text-foreground">Organizer:</span> {trip.organizer}</p>
              </div>
            </div>

            <div className="border border-border bg-card p-6">
              <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">All reviews</p>
              <div className="mt-4 space-y-3">
                {reviews.length > 0 ? (
                  reviews.map((review) => (
                    <article key={review.id} className="border border-border bg-background p-4">
                      <div className="flex items-center justify-between gap-3">
                        <p className="font-medium">{review.userName}</p>
                        <RatingStars rating={review.rating} />
                      </div>
                      <p className="mt-2 text-sm text-muted-foreground">
                        {review.comment.trim() ? review.comment : "No written feedback provided."}
                      </p>
                      <p className="mt-2 text-xs text-muted-foreground">Posted on {formatDate(review.createdAt)}</p>
                    </article>
                  ))
                ) : (
                  <p className="text-sm text-muted-foreground">No reviews have been posted for this trip yet.</p>
                )}
              </div>
            </div>
          </aside>
        </section>
      </main>
      <Footer />
    </div>
  );
}