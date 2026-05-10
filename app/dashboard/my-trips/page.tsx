"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { PageHeader } from "@/components/common/page-header";
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
  status: string;
};

const toTripRow = (trip: TripApiItem): TripRow => ({
  id: trip.id,
  title: trip.tripName,
  destination: trip.destinations[0]?.name ?? trip.startLocation ?? "Unknown destination",
  startDate: trip.startDate,
  status: trip.status ?? "published",
});

export default function MyTripsPage() {
  const { pushToast } = useToast();
  const [tab, setTab] = useState<Tab>("created");
  const [trips, setTrips] = useState<TripRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
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

    void loadTrips();
  }, [pushToast]);

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

      <div className="overflow-x-auto border border-border">
        {loading ? (
          <div className="p-6 text-sm text-muted-foreground">Loading your trips...</div>
        ) : error ? (
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
                <tr key={trip.id} className="border-t border-border">
                  <td className="p-3">{trip.title}</td>
                  <td className="p-3">{trip.destination}</td>
                  <td className="p-3">{trip.startDate}</td>
                  <td className="p-3"><StatusBadge status={(trip.status || "published") as any} /></td>
                  <td className="p-3 text-right">
                    <div className="flex justify-end gap-2">
                      <Button size="sm" variant="outline" asChild><Link href={`/dashboard/trips/${trip.id}/edit`}>Edit</Link></Button>
                      <Button size="sm" variant="outline" asChild><Link href={`/dashboard/trips/${trip.id}/participants`}>Participants</Link></Button>
                      <Button size="sm" asChild><Link href={`/invite/sample-${trip.id}`}>Share Invite</Link></Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
