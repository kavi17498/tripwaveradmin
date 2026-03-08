"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { Navbar } from "@/components/layout/navbar";
import { Footer } from "@/components/layout/footer";
import { Button } from "@/components/ui/button";

export default function InviteAccessPage() {
  const { token } = useParams<{ token: string }>();
  const isValid = token.startsWith("sample") || token.length > 5;

  return (
    <div>
      <Navbar />
      <main className="mx-auto max-w-3xl px-4 py-10 md:px-6">
        {isValid ? (
          <div className="border border-border bg-card p-6">
            <h1 className="text-2xl font-semibold">Private Trip Invitation</h1>
            <p className="mt-2 text-sm text-muted-foreground">Your invite is valid. Preview the private trip and join.</p>
            <div className="mt-4 border border-border p-4">
              <p className="font-medium">Private Alpine Retreat</p>
              <p className="text-sm text-muted-foreground">Innsbruck • 5 days • Invite-only</p>
            </div>
            <Button className="mt-4" asChild>
              <Link href="/booking/t3">Join Trip</Link>
            </Button>
          </div>
        ) : (
          <div className="border border-border bg-card p-6">
            <h1 className="text-2xl font-semibold">Invalid or expired invite</h1>
            <p className="mt-2 text-sm text-muted-foreground">The invite link may be incorrect or expired.</p>
          </div>
        )}
      </main>
      <Footer />
    </div>
  );
}
