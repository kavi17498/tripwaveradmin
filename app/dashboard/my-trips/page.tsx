"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { PageHeader } from "@/components/common/page-header";
import { Modal } from "@/components/common/modal";
import { SavingOverlay } from "@/components/common/saving-overlay";
import { StatusBadge } from "@/components/common/status-badge";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/feedback/toast-provider";
import { userSessionService } from "@/lib/services/userSessionService";
import { tripApiService, type TripApiItem } from "@/lib/services/tripApiService";

type Tab = "created" | "joined" | "drafts";

type TripRow = {
  id: string;
  title: string;
  destination: string;
  startDate: string;
  endDate: string;
  status: string;
  tripCategory: string;
};

const toTripRow = (trip: TripApiItem): TripRow => ({
  id: trip.id,
  title: trip.tripName,
  destination: trip.destinations[0]?.name ?? trip.startLocation ?? "Unknown destination",
  startDate: trip.startDate,
  endDate: trip.endDate,
  status: trip.status ?? "published",
  tripCategory: trip.tripCategory,
});

const getLocalDateString = (date: Date) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

const isTripExpired = (trip: TripRow) => {
  const endOfDay = new Date(`${trip.endDate}T23:59:59.999`);
  return Number.isNaN(endOfDay.getTime()) ? false : new Date() > endOfDay;
};

