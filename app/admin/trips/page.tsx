"use client";

import Link from "next/link";
import { useEffect, useMemo } from "react";
import { useSearchParams } from "next/navigation";
import { StatusBadge } from "@/components/common/status-badge";
import { Button } from "@/components/ui/button";
import { useAdminDataStore } from "@/lib/stores/useAdminDataStore";
import { AdminTripStatus } from "@/lib/types";
import { formatCurrencyRs, formatDateLabel } from "@/lib/utils";

export default function AdminTripsPage() {
  const searchParams = useSearchParams();
  const filter = (searchParams.get("status") ?? "pending") as AdminTripStatus;
  const {
    tripsByStatus,
    onDemandTripsByStatus,
    fetchTrips,
    fetchOnDemandTrips,
    updateTripStatus,
    updateOnDemandTripStatus,
    loadingTrips,
  } = useAdminDataStore();

  useEffect(() => {
    void fetchTrips(filter);
    void fetchOnDemandTrips("pending");
    void fetchOnDemandTrips("in review");
  }, [fetchOnDemandTrips, fetchTrips, filter]);

  const trips = useMemo(() => tripsByStatus[filter] ?? [], [filter, tripsByStatus]);
  const onDemandPendingTrips = onDemandTripsByStatus.pending ?? [];
  const onDemandReviewTrips = onDemandTripsByStatus["in review"] ?? [];

  const canModerate = filter === "in review";
  const canSendToReview = filter === "pending";

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Trips Management</h1>
        <p className="mt-1 text-sm text-muted-foreground">Move pending trips to the review queue, then approve or reject trips in review.</p>
      </div>

      <div className="flex flex-wrap gap-2">
        {(["pending", "in review", "approved", "rejected", "draft"] as AdminTripStatus[]).map((status) => (
          <Button key={status} asChild variant={filter === status ? "default" : "outline"} size="sm">
            <Link href={`/admin/trips?status=${encodeURIComponent(status)}`}>{status}</Link>
          </Button>
        ))}
      </div>

      <div className="space-y-2">
        {trips.map((trip) => (
          <article key={trip.id} className="flex flex-col gap-3 border border-border bg-card p-4 md:flex-row md:items-center md:justify-between">
            <div>
              <p className="font-medium">{trip.tripName}</p>
              <p className="text-sm text-muted-foreground">{trip.startLocation} • {formatDateLabel(trip.startDate)}</p>
              <p className="mt-1 text-xs text-muted-foreground">{trip.tripCategory} • {formatCurrencyRs(trip.price)}</p>
            </div>
            <div className="flex items-center gap-2">
              <StatusBadge status={trip.status} />
              <Button size="sm" variant="outline" asChild>
                <Link href={`/admin/trips/${trip.id}`}>Review details</Link>
              </Button>
              {canSendToReview ? (
                <Button
                  size="sm"
                  onClick={() => void updateTripStatus(trip.id, "in review")}
                  disabled={loadingTrips}
                >
                  Move to review
                </Button>
              ) : null}
              {canModerate ? (
                <>
                  <Button size="sm" onClick={() => void updateTripStatus(trip.id, "approved")} disabled={loadingTrips}>
                    Approve
                  </Button>
                  <Button size="sm" variant="destructive" onClick={() => void updateTripStatus(trip.id, "rejected")} disabled={loadingTrips}>
                    Reject
                  </Button>
                </>
              ) : (
                <span className="text-xs text-muted-foreground">{canSendToReview ? "Queue only" : "Review only"}</span>
              )}
            </div>
          </article>
        ))}
        {!trips.length ? <p className="text-sm text-muted-foreground">No trips found for this status.</p> : null}
      </div>

      <section className="space-y-4 border-t border-border pt-6">
        <div>
          <h2 className="text-xl font-semibold">On-demand trip templates</h2>
          <p className="mt-1 text-sm text-muted-foreground">Approve or reject template requests separately from fixed-date trips.</p>
        </div>

        <div className="space-y-3">
          <h3 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">Pending</h3>
          {onDemandPendingTrips.map((trip) => (
            <article key={trip.id} className="flex flex-col gap-3 border border-border bg-card p-4 md:flex-row md:items-center md:justify-between">
              <div>
                <p className="font-medium">{trip.tripName}</p>
                <p className="text-sm text-muted-foreground">{trip.durationLabel} • {trip.startLocation || "On-demand template"}</p>
                <p className="mt-1 text-xs text-muted-foreground">{trip.tripCategory} • {formatCurrencyRs(trip.price)}</p>
              </div>
              <div className="flex items-center gap-2">
                <StatusBadge status={trip.status} />
                <Button size="sm" onClick={() => void updateOnDemandTripStatus(trip.id, "in review")} disabled={loadingTrips}>
                  Move to review
                </Button>
              </div>
            </article>
          ))}
          {!onDemandPendingTrips.length ? <p className="text-sm text-muted-foreground">No pending on-demand templates found.</p> : null}
        </div>

        <div className="space-y-3">
          <h3 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">In review</h3>
          {onDemandReviewTrips.map((trip) => (
            <article key={trip.id} className="flex flex-col gap-3 border border-border bg-card p-4 md:flex-row md:items-center md:justify-between">
              <div>
                <p className="font-medium">{trip.tripName}</p>
                <p className="text-sm text-muted-foreground">{trip.durationLabel} • {trip.startLocation || "On-demand template"}</p>
                <p className="mt-1 text-xs text-muted-foreground">{trip.tripCategory} • {formatCurrencyRs(trip.price)}</p>
              </div>
              <div className="flex items-center gap-2">
                <StatusBadge status={trip.status} />
                <Button size="sm" onClick={() => void updateOnDemandTripStatus(trip.id, "approved")} disabled={loadingTrips}>
                  Approve
                </Button>
                <Button size="sm" variant="destructive" onClick={() => void updateOnDemandTripStatus(trip.id, "rejected")} disabled={loadingTrips}>
                  Reject
                </Button>
              </div>
            </article>
          ))}
          {!onDemandReviewTrips.length ? <p className="text-sm text-muted-foreground">No on-demand templates are currently in review.</p> : null}
        </div>
      </section>
    </div>
  );
}
