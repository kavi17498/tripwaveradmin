"use client";

import Link from "next/link";
import { FormEvent, useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { Navbar } from "@/components/layout/navbar";
import { Footer } from "@/components/layout/footer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { tripService } from "@/lib/services/tripService";
import { Trip } from "@/lib/types";
import { formatCurrencyRs } from "@/lib/utils";

export default function BookingPage() {
  const router = useRouter();
  const { tripId } = useParams<{ tripId: string }>();
  const [trip, setTrip] = useState<Trip | null>(null);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [seats, setSeats] = useState("1");

  useEffect(() => {
    tripService.getTripById(tripId).then((result) => setTrip(result.data));
  }, [tripId]);

  const submit = (event: FormEvent) => {
    event.preventDefault();
    router.push(`/payment/${tripId}?seats=${seats}`);
  };

  return (
    <div>
      <Navbar />
      <main className="mx-auto grid max-w-6xl grid-cols-1 gap-6 px-4 py-10 md:grid-cols-3 md:px-6">
        <section className="space-y-4 border border-border bg-card p-5 md:col-span-2">
          <h1 className="text-2xl font-semibold">Booking / Join Request</h1>
          <form onSubmit={submit} className="space-y-3">
            <Input placeholder="Participant name" value={name} onChange={(event) => setName(event.target.value)} />
            <Input placeholder="Participant email" value={email} onChange={(event) => setEmail(event.target.value)} />
            <Input type="number" min={1} value={seats} onChange={(event) => setSeats(event.target.value)} />
            <Button>Continue to Payment</Button>
          </form>
        </section>
        <aside className="border border-border bg-card p-5">
          <h2 className="font-semibold">Trip summary</h2>
          <p className="mt-2 text-sm">{trip?.title ?? "Loading..."}</p>
          <p className="mt-1 text-sm text-muted-foreground">{trip?.destination}</p>
          <p className="mt-4 text-lg font-semibold">{formatCurrencyRs(trip ? trip.price * Number(seats) : 0)}</p>
          <Button variant="outline" className="mt-4 w-full" asChild>
            <Link href={`/trips/${tripId}`}>Back to Trip</Link>
          </Button>
        </aside>
      </main>
      <Footer />
    </div>
  );
}
