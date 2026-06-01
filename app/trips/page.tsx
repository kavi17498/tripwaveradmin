"use client";

import { useEffect, useMemo, useState } from "react";
import { Navbar } from "@/components/layout/navbar";
import { Footer } from "@/components/layout/footer";
import { TripFilterBar } from "@/components/trips/trip-filter-bar";
import { TripCardEnhanced } from "@/components/trips/trip-card-enhanced";
import { OnDemandTripCard } from "@/components/trips/on-demand-trip-card";
import { EmptyState } from "@/components/feedback/empty-state";
import { CardSkeletonGrid } from "@/components/feedback/loading-skeletons";
import { Button } from "@/components/ui/button";
import { tripApiService, type TripApiItem } from "@/lib/services/tripApiService";
import { onDemandTripService, type OnDemandTripTemplateApiItem } from "@/lib/services/onDemandTripService";
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
    _category: item.tripCategory ?? "Uncategorized",
  } as any;
}

export default function TripsPage() {
  const [filters, setFilters] = useState<TripFilters>({});
  const [apiTrips, setApiTrips] = useState<TripApiItem[]>([]);
  const [onDemandTrips, setOnDemandTrips] = useState<OnDemandTripTemplateApiItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const loadAllTrips = async () => {
      try {
        setLoading(true);
        setError("");
        
        // Load both fixed departures and on-demand trip templates concurrently
        const [fixedRes, onDemandRes] = await Promise.all([
          tripApiService.getApprovedPublicTrips({}),
          onDemandTripService.getPublicTemplates()
        ]);

        if (fixedRes && fixedRes.data) {
          const publicTrips = fixedRes.data.filter((t) => !(t.tripCategory ?? "").toLowerCase().includes("private"));
          setApiTrips(publicTrips);
        } else {
          setApiTrips([]);
        }

        if (onDemandRes && onDemandRes.data) {
          const publicTemplates = onDemandRes.data.filter((t) => !t.isHidden && t.status === "approved");
          setOnDemandTrips(publicTemplates);
        } else {
          setOnDemandTrips([]);
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to fetch trips");
      } finally {
        setLoading(false);
      }
    };

    loadAllTrips();
  }, []);

  // Filter & Sort On-Demand Templates
  const filteredOnDemandTrips = useMemo(() => {
    let list = [...onDemandTrips];

    // Query text match (keyword, destination, organizer)
    if (filters.query) {
      const q = filters.query.trim().toLowerCase();
      list = list.filter((t) => {
        const destNames = (t.destinations || []).map((d) => d.name.toLowerCase());
        const mainDestNames = (t.mainDestinations || []).map((d) => d.name.toLowerCase());
        return (
          t.tripName.toLowerCase().includes(q) ||
          (t.description || "").toLowerCase().includes(q) ||
          (t.startLocation || "").toLowerCase().includes(q) ||
          destNames.some((name) => name.includes(q)) ||
          mainDestNames.some((name) => name.includes(q)) ||
          (t.organizerName || "").toLowerCase().includes(q)
        );
      });
    }

    // Date filters: restrict if range duration is smaller than template duration
    if (filters.startDate && filters.endDate) {
      const start = new Date(filters.startDate);
      const end = new Date(filters.endDate);
      if (!isNaN(start.getTime()) && !isNaN(end.getTime())) {
        const rangeDays = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) + 1;
        list = list.filter((t) => t.durationDays <= rangeDays);
      }
    }

    // Max Price
    if (filters.maxPrice !== undefined && filters.maxPrice !== null) {
      list = list.filter((t) => t.price <= filters.maxPrice!);
    }

    // Duration (max days)
    if (filters.duration !== undefined && filters.duration !== null) {
      list = list.filter((t) => t.durationDays <= filters.duration!);
    }

    // Sort By
    if (filters.sortBy) {
      if (filters.sortBy === "price-asc") {
        list.sort((a, b) => a.price - b.price);
      } else if (filters.sortBy === "price-desc") {
        list.sort((a, b) => b.price - a.price);
      } else if (filters.sortBy === "date-asc") {
        list.sort((a, b) => {
          const aTime = a.createdAt ? new Date(a.createdAt as string).getTime() : 0;
          const bTime = b.createdAt ? new Date(b.createdAt as string).getTime() : 0;
          return aTime - bTime;
        });
      } else if (filters.sortBy === "date-desc") {
        list.sort((a, b) => {
          const aTime = a.createdAt ? new Date(a.createdAt as string).getTime() : 0;
          const bTime = b.createdAt ? new Date(b.createdAt as string).getTime() : 0;
          return bTime - aTime;
        });
      }
    }

    return list;
  }, [onDemandTrips, filters]);

  // Filter & Sort Fixed Departures
  const filteredFixedTrips = useMemo(() => {
    let list = [...apiTrips];

    // Query text match (keyword, destination, organizer)
    if (filters.query) {
      const q = filters.query.trim().toLowerCase();
      list = list.filter((t) => {
        const destNames = (t.destinations || []).map((d) => d.name.toLowerCase());
        const mainDestNames = (t.mainDestinations || []).map((d: any) => (typeof d === "string" ? d.toLowerCase() : d?.name?.toLowerCase() || ""));
        return (
          t.tripName.toLowerCase().includes(q) ||
          (t.description || "").toLowerCase().includes(q) ||
          (t.startLocation || "").toLowerCase().includes(q) ||
          destNames.some((name) => name.includes(q)) ||
          mainDestNames.some((name) => name.includes(q)) ||
          (t.organizerName || "").toLowerCase().includes(q)
        );
      });
    }

    // Start Date
    if (filters.startDate) {
      const filterStart = new Date(filters.startDate);
      if (!isNaN(filterStart.getTime())) {
        list = list.filter((t) => {
          const tripStart = new Date(t.startDate);
          return !isNaN(tripStart.getTime()) && tripStart >= filterStart;
        });
      }
    }

    // End Date
    if (filters.endDate) {
      const filterEnd = new Date(filters.endDate);
      if (!isNaN(filterEnd.getTime())) {
        list = list.filter((t) => {
          const tripEnd = new Date(t.endDate);
          return !isNaN(tripEnd.getTime()) && tripEnd <= filterEnd;
        });
      }
    }

    // Max Price
    if (filters.maxPrice !== undefined && filters.maxPrice !== null) {
      list = list.filter((t) => t.price <= filters.maxPrice!);
    }

    // Duration (max days)
    if (filters.duration !== undefined && filters.duration !== null) {
      list = list.filter((t) => {
        const start = t.startDate ? new Date(t.startDate) : null;
        const end = t.endDate ? new Date(t.endDate) : null;
        const durationDays = start && end ? Math.max(1, Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) + 1) : 1;
        return durationDays <= filters.duration!;
      });
    }

    // Sort By
    if (filters.sortBy) {
      if (filters.sortBy === "price-asc") {
        list.sort((a, b) => a.price - b.price);
      } else if (filters.sortBy === "price-desc") {
        list.sort((a, b) => b.price - a.price);
      } else if (filters.sortBy === "date-asc") {
        list.sort((a, b) => new Date(a.startDate).getTime() - new Date(b.startDate).getTime());
      } else if (filters.sortBy === "date-desc") {
        list.sort((a, b) => new Date(b.startDate).getTime() - new Date(a.startDate).getTime());
      }
    }

    return list;
  }, [apiTrips, filters]);

  const isSearchActive = useMemo(() => {
    return !!(
      filters.query ||
      filters.startDate ||
      filters.endDate ||
      filters.maxPrice ||
      filters.duration ||
      filters.sortBy
    );
  }, [filters]);

  const resultsLabel = useMemo(() => {
    const total = filteredOnDemandTrips.length + filteredFixedTrips.length;
    return `${total} trips found (${filteredOnDemandTrips.length} on-demand, ${filteredFixedTrips.length} fixed date tours)`;
  }, [filteredOnDemandTrips.length, filteredFixedTrips.length]);

  // Categories when filters are inactive
  const soloTrips = useMemo(() => onDemandTrips.filter((t) => t.maxParticipants === 1), [onDemandTrips]);
  const coupleTrips = useMemo(() => onDemandTrips.filter((t) => t.maxParticipants === 2), [onDemandTrips]);
  const familyTrips = useMemo(() => onDemandTrips.filter((t) => t.maxParticipants > 2 && t.maxParticipants <= 6), [onDemandTrips]);
  const teamTrips = useMemo(() => onDemandTrips.filter((t) => t.maxParticipants > 6), [onDemandTrips]);
  const fixedDateTrips = apiTrips;

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
              Sri Lanka Journeys
            </div>
            <h1 className="text-3xl md:text-5xl font-extrabold tracking-tight leading-tight text-white max-w-3xl drop-shadow-xs">
              Customizable & Group Trips
            </h1>
            <p className="text-sm md:text-base text-zinc-300 max-w-2xl leading-relaxed font-light drop-shadow-2xs">
              Choose between flexible on-demand itineraries or planned group departures led by verified local guides. Discover your next adventure in Sri Lanka.
            </p>
          </div>
        </section>

        {/* Main Content Container (Floating over Hero) */}
        <div className="relative z-20 max-w-7xl mx-auto px-4 md:px-6 -mt-10 space-y-12">
          
          {/* Trip Filter Bar */}
          <TripFilterBar filters={filters} onChange={setFilters} />

          {/* Results Counter / Feed status */}
          {!loading && !error && isSearchActive && (
            <div className="flex items-center justify-between">
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-widest bg-muted/65 px-3 py-1.5 rounded-full border border-border/40">
                {resultsLabel}
              </p>
              <Button variant="outline" size="sm" onClick={() => setFilters({})}>Clear Filters</Button>
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

          {/* Empty Search Results */}
          {!loading && !error && isSearchActive && filteredOnDemandTrips.length === 0 && filteredFixedTrips.length === 0 ? (
            <EmptyState
              title="No matches found"
              description="Try adjusting your query, price range, or duration. Private workspaces are hidden."
              action={<Button variant="outline" onClick={() => setFilters({})}>Clear Filters</Button>}
            />
          ) : null}

          {/* Search Result Listings */}
          {!loading && !error && isSearchActive && (filteredOnDemandTrips.length > 0 || filteredFixedTrips.length > 0) && (
            <section className="space-y-14 pt-4">
              
              {/* On Demand Results */}
              {filteredOnDemandTrips.length > 0 && (
                <div className="space-y-6">
                  <div className="flex items-center justify-between border-b border-border/80 pb-3">
                    <div className="flex items-center gap-3">
                      <h3 className="text-lg md:text-xl font-bold tracking-tight text-foreground">
                        Matching On-Demand Trips
                      </h3>
                      <span className="text-[10px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full border bg-muted text-muted-foreground border-border">
                        {filteredOnDemandTrips.length} {filteredOnDemandTrips.length === 1 ? "trip" : "trips"}
                      </span>
                    </div>
                  </div>
                  <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
                    {filteredOnDemandTrips.map((t) => (
                      <OnDemandTripCard key={`search-od-${t.id}`} trip={t} />
                    ))}
                  </div>
                </div>
              )}

              {/* Fixed Date Results */}
              {filteredFixedTrips.length > 0 && (
                <div className="space-y-6">
                  <div className="flex items-center justify-between border-b border-border/80 pb-3">
                    <div className="flex items-center gap-3">
                      <h3 className="text-lg md:text-xl font-bold tracking-tight text-foreground">
                        Matching Fixed Date Tours
                      </h3>
                      <span className="text-[10px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full border bg-muted text-muted-foreground border-border">
                        {filteredFixedTrips.length} {filteredFixedTrips.length === 1 ? "tour" : "tours"}
                      </span>
                    </div>
                  </div>
                  <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
                    {filteredFixedTrips.map((t) => (
                      <TripCardEnhanced key={`search-fixed-${t.id}`} trip={mapApiToTrip(t)} />
                    ))}
                  </div>
                </div>
              )}

            </section>
          )}

          {/* Grouped Listings (Default view when no search/filter is active) */}
          {!loading && !error && !isSearchActive && (
            <section className="space-y-16 pt-4">
              
              {/* Solo Trips */}
              <div className="space-y-6">
                <div className="flex items-center justify-between border-b border-border/80 pb-3">
                  <div className="flex items-center gap-3">
                    <h3 className="text-lg md:text-xl font-bold tracking-tight text-sky-600 dark:text-sky-400">
                      Solo Trips
                    </h3>
                    <span className="text-[10px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full border bg-sky-500/10 text-sky-700 dark:text-sky-300 border-sky-500/20">
                      {soloTrips.length} {soloTrips.length === 1 ? "trip" : "trips"}
                    </span>
                  </div>
                </div>
                {soloTrips.length === 0 ? (
                  <p className="text-sm text-muted-foreground">No solo trips available.</p>
                ) : (
                  <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
                    {soloTrips.map((t) => (
                      <OnDemandTripCard key={t.id} trip={t} />
                    ))}
                  </div>
                )}
              </div>

              {/* Couple Trips */}
              <div className="space-y-6">
                <div className="flex items-center justify-between border-b border-border/80 pb-3">
                  <div className="flex items-center gap-3">
                    <h3 className="text-lg md:text-xl font-bold tracking-tight text-rose-500 dark:text-rose-400">
                      Couple Trips
                    </h3>
                    <span className="text-[10px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full border bg-rose-500/10 text-rose-700 dark:text-rose-300 border-rose-500/20">
                      {coupleTrips.length} {coupleTrips.length === 1 ? "trip" : "trips"}
                    </span>
                  </div>
                </div>
                {coupleTrips.length === 0 ? (
                  <p className="text-sm text-muted-foreground">No couple trips available.</p>
                ) : (
                  <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
                    {coupleTrips.map((t) => (
                      <OnDemandTripCard key={t.id} trip={t} />
                    ))}
                  </div>
                )}
              </div>

              {/* Family Trips */}
              <div className="space-y-6">
                <div className="flex items-center justify-between border-b border-border/80 pb-3">
                  <div className="flex items-center gap-3">
                    <h3 className="text-lg md:text-xl font-bold tracking-tight text-emerald-600 dark:text-emerald-400">
                      Family Trips
                    </h3>
                    <span className="text-[10px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full border bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border-emerald-500/20">
                      {familyTrips.length} {familyTrips.length === 1 ? "trip" : "trips"}
                    </span>
                  </div>
                </div>
                {familyTrips.length === 0 ? (
                  <p className="text-sm text-muted-foreground">No family trips available.</p>
                ) : (
                  <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
                    {familyTrips.map((t) => (
                      <OnDemandTripCard key={t.id} trip={t} />
                    ))}
                  </div>
                )}
              </div>

              {/* Team Trips */}
              <div className="space-y-6">
                <div className="flex items-center justify-between border-b border-border/80 pb-3">
                  <div className="flex items-center gap-3">
                    <h3 className="text-lg md:text-xl font-bold tracking-tight text-indigo-600 dark:text-indigo-400">
                      Team Trips
                    </h3>
                    <span className="text-[10px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full border bg-indigo-500/10 text-indigo-700 dark:text-indigo-300 border-indigo-500/20">
                      {teamTrips.length} {teamTrips.length === 1 ? "trip" : "trips"}
                    </span>
                  </div>
                </div>
                {teamTrips.length === 0 ? (
                  <p className="text-sm text-muted-foreground">No team trips available.</p>
                ) : (
                  <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
                    {teamTrips.map((t) => (
                      <OnDemandTripCard key={t.id} trip={t} />
                    ))}
                  </div>
                )}
              </div>

              {/* Fixed Date Tours */}
              <div className="space-y-6">
                <div className="flex items-center justify-between border-b border-border/80 pb-3">
                  <div className="flex items-center gap-3">
                    <h3 className="text-lg md:text-xl font-bold tracking-tight text-foreground">
                      Fixed Date Tours
                    </h3>
                    <span className="text-[10px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full border bg-muted text-muted-foreground border-border">
                      {fixedDateTrips.length} {fixedDateTrips.length === 1 ? "tour" : "tours"}
                    </span>
                  </div>
                </div>
                {fixedDateTrips.length === 0 ? (
                  <p className="text-sm text-muted-foreground">No fixed date tours available.</p>
                ) : (
                  <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
                    {fixedDateTrips.map((t) => (
                      <TripCardEnhanced key={t.id} trip={mapApiToTrip(t)} />
                    ))}
                  </div>
                )}
              </div>

            </section>
          )}

        </div>
      </main>
      <Footer />
    </div>
  );
}


