import { Navbar } from "@/components/layout/navbar";
import { Footer } from "@/components/layout/footer";

export default function ChatLandingPage() {
  return (
    <div>
      <Navbar />
      <main className="mx-auto max-w-4xl px-4 py-12 md:px-6">
        <div className="border border-border bg-card p-6">
          <h1 className="text-2xl font-semibold">Trip Chat</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            This is your shared chat space for trip discussions. Join a trip chat room from trip details or dashboard.
          </p>
        </div>
      </main>
      <Footer />
    </div>
  );
}
