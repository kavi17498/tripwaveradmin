"use client";

import { useEffect, useMemo, useState } from "react";
import { Navbar } from "@/components/layout/navbar";
import { Footer } from "@/components/layout/footer";
import { TripFilterBar } from "@/components/trips/trip-filter-bar";
import { TripCard } from "@/components/trips/trip-card";
import { EmptyState } from "@/components/feedback/empty-state";
import { CardSkeletonGrid } from "@/components/feedback/loading-skeletons";
import { Button } from "@/components/ui/button";
import { tripApiService, type TripApiItem } from "@/lib/services/tripApiService";
import { TripFilters } from "@/lib/types";

// Helper: map API trip shape to UI Trip shape used by `TripCard`
function mapApiToTrip(item: TripApiItem) {
  const firstDestination = item.destinations?.[0]?.name ?? item.startLocation ?? "";
  const cover = item.coverImage ?? item.photos?.[0] ?? "";

  return {
    id: item.id,
    title: item.tripName,
    destination: firstDestination,
    description: item.description ?? "",
    startDate: item.startDate,
    endDate: item.endDate,
    price: item.price ?? 0,
    capacity: item.maxParticipants ?? 0,
    bookedCount: item.participants ? item.participants.length : 0,
    durationDays: 0,
    tripType: item.tripCategory?.toLowerCase().includes("private") ? "private" : "public",
    status: (item.status as any) ?? "published",
    coverImage: cover,
    organizerId: "",
    organizerName: item.organizer ?? "",
    organizerRating: 0,
    location: {
      city: firstDestination,
      country: "",
      lat: 0,
      lng: 0,
    },
    included: item.included ? Object.values(item.included).flat() as string[] : [],
    excluded: [],
    itinerary: item.itinerary?.days?.map((d) => ({ day: d.day, title: d.title, description: "" })) ?? [],
    // attach original category for grouping
    _category: item.tripCategory ?? "Uncategorized",
  } as any;
}

export default function TripsPage() {
  const [filters, setFilters] = useState<TripFilters>({});
  const [apiTrips, setApiTrips] = useState<TripApiItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");


  useEffect(() => {
    const loadTrips = async () => {
      try {
        setLoading(true);
        setError("");
        const result = await tripApiService.getApprovedPublicTrips(filters as Record<string, string | number | undefined>);
        // Exclude any trips categorized as private
        const publicTrips = result.data.filter((t) => !(t.tripCategory ?? "").toLowerCase().includes("private"));
        setApiTrips(publicTrips);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to fetch trips");
      } finally {
        setLoading(false);
      }
    };

    loadTrips();
  }, [filters]);

  const resultsLabel = useMemo(() => `${apiTrips.length} public trips found`, [apiTrips.length]);

  const grouped = useMemo(() => {
    const out: Record<string, TripApiItem[]> = {};
    apiTrips.forEach((t) => {
      const cat = t.tripCategory ?? "Uncategorized";
      if (!out[cat]) out[cat] = [];
      out[cat].push(t);
    });
    return out;
  }, [apiTrips]);

  return (
    <div>
      <Navbar />
      <main className="mx-auto max-w-7xl space-y-8 px-4 py-8 md:px-6">
        <section className="grid grid-cols-1 gap-6 border border-border bg-card p-6 md:grid-cols-2">
          <div className="space-y-3">
            <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">Sri Lanka public trip feed</p>
            <h1 className="text-3xl font-semibold">Find guided, group, and family trips across Sri Lanka</h1>
            <p className="text-sm text-muted-foreground">
              Private trips are not shown in this feed. Browse only discoverable public departures with trusted organizers.
            </p>
            <p className="text-xs text-muted-foreground">{resultsLabel}</p>
          </div>
          <img
            src="https://images.unsplash.com/photo-1589307357507-fd1f0ab64582?q=80&w=1800&auto=format&fit=crop"
            alt="Sri Lanka coastal travel"
            className="h-64 w-full object-cover"
          />
        </section>

        <section>
          <h2 className="mb-4 text-xl font-semibold">Trip categories</h2>
          <div className="space-y-8">
            {Object.entries(grouped).map(([category, items]) => (
              <div key={category}>
                <div className="mb-3 flex items-center justify-between">
                  <h3 className="text-lg font-semibold">{category}</h3>
                  <p className="text-sm text-muted-foreground">{items.length} trips</p>
                </div>
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
                  {items.map((it) => (
                    <TripCard key={it.id} trip={mapApiToTrip(it)} />
                  ))}
                </div>
              </div>
            ))}
          </div>
        </section>

        <TripFilterBar filters={filters} onChange={setFilters} />

        {loading ? <CardSkeletonGrid /> : null}

        {error ? (
          <EmptyState title="Unable to load trips" description={error} action={<Button onClick={() => setFilters({ ...filters })}>Retry</Button>} />
        ) : null}

        {!loading && !error && apiTrips.length === 0 ? (
          <EmptyState
            title="No public trips found"
            description="Try another location, date, or budget filter. Private trips are intentionally hidden from this feed."
            action={<Button variant="outline" onClick={() => setFilters({})}>Clear filters</Button>}
          />
        ) : null}
      </main>
      <Footer />
    </div>
  );
}
