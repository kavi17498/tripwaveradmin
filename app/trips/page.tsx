"use client";

import { useEffect, useMemo, useState } from "react";
import { Navbar } from "@/components/layout/navbar";
import { Footer } from "@/components/layout/footer";
import { TripFilterBar } from "@/components/trips/trip-filter-bar";
import { TripCardEnhanced } from "@/components/trips/trip-card-enhanced";
import { EmptyState } from "@/components/feedback/empty-state";
import { CardSkeletonGrid } from "@/components/feedback/loading-skeletons";
import { Button } from "@/components/ui/button";
import { tripApiService, type TripApiItem } from "@/lib/services/tripApiService";
import { TripFilters } from "@/lib/types";

// Helper: map API trip shape to UI Trip shape used by `TripCardEnhanced`
function mapApiToTrip(item: TripApiItem) {
  const firstDestination = item.destinations?.[0]?.name ?? item.startLocation ?? "";
  const cover = item.coverImage ?? item.photos?.[0] ?? "";
  
  const start = item.startDate ? new Date(item.startDate) : null;
  const end = item.endDate ? new Date(item.endDate) : null;
  const durationDays = start && end ? Math.max(1, Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) + 1) : 1;

  let includedItems: string[] = [];
  if (item.included) {
    if (Array.isArray(item.included)) {
      includedItems = item.included;
    } else if (typeof item.included === "object") {
      includedItems = Object.values(item.included).flat().filter((x): x is string => typeof x === "string");
    }
  }

  return {
    id: item.id,
    title: item.tripName,
    destination: firstDestination,
    description: item.description ?? "",
    startDate: item.startDate ?? "",
    endDate: item.endDate ?? "",
    price: item.price ?? 0,
    capacity: item.maxParticipants ?? 0,
    bookedCount: item.participants ? item.participants.length : 0,
    durationDays,
    tripType: item.tripCategory?.toLowerCase().includes("private") ? "private" : "public",
    status: (item.status as any) ?? "published",
    coverImage: cover,
    organizerId: item.organizer ?? "",
    organizerName: item.organizerName ?? "Local Guide",
    organizerRating: (item as any).organizerRating ?? null,
    location: {
      city: firstDestination,
      country: "Sri Lanka",
      lat: 0,
      lng: 0,
    },
    included: includedItems,
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
    <div className="flex flex-col min-h-screen bg-background">
      <Navbar />
      <main className="flex-1 w-full bg-background pb-20">
        
        {/* Immersive Full-Width Hero Banner */}
        <section className="relative h-[340px] md:h-[400px] w-full flex items-center bg-zinc-950 overflow-hidden">
          {/* Background Image with soft gradient overlays */}
          <div className="absolute inset-0 z-0">
            <img 
              src="https://images.unsplash.com/photo-1589307357507-fd1f0ab64582?q=80&w=1800&auto=format&fit=crop" 
              alt="Sri Lanka tea plantation" 
              className="w-full h-full object-cover opacity-85 transition-transform duration-[10000ms] hover:scale-105"
            />
            <div className="absolute inset-0 bg-gradient-to-r from-black/90 via-black/60 to-transparent" />
            <div className="absolute inset-0 bg-gradient-to-t from-background via-transparent to-black/45" />
          </div>
          
          <div className="relative z-10 w-full max-w-7xl mx-auto px-4 md:px-6 text-white space-y-4">
            <div className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3.5 py-1 text-[10px] font-bold tracking-[0.15em] uppercase text-sky-400 backdrop-blur-md border border-white/10">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-sky-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-sky-500"></span>
              </span>
              Sri Lanka Departures
            </div>
            <h1 className="text-3xl md:text-5xl font-extrabold tracking-tight leading-tight text-white max-w-3xl drop-shadow-xs">
              Guided, Group & Family Journeys
            </h1>
            <p className="text-sm md:text-base text-zinc-300 max-w-2xl leading-relaxed font-light drop-shadow-2xs">
              Explore public departures with verified local guides. Only discoverable departures are listed here; private itineraries remain strictly secure in their workspaces.
            </p>
          </div>
        </section>

        {/* Main Content Container (Floating over Hero) */}
        <div className="relative z-20 max-w-7xl mx-auto px-4 md:px-6 -mt-10 space-y-12">
          
          {/* Trip Filter Bar */}
          <TripFilterBar filters={filters} onChange={setFilters} />

          {/* Results Counter / Feed status */}
          {!loading && !error && (
            <div className="flex items-center justify-between">
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-widest bg-muted/65 px-3 py-1.5 rounded-full border border-border/40">
                {resultsLabel}
              </p>
            </div>
          )}

          {/* Loading / Error States */}
          {loading ? (
            <div className="pt-4">
              <CardSkeletonGrid />
            </div>
          ) : null}

          {error ? (
            <EmptyState 
              title="Unable to load trips" 
              description={error} 
              action={<Button onClick={() => setFilters({ ...filters })}>Retry</Button>} 
            />
          ) : null}

          {!loading && !error && apiTrips.length === 0 ? (
            <EmptyState
              title="No public trips found"
              description="Try another location, date, or budget filter. Private trips are intentionally hidden from this feed."
              action={<Button variant="outline" onClick={() => setFilters({})}>Clear filters</Button>}
            />
          ) : null}

          {/* Grouped Trip Listings */}
          {!loading && !error && apiTrips.length > 0 && (
            <section className="space-y-14 pt-4">
              {Object.entries(grouped).map(([category, items]) => {
                const isSolo = category.toLowerCase().includes("solo");
                const isFamily = category.toLowerCase().includes("family");
                const isGroup = category.toLowerCase().includes("stranger") || category.toLowerCase().includes("group");
                
                const titleColor = isSolo 
                  ? "text-sky-600 dark:text-sky-400" 
                  : isFamily 
                    ? "text-emerald-600 dark:text-emerald-400" 
                    : isGroup 
                      ? "text-purple-600 dark:text-purple-400" 
                      : "text-foreground";
                
                const bgBadge = isSolo 
                  ? "bg-sky-500/10 text-sky-700 dark:text-sky-300 border-sky-500/20" 
                  : isFamily 
                    ? "bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border-emerald-500/20" 
                    : isGroup 
                      ? "bg-purple-500/10 text-purple-700 dark:text-purple-300 border-purple-500/20" 
                      : "bg-muted text-muted-foreground border-border";

                return (
                  <div key={category} className="space-y-6">
                    <div className="flex items-center justify-between border-b border-border/80 pb-3">
                      <div className="flex items-center gap-3">
                        <h3 className={`text-lg md:text-xl font-bold tracking-tight ${titleColor}`}>
                          {category}
                        </h3>
                        <span className={`text-[10px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full border ${bgBadge}`}>
                          {items.length} {items.length === 1 ? "departure" : "departures"}
                        </span>
                      </div>
                    </div>
                    <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
                      {items.map((it) => (
                        <TripCardEnhanced key={it.id} trip={mapApiToTrip(it)} />
                      ))}
                    </div>
                  </div>
                );
              })}
            </section>
          )}

        </div>
      </main>
      <Footer />
    </div>
  );
}

