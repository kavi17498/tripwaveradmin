"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { Navbar } from "@/components/layout/navbar";
import { Footer } from "@/components/layout/footer";
import { Button } from "@/components/ui/button";
import { TripCardEnhanced } from "@/components/trips/trip-card-enhanced";
import { Trip } from "@/lib/types";
import { tripApiService, type TripApiItem } from "@/lib/services/tripApiService";
import { useAuthCacheStore } from "@/lib/stores/useAuthCacheStore";

const heroSlides = [
  {
    title: "Are you looking to travel with someone?",
    description:
      "Let us create an amazing Sri Lanka journey with our verified tour guides, from Galle Fort evenings to Ella sunrise routes.",
    ctaLabel: "Explore Guided Trips",
    ctaHref: "/trips",
    image:
      "https://images.unsplash.com/photo-1511895426328-dc8714191300?q=80&w=1800&auto=format&fit=crop",
  },
  {
    title: "Planning a family trip without stress?",
    description:
      "Choose ready-made family trips in Sri Lanka with guides, safe stays, and transport already planned for you.",
    ctaLabel: "View Family Trips",
    ctaHref: "/trips",
    image:
      "https://images.unsplash.com/photo-1511895426328-dc8714191300?q=80&w=1800&auto=format&fit=crop",
  },
  {
    title: "Company, club, or institute trip coming up?",
    description:
      "Plan your Sri Lanka trip using our AI trip planner, share the link with colleagues, and collect trip payments easily.",
    ctaLabel: "Create a Team Trip",
    ctaHref: "/dashboard/create-trip",
    image:
      "https://images.unsplash.com/photo-1522202176988-66273c2fd55f?q=80&w=1800&auto=format&fit=crop",
  },
  {
    title: "Want to join a group of new travelers?",
    description:
      "Join group trips across Sri Lanka and travel with like-minded people under experienced local guides.",
    ctaLabel: "Join Group Trips",
    ctaHref: "/trips",
    image:
      "https://images.unsplash.com/photo-1529156069898-49953e39b3ac?q=80&w=1800&auto=format&fit=crop",
  },
];



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
  const [activeSlide, setActiveSlide] = useState(0);
  const [trips, setTrips] = useState<Trip[]>([]);
  const [loading, setLoading] = useState(false);
  const [isSearchActive, setIsSearchActive] = useState(false);

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

  useEffect(() => {
    const timer = setInterval(() => {
      setActiveSlide((current) => (current + 1) % heroSlides.length);
    }, 5000);

    return () => clearInterval(timer);
  }, []);

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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token, hydrated]);

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

  const soloTrips = trips.filter((t) => t.capacity === 1);
  const coupleTrips = trips.filter((t) => t.capacity === 2);
  const familyTrips = trips.filter((t) => t.capacity > 2 && t.capacity <= 6);
  const teamTrips = trips.filter((t) => t.capacity > 6);
  const otherTrips: Trip[] = [];

  const currentSlide = heroSlides[activeSlide];

  return (
    <div className="bg-background">
      <Navbar />
      <main>
        <section className="relative w-full overflow-hidden bg-zinc-950 min-h-[500px] md:min-h-[600px] lg:min-h-[680px] flex items-center">
          {/* Background Images with Cross-fade and subtle Ken Burns zoom */}
          <div className="absolute inset-0 z-0">
            {heroSlides.map((slide, index) => (
              <div
                key={slide.title}
                className={`absolute inset-0 transition-opacity duration-[1200ms] ease-in-out ${
                  index === activeSlide ? "opacity-100" : "opacity-0"
                }`}
              >
                <img
                  src={slide.image}
                  alt=""
                  className={`w-full h-full object-cover transition-transform duration-[6000ms] ease-out ${
                    index === activeSlide ? "scale-100" : "scale-105"
                  }`}
                />
              </div>
            ))}
            {/* Elegant dark overlay gradient to ensure high readability */}
            <div className="absolute inset-0 bg-gradient-to-r from-black/85 via-black/50 to-transparent" />
            <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-black/30" />
          </div>

          {/* Content Overlays */}
          <div className="relative z-10 mx-auto w-full max-w-7xl px-4 py-20 md:px-6 md:py-28">
            <div className="max-w-2xl space-y-6 text-white">
              {/* Category indicator / Tag */}
              <div className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3.5 py-1 text-xs font-semibold tracking-[0.12em] uppercase text-sky-300 backdrop-blur-sm border border-white/10">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-sky-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-sky-500"></span>
                </span>
                All-in-one Sri Lanka travel platform
              </div>

              {/* Slide Title with visual entry transition */}
              <h1 className="text-3xl font-bold tracking-tight md:text-5xl lg:text-6xl text-balance drop-shadow-md leading-tight">
                {currentSlide.title}
              </h1>

              {/* Description */}
              <p className="text-base md:text-lg text-zinc-200 drop-shadow-sm max-w-xl leading-relaxed">
                {currentSlide.description}
              </p>

              {/* Call-to-actions */}
              <div className="flex flex-wrap gap-3 pt-2">
                <Button size="lg" className="bg-primary hover:bg-primary/90 text-primary-foreground font-semibold shadow-lg shadow-primary/25 border-none transition-all duration-300 transform hover:-translate-y-0.5" asChild>
                  <Link href={currentSlide.ctaHref}>{currentSlide.ctaLabel}</Link>
                </Button>
                <Button size="lg" variant="outline" className="border-white/20 bg-white/5 text-white hover:bg-white/10 hover:border-white/40 backdrop-blur-sm font-semibold transition-all duration-300 transform hover:-translate-y-0.5" asChild>
                  <Link href="/dashboard/create-trip">Plan My Trip</Link>
                </Button>
              </div>

              {/* Slide Pagination Dots */}
              <div className="flex gap-2 pt-6">
                {heroSlides.map((slide, index) => (
                  <button
                    key={slide.title}
                    type="button"
                    aria-label={`Go to slide ${index + 1}`}
                    onClick={() => setActiveSlide(index)}
                    className={`h-2 transition-all duration-300 rounded-full ${
                      index === activeSlide 
                        ? "w-10 bg-white" 
                        : "w-2.5 bg-white/40 hover:bg-white/60"
                    }`}
                  />
                ))}
              </div>
            </div>
          </div>
        </section>

        <section className="mx-auto max-w-7xl px-4 py-16 md:px-6 md:py-24">
          <div className="mb-8 flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-semibold">Featured Sri Lanka Trips</h2>
              <p className="text-sm text-muted-foreground mt-1">Search or browse by our hand-picked travel options.</p>
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
                  <p className="text-sm text-muted-foreground mt-1">Found {trips.length} matching trips in Sri Lanka</p>
                </div>
                <Button variant="outline" size="sm" onClick={handleReset}>Clear All Filters</Button>
              </div>
              {trips.length === 0 ? (
                <p className="text-muted-foreground">No trips found.</p>
              ) : (
                <div className="grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-3">
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
                  <h3 className="text-2xl font-bold tracking-tight">Guided Solo Trips</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    Travel on your own with complete freedom. A verified local guide is always nearby to keep you safe and comfortable.
                  </p>
                  <Button variant="outline" asChild className="w-full sm:w-auto">
                    <Link href="/trips">Browse Solo Trips</Link>
                  </Button>
                </div>
                <div className="lg:col-span-2">
                  {soloTrips.length === 0 ? (
                    <div className="border border-border bg-card p-8 flex flex-col justify-between h-full min-h-[200px]">
                      <div>
                        <h4 className="font-semibold text-sm">Be the first to plan this journey</h4>
                        <p className="text-xs text-muted-foreground mt-2 leading-relaxed">
                          No scheduled solo trips are available right now. Collaborate with a certified guide to plan your own custom route through Sri Lanka.
                        </p>
                      </div>
                      <Button className="mt-6 w-full sm:w-auto self-start" asChild>
                        <Link href="/dashboard/create-trip">Plan My Trip</Link>
                      </Button>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                      {soloTrips.slice(0, 2).map((t) => (
                        <TripCardEnhanced key={t.id} trip={t} />
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* Couple Trips Row */}
              <div className="grid grid-cols-1 gap-8 lg:grid-cols-3 border-b border-border pb-16 last:border-0 last:pb-0">
                <div className="space-y-4">
                  <span className="text-xs font-semibold tracking-wider text-rose-500 uppercase block">Romantic Getaways</span>
                  <h3 className="text-2xl font-bold tracking-tight">Ideal for Couples</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    Plan an intimate escape with your partner. Beautiful stays, private transport options, and relaxing itineraries crafted for two.
                  </p>
                  <Button variant="outline" asChild className="w-full sm:w-auto">
                    <Link href="/trips">Browse Couple Trips</Link>
                  </Button>
                </div>
                <div className="lg:col-span-2">
                  {coupleTrips.length === 0 ? (
                    <div className="border border-border bg-card p-8 flex flex-col justify-between h-full min-h-[200px]">
                      <div>
                        <h4 className="font-semibold text-sm">Be the first to plan this journey</h4>
                        <p className="text-xs text-muted-foreground mt-2 leading-relaxed">
                          No scheduled couple trips are available right now. Plan a trip now and create a custom itinerary.
                        </p>
                      </div>
                      <Button className="mt-6 w-full sm:w-auto self-start" asChild>
                        <Link href="/dashboard/create-trip">Plan My Trip</Link>
                      </Button>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                      {coupleTrips.slice(0, 2).map((t) => (
                        <TripCardEnhanced key={t.id} trip={t} />
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* Family Trips Row */}
              <div className="grid grid-cols-1 gap-8 lg:grid-cols-3 border-b border-border pb-16 last:border-0 last:pb-0">
                <div className="space-y-4">
                  <span className="text-xs font-semibold tracking-wider text-emerald-600 uppercase block">Family Journeys</span>
                  <h3 className="text-2xl font-bold tracking-tight">Family Trips with Guide</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    Enjoy a relaxed family vacation where everyone feels comfortable. We handle the transport, safe stays, and activities for you.
                  </p>
                  <Button variant="outline" asChild className="w-full sm:w-auto">
                    <Link href="/trips">Browse Family Trips</Link>
                  </Button>
                </div>
                <div className="lg:col-span-2">
                  {familyTrips.length === 0 ? (
                    <div className="border border-border bg-card p-8 flex flex-col justify-between h-full min-h-[200px]">
                      <div>
                        <h4 className="font-semibold text-sm">Be the first to plan this journey</h4>
                        <p className="text-xs text-muted-foreground mt-2 leading-relaxed">
                          No scheduled family trips are available right now. Collaborate with a certified guide to plan your own custom route through Sri Lanka.
                        </p>
                      </div>
                      <Button className="mt-6 w-full sm:w-auto self-start" asChild>
                        <Link href="/dashboard/create-trip">Plan My Trip</Link>
                      </Button>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                      {familyTrips.slice(0, 2).map((t) => (
                        <TripCardEnhanced key={t.id} trip={t} />
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* Team Trips Row */}
              <div className="grid grid-cols-1 gap-8 lg:grid-cols-3 border-b border-border pb-16 last:border-0 last:pb-0">
                <div className="space-y-4">
                  <span className="text-xs font-semibold tracking-wider text-indigo-600 uppercase block">Group Adventures</span>
                  <h3 className="text-2xl font-bold tracking-tight">Ideal for Teams</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    Plan an adventure with your colleagues, friends, or club. Make payments easy and manage participants stress-free.
                  </p>
                  <Button variant="outline" asChild className="w-full sm:w-auto">
                    <Link href="/trips">Browse Team Trips</Link>
                  </Button>
                </div>
                <div className="lg:col-span-2">
                  {teamTrips.length === 0 ? (
                    <div className="border border-border bg-card p-8 flex flex-col justify-between h-full min-h-[200px]">
                      <div>
                        <h4 className="font-semibold text-sm">Be the first to plan this journey</h4>
                        <p className="text-xs text-muted-foreground mt-2 leading-relaxed">
                          No scheduled team trips are available right now. Plan your own custom team route through Sri Lanka.
                        </p>
                      </div>
                      <Button className="mt-6 w-full sm:w-auto self-start" asChild>
                        <Link href="/dashboard/create-trip">Plan My Trip</Link>
                      </Button>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                      {teamTrips.slice(0, 2).map((t) => (
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
