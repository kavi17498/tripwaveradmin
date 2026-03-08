"use client";

import { useEffect, useState } from "react";
import { Navbar } from "@/components/layout/navbar";
import { Footer } from "@/components/layout/footer";
import { TripFilterBar } from "@/components/trips/trip-filter-bar";
import { TripCard } from "@/components/trips/trip-card";
import { EmptyState } from "@/components/feedback/empty-state";
import { CardSkeletonGrid } from "@/components/feedback/loading-skeletons";
import { Button } from "@/components/ui/button";
import { tripService } from "@/lib/services/tripService";
import { Trip, TripFilters } from "@/lib/types";

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
        setTrips(result.data);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to fetch trips");
      } finally {
        setLoading(false);
      }
    };

    loadTrips();
  }, [filters]);

  return (
    <div>
      <Navbar />
      <main className="mx-auto max-w-7xl space-y-6 px-4 py-8 md:px-6">
        <div>
          <h1 className="text-3xl font-semibold">Public Trips</h1>
          <p className="mt-1 text-sm text-muted-foreground">Search and filter verified organizer trips.</p>
        </div>

        <TripFilterBar filters={filters} onChange={setFilters} />

        {loading ? <CardSkeletonGrid /> : null}

        {error ? (
          <EmptyState title="Unable to load trips" description={error} action={<Button onClick={() => setFilters({ ...filters })}>Retry</Button>} />
        ) : null}

        {!loading && !error && trips.length === 0 ? (
          <EmptyState
            title="No trips found"
            description="Try changing date, destination, or budget filters."
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
