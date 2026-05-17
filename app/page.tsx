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
      "https://images.unsplash.com/photo-1566552881560-0be862a7c445?q=80&w=1800&auto=format&fit=crop",
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

  const mainDest = item.mainDestinations && item.mainDestinations.length > 0 ? item.mainDestinations[0].name : item.startLocation || "";

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
      city: item.startLocation ?? "",
      country: "",
      lat: (item.mainDestinations && item.mainDestinations[0]?.lat) || 0,
      lng: (item.mainDestinations && item.mainDestinations[0]?.lng) || 0,
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
        <section className="border-b border-border bg-card">
          <div className="mx-auto grid max-w-7xl grid-cols-1 gap-8 px-4 py-10 md:grid-cols-2 md:px-6 md:py-14">
            <div className="space-y-5">
              <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">All-in-one Sri Lanka travel platform</p>
              <h1 className="text-3xl font-semibold tracking-tight md:text-5xl">{currentSlide.title}</h1>
              <p className="text-base text-muted-foreground">{currentSlide.description}</p>

              <div className="flex flex-wrap gap-3">
                <Button asChild>
                  <Link href={currentSlide.ctaHref}>{currentSlide.ctaLabel}</Link>
                </Button>
                <Button variant="outline" asChild>
                  <Link href="/dashboard/create-trip">Plan My Trip</Link>
                </Button>
              </div>

              <div className="flex gap-2 pt-2">
                {heroSlides.map((slide, index) => (
                  <button
                    key={slide.title}
                    type="button"
                    aria-label={`Go to slide ${index + 1}`}
                    onClick={() => setActiveSlide(index)}
                    className={`h-2.5 transition-all ${index === activeSlide ? "w-10 bg-foreground" : "w-5 bg-border"}`}
                  />
                ))}
              </div>
            </div>

            <div className="border border-border bg-muted/20 p-2">
              <img src={currentSlide.image} alt={currentSlide.title} className="h-full w-full object-cover" />
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
