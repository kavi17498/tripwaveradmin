"use client";

import { useEffect, useMemo, useState } from "react";
import { PageHeader } from "@/components/common/page-header";
import { SummaryCard } from "@/components/common/summary-card";
import { paymentService, type OrganizerEarningsSummary } from "@/lib/services/paymentService";
import { formatCurrencyRs } from "@/lib/utils";

const emptySummary: OrganizerEarningsSummary = {
  totalEarned: 0,
  onlineEarned: 0,
  payToGuideEarned: 0,
  uncategorizedEarned: 0,
  tripsCount: 0,
  trips: [],
};

const toStatusLabel = (status: string) => {
  if (status === "in review") return "In review";
  if (status === "approved") return "Approved";
  if (status === "rejected") return "Rejected";
  if (status === "pending") return "Pending";
  if (status === "draft") return "Draft";
  return status || "Unknown";
};

export default function EarningsPage() {
  const [summary, setSummary] = useState<OrganizerEarningsSummary>(emptySummary);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        setError("");
        const response = await paymentService.getOrganizerEarnings();
        setSummary(response.data ?? emptySummary);
      } catch (loadError) {
        setError(loadError instanceof Error ? loadError.message : "Failed to load earnings.");
      } finally {
        setLoading(false);
      }
    };

    void load();
  }, []);

  const sortedTrips = useMemo(() => {
    return [...(summary.trips ?? [])].sort((left, right) => {
      if (left.totalEarned !== right.totalEarned) {
        return right.totalEarned - left.totalEarned;
      }

      return right.startDate.localeCompare(left.startDate);
    });
  }, [summary.trips]);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Earnings"
        description="Track your trip earnings with a split between online payments and pay-to-guide bookings."
      />

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <SummaryCard
          title="Total earnings"
          value={formatCurrencyRs(summary.totalEarned)}
          meta={`${summary.tripsCount} trip${summary.tripsCount === 1 ? "" : "s"}`}
        />
        <SummaryCard
          title="Online earnings"
          value={formatCurrencyRs(summary.onlineEarned)}
          meta="Pay Online"
        />
        <SummaryCard
          title="Pay-to-guide earnings"
          value={formatCurrencyRs(summary.payToGuideEarned)}
          meta="Pay to Guide on Trip Day"
        />
        <SummaryCard
          title="Uncategorized"
          value={formatCurrencyRs(summary.uncategorizedEarned)}
          meta="Legacy bookings without method"
        />
      </div>

      <section className="overflow-x-auto border border-border bg-card">
        {loading ? (
          <div className="p-4 text-sm text-muted-foreground">Loading earnings...</div>
        ) : error ? (
          <div className="p-4 text-sm text-destructive">{error}</div>
        ) : sortedTrips.length === 0 ? (
          <div className="p-4 text-sm text-muted-foreground">No organizer trip earnings found yet.</div>
        ) : (
          <table className="w-full min-w-[980px] text-sm">
            <thead className="bg-muted/30 text-left">
              <tr>
                <th className="p-3 font-medium">Trip</th>
                <th className="p-3 font-medium">Dates</th>
                <th className="p-3 font-medium">Status</th>
                <th className="p-3 font-medium text-right">Participants</th>
                <th className="p-3 font-medium text-right">Online</th>
                <th className="p-3 font-medium text-right">Pay to Guide</th>
                <th className="p-3 font-medium text-right">Total</th>
              </tr>
            </thead>
            <tbody>
              {sortedTrips.map((trip) => (
                <tr key={trip.tripId} className="border-t border-border">
                  <td className="p-3 font-medium">{trip.tripName || "Untitled trip"}</td>
                  <td className="p-3 text-muted-foreground">
                    {trip.startDate || "-"} to {trip.endDate || "-"}
                  </td>
                  <td className="p-3">{toStatusLabel(trip.status)}</td>
                  <td className="p-3 text-right">{trip.participantCount}</td>
                  <td className="p-3 text-right">{formatCurrencyRs(trip.onlineEarned)}</td>
                  <td className="p-3 text-right">{formatCurrencyRs(trip.payToGuideEarned)}</td>
                  <td className="p-3 text-right font-semibold">{formatCurrencyRs(trip.totalEarned)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </section>
    </div>
  );
}
