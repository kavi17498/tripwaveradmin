"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import { PageHeader } from "@/components/common/page-header";
import { RatingStars } from "@/components/common/rating-stars";
import { Button } from "@/components/ui/button";
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

const formatDateRange = (startDate: string, endDate: string) => {
  return `${formatDate(startDate)} - ${formatDate(endDate)}`;
};

const resolveUserProfile = () => {
  const profile = userSessionService.getUserProfile<Record<string, unknown>>();
  const firstName = typeof profile?.firstName === "string" ? profile.firstName : "";
  const lastName = typeof profile?.lastName === "string" ? profile.lastName : "";
  const fullName = [firstName, lastName].filter(Boolean).join(" ").trim();
  const fallbackName = typeof profile?.name === "string" ? profile.name : "Maya Fernandes";

  return {
    id: typeof profile?.id === "string" ? profile.id : "u1",
    name: fullName || fallbackName,
  };
};

export default function ReviewsPage() {
  const currentUser = useMemo(resolveUserProfile, []);
  const [summaries, setSummaries] = useState<ParticipantReviewSummary[]>([]);
  const [drafts, setDrafts] = useState<Record<string, ReviewDraft>>({});
  const [loading, setLoading] = useState(true);
  const [submittingTripId, setSubmittingTripId] = useState<string | null>(null);
  const [error, setError] = useState("");

  const loadReviews = async () => {
    setLoading(true);
    setError("");

    try {
      const response = await reviewService.getParticipantReviewSummaries(currentUser.id);
      setSummaries(response.data);

      setDrafts((currentDrafts) => {
        const nextDrafts = { ...currentDrafts };

        for (const summary of response.data) {
          if (!nextDrafts[summary.trip.id]) {
            nextDrafts[summary.trip.id] = {
              rating: summary.myReview?.rating ?? 4,
              comment: summary.myReview?.comment ?? "",
            };
          }
        }

        return nextDrafts;
      });
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : "Failed to load your trip reviews.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadReviews();
  }, [currentUser.id]);

  const metrics = useMemo(() => {
    const completedTrips = summaries.filter((summary) => summary.tripEnded);
    return {
      totalTrips: summaries.length,
      reviewableTrips: completedTrips.filter((summary) => summary.canReview).length,
      submittedReviews: completedTrips.filter((summary) => summary.myReview).length,
    };
  }, [summaries]);

  const updateDraft = (tripId: string, patch: Partial<ReviewDraft>) => {
    setDrafts((currentDrafts) => ({
      ...currentDrafts,
      [tripId]: {
        rating: currentDrafts[tripId]?.rating ?? 4,
        comment: currentDrafts[tripId]?.comment ?? "",
        ...patch,
      },
    }));
  };

  const submitReview = async (event: FormEvent, tripId: string) => {
    event.preventDefault();

    const summary = summaries.find((item) => item.trip.id === tripId);
    const draft = drafts[tripId] ?? { rating: 4, comment: "" };
    const comment = draft.comment.trim();

    if (!summary || !comment) {
      setError("Add a review comment before submitting.");
      return;
    }

    setSubmittingTripId(tripId);
    setError("");

    try {
      await reviewService.submitReview({
        tripId,
        userId: currentUser.id,
        userName: currentUser.name,
        rating: draft.rating,
        comment,
      });

      await loadReviews();
      setDrafts((currentDrafts) => ({
        ...currentDrafts,
        [tripId]: { rating: 4, comment: "" },
      }));
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : "Failed to submit your review.");
    } finally {
      setSubmittingTripId(null);
    }
  };

  const getTripStatusLabel = (summary: ParticipantReviewSummary) => {
    if (summary.myReview) return "Review posted";
    if (!summary.tripEnded) return "Review unlocks after the trip ends";
    if (summary.canReview) return "Ready for review";
    return "Waiting for approval";
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Trip Reviews"
        description="Reviews open after a trip ends. When that happens, participants get a reminder and can post their experience here."
      />

      <div className="grid gap-3 md:grid-cols-3">
        <div className="border border-border bg-card p-4">
          <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">Your trips</p>
          <p className="mt-2 text-2xl font-semibold">{metrics.totalTrips}</p>
        </div>
        <div className="border border-border bg-card p-4">
          <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">Ready to review</p>
          <p className="mt-2 text-2xl font-semibold">{metrics.reviewableTrips}</p>
        </div>
        <div className="border border-border bg-card p-4">
          <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">Submitted reviews</p>
          <p className="mt-2 text-2xl font-semibold">{metrics.submittedReviews}</p>
        </div>
      </div>

      {loading ? <div className="border border-border bg-card p-5 text-sm text-muted-foreground">Loading your trip reviews...</div> : null}

      {!loading && error ? <div className="border border-border bg-card p-5 text-sm text-destructive">{error}</div> : null}

      {!loading && !error && summaries.length === 0 ? (
        <div className="border border-border bg-card p-5 text-sm text-muted-foreground">
          No participated trips were found yet. Once you join a trip, the review form will appear after that trip ends.
        </div>
      ) : null}

      <section className="space-y-4">
        {summaries.map((summary) => {
          const draft = drafts[summary.trip.id] ?? {
            rating: summary.myReview?.rating ?? 4,
            comment: summary.myReview?.comment ?? "",
          };
          const statusLabel = getTripStatusLabel(summary);

          return (
            <article key={summary.trip.id} className="border border-border bg-card p-5">
              <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                <div className="space-y-1">
                  <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">{statusLabel}</p>
                  <h2 className="text-xl font-semibold">{summary.trip.title}</h2>
                  <p className="text-sm text-muted-foreground">
                    {summary.trip.destination} · {formatDateRange(summary.trip.startDate, summary.trip.endDate)} · {summary.participantCount} participant
                    {summary.participantCount === 1 ? "" : "s"}
                  </p>
                </div>

                <div className="flex flex-wrap gap-2 text-xs font-medium">
                  <span className={`rounded-full px-3 py-1 ${summary.tripEnded ? "bg-emerald-500/10 text-emerald-700" : "bg-amber-500/10 text-amber-700"}`}>
                    {summary.tripEnded ? "Completed" : "Upcoming"}
                  </span>
                  <span className="rounded-full bg-muted px-3 py-1 text-muted-foreground">{summary.booking.status}</span>
                </div>
              </div>

              <div className="mt-5 grid gap-5 lg:grid-cols-[1.2fr_0.8fr]">
                <div className="space-y-4">
                  {summary.myReview ? (
                    <div className="border border-border bg-muted/20 p-4">
                      <div className="flex items-center justify-between gap-3">
                        <div>
                          <p className="text-sm font-semibold">Your review is posted</p>
                          <p className="text-xs text-muted-foreground">Submitted after the trip ended.</p>
                        </div>
                        <RatingStars rating={summary.myReview.rating} />
                      </div>
                      <p className="mt-3 text-sm text-muted-foreground">{summary.myReview.comment}</p>
                    </div>
                  ) : summary.canReview ? (
                    <form className="space-y-3" onSubmit={(event) => void submitReview(event, summary.trip.id)}>
                      <div className="space-y-2">
                        <label className="block text-sm font-medium">Your rating</label>
                        <div className="flex flex-wrap items-center gap-3">
                          <input
                            type="range"
                            min={1}
                            max={5}
                            value={draft.rating}
                            onChange={(event) => updateDraft(summary.trip.id, { rating: Number(event.target.value) })}
                            className="w-full max-w-xs"
                          />
                          <RatingStars rating={draft.rating} />
                        </div>
                      </div>

                      <textarea
                        value={draft.comment}
                        onChange={(event) => updateDraft(summary.trip.id, { comment: event.target.value })}
                        className="min-h-28 w-full border border-input bg-background px-3 py-2 text-sm"
                        placeholder="Tell other participants what the trip was like"
                      />

                      <div className="flex flex-wrap items-center gap-3">
                        <Button type="submit" disabled={submittingTripId === summary.trip.id}>
                          {submittingTripId === summary.trip.id ? "Submitting..." : "Submit review"}
                        </Button>
                        <p className="text-xs text-muted-foreground">
                          A reminder notification is sent automatically when the trip ends.
                        </p>
                      </div>
                    </form>
                  ) : (
                    <div className="border border-border bg-muted/20 p-4 text-sm text-muted-foreground">
                      {summary.tripEnded
                        ? "This booking is not approved yet, so the review form is still locked."
                        : "You will be able to post your review once the trip end date and time have passed."}
                    </div>
                  )}

                  <div className="space-y-2">
                    <h3 className="text-sm font-semibold uppercase tracking-[0.2em] text-muted-foreground">Trip reviews</h3>
                    {summary.reviews.length > 0 ? (
                      summary.reviews.map((review: ParticipantReviewSummary["reviews"][number]) => (
                        <article key={review.id} className="border border-border bg-background p-4">
                          <div className="flex items-center justify-between gap-3">
                            <p className="font-medium">{review.userName}</p>
                            <RatingStars rating={review.rating} />
                          </div>
                          <p className="mt-2 text-sm text-muted-foreground">{review.comment}</p>
                          <p className="mt-2 text-xs text-muted-foreground">Posted on {formatDate(review.createdAt)}</p>
                        </article>
                      ))
                    ) : (
                      <div className="border border-dashed border-border bg-background p-4 text-sm text-muted-foreground">
                        No reviews have been posted for this trip yet.
                      </div>
                    )}
                  </div>
                </div>

                <aside className="space-y-3 border border-border bg-muted/20 p-4 text-sm text-muted-foreground">
                  <div>
                    <p className="text-xs uppercase tracking-[0.2em]">Reminder status</p>
                    <p className="mt-1 text-sm text-foreground">{summary.reminderSent ? "Reminder queued" : "Reminder not needed"}</p>
                  </div>
                  <div>
                    <p className="text-xs uppercase tracking-[0.2em]">Your booking</p>
                    <p className="mt-1 text-sm text-foreground">{summary.booking.participantName}</p>
                    <p>{summary.booking.participantEmail}</p>
                    <p className="mt-1">Seats booked: {summary.booking.seats}</p>
                  </div>
                  <div>
                    <p className="text-xs uppercase tracking-[0.2em]">Trip timing</p>
                    <p className="mt-1 text-sm text-foreground">
                      {formatDate(summary.trip.startDate)} to {formatDate(summary.trip.endDate)}
                    </p>
                    <p>{summary.trip.startTime ?? "All day"} - {summary.trip.endTime ?? "End of day"}</p>
                  </div>
                </aside>
              </div>
            </article>
          );
        })}
      </section>
    </div>
  );
}
