"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { Navbar } from "@/components/layout/navbar";
import { Footer } from "@/components/layout/footer";
import { Button } from "@/components/ui/button";
import { TripCardEnhanced } from "@/components/trips/trip-card-enhanced";
import { Trip } from "@/lib/types";

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
    text: "Meet new people and explore iconic places like Ella, Mirissa, and Sigiriya together.",
    image: "https://images.unsplash.com/photo-1469474968028-56623f02e42e?q=80&w=1400&auto=format&fit=crop",
  },
  {
    name: "Family Trip with Guide",
    text: "Comfort-focused itineraries for families with child-friendly activities and local support.",
    image: "https://images.unsplash.com/photo-1472396961693-142e6e269027?q=80&w=1400&auto=format&fit=crop",
  },
  {
    name: "AI Trip Planner for Teams",
    text: "Build custom plans, share one trip link, and manage participant payments in one place.",
    image: "https://images.unsplash.com/photo-1521737711867-e3b97375f902?q=80&w=1400&auto=format&fit=crop",
  },
];

const featuredTripsData: Record<string, Trip[]> = {
  "Travel with Guide": [
    {
      id: "trip-1",
      title: "Galle Fort Story Walk",
      destination: "Galle",
      description: "Explore the historic Galle Fort with an expert guide who brings centuries of colonial architecture and local stories to life. Walk through narrow cobblestone streets, visit hidden temples, and enjoy fresh seafood at sunset.",
      startDate: "2026-04-01",
      endDate: "2026-04-03",
      price: 72000,
      capacity: 12,
      bookedCount: 8,
      durationDays: 3,
      tripType: "public",
      status: "published",
      coverImage: "https://images.unsplash.com/photo-1518509562904-e7ef99cdcc86?q=80&w=1400&auto=format&fit=crop",
      organizerId: "org-1",
      organizerName: "Lakshman Tours",
      organizerRating: 4.8,
      location: {
        city: "Galle",
        country: "Sri Lanka",
        lat: 6.0535,
        lng: 80.2210,
      },
      included: [
        "Professional tour guide",
        "Hotel accommodation (3 nights)",
        "All meals",
        "Fort entrance fee",
        "Sunset boat cruise",
        "Transport in AC vehicle",
      ],
      excluded: [
        "International flights",
        "Travel insurance",
        "Personal shopping",
        "Alcoholic beverages",
      ],
      itinerary: [
        {
          day: 1,
          title: "Arrival & Fort Exploration",
          description: "Arrive in Galle, check-in to hotel, and begin your guided walking tour of the historic Galle Fort. Explore colonial buildings and enjoy sunset from the ramparts.",
        },
        {
          day: 2,
          title: "Cultural Deep Dive",
          description: "Visit local temples, meet artisans, and participate in a traditional cooking class. Learn about Sri Lankan spices and cuisine.",
        },
        {
          day: 3,
          title: "Boat Cruise & Departure",
          description: "Sunrise croquet at the fort, enjoy a sunset boat cruise along the coast, and transfer to the airport.",
        },
      ],
    },
    {
      id: "trip-2",
      title: "Ella Peaks and Tea Trails",
      destination: "Ella",
      description: "Trek through misty tea plantations in the central highlands. Stay in boutique mountain lodges, watch the sunrise from Ella Rock, and experience authentic village life with local tea pluckers.",
      startDate: "2026-04-05",
      endDate: "2026-04-08",
      price: 84000,
      capacity: 10,
      bookedCount: 6,
      durationDays: 4,
      tripType: "public",
      status: "published",
      coverImage: "https://images.unsplash.com/photo-1470004914212-05527e49370b?q=80&w=1400&auto=format&fit=crop",
      organizerId: "org-2",
      organizerName: "Highland Adventures",
      organizerRating: 4.9,
      location: {
        city: "Ella",
        country: "Sri Lanka",
        lat: 6.8633,
        lng: 81.0454,
      },
      included: [
        "Experienced mountain guide",
        "Boutique lodge accommodation",
        "Tea plantation trekking",
        "Train ride to Kandy",
        "All meals with local cuisine",
        "Sunrise viewpoint access",
      ],
      excluded: [
        "Domestic flights",
        "Tips and gratuities",
        "Personal medications",
        "Additional activities",
      ],
      itinerary: [
        {
          day: 1,
          title: "Arrival in Ella",
          description: "Check-in to mountain lodge. Evening village walk and interaction with tea pluckers. Dinner with local family.",
        },
        {
          day: 2,
          title: "Tea Plantation Trek",
          description: "Morning trek through emerald tea gardens. Meet tea pluckers, visit a tea factory, and learn about processing. Afternoon rest and local cuisine cooking.",
        },
        {
          day: 3,
          title: "Ella Rock & Train Journey",
          description: "Sunrise trek to Ella Rock, journey on the scenic railway to Kandy, visit local market, experience mountain village life.",
        },
        {
          day: 4,
          title: "Departure",
          description: "Final breakfast with host family, last-minute souvenir shopping, and transfer to airport.",
        },
      ],
    },
    {
      id: "trip-3",
      title: "Sigiriya Heritage Route",
      destination: "Sigiriya",
      description: "Climb the ancient rock fortress of Sigiriya and explore the surrounding cultural triangle. Visit ancient temples, understand Buddhist heritage, and enjoy views across lush valleys.",
      startDate: "2026-04-10",
      endDate: "2026-04-11",
      price: 61000,
      capacity: 15,
      bookedCount: 9,
      durationDays: 2,
      tripType: "public",
      status: "published",
      coverImage: "https://images.unsplash.com/photo-1472396961693-142e6e269027?q=80&w=1400&auto=format&fit=crop",
      organizerId: "org-3",
      organizerName: "Heritage Express",
      organizerRating: 4.7,
      location: {
        city: "Sigiriya",
        country: "Sri Lanka",
        lat: 7.9577,
        lng: 80.7597,
      },
      included: [
        "Knowledgeable heritage guide",
        "Sigiriya Rock climb permit",
        "Hotel accommodation",
        "All breakfast and lunch",
        "Temple visits and access",
        "Scenic viewpoint stops",
      ],
      excluded: [
        "Personal activities",
        "Evening meals",
        "Tips",
        "Equipment rental",
      ],
      itinerary: [
        {
          day: 1,
          title: "Sigiriya & Cultural Sites",
          description: "Climb the legendary Sigiriya Rock, explore ancient fresco chambers, visit Cave Temple, and witness panoramic valley views.",
        },
        {
          day: 2,
          title: "Cultural Triangle Exploration",
          description: "Visit Dambulla Cave Temple complex, explore local village markets, enjoy authentic Sri Lankan lunch, and transfer to airport.",
        },
      ],
    },
  ],
  "Join Group Trip": [
    {
      id: "trip-4",
      title: "Mirissa Social Coastline",
      destination: "Mirissa",
      description: "Join like-minded travelers for beach days and water activities in Mirissa. Whale watching, surfing lessons, beach volleyball, and evening bonfire with fellow travelers.",
      startDate: "2026-04-12",
      endDate: "2026-04-14",
      price: 58000,
      capacity: 20,
      bookedCount: 14,
      durationDays: 3,
      tripType: "public",
      status: "published",
      coverImage: "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?q=80&w=1400&auto=format&fit=crop",
      organizerId: "org-4",
      organizerName: "Beach Collective",
      organizerRating: 4.6,
      location: {
        city: "Mirissa",
        country: "Sri Lanka",
        lat: 5.9497,
        lng: 80.7749,
      },
      included: [
        "Beach resort accommodation",
        "Daily breakfast & dinner",
        "Whale watching tour",
        "Surfing lesson",
        "Beach activities",
        "Bonfire evening",
      ],
      excluded: [
        "Lunch",
        "Alcoholic beverages",
        "Water sports equipment rental",
        "Personal massages",
      ],
      itinerary: [
        {
          day: 1,
          title: "Group Meet & Beach",
          description: "Check-in and meet fellow travelers. Beach orientation, swimming, and group dinner introduction.",
        },
        {
          day: 2,
          title: "Water Activities",
          description: "Early morning whale watching boat tour, afternoon surfing lessons, beach volleyball, and bonfire evening.",
        },
        {
          day: 3,
          title: "Last Beach Day",
          description: "Sunrise yoga on beach, final swim, lunch, and group departure with memories and new friendships.",
        },
      ],
    },
    {
      id: "trip-5",
      title: "Kandy to Nuwara Eliya Group Escape",
      destination: "Nuwara Eliya",
      description: "Join a group adventure through misty mountain towns. Hike through botanical gardens, visit waterfalls, and enjoy cool mountain climate with other adventurers.",
      startDate: "2026-04-15",
      endDate: "2026-04-18",
      price: 69000,
      capacity: 16,
      bookedCount: 10,
      durationDays: 4,
      tripType: "public",
      status: "published",
      coverImage: "https://images.unsplash.com/photo-1521295121783-8a321d551ad2?q=80&w=1400&auto=format&fit=crop",
      organizerId: "org-5",
      organizerName: "Mountain Wanderers",
      organizerRating: 4.8,
      location: {
        city: "Nuwara Eliya",
        country: "Sri Lanka",
        lat: 6.9497,
        lng: 80.7885,
      },
      included: [
        "Mountain lodge stay",
        "Group guide services",
        "Botanical garden tour",
        "Waterfalls trekking",
        "All meals with views",
        "Group activities",
      ],
      excluded: [
        "Drinks and snacks",
        "Adventure equipment",
        "Photography sessions",
        "Extra activities",
      ],
      itinerary: [
        {
          day: 1,
          title: "Kandy to Nuwara Eliya",
          description: "Travel to Nuwara Eliya, explore the colonial town, visit botanical gardens, group welcome dinner.",
        },
        {
          day: 2,
          title: "Waterfall Trek",
          description: "Group hiking to several waterfalls, refreshing water activities, picnic lunch, afternoon free time.",
        },
        {
          day: 3,
          title: "Adventure Day",
          description: "Mountain biking or hiking options, visit viewpoints, evening camp, group bonfire.",
        },
        {
          day: 4,
          title: "Departure",
          description: "Sunrise hike to final viewpoint, group breakfast, shopping for souvenirs, transfer to airport.",
        },
      ],
    },
    {
      id: "trip-6",
      title: "Arugam Bay Weekend Crew",
      destination: "Arugam Bay",
      description: "Quick beach escape with fellow travelers. Relax on pristine beaches, enjoy street food, watch sunsets, and build connections in a laid-back environment.",
      startDate: "2026-04-20",
      endDate: "2026-04-21",
      price: 47000,
      capacity: 18,
      bookedCount: 12,
      durationDays: 2,
      tripType: "public",
      status: "published",
      coverImage: "https://images.unsplash.com/photo-1528127269322-539801943592?q=80&w=1400&auto=format&fit=crop",
      organizerId: "org-6",
      organizerName: "Breezy Escapes",
      organizerRating: 4.5,
      location: {
        city: "Arugam Bay",
        country: "Sri Lanka",
        lat: 7.7547,
        lng: 81.8178,
      },
      included: [
        "Beachfront accommodation",
        "Breakfast & lunch",
        "Beach activities",
        "Sunset watching",
        "Group guide",
        "Street food tour",
      ],
      excluded: [
        "Dinner & alcohol",
        "Water sports gear",
        "Photography",
        "Extra outings",
      ],
      itinerary: [
        {
          day: 1,
          title: "Arrive & Chill",
          description: "Arrive in Arugam Bay, settle into beachfront rooms, beach time, street food walk, sunset watching.",
        },
        {
          day: 2,
          title: "Final Beach Day",
          description: "Sunrise beach walk, breakfast, water activities, lunch, group shopping, afternoon departure.",
        },
      ],
    },
  ],
  "Family Trip with Guide": [
    {
      id: "trip-7",
      title: "Bentota Family Beach Days",
      destination: "Bentota",
      description: "Perfect family getaway with water sports, beach games, and cultural experiences. Safe for kids with experienced guides and family-friendly accommodations.",
      startDate: "2026-04-22",
      endDate: "2026-04-24",
      price: 95000,
      capacity: 10,
      bookedCount: 4,
      durationDays: 3,
      tripType: "public",
      status: "published",
      coverImage: "https://images.unsplash.com/photo-1516483638261-f4dbaf036963?q=80&w=1400&auto=format&fit=crop",
      organizerId: "org-7",
      organizerName: "Family First Tours",
      organizerRating: 4.9,
      location: {
        city: "Bentota",
        country: "Sri Lanka",
        lat: 6.4264,
        lng: 80.2789,
      },
      included: [
        "Family suite accommodation",
        "All meals & snacks",
        "Water sports for kids",
        "Beach games & activities",
        "Kids guide assistant",
        "Turtle hatchery visit",
      ],
      excluded: [
        "Personal services",
        "Premium activities",
        "Extra shopping",
        "Tips",
      ],
      itinerary: [
        {
          day: 1,
          title: "Family Arrival",
          description: "Check-in, beach orientation for kids, safe swimming area, evening family dinner.",
        },
        {
          day: 2,
          title: "Water & Culture",
          description: "Water sports for all ages, turtle hatchery conservation visit, local market exploration, beach bonfire.",
        },
        {
          day: 3,
          title: "Final Family Fun",
          description: "Beach games tournament, group activities, lunch, souvenir shopping, transfer home with family photos.",
        },
      ],
    },
    {
      id: "trip-8",
      title: "Yala Family Safari Journey",
      destination: "Yala",
      description: "Thrilling wildlife safari for the whole family. See leopards, elephants, and exotic birds. Child-friendly safari vehicles with expert naturalist guides.",
      startDate: "2026-04-25",
      endDate: "2026-04-27",
      price: 108000,
      capacity: 8,
      bookedCount: 3,
      durationDays: 3,
      tripType: "public",
      status: "published",
      coverImage: "https://images.unsplash.com/photo-1534180477871-5d6cc81f3920?q=80&w=1400&auto=format&fit=crop",
      organizerId: "org-8",
      organizerName: "Wild Family Adventures",
      organizerRating: 4.8,
      location: {
        city: "Yala",
        country: "Sri Lanka",
        lat: 6.3736,
        lng: 81.5142,
      },
      included: [
        "Safari lodge accommodation",
        "Expert naturalist guide",
        "Morning & evening safaris",
        "All meals",
        "Binoculars & guides",
        "Nature education",
      ],
      excluded: [
        "Photography equipment",
        "Customized safaris",
        "Premium accommodations",
        "Shopping",
      ],
      itinerary: [
        {
          day: 1,
          title: "Safari Introduction",
          description: "Arrive at safari lodge, safety briefing, evening wildlife orientation, early dinner for kids.",
        },
        {
          day: 2,
          title: "Full Safari Day",
          description: "Early morning safari (elephants & birds), rest time, late afternoon safari (leopard spotting chances), nature talk.",
        },
        {
          day: 3,
          title: "Last Safari & Depart",
          description: "Final sunrise safari, wildlife slideshow, lunch, visit interpretation center, family photos, transfer home.",
        },
      ],
    },
    {
      id: "trip-9",
      title: "Cultural Triangle for Families",
      destination: "Dambulla",
      description: "Educational family journey through ancient temples and historical sites. Learn about Buddhism, art, and culture. Interactive activities for kids at every stop.",
      startDate: "2026-04-28",
      endDate: "2026-05-01",
      price: 126000,
      capacity: 12,
      bookedCount: 5,
      durationDays: 4,
      tripType: "public",
      status: "published",
      coverImage: "https://images.unsplash.com/photo-1548013146-72479768bada?q=80&w=1400&auto=format&fit=crop",
      organizerId: "org-9",
      organizerName: "Heritage Kids Education",
      organizerRating: 4.7,
      location: {
        city: "Dambulla",
        country: "Sri Lanka",
        lat: 7.8667,
        lng: 80.6667,
      },
      included: [
        "Family hotel accommodation",
        "Educational guide services",
        "Temple entrance fees",
        "All meals",
        "Interactive activities",
        "Learning materials",
      ],
      excluded: [
        "Extra souvenir purchases",
        "Premium classes",
        "Personal guides",
        "Customized tours",
      ],
      itinerary: [
        {
          day: 1,
          title: "Dambulla Cave Temple",
          description: "Arrive in Dambulla, visit the sacred cave temple complex with 500 Buddha statues, learn about Buddhist iconography.",
        },
        {
          day: 2,
          title: "Sigiriya & Heritage",
          description: "Climb Sigiriya Rock, explore palace ruins, visit fresco chambers, learn ancient history with fun activities.",
        },
        {
          day: 3,
          title: "Local Life Experience",
          description: "Visit pottery workshop, traditional cooking class with kids, local school visit, community engagement.",
        },
        {
          day: 4,
          title: "Final Culture & Depart",
          description: "Museum visit, artisan market exploration, family reflection session, group photo, transfer to airport.",
        },
      ],
    },
  ],
};

export default function HomePage() {
  const [activeSlide, setActiveSlide] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setActiveSlide((current) => (current + 1) % heroSlides.length);
    }, 5000);

    return () => clearInterval(timer);
  }, []);

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
            <div className="space-y-8">
              {Object.entries(featuredTripsData).map(([type, trips]) => (
                <section key={type} className="space-y-3">
                  <h3 className="text-lg font-semibold">{type}</h3>
                  <div className="grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-3">
                    {trips.map((trip) => (
                      <TripCardEnhanced key={trip.id} trip={trip} />
                    ))}
                  </div>
                </section>
              ))}
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
