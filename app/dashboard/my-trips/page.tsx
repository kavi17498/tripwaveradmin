"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import { PageHeader } from "@/components/common/page-header";
import { Modal } from "@/components/common/modal";
import { SavingOverlay } from "@/components/common/saving-overlay";
import { StatusBadge } from "@/components/common/status-badge";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/feedback/toast-provider";
import { userSessionService } from "@/lib/services/userSessionService";
import { tripApiService, type TripApiItem } from "@/lib/services/tripApiService";
import { onDemandTripService } from "@/lib/services/onDemandTripService";
import type { CreateTripApiPayload } from "@/lib/types";

type TripDisplayStatus = "all" | "pending" | "approved" | "rejected" | "expired" | "cancelled" | "draft";

type TripParticipantRecord = NonNullable<TripApiItem["participants"]>[number];

type ShareNavigator = Navigator & {
  share?: (data: { title?: string; url?: string }) => Promise<void>;
};

const statusFilters: Array<{ value: TripDisplayStatus; label: string }> = [
  { value: "all", label: "All trips" },
  { value: "pending", label: "Pending" },
  { value: "approved", label: "Approved" },
  { value: "rejected", label: "Rejected" },
  { value: "expired", label: "Expired" },
  { value: "cancelled", label: "Cancelled" },
  { value: "draft", label: "Drafts" },
];

const normalizeStatus = (status?: string) => {
  if (status === "in review") return "pending";
  return status ?? "draft";
};

const getTripDisplayStatus = (trip: TripApiItem): Exclude<TripDisplayStatus, "all"> => {
  if (trip.status === "cancelled") return "cancelled";
  if (trip.status === "draft") return "draft";
  if (trip.status === "rejected") return "rejected";
  if (trip.status === "approved" && isTripExpired(trip)) return "expired";
  if (trip.status === "approved") return "approved";
  if (trip.status === "pending" || trip.status === "in review") return "pending";
  return normalizeStatus(trip.status) as Exclude<TripDisplayStatus, "all">;
};

const getTripDestination = (trip: TripApiItem) => trip.mainDestinations?.[0]?.name ?? trip.destinations?.[0]?.name ?? trip.startLocation ?? "Unknown destination";

const countParticipantsByStatus = (participants: TripParticipantRecord[] | undefined) => {
  const list = participants ?? [];
  return {
    total: list.length,
    accepted: list.filter((participant) => participant.status === "accepted").length,
    pending: list.filter((participant) => participant.status === "pending").length,
    rejected: list.filter((participant) => participant.status === "rejected").length,
  };
};

const getLocalDateString = (date: Date) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

const isTripExpired = (trip: TripApiItem) => {
  const endOfDay = new Date(`${trip.endDate}T23:59:59.999`);
  return Number.isNaN(endOfDay.getTime()) ? false : new Date() > endOfDay;
};

