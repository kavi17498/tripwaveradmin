"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Navbar } from "@/components/layout/navbar";
import { Footer } from "@/components/layout/footer";
import { Button } from "@/components/ui/button";
import { paymentService } from "@/lib/services/paymentService";
import { tripService } from "@/lib/services/tripService";
import { Trip } from "@/lib/types";
import { formatCurrencyRs } from "@/lib/utils";

export default function PaymentPage() {
  const router = useRouter();
  const { tripId } = useParams<{ tripId: string }>();
  const [trip, setTrip] = useState<Trip | null>(null);
  const [method, setMethod] = useState<"card" | "bank-transfer" | "wallet">("card");
  const [status, setStatus] = useState<"idle" | "processing" | "success" | "failed">("idle");

  useEffect(() => {
    tripService.getTripById(tripId).then((result) => setTrip(result.data));
  }, [tripId]);

  const amount = trip?.price ?? 0;

  const payNow = async () => {
    setStatus("processing");
    const result = await paymentService.createPayment({
      tripId,
      bookingId: "b1",
      userId: "u1",
      method,
      amount,
    });
    if (result.data.status === "success") {
      setStatus("success");
      router.push(`/receipt/${result.data.id}`);
    } else {
      setStatus("failed");
    }
  };

  return (
    <div>
      <Navbar />
      <main className="mx-auto grid max-w-6xl grid-cols-1 gap-6 px-4 py-10 md:grid-cols-3 md:px-6">
        <section className="space-y-4 border border-border bg-card p-5 md:col-span-2">
          <h1 className="text-2xl font-semibold">Payment</h1>
          <p className="text-sm text-muted-foreground">Select a payment method and confirm secure checkout.</p>
          <div className="space-y-2">
            {[
              ["card", "Credit / Debit Card"],
              ["bank-transfer", "Bank Transfer"],
              ["wallet", "Wallet"],
            ].map(([value, label]) => (
              <label key={value} className="block border border-border p-3 text-sm">
                <input type="radio" checked={method === value} onChange={() => setMethod(value as typeof method)} className="mr-2" />
                {label}
              </label>
            ))}
          </div>
          <div className="border border-dashed border-border bg-muted/20 p-4 text-sm">Mock secure payment section (frontend only).</div>
          <Button onClick={payNow} disabled={status === "processing"}>{status === "processing" ? "Processing..." : "Pay now"}</Button>
          {status === "failed" ? <p className="text-sm text-destructive">Payment failed. Please retry.</p> : null}
        </section>
        <aside className="border border-border bg-card p-5">
          <h2 className="font-semibold">Billing summary</h2>
          <p className="mt-2 text-sm text-muted-foreground">Trip: {tripId}</p>
          <p className="mt-1 text-sm text-muted-foreground">Seats: 1</p>
          <p className="mt-4 text-2xl font-semibold">{formatCurrencyRs(amount)}</p>
          <Button className="mt-4 w-full" variant="outline" asChild>
            <Link href={`/booking/${tripId}`}>Back to booking</Link>
          </Button>
        </aside>
      </main>
      <Footer />
    </div>
  );
}
