"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useParams } from "next/navigation";

import { adminService } from "@/lib/services/adminService";
import { AdminTripRecord } from "@/lib/types";
import { formatCurrencyRs, formatDateLabel, formatFirestoreTimestamp } from "@/lib/utils";
import { StatusBadge } from "@/components/common/status-badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Modal } from "@/components/common/modal";

export default function AdminTripDetailPage() {
  const params = useParams<{ id: string }>();
  const [trip, setTrip] = useState<AdminTripRecord | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pendingStatus, setPendingStatus] = useState<"approved" | "rejected" | null>(null);
  const [reviewReason, setReviewReason] = useState("");

  useEffect(() => {
    const load = async () => {
      if (!params?.id) {
        setError("Missing trip id.");
        setLoading(false);
        return;
      }

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
  }, [params?.id]);

  const handleStatusUpdate = async (status: "approved" | "rejected", reason: string) => {
    if (!trip) return;

    setSaving(true);
    try {
      const response = await adminService.updateTripStatus(trip.id, status, reason);
      setTrip(response.data);
      setPendingStatus(null);
      setReviewReason("");
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
            <p><span className="text-muted-foreground">Payment methods:</span> {trip.paymentMethods?.length ? trip.paymentMethods.join(", ") : "-"}</p>
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
                <Button onClick={() => setPendingStatus("approved")} disabled={saving}>Approve</Button>
                <Button variant="destructive" onClick={() => setPendingStatus("rejected")} disabled={saving}>Reject</Button>
              </>
            ) : (
              <p className="text-sm text-muted-foreground">This trip is read-only in admin review mode.</p>
            )}
          </div>
        </article>
      </div>

      <section className="grid gap-4 lg:grid-cols-2">
        <article className="border border-border bg-card p-4">
          <h2 className="font-semibold">Photos</h2>
          <div className="mt-3 grid grid-cols-2 gap-3 md:grid-cols-3">
            {[trip.coverImage, ...trip.photos].filter(Boolean).map((photo, index) => (
              <img
                key={`${photo}-${index}`}
                src={photo}
                alt={`${trip.tripName} photo ${index + 1}`}
                className="h-32 w-full rounded object-cover border border-border"
              />
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
            <p>Status: {trip.status}</p>
          </div>
        </article>
      </section>

      <section className="grid gap-4 lg:grid-cols-2">
        <article className="border border-border bg-card p-4">
          <h2 className="font-semibold">Destinations</h2>
          <div className="mt-3 space-y-4 text-sm">
            {trip.destinations.map((destination) => (
              <div key={destination.name} className="space-y-3 border border-border p-3">
                <div>
                  <p className="font-medium">{destination.name}</p>
                  <p className="text-muted-foreground">{destination.description}</p>
                </div>
                {destination.photos?.length ? (
                  <div className="grid grid-cols-2 gap-2 md:grid-cols-3">
                    {destination.photos.map((photo, index) => (
                      <img key={`${destination.name}-${index}`} src={photo} alt={destination.name} className="h-24 w-full rounded object-cover border border-border" />
                    ))}
                  </div>
                ) : null}
                {destination.geoCode ? (
                  <p className="text-xs text-muted-foreground">
                    {destination.geoCode.latitude}, {destination.geoCode.longitude}
                  </p>
                ) : null}
              </div>
            ))}
          </div>
        </article>

        <article className="border border-border bg-card p-4">
          <h2 className="font-semibold">Main Destinations</h2>
          <div className="mt-3 space-y-3 text-sm">
            {trip.mainDestinations?.length ? (
              trip.mainDestinations.map((destination) => (
                <div key={destination.name} className="border border-border p-3">
                  <p className="font-medium">{destination.name}</p>
                  <p className="text-xs text-muted-foreground">
                    {destination.lat}, {destination.lng}
                  </p>
                </div>
              ))
            ) : (
              <p className="text-sm text-muted-foreground">No main destinations provided.</p>
            )}
          </div>
        </article>
      </section>

      <section className="grid gap-4 lg:grid-cols-2">
        <article className="border border-border bg-card p-4">
          <h2 className="font-semibold">Itinerary</h2>
          <div className="mt-3 space-y-4 text-sm">
            {trip.itinerary?.days?.length ? (
              trip.itinerary.days.map((day) => (
                <div key={day.day} className="space-y-3 border border-border p-3">
                  <p className="font-medium">{day.title}</p>
                  <div className="space-y-2">
                    {day.activities.map((activity, index) => (
                      <div key={`${day.day}-${index}`} className="border border-border p-2">
                        <p className="font-medium">{activity.title}</p>
                        <p className="text-xs text-muted-foreground">
                          {activity.timeSlot.startTime} - {activity.timeSlot.endTime}
                        </p>
                        {activity.notes?.length ? <p className="mt-1 text-xs text-muted-foreground">{activity.notes.join(" • ")}</p> : null}
                      </div>
                    ))}
                  </div>
                </div>
              ))
            ) : (
              <p className="text-sm text-muted-foreground">No itinerary provided.</p>
            )}
          </div>
        </article>

        <article className="border border-border bg-card p-4">
          <h2 className="font-semibold">Included / Participants</h2>
          <div className="mt-3 space-y-4 text-sm">
            <div>
              <p className="font-medium">Hotel facilities</p>
              <p className="text-muted-foreground">{trip.included?.hotelFacilities?.join(", ") || "-"}</p>
            </div>
            <div>
              <p className="font-medium">Transport facilities</p>
              <p className="text-muted-foreground">{trip.included?.transportFacilities?.join(", ") || "-"}</p>
            </div>
            <div>
              <p className="font-medium">Other inclusions</p>
              <p className="text-muted-foreground">{trip.included?.otherInclusions?.join(", ") || "-"}</p>
            </div>
            <div>
              <p className="font-medium">Exclusions</p>
              <p className="text-muted-foreground">{trip.included?.exclusions?.join(", ") || "-"}</p>
            </div>
            <div>
              <p className="font-medium">Participants</p>
              <p className="text-muted-foreground">{trip.participants?.length ?? 0} participant records</p>
            </div>
          </div>
        </article>
      </section>

      <Modal
        open={pendingStatus !== null}
        title={pendingStatus === "approved" ? "Approve trip" : "Reject trip"}
        description="Enter a reason before updating the trip status."
        confirmText={pendingStatus === "approved" ? "Approve" : "Reject"}
        onClose={() => {
          setPendingStatus(null);
          setReviewReason("");
        }}
        onConfirm={() => {
          if (!pendingStatus) return;
          if (!reviewReason.trim()) return;
          void handleStatusUpdate(pendingStatus, reviewReason.trim());
        }}
      >
        <div className="space-y-3">
          <Input value={reviewReason} onChange={(event) => setReviewReason(event.target.value)} placeholder="Reason for this decision" />
          <p className="text-xs text-muted-foreground">This reason is sent with the status update request.</p>
        </div>
      </Modal>
    </div>
  );
}