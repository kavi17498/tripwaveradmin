"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { CalendarDays, MapPin, Users } from "lucide-react";
import { Navbar } from "@/components/layout/navbar";
import { Footer } from "@/components/layout/footer";
import { PageHeader } from "@/components/common/page-header";
import { EmptyState } from "@/components/feedback/empty-state";
import { CardSkeletonGrid } from "@/components/feedback/loading-skeletons";
import { Button } from "@/components/ui/button";
import { SummaryCard } from "@/components/common/summary-card";
import { tripApiService, type TripApiItem } from "@/lib/services/tripApiService";
import { useAuthCacheStore } from "@/lib/stores/useAuthCacheStore";
import { formatCurrencyRs } from "@/lib/utils";

const formatDateRange = (startDate?: string, endDate?: string) => {
  if (!startDate && !endDate) return "Dates unavailable";
  if (!endDate || startDate === endDate) return startDate ?? endDate ?? "Dates unavailable";
  return `${startDate} to ${endDate}`;
};

export default function BookingsPage() {
  const token = useAuthCacheStore((state) => state.token);
  const hydrateFromLegacySession = useAuthCacheStore((state) => state.hydrateFromLegacySession);
  const [trips, setTrips] = useState<TripApiItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [reloadKey, setReloadKey] = useState(0);
  const [actionTripId, setActionTripId] = useState<string | null>(null);

  useEffect(() => {
    hydrateFromLegacySession();
  }, [hydrateFromLegacySession]);

  useEffect(() => {
    const loadTrips = async () => {
      if (!token) {
        setError("Please sign in to view your bookings.");
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError("");
        const response = await tripApiService.getParticipatedTrips(token);
        setTrips(response.data);
      } catch (loadError) {
        const message = loadError instanceof Error ? loadError.message : "Failed to load bookings.";
        setError(message);
      } finally {
        setLoading(false);
      }
    };

    void loadTrips();
  }, [token, reloadKey]);

  const stats = useMemo(() => {
    const totalTrips = trips.length;
    const upcomingTrips = trips.filter((trip) => trip.endDate >= new Date().toISOString().slice(0, 10)).length;
    const totalSpend = trips.reduce((sum, trip) => sum + (trip.price ?? 0), 0);

    return { totalTrips, upcomingTrips, totalSpend };
  }, [trips]);

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      <main className="mx-auto max-w-7xl space-y-8 px-4 py-8 md:px-6">
        <PageHeader
          title="Bookings"
          description="Trips you participated in, excluding the trips you created yourself."
        />

        <section className="grid grid-cols-1 gap-4 md:grid-cols-3">
          <SummaryCard title="Trips booked" value={String(stats.totalTrips)} meta="Participated trips returned by /trips/participated" />
          <SummaryCard title="Upcoming" value={String(stats.upcomingTrips)} meta="Trips that have not ended yet" />
          <SummaryCard title="Estimated spend" value={formatCurrencyRs(stats.totalSpend)} meta="Sum of trip prices in this list" />
        </section>

        {loading ? <CardSkeletonGrid /> : null}

        {error ? (
          <EmptyState
            title="Unable to load bookings"
            description={error}
            action={<Button onClick={() => setReloadKey((current) => current + 1)}>Retry</Button>}
          />
        ) : null}

        {!loading && !error && trips.length === 0 ? (
          <EmptyState
            title="No bookings found"
            description="You will see trips here once you participate in one and the booking is linked to your account."
            action={<Button asChild variant="outline"><Link href="/trips">Browse trips</Link></Button>}
          />
        ) : null}

        {!loading && !error && trips.length > 0 ? (
          <section className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
            {trips.map((trip) => {
              const coverImage = trip.coverImage ?? trip.photos?.[0] ?? trip.destinations?.[0]?.photos?.[0] ?? "";
              const destination = trip.mainDestinations?.[0]?.name ?? trip.destinations?.[0]?.name ?? trip.startLocation ?? "Unknown destination";
              const participantCount = Array.isArray(trip.participants) ? trip.participants.length : 0;

              return (
                <article key={trip.id} className="overflow-hidden border border-border bg-card shadow-sm">
                  {coverImage ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={coverImage} alt={trip.tripName} className="h-44 w-full object-cover" />
                  ) : null}
                  <div className="space-y-3 p-4">
                    <div>
                      <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">{trip.tripCategory}</p>
                      <h3 className="mt-1 text-lg font-semibold leading-tight">{trip.tripName}</h3>
                    </div>

                    <p className="line-clamp-2 text-sm text-muted-foreground">{trip.description ?? "No trip description available."}</p>

                    <div className="space-y-1 text-sm text-muted-foreground">
                      <p className="flex items-center gap-2">
                        <MapPin className="size-4" />
                        {destination}
                      </p>
                      <p className="flex items-center gap-2">
                        <CalendarDays className="size-4" />
                        {formatDateRange(trip.startDate, trip.endDate)}
                      </p>
                      <p className="flex items-center gap-2">
                        <Users className="size-4" />
                        {participantCount} participant{participantCount === 1 ? "" : "s"}
                      </p>
                    </div>

                    <div className="flex flex-wrap items-center gap-2 pt-1">
                      <Button
                        variant="outline"
                        disabled={actionTripId === trip.id}
                        onClick={async () => {
                          if (!token) return;
                          setActionTripId(trip.id);
                          try {
                            await tripApiService.cancelBooking(trip.id, token);
                            const response = await tripApiService.getParticipatedTrips(token);
                            setTrips(response.data);
                          } catch (cancelError) {
                            setError(cancelError instanceof Error ? cancelError.message : "Failed to cancel booking.");
                          } finally {
                            setActionTripId(null);
                          }
                        }}
                      >
                        {actionTripId === trip.id ? "Canceling..." : "Cancel booking"}
                      </Button>
                      <Button asChild>
                        <Link href={`/chat?tripId=${trip.id}`}>View chat group</Link>
                      </Button>
                    </div>
                  </div>
                </article>
              );
            })}
          </section>
        ) : null}
      </main>

      <Footer />
    </div>
  );
}