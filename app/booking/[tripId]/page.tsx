"use client";

import Link from "next/link";
import { FormEvent, useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { Navbar } from "@/components/layout/navbar";
import { Footer } from "@/components/layout/footer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useAuthCacheStore, type CachedUserProfile } from "@/lib/stores/useAuthCacheStore";
import { tripService } from "@/lib/services/tripService";
import { Trip } from "@/lib/types";
import { formatCurrencyRs } from "@/lib/utils";

type ParticipantGender = "male" | "female" | "other" | "";

type ParticipantForm = {
  name: string;
  age: string;
  gender: ParticipantGender;
  address: string;
  phone: string;
  email: string;
};

const emptyParticipant = (): ParticipantForm => ({
  name: "",
  age: "",
  gender: "",
  address: "",
  phone: "",
  email: "",
});

const joinParts = (parts: Array<string | undefined | null>) => parts.filter((part) => Boolean(part && part.trim())).join(", ");

const getFullName = (user: CachedUserProfile | null) => {
  if (!user) return "";

  const firstName = user.firstName?.trim() ?? "";
  const lastName = user.lastName?.trim() ?? "";
  const directName = user.name?.trim() ?? "";

  return joinParts([firstName, lastName]) || directName;
};

const getUserAddress = (user: CachedUserProfile | null) => {
  if (!user) return "";

  return joinParts([
    user.street?.trim(),
    user.city?.trim(),
    user.state?.trim(),
    user.postalCode?.trim(),
    user.country?.trim(),
  ]);
};

const computeAgeFromDOB = (dob?: string | null) => {
  if (!dob) return "";
  const date = new Date(dob);
  if (Number.isNaN(date.getTime())) return "";
  const now = new Date();
  let age = now.getFullYear() - date.getFullYear();
  const m = now.getMonth() - date.getMonth();
  if (m < 0 || (m === 0 && now.getDate() < date.getDate())) age--;
  return String(Math.max(0, age));
};

export default function BookingPage() {
  const { tripId } = useParams<{ tripId: string }>();
  const [trip, setTrip] = useState<Trip | null>(null);
  const currentUser = useAuthCacheStore((state) => state.currentUser);
  const hydrated = useAuthCacheStore((state) => state.hydrated);
  const hydrateFromLegacySession = useAuthCacheStore((state) => state.hydrateFromLegacySession);
  const token = useAuthCacheStore((state) => state.token);
  const [participantsCount, setParticipantsCount] = useState("1");
  const [participants, setParticipants] = useState<ParticipantForm[]>([emptyParticipant()]);
  const [loadingSubmission, setLoadingSubmission] = useState(false);
  const [status, setStatus] = useState<"idle" | "success" | "failed">("idle");
  const [error, setError] = useState("");

  useEffect(() => {
    tripService.getTripById(tripId).then((result) => setTrip(result.data));
  }, [tripId]);

  useEffect(() => {
    hydrateFromLegacySession();
  }, [hydrateFromLegacySession]);

  useEffect(() => {
    const count = Math.max(1, Number(participantsCount) || 1);
    setParticipants((currentParticipants) => {
      const nextParticipants = currentParticipants.slice(0, count);

      while (nextParticipants.length < count) {
        nextParticipants.push(emptyParticipant());
      }

      return nextParticipants;
    });
  }, [participantsCount]);

  useEffect(() => {
    if (!currentUser) return;

    const primaryParticipant = {
      ...emptyParticipant(),
      name: getFullName(currentUser),
      email: currentUser.email?.trim() ?? "",
      phone: currentUser.phone?.trim() ?? "",
      address: getUserAddress(currentUser),
      gender: (currentUser.gender as ParticipantGender) ?? "",
      age: computeAgeFromDOB(currentUser.dateOfBirth),
    };

    setParticipants((currentParticipants) => {
      if (!currentParticipants.length) return [primaryParticipant];

      const nextParticipants = [...currentParticipants];
      const firstParticipant = nextParticipants[0] ?? emptyParticipant();

      nextParticipants[0] = {
        ...firstParticipant,
        name: firstParticipant.name.trim() || primaryParticipant.name,
        email: firstParticipant.email.trim() || primaryParticipant.email,
        phone: firstParticipant.phone.trim() || primaryParticipant.phone,
        address: firstParticipant.address.trim() || primaryParticipant.address,
        gender: (firstParticipant.gender.trim() || primaryParticipant.gender) as ParticipantGender,
        age: firstParticipant.age.trim() || primaryParticipant.age,
      };

      return nextParticipants;
    });
  }, [currentUser]);

  const updateParticipant = (index: number, field: keyof ParticipantForm, value: string) => {
    setParticipants((currentParticipants) =>
      currentParticipants.map((participant, participantIndex) =>
        participantIndex === index ? { ...participant, [field]: value } : participant,
      ),
    );
  };

  const submit = (event: FormEvent) => {
    event.preventDefault();

    const parentUserId = typeof currentUser?.id === "string" ? currentUser.id.trim() : "";

    if (!parentUserId) {
      setError("Please sign in so we can use your cached participant details.");
      return;
    }

    const primaryParticipant = participants[0];
    if (!primaryParticipant || !primaryParticipant.name.trim() || !primaryParticipant.age.trim() || !primaryParticipant.gender) {
      setError("Please complete the first participant details.");
      return;
    }

    const invalidExtraParticipant = participants.slice(1).find((participant) => !participant.name.trim() || !participant.age.trim() || !participant.gender);
    if (invalidExtraParticipant) {
      setError("Please complete every additional participant with name, age, and gender.");
      return;
    }

    const payload = participants.map((participant, index) => {
      const baseParticipant = {
        parentUserId: participants.length === 1 ? null : parentUserId,
        name: participant.name.trim(),
        gender: participant.gender as "male" | "female" | "other",
        age: Number(participant.age),
      };

      if (index === 0) {
        return {
          ...baseParticipant,
          address: participant.address.trim(),
          phone: participant.phone.trim(),
          email: participant.email.trim(),
        };
      }

      return baseParticipant;
    });

    setLoadingSubmission(true);
    setError("");
    setStatus("idle");

    void tripService
      .submitTripParticipants(tripId, payload, token ?? undefined)
      .then(() => {
        setStatus("success");
      })
      .catch((submissionError) => {
        setStatus("failed");
        setError(submissionError instanceof Error ? submissionError.message : "Failed to submit participants.");
      })
      .finally(() => {
        setLoadingSubmission(false);
      });
  };

  return (
    <div>
      <Navbar />
      <main className="mx-auto grid max-w-6xl grid-cols-1 gap-6 px-4 py-10 md:grid-cols-3 md:px-6">
        <section className="space-y-4 border border-border bg-card p-5 md:col-span-2">
          <div className="space-y-2">
            <h1 className="text-2xl font-semibold">Booking participants</h1>
            <p className="text-sm text-muted-foreground">Your cached profile fills the first participant. Add the rest of the party below.</p>
          </div>
          <form onSubmit={submit} className="space-y-4">
            <div className="grid gap-2 md:max-w-sm">
              <label className="text-sm font-medium">Total participants</label>
              <Input type="number" min={1} value={participantsCount} onChange={(event) => setParticipantsCount(event.target.value)} />
            </div>

            {!hydrated ? <p className="text-sm text-muted-foreground">Loading cached profile...</p> : null}

            {participants.map((participant, index) => (
              <article key={index} className="space-y-3 border border-border bg-background p-4">
                <div>
                  <h2 className="font-semibold">Participant {index + 1}</h2>
                  <p className="text-xs text-muted-foreground">
                    {index === 0 ? "Auto-filled from your cached account data." : "Enter the details for this traveller."}
                  </p>
                </div>

                <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                  <div>
                    <label className="mb-1 block text-sm font-medium">Name</label>
                    <Input value={participant.name} onChange={(event) => updateParticipant(index, "name", event.target.value)} placeholder="Full name" />
                  </div>
                  <div>
                    <label className="mb-1 block text-sm font-medium">Age</label>
                    <Input type="number" min={0} value={participant.age} onChange={(event) => updateParticipant(index, "age", event.target.value)} placeholder="Age" />
                  </div>
                </div>

                <div>
                  <label className="mb-1 block text-sm font-medium">Gender</label>
                  <select
                    value={participant.gender}
                    onChange={(event) => updateParticipant(index, "gender", event.target.value)}
                    className="h-9 w-full rounded-md border border-input bg-transparent px-3 text-sm outline-none focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px]"
                  >
                    <option value="">Select gender</option>
                    <option value="male">Male</option>
                    <option value="female">Female</option>
                    <option value="other">Other</option>
                  </select>
                </div>

                {index === 0 ? (
                  <>
                    <div>
                      <label className="mb-1 block text-sm font-medium">Email</label>
                      <Input value={participant.email} onChange={(event) => updateParticipant(index, "email", event.target.value)} placeholder="Email address" />
                    </div>
                    <div>
                      <label className="mb-1 block text-sm font-medium">Phone</label>
                      <Input value={participant.phone} onChange={(event) => updateParticipant(index, "phone", event.target.value)} placeholder="Phone number" />
                    </div>
                    <div>
                      <label className="mb-1 block text-sm font-medium">Address</label>
                      <Input value={participant.address} onChange={(event) => updateParticipant(index, "address", event.target.value)} placeholder="Full address" />
                    </div>
                  </>
                ) : null}
              </article>
            ))}

            {error ? <p className="text-sm text-destructive">{error}</p> : null}
            {status === "success" ? <p className="text-sm text-emerald-600">Participants submitted successfully.</p> : null}
            <Button disabled={loadingSubmission}>{loadingSubmission ? "Submitting..." : "Submit booking participants"}</Button>
          </form>
        </section>
        <aside className="border border-border bg-card p-5">
          <h2 className="font-semibold">Trip summary</h2>
          <p className="mt-2 text-sm">{trip?.title ?? "Loading..."}</p>
          <p className="mt-1 text-sm text-muted-foreground">{trip?.destination}</p>
          <p className="mt-4 text-sm text-muted-foreground">Participants: {participants.length}</p>
          <p className="mt-1 text-lg font-semibold">{formatCurrencyRs(trip ? trip.price * participants.length : 0)}</p>
          <Button variant="outline" className="mt-4 w-full" asChild>
            <Link href={`/trips/${tripId}`}>Back to Trip</Link>
          </Button>
        </aside>
      </main>
      <Footer />
    </div>
  );
}
