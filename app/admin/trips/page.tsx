"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { StatusBadge } from "@/components/common/status-badge";
import { Button } from "@/components/ui/button";
import { mockTrips } from "@/lib/data/trips";

export default function AdminTripsPage() {
  const [filter, setFilter] = useState("all");

  const trips = useMemo(
    () => (filter === "all" ? mockTrips : mockTrips.filter((trip) => trip.status === filter)),
    [filter],
  );

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Trips Management</h1>
        <p className="mt-1 text-sm text-muted-foreground">Moderate all trips and monitor trip lifecycle status.</p>
      </div>

      <select className="h-9 border border-input bg-background px-3 text-sm" value={filter} onChange={(event) => setFilter(event.target.value)}>
        <option value="all">All statuses</option>
        <option value="published">Published</option>
        <option value="draft">Draft</option>
        <option value="cancelled">Cancelled</option>
      </select>

      <div className="space-y-2">
        {trips.map((trip) => (
          <article key={trip.id} className="flex flex-col gap-3 border border-border bg-card p-4 md:flex-row md:items-center md:justify-between">
            <div>
              <p className="font-medium">{trip.title}</p>
              <p className="text-sm text-muted-foreground">{trip.destination} • {trip.startDate}</p>
            </div>
            <div className="flex items-center gap-2">
              <StatusBadge status={trip.status} />
              <Button size="sm" variant="outline" asChild>
                <Link href={`/trips/${trip.id}`}>View details</Link>
              </Button>
              <Button size="sm" variant="destructive">Moderate / Cancel</Button>
            </div>
          </article>
        ))}
      </div>
    </div>
  );
}
