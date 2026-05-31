"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { Navbar } from "@/components/layout/navbar";
import { Footer } from "@/components/layout/footer";
import { SmoothScrollHero } from "@/components/publicavailable/full_hero";
import { Button } from "@/components/ui/button";
import { TripCardEnhanced } from "@/components/trips/trip-card-enhanced";
import { OnDemandTripCard } from "@/components/trips/on-demand-trip-card";
import { Trip } from "@/lib/types";
import { tripApiService, type TripApiItem } from "@/lib/services/tripApiService";
import { onDemandTripService, type OnDemandTripTemplateApiItem } from "@/lib/services/onDemandTripService";
import { searchService, type ComprehensiveSearchResponse } from "@/lib/services/searchService";
import { useAuthCacheStore } from "@/lib/stores/useAuthCacheStore";



function mapApiToTrip(item: TripApiItem): Trip {
  const start = item.startDate ? new Date(item.startDate) : null;
  const end = item.endDate ? new Date(item.endDate) : null;
  const durationDays = start && end ? Math.max(1, Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) + 1) : 1;

  let mainDest = "";
  let mainLat = 0;
  let mainLng = 0;
  let mainCountry = "";

  if (item.mainDestinations && item.mainDestinations.length > 0) {
    const first = item.mainDestinations[0] as any;
    if (typeof first === "string") {
      const parts = first.split(",").map((s: string) => s.trim());
      mainDest = parts[0] ?? first;
      mainCountry = parts[1] ?? "";
    } else if (first && typeof first === "object") {
      mainDest = first.name ?? item.startLocation ?? "";
      mainLat = first.lat ?? 0;
      mainLng = first.lng ?? 0;
    }
  } else {
    mainDest = item.startLocation ?? "";
  }

  return {
    id: item.id,
    title: item.tripName,
    destination: mainDest,
    description: item.description || "",
    startDate: item.startDate ?? "",
    endDate: item.endDate ?? "",
    price: item.price ?? 0,
    capacity: item.maxParticipants ?? 10,
    bookedCount: (item as any).bookedCount ?? 0,
    durationDays,
    tripType: (item.tripCategory as string) || "public",
    status: item.status || "published",
    coverImage: item.coverImage || (item.photos && item.photos[0]) || "",
    organizerId: item.organizer ?? "",
    organizerName: (item as any).organizerName || String(item.organizer ?? ""),
    organizerRating: (item as any).organizerRating ?? null,
    location: {
      city: mainDest || item.startLocation || "",
      country: mainCountry || "",
      lat: mainLat || 0,
      lng: mainLng || 0,
    },
    included: Array.isArray(item.included) ? (item.included as any).hotelFacilities ?? [] : [],
    excluded: [],
    itinerary: [],
  } as Trip;
}

