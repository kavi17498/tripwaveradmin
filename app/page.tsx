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

const categoryHighlights = [
  {
    name: "Travel with Guide",
    text: "Verified Sri Lankan guides, curated routes, and cultural storytelling for every stop.",
    image: "https://images.unsplash.com/photo-1530789253388-582c481c54b0?q=80&w=1400&auto=format&fit=crop",
  },
  {
    name: "Join Group Trip",
    text: "Join group trips across Sri Lanka and travel with like-minded people.",
    image: "https://images.unsplash.com/photo-1529156069898-49953e39b3ac?q=80&w=1400&auto=format&fit=crop",
  },
  {
    name: "Family Trip with Guide",
    text: "Family-friendly itineraries with child-safe activities and verified accommodations.",
    image: "https://images.unsplash.com/photo-1511895426328-dc8714191300?q=80&w=1400&auto=format&fit=crop",
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
    organizerRating: 4.5,
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
  const hydrated = useAuthCacheStore((s) => s.hydrated);
  const hydrateFromLegacySession = useAuthCacheStore((s) => s.hydrateFromLegacySession);

  useEffect(() => {
    if (!hydrated) hydrateFromLegacySession();
    // load trips when token/hydration changes (ensures auth header is sent when available)
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
      // swallow for now; UI can show empty state
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
    loadTrips(params);
  }

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

        <section className="mx-auto max-w-7xl px-4 py-12 md:px-6">
          <div className="mb-6 flex items-center justify-between">
            <h2 className="text-2xl font-semibold">Trip Categories in Sri Lanka</h2>
            <Button variant="outline" asChild>
              <Link href="/trips">Browse Categories</Link>
            </Button>
          </div>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
            {categoryHighlights.map((category) => (
              <article key={category.name} className="border border-border bg-card p-3">
                <img src={category.image} alt={category.name} className="h-40 w-full object-cover" />
                <h3 className="mt-3 font-semibold">{category.name}</h3>
                <p className="mt-2 text-sm text-muted-foreground">{category.text}</p>
              </article>
            ))}
          </div>
        </section>

        <section className="border-y border-border bg-card">
          <div className="mx-auto max-w-7xl px-4 py-12 md:px-6">
            <div className="mb-6 flex items-center justify-between">
              <h2 className="text-2xl font-semibold">Featured Sri Lanka Trips</h2>
              <Button variant="outline" asChild>
                <Link href="/trips">View all trips</Link>
              </Button>
            </div>

            <form onSubmit={handleSearch} className="mb-6 grid gap-2 md:grid-cols-4">
              <input name="tripName" placeholder="Trip name" value={filters.tripName} onChange={handleInputChange} className="input" />
              <input name="startLocation" placeholder="Start location" value={filters.startLocation} onChange={handleInputChange} className="input" />
              <input name="startDate" type="date" placeholder="Start date" value={filters.startDate} onChange={handleInputChange} className="input" />
              <div className="flex gap-2">
                <input name="minPrice" placeholder="Min price" value={filters.minPrice} onChange={handleInputChange} className="input" />
                <input name="maxPrice" placeholder="Max price" value={filters.maxPrice} onChange={handleInputChange} className="input" />
              </div>
              <div className="md:col-span-4 flex gap-2">
                <Button type="submit">Search</Button>
                <Button variant="outline" onClick={() => { setFilters({ tripCategory: "", tripName: "", organizer: "", startLocation: "", startDate: "", endDate: "", minPrice: "", maxPrice: "" }); loadTrips(); }}>
                  Reset
                </Button>
              </div>
            </form>

            <div>
              {loading ? (
                <p>Loading trips…</p>
              ) : trips.length === 0 ? (
                <p className="text-muted-foreground">No trips found.</p>
              ) : (
                <div className="grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-3">
                  {trips.map((t) => (
                    <TripCardEnhanced key={t.id} trip={t} />
                  ))}
                </div>
              )}
            </div>
          </div>
        </section>

        <section className="mx-auto max-w-7xl px-4 py-12 md:px-6">
          <div className="border border-border bg-card p-8 text-center">
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
      </main>
      <Footer />
    </div>
  );
}