export default function MyTripsPage() {
  const { pushToast } = useToast();
  const [shareOpen, setShareOpen] = useState(false);
  const [shareUrl, setShareUrl] = useState("");
  const [tab, setTab] = useState<Tab>("created");
  const [trips, setTrips] = useState<TripRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // States for duplicating trips
  const [duplicateModalOpen, setDuplicateModalOpen] = useState(false);
  const [selectedTripId, setSelectedTripId] = useState<string | null>(null);
  const [selectedTripDetails, setSelectedTripDetails] = useState<TripApiItem | null>(null);
  const [loadingDetails, setLoadingDetails] = useState(false);
  const [selectedNewStartDate, setSelectedNewStartDate] = useState<Date | null>(null);
  const [viewDate, setViewDate] = useState(() => new Date());
  const [duplicating, setDuplicating] = useState(false);

  const loadTrips = async () => {
    const token = userSessionService.getToken();
    if (!token) {
      setError("Missing auth token. Please login again.");
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError("");
      const response = await tripApiService.getMyTrips(token);
      setTrips(response.data.map(toTripRow));
    } catch (loadError) {
      const message = loadError instanceof Error ? loadError.message : "Failed to load trips.";
      setError(message);
      pushToast({ type: "error", title: "Load failed", description: message });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadTrips();
  }, [pushToast]);

  const handleOpenDuplicate = async (tripId: string) => {
    const token = userSessionService.getToken();
    if (!token) return;

    setLoadingDetails(true);
    setSelectedTripId(tripId);
    setSelectedNewStartDate(null);
    setViewDate(new Date());

    try {
      const res = await tripApiService.getTripById(tripId, token);
      if (res.data) {
        setSelectedTripDetails(res.data);
        setDuplicateModalOpen(true);
      } else {
        pushToast({ type: "error", title: "Error", description: "Trip details not found." });
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to load trip details.";
      pushToast({ type: "error", title: "Error", description: message });
    } finally {
      setLoadingDetails(false);
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

      const payload: any = {
        tripName: selectedTripDetails.tripName,
        tripCategory: selectedTripDetails.tripCategory,
        paymentMethods: selectedTripDetails.paymentMethods,
        destinations: selectedTripDetails.destinations,
        mainDestinations: selectedTripDetails.mainDestinations,
        startDate: newStartStr,
        endDate: newEndStr,
        startTime: selectedTripDetails.startTime,
        endTime: selectedTripDetails.endTime,
        startLocation: selectedTripDetails.startLocation,
        organizer: selectedTripDetails.organizer,
        price: selectedTripDetails.price,
        itinerary: selectedTripDetails.itinerary,
        included: selectedTripDetails.included,
        photos: selectedTripDetails.photos,
        coverImage: selectedTripDetails.coverImage,
        description: selectedTripDetails.description,
        maxParticipants: selectedTripDetails.maxParticipants,
        status: "pending",
        participants: [],
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

  const isDateDisabled = (dateVal: Date) => {
    if (!selectedTripDetails) return true;

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const minAllowed = new Date(today);
    const isGuided = ["Solo Trip with guide", "Family Trip with guide", "Strangers Trip with guide"].includes(
      selectedTripDetails.tripCategory
    );
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

  const visibleTrips = useMemo(() => {
    if (tab === "joined") return [];
    if (tab === "drafts") return trips.filter((trip) => trip.status === "draft");
    return trips;
  }, [tab, trips]);

  return (
    <div className="space-y-6">
      <PageHeader title="My Trips" description="Manage created trips, joined trips, and draft trips." />

      <div className="flex flex-wrap gap-2 border-b border-border pb-3">
        {[
          ["created", "Created Trips"],
          ["joined", "Joined Trips"],
          ["drafts", "Drafts"],
        ].map(([value, label]) => (
          <Button key={value} variant={tab === value ? "default" : "outline"} onClick={() => setTab(value as Tab)}>
            {label}
          </Button>
        ))}
      </div>

      <SavingOverlay open={loading} title="Loading trips..." description="Fetching your trips." />

      <div className="overflow-x-auto border border-border">
        {loading ? null : error ? (
          <div className="p-6 text-sm text-destructive">{error}</div>
        ) : visibleTrips.length === 0 ? (
          <div className="p-6 text-sm text-muted-foreground">
            {tab === "joined"
              ? "Joined trips are not returned by the current /trips endpoint."
              : tab === "drafts"
                ? "No draft trips found."
                : "No trips found."}
          </div>
        ) : (
          <table className="w-full min-w-[800px] text-sm">
            <thead className="bg-muted/30">
              <tr>
                <th className="p-3 text-left font-medium">Trip</th>
                <th className="p-3 text-left font-medium">Destination</th>
                <th className="p-3 text-left font-medium">Date</th>
                <th className="p-3 text-left font-medium">Status</th>
                <th className="p-3 text-right font-medium">Actions</th>
              </tr>
            </thead>
            <tbody>
              {visibleTrips.map((trip) => (
                (() => {
                  const expired = isTripExpired(trip);
                  const canEdit = trip.status !== "in review";
                  const canShare = trip.status === "approved" && !expired;
                  const statusLabel = expired ? "expired" : trip.status;

                  return (
                <tr key={trip.id} className="border-t border-border">
                  <td className="p-3">{trip.title}</td>
                  <td className="p-3">{trip.destination}</td>
                  <td className="p-3">{trip.startDate}</td>
                  <td className="p-3"><StatusBadge status={(statusLabel || "published") as any} /></td>
                  <td className="p-3 text-right">
                    <div className="flex justify-end gap-2 flex-wrap">
                      {canEdit ? (
                        <Button size="sm" variant="outline" asChild>
                          <Link href={`/dashboard/trips/${trip.id}/edit`}>
                            {trip.status === "rejected" ? "Edit & Resubmit" : "Edit"}
                          </Link>
                        </Button>
                      ) : (
                        <Button size="sm" variant="outline" disabled title="Trips in review cannot be edited">
                          Edit
                        </Button>
                      )}
                      <Button size="sm" variant="outline" asChild><Link href={`/dashboard/trips/${trip.id}/participants`}>Participants</Link></Button>
                      {trip.status !== "draft" && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => void handleOpenDuplicate(trip.id)}
                        >
                          Post with New Date
                        </Button>
                      )}
                      {canShare ? (
                        <Button
                          size="sm"
                          onClick={() => {
                            // build public trip URL using current origin
                            const url = typeof window !== "undefined" ? `${window.location.origin}/trips/${trip.id}` : `/trips/${trip.id}`;
                            setShareUrl(url);
                            setShareOpen(true);
                          }}
                        >
                          Share Invite
                        </Button>
                      ) : (
                        <Button
                          size="sm"
                          variant="outline"
                          disabled
                          title={expired ? "Trip has expired" : trip.status === "approved" ? "Invite unavailable" : "Trip not approved"}
                        >
                          Share Invite
                        </Button>
                      )}
                    </div>
                  </td>
                </tr>
                  );
                })()
              ))}
            </tbody>
          </table>
        )}
      </div>

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
                } catch (e) {
                  pushToast({ type: "error", title: "Copy failed", description: "Could not copy to clipboard." });
                }
              }}
            >
              Copy URL
            </Button>
            {typeof navigator !== "undefined" && (navigator as any).share ? (
              <Button
                onClick={async () => {
                  try {
                    await (navigator as any).share({ title: "Join my trip", url: shareUrl });
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
              const isGuided = ["Solo Trip with guide", "Family Trip with guide", "Strangers Trip with guide"].includes(
                selectedTripDetails.tripCategory
              );

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