export default function HomePage() {
  const [trips, setTrips] = useState<Trip[]>([]);
  const [onDemandTrips, setOnDemandTrips] = useState<OnDemandTripTemplateApiItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadingOnDemand, setLoadingOnDemand] = useState(false);
  const [isSearchActive, setIsSearchActive] = useState(false);
  const [heroQuery, setHeroQuery] = useState("");
  const [heroSearchLoading, setHeroSearchLoading] = useState(false);
  const [heroSearchResults, setHeroSearchResults] = useState<ComprehensiveSearchResponse | null>(null);

  const [filters, setFilters] = useState({
    tripCategory: "",
    tripName: "",
    organizer: "",
    startLocation: "",
    startDate: "",
    endDate: "",
    minPrice: "",
    maxPrice: "",
  });

  const token = useAuthCacheStore((s) => s.token);
  const currentUser = useAuthCacheStore((s) => s.currentUser);
  const hydrated = useAuthCacheStore((s) => s.hydrated);
  const hydrateFromLegacySession = useAuthCacheStore((s) => s.hydrateFromLegacySession);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!hydrated) hydrateFromLegacySession();
    loadTrips();
    loadOnDemandTrips();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token, hydrated]);

  async function loadOnDemandTrips() {
    try {
      setLoadingOnDemand(true);
      const res = await onDemandTripService.getPublicTemplates();
      if (res && res.data) {
        setOnDemandTrips(res.data.filter((trip) => !trip.isHidden && trip.status === "approved"));
      }
    } catch {
      setOnDemandTrips([]);
    } finally {
      setLoadingOnDemand(false);
    }
  }

  async function loadTrips(params?: Record<string, string | number | undefined>) {
    try {
      setLoading(true);
      const res = await tripApiService.getApprovedPublicTrips(params, token ?? undefined);
      if (res && res.data) {
        setTrips(res.data.map(mapApiToTrip));
      }
    } catch (err) {
      setTrips([]);
    } finally {
      setLoading(false);
    }
  }

  function handleInputChange(e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) {
    const { name, value } = e.target;
    setFilters((prev) => ({ ...prev, [name]: value }));
  }

  function handleSearch(e?: React.FormEvent) {
    e?.preventDefault();
    const params: Record<string, string | number | undefined> = {};
    Object.entries(filters).forEach(([k, v]) => {
      if (v !== "") params[k] = v;
    });
    const hasActiveFilters = Object.values(filters).some((v) => v !== "");
    setIsSearchActive(hasActiveFilters);
    loadTrips(params);
  }

  function handleReset() {
    setFilters({
      tripCategory: "",
      tripName: "",
      organizer: "",
      startLocation: "",
      startDate: "",
      endDate: "",
      minPrice: "",
      maxPrice: "",
    });
    setIsSearchActive(false);
    loadTrips();
  }

  async function handleHeroSearch(query: string) {
    const normalizedQuery = query.trim();
    setHeroQuery(normalizedQuery);

    if (!normalizedQuery) {
      setHeroSearchResults(null);
      return;
    }

    try {
      setHeroSearchLoading(true);
      const res = await searchService.comprehensiveSearch({
        q: normalizedQuery,
        tripLimit: 12,
        onDemandLimit: 12,
      });

      setHeroSearchResults(res.data);
    } catch {
      setHeroSearchResults({
        query: normalizedQuery,
        totals: { trips: 0, onDemandTrips: 0, total: 0 },
        trips: [],
        onDemandTrips: [],
      });
    } finally {
      setHeroSearchLoading(false);
    }
  }

  function clearHeroSearch() {
    setHeroQuery("");
    setHeroSearchResults(null);
  }

  const fixedDateTrips = trips;
  const soloTrips = onDemandTrips.filter((t) => t.maxParticipants === 1);
  const coupleTrips = onDemandTrips.filter((t) => t.maxParticipants === 2);
  const familyTrips = onDemandTrips.filter((t) => t.maxParticipants > 2 && t.maxParticipants <= 6);
  const teamTrips = onDemandTrips.filter((t) => t.maxParticipants > 6);
  const searchedTrips = (heroSearchResults?.trips || []).map((trip) => mapApiToTrip(trip as TripApiItem));
  const searchedOnDemandTrips = heroSearchResults?.onDemandTrips || [];

  return (
    <div className="bg-background">
      <Navbar />
      <main>
        <SmoothScrollHero onSearch={handleHeroSearch} isSearching={heroSearchLoading} initialQuery={heroQuery} />

        {heroQuery && (
          <section className="mx-auto max-w-7xl px-4 pt-10 md:px-6">
            <div className="rounded-2xl border border-border bg-card p-6 md:p-8">
              <div className="mb-6 flex flex-col gap-4 border-b border-border pb-5 md:flex-row md:items-end md:justify-between">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.2em] text-primary">Search Results</p>
                  <h2 className="mt-1 text-2xl font-black tracking-tight">Results for "{heroQuery}"</h2>
                  <p className="mt-1 text-sm text-muted-foreground">
                    {heroSearchResults?.totals.total ?? 0} total matches: {heroSearchResults?.totals.trips ?? 0} trips and {heroSearchResults?.totals.onDemandTrips ?? 0} on-demand trips.
                  </p>
                </div>
                <Button variant="outline" size="sm" onClick={clearHeroSearch}>Clear Search</Button>
              </div>

              {heroSearchLoading ? (
                <p className="text-sm text-muted-foreground">Searching trips...</p>
              ) : (heroSearchResults?.totals.total ?? 0) === 0 ? (
                <div className="rounded-xl border border-border bg-muted p-6 text-sm text-muted-foreground">
                  No matching trips found. Try another keyword like a destination, trip name, or guide name.
                </div>
              ) : (
                <div className="space-y-10">
                  <div>
                    <h3 className="mb-4 text-lg font-bold tracking-tight">Approved Public Trips</h3>
                    {searchedTrips.length === 0 ? (
                      <p className="text-sm text-muted-foreground">No approved public non-expired trips found for this query.</p>
                    ) : (
                      <div className="grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-2">
                        {searchedTrips.map((trip) => (
                          <TripCardEnhanced key={`search-trip-${trip.id}`} trip={trip} />
                        ))}
                      </div>
                    )}
                  </div>

                  <div>
                    <h3 className="mb-4 text-lg font-bold tracking-tight">On-demand Trips</h3>
                    {searchedOnDemandTrips.length === 0 ? (
                      <p className="text-sm text-muted-foreground">No approved on-demand trips found for this query.</p>
                    ) : (
                      <div className="grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-2">
                        {searchedOnDemandTrips.map((trip) => (
                          <OnDemandTripCard key={`search-ondemand-${trip.id}`} trip={trip} />
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          </section>
        )}

        <section className="mx-auto max-w-7xl px-4 py-16 md:px-6 md:py-24">
          <div className="mb-8 flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-semibold">Featured On-Demand Trips</h2>
              <p className="mt-1 text-sm text-muted-foreground">Browse flexible on-demand options and choose your dates later.</p>
            </div>
            {!isSearchActive && (
              <Button variant="outline" asChild className="hidden sm:inline-flex">
                <Link href="/trips">View all trips</Link>
              </Button>
            )}
          </div>

          <form onSubmit={handleSearch} className="mb-12 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 items-end border border-border bg-card p-6 rounded-sm">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider block">Trip Name</label>
              <input name="tripName" placeholder="Trip name" value={filters.tripName} onChange={handleInputChange} className="input w-full" />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider block">Start Location</label>
              <input name="startLocation" placeholder="Start location" value={filters.startLocation} onChange={handleInputChange} className="input w-full" />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider block">Start Date</label>
              <input name="startDate" type="date" placeholder="Start date" value={filters.startDate} onChange={handleInputChange} className="input w-full" />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider block">Price Range</label>
              <div className="flex gap-2">
                <input name="minPrice" placeholder="Min price" value={filters.minPrice} onChange={handleInputChange} className="input w-full" />
                <input name="maxPrice" placeholder="Max price" value={filters.maxPrice} onChange={handleInputChange} className="input w-full" />
              </div>
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider hidden lg:block invisible select-none">Actions</label>
              <div className="flex gap-2 w-full">
                <Button type="submit" className="flex-1">Search</Button>
                <Button variant="outline" className="flex-1" onClick={handleReset}>
                  Reset
                </Button>
              </div>
            </div>
          </form>


          {loading ? (
            <p>Loading trips…</p>
          ) : isSearchActive ? (
            <div>
              <div className="mb-6 flex items-center justify-between border-b border-border pb-4">
                <div>
                  <h3 className="text-xl font-bold tracking-tight">Search Results</h3>
                  <p className="text-sm text-muted-foreground mt-1">Found {trips.length} matching fixed date trips in Sri Lanka</p>
                </div>
                <Button variant="outline" size="sm" onClick={handleReset}>Clear All Filters</Button>
              </div>
              {trips.length === 0 ? (
                <p className="text-muted-foreground">No trips found.</p>
              ) : (
                      <div className="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-3">
                  {trips.map((t) => (
                    <TripCardEnhanced key={t.id} trip={t} />
                  ))}
                </div>
              )}
            </div>
          ) : (
            <div className="space-y-16">
              {/* Solo Trips Row */}
              <div className="grid grid-cols-1 gap-8 lg:grid-cols-3 border-b border-border pb-16 last:border-0 last:pb-0">
                <div className="space-y-4">
                  <span className="text-xs font-semibold tracking-wider text-sky-600 uppercase block">Explore Alone</span>
                  <h3 className="text-2xl font-bold tracking-tight">On-Demand Solo Trips</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    Travel on your own schedule. Book a verified local guide first, then choose the date that works for you.
                  </p>
                  <Button variant="outline" asChild className="w-full sm:w-auto">
                    <Link href="/organizers">Find Guides</Link>
                  </Button>
                </div>
                <div className="lg:col-span-2">
                  {soloTrips.length === 0 ? (
                    <div className="border border-border bg-card p-8 flex flex-col justify-between h-full min-h-[200px]">
                      <div>
                        <h4 className="font-semibold text-sm">No solo on-demand options yet</h4>
                        <p className="text-xs text-muted-foreground mt-2 leading-relaxed">
                          No on-demand solo templates are available right now. You can still create your own trip and invite a guide.
                        </p>
                      </div>
                      <Button className="mt-6 w-full sm:w-auto self-start" asChild>
                        <Link href="/dashboard/create-trip">Plan My Trip</Link>
                      </Button>
                    </div>
                  ) : (
                      <div className="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-3">
                      {soloTrips.slice(0, 3).map((t) => (
                        <OnDemandTripCard key={t.id} trip={t} />
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* Couple Trips Row */}
              <div className="grid grid-cols-1 gap-8 lg:grid-cols-3 border-b border-border pb-16 last:border-0 last:pb-0">
                <div className="space-y-4">
                  <span className="text-xs font-semibold tracking-wider text-rose-500 uppercase block">Romantic Getaways</span>
                  <h3 className="text-2xl font-bold tracking-tight">On-Demand Trips for Couples</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    Pick a guide and lock your preferred travel dates later. Ideal for flexible couple escapes.
                  </p>
                  <Button variant="outline" asChild className="w-full sm:w-auto">
                    <Link href="/organizers">Find Guides</Link>
                  </Button>
                </div>
                <div className="lg:col-span-2">
                  {coupleTrips.length === 0 ? (
                    <div className="border border-border bg-card p-8 flex flex-col justify-between h-full min-h-[200px]">
                      <div>
                        <h4 className="font-semibold text-sm">No couple on-demand options yet</h4>
                        <p className="text-xs text-muted-foreground mt-2 leading-relaxed">
                          No on-demand templates for couples are available right now. Create a custom trip with your own dates.
                        </p>
                      </div>
                      <Button className="mt-6 w-full sm:w-auto self-start" asChild>
                        <Link href="/dashboard/create-trip">Plan My Trip</Link>
                      </Button>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-3">
                      {coupleTrips.slice(0, 3).map((t) => (
                        <OnDemandTripCard key={t.id} trip={t} />
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* Family Trips Row */}
              <div className="grid grid-cols-1 gap-8 lg:grid-cols-3 border-b border-border pb-16 last:border-0 last:pb-0">
                <div className="space-y-4">
                  <span className="text-xs font-semibold tracking-wider text-emerald-600 uppercase block">Family Journeys</span>
                  <h3 className="text-2xl font-bold tracking-tight">On-Demand Family Trips</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    Family-friendly templates where you book a guide now and confirm your schedule later.
                  </p>
                  <Button variant="outline" asChild className="w-full sm:w-auto">
                    <Link href="/organizers">Find Guides</Link>
                  </Button>
                </div>
                <div className="lg:col-span-2">
                  {familyTrips.length === 0 ? (
                    <div className="border border-border bg-card p-8 flex flex-col justify-between h-full min-h-[200px]">
                      <div>
                        <h4 className="font-semibold text-sm">No family on-demand options yet</h4>
                        <p className="text-xs text-muted-foreground mt-2 leading-relaxed">
                          No on-demand family templates are available right now. Collaborate with a certified guide to build one.
                        </p>
                      </div>
                      <Button className="mt-6 w-full sm:w-auto self-start" asChild>
                        <Link href="/dashboard/create-trip">Plan My Trip</Link>
                      </Button>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-3">
                      {familyTrips.slice(0, 3).map((t) => (
                        <OnDemandTripCard key={t.id} trip={t} />
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* Team Trips Row */}
              <div className="grid grid-cols-1 gap-8 lg:grid-cols-3 border-b border-border pb-16 last:border-0 last:pb-0">
                <div className="space-y-4">
                  <span className="text-xs font-semibold tracking-wider text-indigo-600 uppercase block">Group Adventures</span>
                  <h3 className="text-2xl font-bold tracking-tight">On-Demand Trips for Teams</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    Great for clubs and teams who need date flexibility. Choose a guide now and lock dates later.
                  </p>
                  <Button variant="outline" asChild className="w-full sm:w-auto">
                    <Link href="/organizers">Find Guides</Link>
                  </Button>
                </div>
                <div className="lg:col-span-2">
                  {teamTrips.length === 0 ? (
                    <div className="border border-border bg-card p-8 flex flex-col justify-between h-full min-h-[200px]">
                      <div>
                        <h4 className="font-semibold text-sm">No team on-demand options yet</h4>
                        <p className="text-xs text-muted-foreground mt-2 leading-relaxed">
                          No on-demand team templates are available right now. Plan your own custom team route through Sri Lanka.
                        </p>
                      </div>
                      <Button className="mt-6 w-full sm:w-auto self-start" asChild>
                        <Link href="/dashboard/create-trip">Plan My Trip</Link>
                      </Button>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-3">
                      {teamTrips.slice(0, 3).map((t) => (
                        <OnDemandTripCard key={t.id} trip={t} />
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* Fixed Date Trips Section (last section) */}
              <div className="grid grid-cols-1 gap-8 lg:grid-cols-3 border-b border-border pb-16 last:border-0 last:pb-0">
                <div className="space-y-4">
                  <span className="text-xs font-semibold tracking-wider text-amber-600 uppercase block">Fixed Departures</span>
                  <h3 className="text-2xl font-bold tracking-tight">Fixed Date Trips</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    These trips already have confirmed departure dates. Browse all available approved fixed date trips.
                  </p>
                  <Button variant="outline" asChild className="w-full sm:w-auto">
                    <Link href="/trips">Browse Fixed Date Trips</Link>
                  </Button>
                </div>
                <div className="lg:col-span-2">
                  {fixedDateTrips.length === 0 ? (
                    <div className="border border-border bg-card p-8 flex flex-col justify-between h-full min-h-[200px]">
                      <div>
                        <h4 className="font-semibold text-sm">No fixed date trips available right now</h4>
                        <p className="text-xs text-muted-foreground mt-2 leading-relaxed">
                          There are currently no approved fixed date departures. Check back soon or explore on-demand options above.
                        </p>
                      </div>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-2">
                      {fixedDateTrips.map((t) => (
                        <TripCardEnhanced key={t.id} trip={t} />
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </section>

        {mounted && !currentUser && (
          <section className="mx-auto max-w-7xl px-4 pb-24 md:px-6">
            <div className="border border-border bg-card p-12 md:p-16 text-center rounded-sm">
              <h2 className="text-3xl font-semibold">Create, share, and manage Sri Lanka trips in one workspace</h2>
              <p className="mx-auto mt-3 max-w-2xl text-sm text-muted-foreground">
                From guided family escapes to group adventures and team outings, TripWaver helps with planning, participant tracking,
                and payment collection from one dashboard.
              </p>
              <div className="mt-6 flex justify-center gap-3">
                <Button asChild>
                  <Link href="/register">Create account</Link>
                </Button>
                <Button variant="outline" asChild>
                  <Link href="/dashboard">Open dashboard</Link>
                </Button>
              </div>
            </div>
          </section>
        )}
      </main>
      <Footer />
    </div>
  );
}
