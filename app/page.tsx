import Link from "next/link";
import { Navbar } from "@/components/layout/navbar";
import { Footer } from "@/components/layout/footer";
import { TripCard } from "@/components/trips/trip-card";
import { Button } from "@/components/ui/button";
import { mockTrips } from "@/lib/data/trips";

export default function HomePage() {
  const featuredTrips = mockTrips.slice(0, 3);

  return (
    <div className="bg-background">
      <Navbar />
      <main>
        <section className="border-b border-border bg-card">
          <div className="mx-auto grid max-w-7xl grid-cols-1 gap-10 px-4 py-16 md:grid-cols-2 md:px-6">
            <div className="space-y-6">
              <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">Social travel and trip management</p>
              <h1 className="text-4xl font-semibold tracking-tight md:text-5xl">Plan, join, and manage meaningful group travel.</h1>
              <p className="text-base text-muted-foreground">
                TripWaver helps travelers, organizers, and teams run public and private trips with bookings, payments,
                chat, and admin controls in one place.
              </p>
              <div className="flex flex-wrap gap-3">
                <Button asChild>
                  <Link href="/trips">Explore Trips</Link>
                </Button>
                <Button variant="outline" asChild>
                  <Link href="/dashboard/create-trip">Create a Trip</Link>
                </Button>
              </div>
              <form action="/trips" className="flex gap-2">
                <input
                  type="text"
                  name="q"
                  placeholder="Search destinations or trip title"
                  className="h-9 flex-1 border border-input bg-background px-3 text-sm"
                />
                <Button type="submit" variant="outline">Search</Button>
              </form>
            </div>
            <div className="border border-border bg-muted/20 p-2">
              <img
                src="https://images.unsplash.com/photo-1469854523086-cc02fe5d8800?q=80&w=1800&auto=format&fit=crop"
                alt="Travel destination"
                className="h-full w-full object-cover"
              />
            </div>
          </div>
        </section>

        <section className="mx-auto max-w-7xl px-4 py-14 md:px-6">
          <div className="mb-6 flex items-center justify-between">
            <h2 className="text-2xl font-semibold">Featured Trips</h2>
            <Button variant="outline" asChild>
              <Link href="/trips">View all</Link>
            </Button>
          </div>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
            {featuredTrips.map((trip) => (
              <TripCard key={trip.id} trip={trip} />
            ))}
          </div>
        </section>

        <section className="border-y border-border bg-card">
          <div className="mx-auto grid max-w-7xl grid-cols-1 gap-4 px-4 py-12 md:grid-cols-3 md:px-6">
            {[
              ["Discover trusted organizers", "Browse verified public trips with transparent details and ratings."],
              ["Manage private invitations", "Share secure links, validate guests, and track participation."],
              ["Pay and coordinate in one flow", "Booking, payment receipts, and chat are connected."],
            ].map(([title, text]) => (
              <article key={title} className="border border-border bg-background p-5">
                <h3 className="font-semibold">{title}</h3>
                <p className="mt-2 text-sm text-muted-foreground">{text}</p>
              </article>
            ))}
          </div>
        </section>

        <section className="mx-auto max-w-7xl px-4 py-14 md:px-6">
          <h2 className="text-2xl font-semibold">How it works</h2>
          <div className="mt-5 grid grid-cols-1 gap-3 md:grid-cols-4">
            {[
              "Find or create a trip",
              "Invite or request to join",
              "Manage participants and payments",
              "Travel with updates and group chat",
            ].map((item, index) => (
              <div key={item} className="border border-border p-4">
                <p className="text-xs text-muted-foreground">Step {index + 1}</p>
                <p className="mt-1 font-medium">{item}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="border-y border-border bg-card">
          <div className="mx-auto max-w-7xl px-4 py-14 md:px-6">
            <h2 className="text-2xl font-semibold">What travelers say</h2>
            <div className="mt-6 grid grid-cols-1 gap-4 md:grid-cols-3">
              {[
                "Trip planning felt reliable. We had every detail in one view.",
                "The join request and approval flow is easy for group organizers.",
                "Payment and receipt UX is clear and confidence-inspiring.",
              ].map((quote, index) => (
                <blockquote key={index} className="border border-border bg-background p-5 text-sm">
                  {quote}
                </blockquote>
              ))}
            </div>
          </div>
        </section>

        <section className="mx-auto max-w-7xl px-4 py-14 md:px-6">
          <div className="border border-border bg-card p-8 text-center">
            <h2 className="text-3xl font-semibold">Start planning your next trip with confidence</h2>
            <p className="mx-auto mt-3 max-w-xl text-sm text-muted-foreground">
              Use TripWaver to run discovery, bookings, participant coordination, and travel communication in one
              practical workspace.
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