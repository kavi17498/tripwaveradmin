"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams } from "next/navigation";
import { PageHeader } from "@/components/common/page-header";
import { SearchInput } from "@/components/common/search-input";
import { StatusBadge } from "@/components/common/status-badge";
import { Button } from "@/components/ui/button";
import { bookingService } from "@/lib/services/bookingService";
import { Booking } from "@/lib/types";

export default function TripParticipantsPage() {
  const { id } = useParams<{ id: string }>();
  const [items, setItems] = useState<Booking[]>([]);
  const [query, setQuery] = useState("");

  useEffect(() => {
    bookingService.getBookingsByTrip(id).then((result) => setItems(result.data));
  }, [id]);

  const filteredItems = useMemo(
    () => items.filter((item) => item.participantName.toLowerCase().includes(query.toLowerCase())),
    [items, query],
  );

  return (
    <div className="space-y-6">
      <PageHeader title="Trip Participants" description="Review participants and manage approvals." />
      <SearchInput value={query} onChange={setQuery} placeholder="Search participants" />
      <div className="space-y-2">
        {filteredItems.map((item) => (
          <article key={item.id} className="flex flex-col gap-3 border border-border bg-card p-4 md:flex-row md:items-center md:justify-between">
            <div>
              <p className="font-medium">{item.participantName}</p>
              <p className="text-sm text-muted-foreground">{item.participantEmail}</p>
            </div>
            <div className="flex items-center gap-2">
              <StatusBadge status={item.status} />
              <Button size="sm" variant="outline">Approve</Button>
              <Button size="sm" variant="destructive">Reject</Button>
            </div>
          </article>
        ))}
      </div>
    </div>
  );
}
