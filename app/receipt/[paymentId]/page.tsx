"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { Navbar } from "@/components/layout/navbar";
import { Footer } from "@/components/layout/footer";
import { Button } from "@/components/ui/button";
import { paymentService } from "@/lib/services/paymentService";
import { Payment } from "@/lib/types";

export default function ReceiptPage() {
  const { paymentId } = useParams<{ paymentId: string }>();
  const [payment, setPayment] = useState<Payment | null>(null);

  useEffect(() => {
    paymentService.getPaymentById(paymentId).then((result) => setPayment(result.data));
  }, [paymentId]);

  return (
    <div>
      <Navbar />
      <main className="mx-auto max-w-3xl px-4 py-10 md:px-6">
        <section className="border border-border bg-card p-6">
          <h1 className="text-2xl font-semibold">Payment Receipt</h1>
          <p className="mt-2 text-sm text-muted-foreground">Receipt reference: {paymentId}</p>

          <div className="mt-6 grid grid-cols-1 gap-2 border border-border p-4 text-sm">
            <p><span className="font-medium">Booking:</span> {payment?.bookingId ?? "N/A"}</p>
            <p><span className="font-medium">Trip:</span> {payment?.tripId ?? "N/A"}</p>
            <p><span className="font-medium">Method:</span> {payment?.method ?? "N/A"}</p>
            <p><span className="font-medium">Status:</span> {payment?.status ?? "N/A"}</p>
            <p><span className="font-medium">Amount:</span> ${payment?.amount ?? 0}</p>
          </div>

          <Button className="mt-4" variant="outline">Download Receipt</Button>
        </section>
      </main>
      <Footer />
    </div>
  );
}
