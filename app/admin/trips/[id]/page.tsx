"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

import { adminService } from "@/lib/services/adminService";
import { AdminTripRecord } from "@/lib/types";
import { formatCurrencyRs, formatDateLabel, formatFirestoreTimestamp } from "@/lib/utils";
import { StatusBadge } from "@/components/common/status-badge";
import { Button } from "@/components/ui/button";

export default function AdminTripDetailPage({ params }: { params: { id: string } }) {
  const [trip, setTrip] = useState<AdminTripRecord | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const load = async () => {
      try {
        const response = await adminService.getTripById(params.id);
        setTrip(response.data);
      } catch (loadError) {
        setError(loadError instanceof Error ? loadError.message : "Failed to load trip details.");
      } finally {
        setLoading(false);
      }
    };

    void load();
  }, [params]);

  const handleStatusUpdate = async (status: "approved" | "rejected") => {
    if (!trip) return;

    setSaving(true);
    try {
      const response = await adminService.updateTripStatus(trip.id, status);
      setTrip(response.data);
    } catch (updateError) {
      setError(updateError instanceof Error ? updateError.message : "Failed to update trip status.");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <div className="p-6 text-sm text-muted-foreground">Loading trip details...</div>;
  }

  if (error) {
    return <div className="p-6 text-sm text-rose-600">{error}</div>;
  }

  if (!trip) {
    return <div className="p-6 text-sm text-muted-foreground">Trip not found.</div>;
  }

  const canModerate = trip.status === "pending";

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
        <div>
          <Button variant="outline" size="sm" asChild>
            <Link href="/admin/trips?status=pending">Back to trips</Link>
          </Button>
          <h1 className="mt-4 text-2xl font-semibold">{trip.tripName}</h1>
          <p className="mt-1 text-sm text-muted-foreground">Full review view for admin moderation.</p>
        </div>
        <StatusBadge status={trip.status} />
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <article className="border border-border bg-card p-4 lg:col-span-2">
          <h2 className="font-semibold">Trip Summary</h2>
          <div className="mt-3 grid gap-3 text-sm md:grid-cols-2">
            <p><span className="text-muted-foreground">Category:</span> {trip.tripCategory}</p>
            <p><span className="text-muted-foreground">Price:</span> {formatCurrencyRs(trip.price)}</p>
            <p><span className="text-muted-foreground">Start:</span> {formatDateLabel(trip.startDate)} {trip.startTime ? `at ${trip.startTime}` : ""}</p>
            <p><span className="text-muted-foreground">End:</span> {formatDateLabel(trip.endDate)} {trip.endTime ? `at ${trip.endTime}` : ""}</p>
            <p><span className="text-muted-foreground">Start location:</span> {trip.startLocation}</p>
            <p><span className="text-muted-foreground">Max participants:</span> {trip.maxParticipants}</p>
          </div>
          <p className="mt-4 text-sm text-muted-foreground">{trip.description}</p>
        </article>

        <article className="border border-border bg-card p-4">
          <h2 className="font-semibold">Review Actions</h2>
          <p className="mt-2 text-sm text-muted-foreground">Created {formatFirestoreTimestamp(trip.createdAt)}</p>
          <p className="mt-1 text-sm text-muted-foreground">Updated {formatFirestoreTimestamp(trip.updatedAt)}</p>
          <div className="mt-4 flex flex-col gap-2">
            {canModerate ? (
              <>
                <Button onClick={() => void handleStatusUpdate("approved")} disabled={saving}>Approve trip</Button>
                <Button variant="destructive" onClick={() => void handleStatusUpdate("rejected")} disabled={saving}>Reject trip</Button>
              </>
            ) : (
              <p className="text-sm text-muted-foreground">This trip is read-only in admin review mode.</p>
            )}
          </div>
        </article>
      </div>

      <section className="grid gap-4 lg:grid-cols-2">
        <article className="border border-border bg-card p-4">
          <h2 className="font-semibold">Destinations</h2>
          <div className="mt-3 space-y-3 text-sm">
            {trip.destinations.map((destination) => (
              <div key={destination.name} className="border border-border p-3">
                <p className="font-medium">{destination.name}</p>
                <p className="text-muted-foreground">{destination.description}</p>
              </div>
            ))}
          </div>
        </article>
        <article className="border border-border bg-card p-4">
          <h2 className="font-semibold">Audit</h2>
          <div className="mt-3 space-y-2 text-sm text-muted-foreground">
            <p>ID: {trip.id}</p>
            <p>Organizer: {trip.organizer}</p>
            <p>Photos: {trip.photos.length}</p>
            <p>Participants: {trip.participants?.length ?? 0}</p>
          </div>
        </article>
      </section>
    </div>
  );
}