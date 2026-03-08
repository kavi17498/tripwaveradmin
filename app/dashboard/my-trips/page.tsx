"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { PageHeader } from "@/components/common/page-header";
import { StatusBadge } from "@/components/common/status-badge";
import { mockTrips } from "@/lib/data/trips";
import { Button } from "@/components/ui/button";

type Tab = "created" | "joined" | "drafts";

export default function MyTripsPage() {
  const [tab, setTab] = useState<Tab>("created");

  const trips = useMemo(() => {
    if (tab === "drafts") return mockTrips.filter((trip) => trip.status === "draft");
    if (tab === "joined") return mockTrips.slice(0, 2);
    return mockTrips;
  }, [tab]);

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
            {trips.map((trip) => (
              <tr key={trip.id} className="border-t border-border">
                <td className="p-3">{trip.title}</td>
                <td className="p-3">{trip.destination}</td>
                <td className="p-3">{trip.startDate}</td>
                <td className="p-3"><StatusBadge status={trip.status} /></td>
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
      </div>
    </div>
  );
}