export default function MyTripsPage() {
  const { pushToast } = useToast();
  const [shareOpen, setShareOpen] = useState(false);
  const [shareUrl, setShareUrl] = useState("");
  const [statusFilter, setStatusFilter] = useState<TripDisplayStatus>("all");
  const [trips, setTrips] = useState<TripApiItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [duplicateModalOpen, setDuplicateModalOpen] = useState(false);
  const [selectedTripDetails, setSelectedTripDetails] = useState<TripApiItem | null>(null);
  const [loadingDetails, setLoadingDetails] = useState(false);
  const [selectedNewStartDate, setSelectedNewStartDate] = useState<Date | null>(null);
  const [viewDate, setViewDate] = useState(() => new Date());
  const [duplicating, setDuplicating] = useState(false);
  const [detailsModalOpen, setDetailsModalOpen] = useState(false);
  const [cancelModalOpen, setCancelModalOpen] = useState(false);
  const [cancelReason, setCancelReason] = useState("");
  const [canceling, setCanceling] = useState(false);

  const loadTrips = useCallback(async () => {
    const token = userSessionService.getToken();
    if (!token) {
      setError("Missing auth token. Please login again.");
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError("");
      
      const [tripsResponse, onDemandResponse] = await Promise.all([
        tripApiService.getMyTrips(token),
        (async () => {
          const profile = userSessionService.getUserProfile<{ id?: string }>();
          if (profile?.id) {
            try {
              const res = await onDemandTripService.getTemplatesByOrganizer(profile.id, token);
              return res.data || [];
            } catch {
              return [];
            }
          }
          return [];
        })(),
      ]);

      const combinedTrips = [
        ...(tripsResponse.data || []),
        ...(onDemandResponse || []).map((t) => ({
          ...t,
          tripCategory: t.tripCategory || "On-demand trip",
        })),
      ];

      setTrips(combinedTrips as any[]);
    } catch (loadError) {
      const message = loadError instanceof Error ? loadError.message : "Failed to load trips.";
      setError(message);
      pushToast({ type: "error", title: "Load failed", description: message });
    } finally {
      setLoading(false);
    }
  }, [pushToast]);

  useEffect(() => {
    void loadTrips();
  }, [loadTrips]);

  const loadTripDetails = async (tripId: string) => {
    const token = userSessionService.getToken();
    if (!token) return;

    setLoadingDetails(true);
    setSelectedNewStartDate(null);
    setViewDate(new Date());

    try {
      const res = await tripApiService.getTripById(tripId, token);
      if (!res.data) {
        try {
          const templateRes = await onDemandTripService.getTemplateById(tripId);
          if (templateRes.data) {
            setSelectedTripDetails(templateRes.data as any);
            return templateRes.data;
          }
        } catch {
          // ignore
        }
        pushToast({ type: "error", title: "Error", description: "Trip details not found." });
        return null;
      }

      setSelectedTripDetails(res.data);
      return res.data;
    } catch (err) {
      try {
        const templateRes = await onDemandTripService.getTemplateById(tripId);
        if (templateRes.data) {
          setSelectedTripDetails(templateRes.data as any);
          return templateRes.data;
        }
      } catch {
        // ignore
      }
      const message = err instanceof Error ? err.message : "Failed to load trip details.";
      pushToast({ type: "error", title: "Error", description: message });
      return null;
    } finally {
      setLoadingDetails(false);
    }
  };

  const handleOpenDuplicate = async (tripId: string) => {
    const trip = await loadTripDetails(tripId);
    if (trip) {
      setDuplicateModalOpen(true);
    }
  };

  const handleOpenDetails = async (tripId: string) => {
    const trip = await loadTripDetails(tripId);
    if (trip) {
      setDetailsModalOpen(true);
    }
  };

  const handleOpenCancel = async (tripId: string) => {
    const trip = await loadTripDetails(tripId);
    if (trip) {
      setCancelReason(trip.statusReason ?? "");
      setCancelModalOpen(true);
    }
  };

  const handlePostTrip = async () => {
    if (!selectedTripDetails || !selectedNewStartDate) return;

    const token = userSessionService.getToken();
    if (!token) return;

    setDuplicating(true);
    try {
      const origStart = new Date(selectedTripDetails.startDate + "T00:00:00");
      const origEnd = new Date(selectedTripDetails.endDate + "T00:00:00");
      const durationMs = origEnd.getTime() - origStart.getTime();

      const newStartStr = getLocalDateString(selectedNewStartDate);
      const newEndStr = getLocalDateString(new Date(selectedNewStartDate.getTime() + durationMs));

      const payload: CreateTripApiPayload = {
        tripName: selectedTripDetails.tripName,
        tripCategory: selectedTripDetails.tripCategory as CreateTripApiPayload["tripCategory"],
        paymentMethods: selectedTripDetails.paymentMethods ?? [],
        destinations: selectedTripDetails.destinations,
        mainDestinations: selectedTripDetails.mainDestinations,
        startDate: newStartStr,
        endDate: newEndStr,
        startTime: selectedTripDetails.startTime ?? "",
        endTime: selectedTripDetails.endTime,
        startLocation: selectedTripDetails.startLocation,
        organizer: selectedTripDetails.organizer,
        price: selectedTripDetails.price ?? 0,
        itinerary: (selectedTripDetails.itinerary ?? { days: [] }) as CreateTripApiPayload["itinerary"],
        included: (selectedTripDetails.included ?? {
          hotelFacilities: [],
          transportFacilities: [],
          otherInclusions: [],
          exclusions: [],
        }) as CreateTripApiPayload["included"],
        photos: selectedTripDetails.photos ?? [],
        coverImage: selectedTripDetails.coverImage ?? "",
        description: selectedTripDetails.description ?? "",
        maxParticipants: selectedTripDetails.maxParticipants ?? 0,
        status: "pending",
        participants: [],
        pickupType: selectedTripDetails.pickupType ?? "Meet at Location",
        ...(selectedTripDetails.pickupCostPerKm !== undefined ? { pickupCostPerKm: selectedTripDetails.pickupCostPerKm } : {}),
        ...(selectedTripDetails.pickupStartLocation ? { pickupStartLocation: selectedTripDetails.pickupStartLocation } : {}),
      };

      await tripApiService.createTrip(payload, token);

      pushToast({
        type: "success",
        title: "Success",
        description: "Trip copied and posted successfully. Status is pending.",
      });

      setDuplicateModalOpen(false);
      void loadTrips();
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to duplicate trip.";
      pushToast({ type: "error", title: "Error", description: message });
    } finally {
      setDuplicating(false);
    }
  };

  const handleCancelTrip = async () => {
    if (!selectedTripDetails) return;

    const trimmedReason = cancelReason.trim();
    if (!trimmedReason) {
      pushToast({ type: "error", title: "Reason required", description: "Please add a reason before canceling the trip." });
      return;
    }

    const token = userSessionService.getToken();
    if (!token) {
      pushToast({ type: "error", title: "Missing auth token", description: "Please login again." });
      return;
    }

    setCanceling(true);
    try {
      await tripApiService.cancelTrip(selectedTripDetails.id, trimmedReason, token);
      pushToast({
        type: "success",
        title: "Trip canceled",
        description: "Participants were notified and the cancellation was added to the trip chat.",
      });
      setCancelModalOpen(false);
      setDetailsModalOpen(false);
      setCancelReason("");
      void loadTrips();
    } catch (cancelError) {
      const message = cancelError instanceof Error ? cancelError.message : "Failed to cancel trip.";
      pushToast({ type: "error", title: "Cancel failed", description: message });
    } finally {
      setCanceling(false);
    }
  };

  const isDateDisabled = (dateVal: Date) => {
    if (!selectedTripDetails) return true;

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const minAllowed = new Date(today);
    const isGuided = selectedTripDetails.tripCategory === "Public trip";
    if (isGuided) {
      minAllowed.setDate(today.getDate() + 3);
    }

    const compareDate = new Date(dateVal);
    compareDate.setHours(0, 0, 0, 0);

    if (compareDate < minAllowed) {
      return true;
    }

    const origStart = new Date(selectedTripDetails.startDate + "T00:00:00");
    const origEnd = new Date(selectedTripDetails.endDate + "T00:00:00");
    const durationMs = origEnd.getTime() - origStart.getTime();
    const potentialEnd = new Date(compareDate.getTime() + durationMs);

    const activeTripRanges = trips
      .filter((t) => t.status === "pending" || t.status === "in review" || t.status === "approved")
      .map((t) => ({
        start: new Date(t.startDate + "T00:00:00"),
        end: new Date(t.endDate + "T00:00:00"),
      }));

    for (const range of activeTripRanges) {
      if (compareDate <= range.end && potentialEnd >= range.start) {
        return true;
      }
    }

    return false;
  };

  const handlePrevMonth = () => {
    setViewDate(new Date(viewDate.getFullYear(), viewDate.getMonth() - 1, 1));
  };

  const handleNextMonth = () => {
    setViewDate(new Date(viewDate.getFullYear(), viewDate.getMonth() + 1, 1));
  };

  const calendarDays = useMemo(() => {
    const year = viewDate.getFullYear();
    const month = viewDate.getMonth();

    const firstDay = new Date(year, month, 1);
    const startDayOfWeek = firstDay.getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();

    const days: (Date | null)[] = [];
    for (let i = 0; i < startDayOfWeek; i++) {
      days.push(null);
    }
    for (let d = 1; d <= daysInMonth; d++) {
      days.push(new Date(year, month, d));
    }
    return days;
  }, [viewDate]);

  const tripGroups = useMemo(() => {
    const grouped = {
      pending: [] as TripApiItem[],
      approved: [] as TripApiItem[],
      rejected: [] as TripApiItem[],
      expired: [] as TripApiItem[],
      cancelled: [] as TripApiItem[],
      draft: [] as TripApiItem[],
    };

    for (const trip of trips) {
      grouped[getTripDisplayStatus(trip)].push(trip);
    }

    return grouped;
  }, [trips]);

  const filteredTrips = useMemo(() => {
    if (statusFilter === "all") return trips;
    return trips.filter((trip) => getTripDisplayStatus(trip) === statusFilter);
  }, [statusFilter, trips]);

  const dashboardSummary = [
    { label: "Pending", value: tripGroups.pending.length, tone: "amber" },
    { label: "Approved", value: tripGroups.approved.length, tone: "emerald" },
    { label: "Rejected", value: tripGroups.rejected.length, tone: "rose" },
    { label: "Expired", value: tripGroups.expired.length, tone: "zinc" },
    { label: "Cancelled", value: tripGroups.cancelled.length, tone: "rose" },
    { label: "Drafts", value: tripGroups.draft.length, tone: "sky" },
  ];

  const selectedTripParticipants = selectedTripDetails?.participants ?? [];
  const selectedTripParticipantStats = countParticipantsByStatus(selectedTripParticipants);
  const selectedTripDisplayStatus = selectedTripDetails ? getTripDisplayStatus(selectedTripDetails) : "draft";

  return (
    <div className="space-y-6">
      <PageHeader
        title="My Trips"
        description="Track every trip by status, inspect participants and pickup details, and cancel trips with a recorded reason."
      />

      <div className="grid gap-3 md:grid-cols-3 xl:grid-cols-6">
        {dashboardSummary.map((item) => (
          <button
            key={item.label}
            type="button"
            onClick={() => setStatusFilter(item.label.toLowerCase() === "drafts" ? "draft" : (item.label.toLowerCase() as TripDisplayStatus))}
            className={`rounded border p-4 text-left transition hover:bg-accent ${statusFilter === (item.label.toLowerCase() === "drafts" ? "draft" : item.label.toLowerCase()) ? "border-primary bg-primary/5" : "border-border bg-card"}`}
          >
            <p className="text-xs uppercase tracking-wide text-muted-foreground">{item.label}</p>
            <p className="mt-2 text-2xl font-semibold">{item.value}</p>
          </button>
        ))}
      </div>

      <div className="flex flex-wrap gap-2 border-b border-border pb-3">
        {statusFilters.map((filter) => (
          <Button key={filter.value} variant={statusFilter === filter.value ? "default" : "outline"} onClick={() => setStatusFilter(filter.value)}>
            {filter.label}
          </Button>
        ))}
      </div>

      <SavingOverlay open={loading} title="Loading trips..." description="Fetching your trips." />

      {loading ? null : error ? (
        <div className="border border-border bg-card p-6 text-sm text-destructive">{error}</div>
      ) : filteredTrips.length === 0 ? (
        <div className="border border-border bg-card p-6 text-sm text-muted-foreground">
          {statusFilter === "all"
            ? "No trips found."
            : `No ${statusFilter} trips found.`}
        </div>
      ) : (
        <div className="grid gap-4 xl:grid-cols-2">
          {filteredTrips.map((trip) => {
            const isOnDemand = trip.tripCategory === "On-demand trip" || !trip.startDate;
            const displayStatus = getTripDisplayStatus(trip);
            const expired = displayStatus === "expired";
            const canEdit = displayStatus !== "cancelled";
            const canShare = displayStatus === "approved" && !expired;
            const canCancel = !isOnDemand && displayStatus !== "cancelled" && displayStatus !== "rejected" && displayStatus !== "draft";
            const participantStats = countParticipantsByStatus(trip.participants);
            const pickupOrigin = trip.pickupType === "Meet at Location"
              ? trip.startLocation
              : trip.pickupStartLocation?.name ?? "Configured pickup origin";

            return (
              <article key={trip.id} className="rounded border border-border bg-card p-4 shadow-sm">
                <div className="flex items-start justify-between gap-3">
                  <div className="space-y-1">
                    <p className="text-xs uppercase tracking-wide text-muted-foreground">{trip.tripCategory}</p>
                    <h3 className="text-lg font-semibold leading-tight">{trip.tripName}</h3>
                    <p className="text-sm text-muted-foreground">{getTripDestination(trip)}</p>
                  </div>
                  <StatusBadge status={displayStatus} />
                </div>

                <div className="mt-4 grid gap-2 text-sm md:grid-cols-2">
                  <div className="rounded border border-border/70 bg-muted/20 p-3">
                    <p className="text-xs uppercase tracking-wide text-muted-foreground">Date range</p>
                    {trip.startDate && trip.endDate ? (
                      <>
                        <p className="mt-1 font-medium">{trip.startDate} to {trip.endDate}</p>
                        <p className="text-xs text-muted-foreground">{trip.startTime ?? "--"} to {trip.endTime ?? "--"}</p>
                      </>
                    ) : (
                      <>
                        <p className="mt-1 font-medium">Flexible Dates</p>
                        <p className="text-xs text-muted-foreground">Duration: {(trip as any).durationLabel || "On-demand"}</p>
                      </>
                    )}
                  </div>
                  <div className="rounded border border-border/70 bg-muted/20 p-3">
                    <p className="text-xs uppercase tracking-wide text-muted-foreground">Pickup</p>
                    <p className="mt-1 font-medium">{trip.pickupType ?? "Meet at Location"}</p>
                    <p className="text-xs text-muted-foreground">Origin: {pickupOrigin}</p>
                  </div>
                  <div className="rounded border border-border/70 bg-muted/20 p-3">
                    <p className="text-xs uppercase tracking-wide text-muted-foreground">Participants</p>
                    <p className="mt-1 font-medium">{participantStats.total} booked</p>
                    <p className="text-xs text-muted-foreground">Accepted {participantStats.accepted} | Pending {participantStats.pending} | Rejected {participantStats.rejected}</p>
                  </div>
                  <div className="rounded border border-border/70 bg-muted/20 p-3">
                    <p className="text-xs uppercase tracking-wide text-muted-foreground">Organizer</p>
                    <p className="mt-1 font-medium">{trip.organizerName ?? trip.organizer}</p>
                    <p className="text-xs text-muted-foreground">Base price {trip.price}</p>
                  </div>
                </div>

                {trip.statusReason ? (
                  <div className="mt-3 rounded border border-dashed border-border p-3 text-sm text-muted-foreground">
                    <p className="text-xs uppercase tracking-wide">Status note</p>
                    <p className="mt-1">{trip.statusReason}</p>
                  </div>
                ) : null}

                <div className="mt-4 flex flex-wrap gap-2">
                  <span className="rounded-full border border-border px-2 py-1 text-xs text-muted-foreground">{trip.pickupType ?? "Meet at Location"}</span>
                  <span className="rounded-full border border-border px-2 py-1 text-xs text-muted-foreground">{trip.participants?.length ?? 0} participants</span>
                  <span className="rounded-full border border-border px-2 py-1 text-xs text-muted-foreground">{expired ? "Expired" : displayStatus}</span>
                </div>

                <div className="mt-4 flex flex-wrap items-center justify-between gap-2">
                  <div className="flex flex-wrap gap-2">
                    <Button size="sm" variant="outline" onClick={() => void handleOpenDetails(trip.id)}>View details</Button>
                    {canEdit ? (
                      <Button size="sm" variant="outline" asChild>
                        <Link href={isOnDemand ? `/dashboard/create-trip?mode=edit&id=${trip.id}` : `/dashboard/trips/${trip.id}/edit`}>
                          {displayStatus === "rejected" ? "Edit & Resubmit" : "Edit"}
                        </Link>
                      </Button>
                    ) : (
                      <Button size="sm" variant="outline" disabled title="Cancelled trips cannot be edited">Edit</Button>
                    )}
                    {!isOnDemand && trip.status !== "draft" && displayStatus !== "cancelled" ? (
                      <Button size="sm" variant="outline" onClick={() => void handleOpenDuplicate(trip.id)}>Post with New Date</Button>
                    ) : null}
                  </div>

                  <div className="flex flex-wrap gap-2">
                    {canShare ? (
                      <Button
                        size="sm"
                        onClick={() => {
                          const pathSegment = isOnDemand ? "on-demand" : "trips";
                          const url = typeof window !== "undefined" ? `${window.location.origin}/${pathSegment}/${trip.id}` : `/${pathSegment}/${trip.id}`;
                          setShareUrl(url);
                          setShareOpen(true);
                        }}
                      >
                        Share Invite
                      </Button>
                    ) : (
                      <Button size="sm" variant="outline" disabled title={expired ? "Trip has expired" : "Invite unavailable"}>
                        Share Invite
                      </Button>
                    )}
                    {canCancel ? (
                      <Button size="sm" variant="outline" className="border-destructive text-destructive hover:bg-destructive/5" onClick={() => void handleOpenCancel(trip.id)}>
                        Cancel trip
                      </Button>
                    ) : null}
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      )}

      <Modal
        open={shareOpen}
        title="Share Invite"
        description="Share the public trip URL with participants."
        onClose={() => setShareOpen(false)}
      >
        <div className="space-y-3">
          <input readOnly className="w-full rounded border border-border bg-muted/10 p-2 text-sm" value={shareUrl} />
          <div className="flex items-center gap-2 justify-end">
            <Button
              variant="outline"
              onClick={async () => {
                try {
                  await navigator.clipboard.writeText(shareUrl);
                  pushToast({ type: "success", title: "Copied", description: "Invite URL copied to clipboard." });
                } catch {
                  pushToast({ type: "error", title: "Copy failed", description: "Could not copy to clipboard." });
                }
              }}
            >
              Copy URL
            </Button>
            {typeof navigator !== "undefined" && (navigator as ShareNavigator).share ? (
              <Button
                onClick={async () => {
                  try {
                    await (navigator as ShareNavigator).share?.({ title: "Join my trip", url: shareUrl });
                  } catch (e) {
                    pushToast({ type: "error", title: "Share failed", description: String(e) });
                  }
                }}
              >
                Native Share
              </Button>
            ) : null}
            <Button
              onClick={() => {
                // open in new tab
                if (typeof window !== "undefined") window.open(shareUrl, "_blank");
              }}
            >
              Open
            </Button>
          </div>
        </div>
      </Modal>

      <Modal
        open={detailsModalOpen}
        title={selectedTripDetails?.tripName ?? "Trip details"}
        description="Review status, pickup preferences, and each participant's pickup details."
        onClose={() => setDetailsModalOpen(false)}
      >
        {selectedTripDetails ? (
          <div className="space-y-4">
            <div className="flex flex-wrap items-center gap-2">
              <StatusBadge status={selectedTripDisplayStatus} />
              <span className="rounded-full border border-border px-2 py-1 text-xs text-muted-foreground">{selectedTripDetails.tripCategory}</span>
              <span className="rounded-full border border-border px-2 py-1 text-xs text-muted-foreground">{selectedTripParticipantStats.total} participants</span>
            </div>

            {selectedTripDetails.statusReason ? (
              <div className="rounded border border-dashed border-border p-3 text-sm">
                <p className="text-xs uppercase tracking-wide text-muted-foreground">Latest status note</p>
                <p className="mt-1">{selectedTripDetails.statusReason}</p>
                <p className="mt-2 text-xs text-muted-foreground">
                  Updated by {selectedTripDetails.statusUpdatedByName ?? selectedTripDetails.statusUpdatedBy ?? "system"}
                </p>
              </div>
            ) : null}

            <div className="grid gap-3 md:grid-cols-2">
              <div className="rounded border border-border p-3 text-sm">
                <p className="text-xs uppercase tracking-wide text-muted-foreground">Trip schedule</p>
                <p className="mt-1 font-medium">{selectedTripDetails.startDate} to {selectedTripDetails.endDate}</p>
                <p className="text-xs text-muted-foreground">{selectedTripDetails.startTime ?? "--"} to {selectedTripDetails.endTime ?? "--"}</p>
              </div>
              <div className="rounded border border-border p-3 text-sm">
                <p className="text-xs uppercase tracking-wide text-muted-foreground">Pickup setup</p>
                <p className="mt-1 font-medium">{selectedTripDetails.pickupType ?? "Meet at Location"}</p>
                <p className="text-xs text-muted-foreground">Origin: {selectedTripDetails.pickupStartLocation?.name ?? selectedTripDetails.startLocation}</p>
                {selectedTripDetails.pickupType && selectedTripDetails.pickupType !== "Meet at Location" ? (
                  <p className="text-xs text-muted-foreground">Pickup rate: {selectedTripDetails.pickupCostPerKm ?? 0} per km</p>
                ) : null}
              </div>
              <div className="rounded border border-border p-3 text-sm">
                <p className="text-xs uppercase tracking-wide text-muted-foreground">Booking controls</p>
                <p className="mt-1 font-medium">Payment methods: {(selectedTripDetails.paymentMethods ?? []).join(", ") || "Not set"}</p>
                <p className="text-xs text-muted-foreground">Max participants: {selectedTripDetails.maxParticipants ?? "--"}</p>
              </div>
              <div className="rounded border border-border p-3 text-sm">
                <p className="text-xs uppercase tracking-wide text-muted-foreground">Organizer</p>
                <p className="mt-1 font-medium">{selectedTripDetails.organizerName ?? selectedTripDetails.organizer}</p>
                <p className="text-xs text-muted-foreground">Destination: {getTripDestination(selectedTripDetails)}</p>
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-semibold">Participants</h3>
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <span>Accepted {selectedTripParticipantStats.accepted}</span>
                  <span>Pending {selectedTripParticipantStats.pending}</span>
                  <span>Rejected {selectedTripParticipantStats.rejected}</span>
                </div>
              </div>

              {selectedTripParticipants.length === 0 ? (
                <p className="text-sm text-muted-foreground">No participant bookings have been added yet.</p>
              ) : (
                <div className="space-y-2">
                  {selectedTripParticipants.map((participant, index) => (
                    <div key={participant.participantId ?? `${participant.name}-${index}`} className="rounded border border-border bg-muted/20 p-3 text-sm">
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <div>
                          <p className="font-medium">{participant.name}</p>
                          <p className="text-xs text-muted-foreground">{participant.email ?? "No email"} {participant.phone ? `• ${participant.phone}` : ""}</p>
                        </div>
                        <StatusBadge status={participant.status ?? "pending"} />
                      </div>
                      <div className="mt-2 grid gap-2 md:grid-cols-2 text-xs text-muted-foreground">
                        <p>Pickup time: {participant.pickupTime ?? "Not set"}</p>
                        <p>Payment: {participant.paymentMethod ?? "Not set"}</p>
                        <p>Pickup location: {participant.pickupLocation?.name ?? (selectedTripDetails.pickupType === "Meet at Location" ? selectedTripDetails.startLocation : "Using trip pickup origin")}</p>
                        <p>Pickup cost: {participant.pickupCost !== undefined ? String(participant.pickupCost) : "--"}</p>
                      </div>
                      <p className="mt-2 text-xs text-muted-foreground">
                        {participant.pickupLocation ? `${participant.pickupLocation.lat.toFixed(5)}, ${participant.pickupLocation.lng.toFixed(5)}` : "Pickup coordinates not set"}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="flex flex-wrap items-center justify-end gap-2 pt-2 border-t border-border">
              <Button variant="outline" onClick={() => setDetailsModalOpen(false)}>Close</Button>
              {selectedTripDetails.status !== "draft" && selectedTripDisplayStatus !== "cancelled" ? (
                <Button variant="outline" onClick={() => { setDetailsModalOpen(false); setDuplicateModalOpen(true); }}>
                  Post with New Date
                </Button>
              ) : null}
              {selectedTripDisplayStatus !== "cancelled" && selectedTripDisplayStatus !== "rejected" && selectedTripDisplayStatus !== "draft" ? (
                <Button
                  variant="outline"
                  className="border-destructive text-destructive hover:bg-destructive/5"
                  onClick={() => {
                    setDetailsModalOpen(false);
                    setCancelReason(selectedTripDetails.statusReason ?? "");
                    setCancelModalOpen(true);
                  }}
                >
                  Cancel trip
                </Button>
              ) : null}
            </div>
          </div>
        ) : null}
      </Modal>

      <Modal
        open={cancelModalOpen}
        title="Cancel Trip"
        description="Confirm the cancellation, add a reason, and notify participants plus the chat group."
        onClose={() => setCancelModalOpen(false)}
      >
        <div className="space-y-4">
          <div className="rounded border border-amber-200 bg-amber-50 p-3 text-sm text-amber-800">
            Canceling a trip will mark it as cancelled, notify participants, and flag online refunds for admin review.
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium">Cancellation reason</label>
            <textarea
              value={cancelReason}
              onChange={(event) => setCancelReason(event.target.value)}
              className="min-h-28 w-full border border-input bg-background px-3 py-2 text-sm"
              placeholder="Severe weather, route closure, guide unavailable, etc."
            />
          </div>

          <div className="flex items-center justify-end gap-2 border-t border-border pt-3">
            <Button variant="outline" disabled={canceling} onClick={() => setCancelModalOpen(false)}>
              Keep trip active
            </Button>
            <Button
              className="border-destructive bg-destructive text-destructive-foreground hover:bg-destructive/90"
              disabled={canceling || !cancelReason.trim()}
              onClick={() => void handleCancelTrip()}
            >
              {canceling ? "Canceling..." : "Cancel trip"}
            </Button>
          </div>
        </div>
      </Modal>

      {/* Duplication Modal */}
      <Modal
        open={duplicateModalOpen}
        title="Post Trip with New Start Date"
        description={selectedTripDetails ? `Set a new date range for "${selectedTripDetails.tripName}".` : ""}
        onClose={() => setDuplicateModalOpen(false)}
      >
        <div className="space-y-4">
          {selectedTripDetails && (
            (() => {
              const origStart = new Date(selectedTripDetails.startDate + "T00:00:00");
              const origEnd = new Date(selectedTripDetails.endDate + "T00:00:00");
              const durationDays = Math.round((origEnd.getTime() - origStart.getTime()) / (24 * 60 * 60 * 1000)) + 1;
              const isGuided = selectedTripDetails.tripCategory === "Public trip";

              return (
                <>
                  <div className="text-xs text-muted-foreground space-y-1">
                    <p><span className="font-semibold text-foreground">Duration:</span> {durationDays} day{durationDays > 1 ? "s" : ""}</p>
                    <p><span className="font-semibold text-foreground">Category:</span> {selectedTripDetails.tripCategory}</p>
                    {isGuided && (
                      <p className="text-amber-600 font-medium">* Guided trips require a 3-day lead time. Dates before today + 3 days are disabled.</p>
                    )}
                  </div>

                  {/* Calendar view */}
                  <div className="border border-border rounded-md p-4 bg-muted/10">
                    <div className="flex items-center justify-between mb-4">
                      <button
                        type="button"
                        onClick={handlePrevMonth}
                        className="p-1 hover:bg-muted rounded border border-border text-xs font-semibold px-2 py-1 cursor-pointer"
                      >
                        Prev
                      </button>
                      <div className="font-semibold text-sm">
                        {viewDate.toLocaleString("default", { month: "long" })} {viewDate.getFullYear()}
                      </div>
                      <button
                        type="button"
                        onClick={handleNextMonth}
                        className="p-1 hover:bg-muted rounded border border-border text-xs font-semibold px-2 py-1 cursor-pointer"
                      >
                        Next
                      </button>
                    </div>

                    <div className="grid grid-cols-7 gap-1 text-center text-xs font-bold text-muted-foreground mb-2">
                      {["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"].map((day) => (
                        <div key={day} className="py-1">{day}</div>
                      ))}
                    </div>

                    <div className="grid grid-cols-7 gap-1">
                      {calendarDays.map((day, idx) => {
                        if (!day) {
                          return <div key={`empty-${idx}`} className="h-8" />;
                        }

                        const disabled = isDateDisabled(day);
                        const isSelected = selectedNewStartDate && day.toDateString() === selectedNewStartDate.toDateString();

                        return (
                          <button
                            key={day.toDateString()}
                            type="button"
                            disabled={disabled}
                            onClick={() => setSelectedNewStartDate(day)}
                            className={`
                              h-8 text-xs font-medium rounded transition-colors flex items-center justify-center
                              ${disabled ? "text-muted-foreground/30 bg-muted/30 cursor-not-allowed" : "cursor-pointer"}
                              ${isSelected ? "bg-primary text-primary-foreground font-semibold" : ""}
                              ${!disabled && !isSelected ? "hover:bg-accent hover:text-accent-foreground bg-background border border-border/40" : ""}
                            `}
                          >
                            {day.getDate()}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {selectedNewStartDate && (
                    <div className="rounded bg-sky-50/50 dark:bg-sky-950/20 p-3 text-xs space-y-1 border border-sky-100 dark:border-sky-900/50">
                      <p className="font-semibold text-sky-800 dark:text-sky-400">Selected Date Range:</p>
                      <p className="text-muted-foreground font-medium">
                        Start: {getLocalDateString(selectedNewStartDate)}
                      </p>
                      <p className="text-muted-foreground font-medium">
                        End: {getLocalDateString(new Date(selectedNewStartDate.getTime() + (origEnd.getTime() - origStart.getTime())))}
                      </p>
                    </div>
                  )}

                  <div className="flex items-center gap-2 justify-end pt-3 border-t border-border">
                    <Button
                      variant="outline"
                      disabled={duplicating}
                      onClick={() => setDuplicateModalOpen(false)}
                    >
                      Cancel
                    </Button>
                    <Button
                      disabled={!selectedNewStartDate || duplicating}
                      onClick={handlePostTrip}
                    >
                      {duplicating ? "Posting..." : "Post Trip"}
                    </Button>
                  </div>
                </>
              );
            })()
          )}
        </div>
      </Modal>

      {/* Loading Details Overlay */}
      <SavingOverlay open={loadingDetails} title="Loading trip..." description="Fetching full trip details." />
    </div>
  );
}
