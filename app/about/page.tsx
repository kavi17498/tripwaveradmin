"use client";

import { Navbar } from "@/components/layout/navbar";
import { Footer } from "@/components/layout/footer";
import { Button } from "@/components/ui/button";
import Link from "next/link";

export default function AboutPage() {
  return (
    <div className="bg-background min-h-screen flex flex-col">
      <Navbar />
      <main className="flex-1 mx-auto max-w-4xl w-full px-4 py-16 md:px-6 md:py-24">
        <div className="space-y-12">
          {/* Header */}
          <div className="space-y-4 border-b border-border pb-8">
            <span className="text-xs font-semibold tracking-wider text-primary uppercase block">Our Story</span>
            <h1 className="text-4xl font-bold tracking-tight md:text-5xl">About TripWaver</h1>
            <p className="text-lg text-muted-foreground leading-relaxed max-w-2xl">
              We connect travelers with verified local guides and build collaborative workspaces to make trip planning in Sri Lanka effortless.
            </p>
          </div>

          {/* Section 1 */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-start">
            <div className="space-y-4">
              <h2 className="text-2xl font-bold tracking-tight">Redefining Island Travel</h2>
              <p className="text-sm text-muted-foreground leading-relaxed">
                TripWaver was born out of a simple need: to make group travel in Sri Lanka more organized, collaborative, and authentic. 
                Too often, planning a trip involves endless chats, spreadsheet tracking, and payment coordination headaches.
              </p>
              <p className="text-sm text-muted-foreground leading-relaxed">
                By combining collaborative dashboards, direct booking tools, and verified local guide partnerships, we've created a single, reliable workspace for all your journeys.
              </p>
            </div>
            <div className="border border-border bg-card p-6 rounded-sm space-y-4">
              <h3 className="font-semibold text-lg">Our Core Pillars</h3>
              <ul className="space-y-3 text-sm text-muted-foreground">
                <li className="flex items-start gap-2.5">
                  <span className="h-5 w-5 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold text-xs shrink-0 mt-0.5">✓</span>
                  <span><strong>Verified Local Expertise:</strong> All guides undergo thorough safety and expertise verifications.</span>
                </li>
                <li className="flex items-start gap-2.5">
                  <span className="h-5 w-5 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold text-xs shrink-0 mt-0.5">✓</span>
                  <span><strong>Collaborative Dashboards:</strong> Plan, coordinate participants, and collect fees in one dashboard.</span>
                </li>
                <li className="flex items-start gap-2.5">
                  <span className="h-5 w-5 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold text-xs shrink-0 mt-0.5">✓</span>
                  <span><strong>Secure Transactions:</strong> Peace of mind with integrated trusted payment gateways.</span>
                </li>
              </ul>
            </div>
          </div>

          {/* Action CTA */}
          <div className="border border-border bg-card p-8 rounded-sm text-center space-y-4">
            <h3 className="text-xl font-bold">Ready to see Sri Lanka differently?</h3>
            <p className="text-sm text-muted-foreground max-w-lg mx-auto">
              Browse public tours created by local experts, or design your own custom itinerary today.
            </p>
            <div className="flex justify-center gap-3 pt-2">
              <Button asChild>
                <Link href="/trips">Browse Trips</Link>
              </Button>
              <Button variant="outline" asChild>
                <Link href="/dashboard/create-trip">Plan My Trip</Link>
              </Button>
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
