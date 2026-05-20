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
  const { tripsByStatus, fetchTrips, updateTripStatus, loadingTrips } = useAdminDataStore();

  useEffect(() => {
    void fetchTrips(filter);
  }, [fetchTrips, filter]);

  const trips = useMemo(() => tripsByStatus[filter] ?? [], [filter, tripsByStatus]);

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
    </div>
  );
}
