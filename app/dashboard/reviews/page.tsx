"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { PageHeader } from "@/components/common/page-header";
import { RatingStars } from "@/components/common/rating-stars";
import { EmptyState } from "@/components/feedback/empty-state";
import { CardSkeletonGrid } from "@/components/feedback/loading-skeletons";
import { Button } from "@/components/ui/button";
import { reviewService } from "@/lib/services/review-service";
import type { OrganizedTripReviewSummary } from "@/lib/services/review-service";
import { userSessionService } from "@/lib/services/userSessionService";

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

export default function ReviewsPage() {
  const currentUser = useMemo(() => userSessionService.getUserProfile<{ id?: string; name?: string }>(), []);
  const [summaries, setSummaries] = useState<OrganizedTripReviewSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let mounted = true;

    const load = async () => {
      setLoading(true);
      setError("");

      try {
        const response = await reviewService.getOrganizedTripReviewSummaries(typeof currentUser?.id === "string" ? currentUser.id : "u1");
        if (mounted) {
          setSummaries(response.data);
        }
      } catch (loadError) {
        if (mounted) {
          setError(loadError instanceof Error ? loadError.message : "Failed to load organized trip reviews.");
        }
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    };

    void load();

    return () => {
      mounted = false;
    };
  }, [currentUser?.id]);

  const metrics = useMemo(() => {
    const totalReviews = summaries.reduce((count, summary) => count + summary.reviewCount, 0);
    return {
      totalTrips: summaries.length,
      totalReviews,
      tripsWithReviews: summaries.filter((summary) => summary.reviewCount > 0).length,
    };
  }, [summaries]);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Trip Reviews"
        description="Reviews for trips you organized. This view includes completed trips and shows who posted each review."
        actions={<Button asChild><Link href="/dashboard">Back to Dashboard</Link></Button>}
      />

      <div className="grid gap-3 md:grid-cols-3">
        <div className="border border-border bg-card p-4">
          <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">Organized trips</p>
          <p className="mt-2 text-2xl font-semibold">{metrics.totalTrips}</p>
        </div>
        <div className="border border-border bg-card p-4">
          <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">Trips with reviews</p>
          <p className="mt-2 text-2xl font-semibold">{metrics.tripsWithReviews}</p>
        </div>
        <div className="border border-border bg-card p-4">
          <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">Total reviews</p>
          <p className="mt-2 text-2xl font-semibold">{metrics.totalReviews}</p>
        </div>
      </div>

      {loading ? <CardSkeletonGrid /> : null}

      {!loading && error ? <EmptyState title="Failed to load reviews" description={error} /> : null}

      {!loading && !error && summaries.length === 0 ? (
        <div className="border border-border bg-card p-5 text-sm text-muted-foreground">
          No organized trips were found yet.
        </div>
      ) : null}

      <section className="space-y-4">
        {summaries.map((summary) => (
          <article key={summary.trip.id} className="border border-border bg-card p-5">
            <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
              <div className="space-y-1">
                <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">{summary.trip.status || "Trip"}</p>
                <h2 className="text-xl font-semibold">{summary.trip.tripName}</h2>
                <p className="text-sm text-muted-foreground">
                  {summary.trip.destinations?.[0]?.name ?? summary.trip.startLocation} · {formatDateRange(summary.trip.startDate, summary.trip.endDate)} · {summary.participantCount} participant{summary.participantCount === 1 ? "" : "s"}
                </p>
              </div>

              <div className="flex flex-wrap gap-2 text-xs font-medium">
                <span className="rounded-full bg-muted px-3 py-1 text-muted-foreground">{summary.reviewCount} review{summary.reviewCount === 1 ? "" : "s"}</span>
                <span className={`rounded-full px-3 py-1 ${new Date(`${summary.trip.endDate}T${summary.trip.endTime ?? "23:59:59.999"}`) < new Date() ? "bg-emerald-500/10 text-emerald-700" : "bg-amber-500/10 text-amber-700"}`}>
                  {new Date(`${summary.trip.endDate}T${summary.trip.endTime ?? "23:59:59.999"}`) < new Date() ? "Completed" : "Upcoming"}
                </span>
              </div>
            </div>

            <div className="mt-5 grid gap-5 lg:grid-cols-[0.9fr_1.1fr]">
              <aside className="space-y-3 border border-border bg-muted/20 p-4 text-sm text-muted-foreground">
                <div>
                  <p className="text-xs uppercase tracking-[0.2em]">Trip timing</p>
                  <p className="mt-1 text-sm text-foreground">
                    {formatDate(summary.trip.startDate)} to {formatDate(summary.trip.endDate)}
                  </p>
                  <p>{summary.trip.startTime ?? "All day"} - {summary.trip.endTime ?? "End of day"}</p>
                </div>
                <div>
                  <p className="text-xs uppercase tracking-[0.2em]">Organizer</p>
                  <p className="mt-1 text-sm text-foreground">{summary.trip.organizer}</p>
                </div>
                <div>
                  <p className="text-xs uppercase tracking-[0.2em]">Destination</p>
                  <p className="mt-1 text-sm text-foreground">{summary.trip.destinations?.[0]?.name ?? summary.trip.startLocation}</p>
                </div>
                <div>
                  <p className="text-xs uppercase tracking-[0.2em]">Trip details</p>
                  <p className="mt-1 text-sm text-foreground">{summary.trip.description || "No description provided."}</p>
                </div>
              </aside>

              <div className="space-y-3">
                <div className="flex items-center justify-between gap-3">
                  <h3 className="text-sm font-semibold uppercase tracking-[0.2em] text-muted-foreground">Reviews</h3>
                </div>

                {summary.reviews.length > 0 ? (
                  summary.reviews.map((review) => (
                    <article key={review.id} className="border border-border bg-background p-4">
                      <div className="flex flex-col gap-2 md:flex-row md:items-start md:justify-between">
                        <div>
                          <p className="font-medium">{review.userName}</p>
                          <p className="text-xs text-muted-foreground">Posted on {formatDate(review.createdAt)}</p>
                        </div>
                        <RatingStars rating={review.rating} />
                      </div>
                      <p className="mt-3 text-sm text-muted-foreground">
                        {review.comment.trim() ? review.comment : "No written feedback provided."}
                      </p>
                    </article>
                  ))
                ) : (
                  <div className="border border-dashed border-border bg-background p-4 text-sm text-muted-foreground">
                    No reviews have been posted for this trip yet.
                  </div>
                )}
              </div>
            </div>
          </article>
        ))}
      </section>
    </div>
  );
}
