"use client";

import { useEffect, useMemo, useState } from "react";
import { Navbar } from "@/components/layout/navbar";
import { Footer } from "@/components/layout/footer";
import { TripFilterBar } from "@/components/trips/trip-filter-bar";
import { TripCard } from "@/components/trips/trip-card";
import { EmptyState } from "@/components/feedback/empty-state";
import { CardSkeletonGrid } from "@/components/feedback/loading-skeletons";
import { Button } from "@/components/ui/button";
import { tripService } from "@/lib/services/tripService";
import { Trip, TripFilters } from "@/lib/types";

const categoryCards = [
  {
    title: "Travel with Guide",
    note: "Verified guide-led routes across the island",
    query: "galle",
    image: "https://images.unsplash.com/photo-1530789253388-582c481c54b0?q=80&w=1400&auto=format&fit=crop",
  },
  {
    title: "Join Group Trip",
    note: "Join open departures with new travel friends",
    query: "ella",
    image: "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?q=80&w=1400&auto=format&fit=crop",
  },
  {
    title: "Family Trip with Guide",
    note: "Comfortable family-focused itineraries",
    query: "sigiriya",
    image: "https://images.unsplash.com/photo-1511895426328-dc8714191300?q=80&w=1400&auto=format&fit=crop",
  },
];

export default function TripsPage() {
  const [filters, setFilters] = useState<TripFilters>({});
  const [trips, setTrips] = useState<Trip[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [visibleCount, setVisibleCount] = useState(6);

  useEffect(() => {
    const loadTrips = async () => {
      try {
        setLoading(true);
        setError("");
        const result = await tripService.getPublicTrips(filters);
        setTrips(result.data.filter((trip) => trip.tripType !== "private"));
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to fetch trips");
      } finally {
        setLoading(false);
      }
    };

    loadTrips();
  }, [filters]);

  const resultsLabel = useMemo(() => `${trips.length} public trips found`, [trips.length]);

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
          <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
            {categoryCards.map((category) => (
              <button
                key={category.title}
                type="button"
                onClick={() => setFilters({ ...filters, query: category.query })}
                className="border border-border bg-card p-3 text-left"
              >
                <img src={category.image} alt={category.title} className="h-36 w-full object-cover" />
                <p className="mt-3 font-semibold">{category.title}</p>
                <p className="mt-1 text-sm text-muted-foreground">{category.note}</p>
              </button>
            ))}
          </div>
        </section>

        <TripFilterBar filters={filters} onChange={setFilters} />

        {loading ? <CardSkeletonGrid /> : null}

        {error ? (
          <EmptyState title="Unable to load trips" description={error} action={<Button onClick={() => setFilters({ ...filters })}>Retry</Button>} />
        ) : null}

        {!loading && !error && trips.length === 0 ? (
          <EmptyState
            title="No public trips found"
            description="Try another location, date, or budget filter. Private trips are intentionally hidden from this feed."
            action={<Button variant="outline" onClick={() => setFilters({})}>Clear filters</Button>}
          />
        ) : null}

        {!loading && !error && trips.length > 0 ? (
          <>
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
              {trips.slice(0, visibleCount).map((trip) => (
                <TripCard key={trip.id} trip={trip} />
              ))}
            </div>
            {visibleCount < trips.length ? (
              <div className="flex justify-center">
                <Button variant="outline" onClick={() => setVisibleCount((count) => count + 3)}>
                  Load more
                </Button>
              </div>
            ) : null}
          </>
        ) : null}
      </main>
      <Footer />
    </div>
  );
}
