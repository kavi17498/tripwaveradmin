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
import { paymentService } from "@/lib/services/paymentService";
import { tripApiService, type TripApiItem } from "@/lib/services/tripApiService";
import { useRouter } from "next/navigation";
import { formatCurrencyRs } from "@/lib/utils";

type ParticipantGender = "male" | "female" | "other" | "";
type TripPaymentMethod = NonNullable<TripApiItem["paymentMethods"]>[number];

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

const isTripExpired = (trip: TripApiItem) => {
  const endOfDay = new Date(`${trip.endDate}T23:59:59.999`);
  return Number.isNaN(endOfDay.getTime()) ? false : new Date() > endOfDay;
};

const getBookingBlockedMessage = (trip: TripApiItem) => {
  if (isTripExpired(trip)) return "This trip has expired.";
  if (trip.status !== "approved") return "Booking is available after the trip is approved.";
  return "This trip cannot be booked right now.";
};

const getPaymentMethodHelpText = (method: TripPaymentMethod) => {
  if (method === "Pay Online") return "Complete the payment online now.";
  return "Reserve your spot now and pay the guide on the trip day.";
};

export default function BookingPage() {
  const { tripId } = useParams<{ tripId: string }>();
  const router = useRouter();
  const [trip, setTrip] = useState<TripApiItem | null>(null);
  const currentUser = useAuthCacheStore((state) => state.currentUser);
  const hydrated = useAuthCacheStore((state) => state.hydrated);
  const hydrateFromLegacySession = useAuthCacheStore((state) => state.hydrateFromLegacySession);
  const token = useAuthCacheStore((state) => state.token);
  const [participantsCount, setParticipantsCount] = useState("1");
  const [participants, setParticipants] = useState<ParticipantForm[]>([emptyParticipant()]);
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState<TripPaymentMethod | "">("");
  const [loadingSubmission, setLoadingSubmission] = useState(false);
  const [status, setStatus] = useState<"idle" | "processing" | "success" | "failed">("idle");
  const [error, setError] = useState("");
  const [showSuccessModal, setShowSuccessModal] = useState(false);

  const bookedParticipantsCount = trip?.participants?.filter((p: any) => p.status !== 'rejected').length ?? 0;
  const allowedBookingCount = Math.max(0, (trip?.maxParticipants ?? 0) - bookedParticipantsCount);
  const mainDestination = trip?.mainDestinations?.[0]?.name || trip?.destinations?.[0]?.name || trip?.startLocation || "Not specified";
  const pricePerPerson = trip?.price ?? 0;
  const coverImage = trip?.coverImage || trip?.photos?.[0] || trip?.destinations?.[0]?.photos?.[0] || "";

  useEffect(() => {
    const loadTrip = async () => {
      try {
        const result = await tripApiService.getTripById(tripId, token ?? "");
        const loadedTrip = result.data ?? null;
        setTrip(loadedTrip);

        if (loadedTrip) {
          if (loadedTrip.status !== "approved" || isTripExpired(loadedTrip)) {
            setError(getBookingBlockedMessage(loadedTrip));
          }

          // Server may mark trips as reserved when a family/solo booking is completed
          const reservedFor = (loadedTrip as any).reservedFor as string | undefined;
          if (reservedFor === 'family' || reservedFor === 'solo') {
            // If reserved by someone else, block booking for everyone
            setError('This trip has been reserved and is no longer bookable.');
          }

          // If current user already has a booking, block additional bookings
          if (currentUser && Array.isArray(loadedTrip.participants)) {
            const already = loadedTrip.participants.find((p: any) => p.parentUserId && p.parentUserId === currentUser.id);
            if (already) {
              setError('You have already booked this trip.');
            }
          }
        }
      } catch {
        setTrip(null);
      }
    };

    loadTrip();
  }, [currentUser, tripId, token]);

  useEffect(() => {
    hydrateFromLegacySession();
  }, [hydrateFromLegacySession]);

  useEffect(() => {
    if (!trip) return;

    const availablePaymentMethods = trip.paymentMethods ?? [];
    if (availablePaymentMethods.length === 1) {
      setSelectedPaymentMethod(availablePaymentMethods[0]);
    } else if (availablePaymentMethods.length > 1 && (!selectedPaymentMethod || !availablePaymentMethods.includes(selectedPaymentMethod as TripPaymentMethod))) {
      setSelectedPaymentMethod(availablePaymentMethods[0]);
    }

    const nextCount = Math.min(Math.max(1, Number(participantsCount) || 1), Math.max(allowedBookingCount, 1));
    const nextCountText = String(nextCount);
    if (nextCountText !== participantsCount) {
      setParticipantsCount(nextCountText);
    }
  }, [allowedBookingCount, participantsCount, selectedPaymentMethod, trip]);

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

    if (!trip || trip.status !== "approved" || isTripExpired(trip)) {
      setError(trip ? getBookingBlockedMessage(trip) : "This trip is not available for booking.");
      return;
    }

    const availablePaymentMethods = trip.paymentMethods ?? [];
    if (!availablePaymentMethods.length) {
      setError("This trip does not have a supported payment method configured.");
      return;
    }

    const paymentMethod = selectedPaymentMethod || availablePaymentMethods[0];
    if (!paymentMethod || !availablePaymentMethods.includes(paymentMethod)) {
      setError("Please select a valid payment method for this trip.");
      return;
    }

    if (allowedBookingCount <= 0) {
      setError("This trip has reached its maximum participant limit.");
      return;
    }

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

    const participantsPayload = participants.map((participant, index) => {
      const baseParticipant = {
        parentUserId,
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

    const finalizeBooking = async () => {
      await tripService.submitTripParticipants(tripId, participantsPayload, token ?? undefined, paymentMethod);
      setStatus("success");
      setLoadingSubmission(false);
      setShowSuccessModal(true);
    };

    (async () => {
      setLoadingSubmission(true);
      setError("");
      setStatus("processing");

      try {
        if (paymentMethod === "Pay to Guide on Trip Day") {
          await finalizeBooking();
          return;
        }

        const amount = pricePerPerson * participantsPayload.length;
        const createRes = await paymentService.createPayment({
          tripId,
          userId: parentUserId,
          method: "card",
          amount,
          // pass explicit user fields to avoid relying on server-side guessing
          firstName: currentUser?.firstName ?? (currentUser?.name ? currentUser.name.split(" ")[0] : ""),
          lastName: currentUser?.lastName ?? (currentUser?.name ? currentUser.name.split(" ").slice(1).join(" ") : ""),
          email: currentUser?.email?.trim() ?? "",
          phone: currentUser?.phone?.trim() ?? "",
        }, token ?? undefined);

        const payment = createRes.data;

        const payhere = (window as Window & { payhere?: {
          startPayment: (payload: typeof payment) => void;
          onCompleted?: (orderId: string) => void;
          onDismissed?: () => void;
          onError?: (error: unknown) => void;
        } }).payhere;

        if (!payhere) {
          throw new Error("PayHere script is not loaded.");
        }

        payhere.onCompleted = async () => {
          try {
            await finalizeBooking();
          } catch (submitError: unknown) {
            setStatus("failed");
            setError(submitError instanceof Error ? submitError.message : "Failed to submit participants after payment.");
          }
        };

        payhere.onDismissed = () => {
          setStatus("failed");
          setError("Payment was dismissed before completion.");
          setLoadingSubmission(false);
        };

        payhere.onError = (payhereError: unknown) => {
          setStatus("failed");
          setError(payhereError instanceof Error ? payhereError.message : "Payment failed to initialize.");
          setLoadingSubmission(false);
        };

        payhere.startPayment(payment);
      } catch (err: unknown) {
        setStatus("failed");
        setError(err instanceof Error ? err.message : String(err));
        setLoadingSubmission(false);
      } finally {
        // Keep the button disabled until the PayHere callback completes.
      }
    })();
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
            <section className="space-y-3 border border-border bg-background p-4">
              <div>
                <h2 className="font-semibold">Payment method</h2>
                <p className="text-xs text-muted-foreground">Choose how you want to complete this booking.</p>
              </div>

              {trip?.paymentMethods?.length ? (
                <div className="grid gap-2 md:grid-cols-2">
                  {trip.paymentMethods.map((method) => (
                    <label
                      key={method}
                      className={`flex cursor-pointer items-start gap-3 rounded-md border p-3 text-sm transition-colors ${selectedPaymentMethod === method ? "border-primary bg-primary/5" : "border-border bg-card"}`}
                    >
                      <input
                        type="radio"
                        name="payment-method"
                        className="mt-1"
                        checked={selectedPaymentMethod === method}
                        onChange={() => setSelectedPaymentMethod(method)}
                      />
                      <div>
                        <p className="font-medium">{method}</p>
                        <p className="text-xs text-muted-foreground">{getPaymentMethodHelpText(method)}</p>
                      </div>
                    </label>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-destructive">No payment methods are configured for this trip.</p>
              )}
            </section>

            <div className="grid gap-2 md:max-w-sm">
              <label className="text-sm font-medium">Total participants</label>
              <Input
                type="number"
                min={1}
                max={allowedBookingCount}
                value={participantsCount}
                onChange={(event) => setParticipantsCount(event.target.value)}
                disabled={allowedBookingCount <= 0}
              />
              <p className="text-xs text-muted-foreground">
                {allowedBookingCount > 0
                  ? `You can book up to ${allowedBookingCount} participant${allowedBookingCount === 1 ? "" : "s"} for this trip.`
                  : "This trip is fully booked."}
              </p>
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

            {allowedBookingCount <= 0 ? (
              <p className="text-sm text-destructive">Booking is closed because this trip has no remaining participant slots.</p>
            ) : null}
            {error ? <p className="text-sm text-destructive">{error}</p> : null}
            {status === "success" ? <p className="text-sm text-emerald-600">Participants submitted successfully.</p> : null}
            <Button disabled={loadingSubmission || allowedBookingCount <= 0 || !selectedPaymentMethod}>
              {loadingSubmission
                ? "Submitting..."
                : selectedPaymentMethod === "Pay Online"
                  ? "Pay online and submit"
                  : "Confirm booking"}
            </Button>
          </form>
        </section>
        <aside className="border border-border bg-card p-5">
          <h2 className="font-semibold">Trip summary</h2>
          {coverImage ? (
            <img src={coverImage} alt={trip?.tripName ?? "Trip cover"} className="mt-4 h-36 w-full rounded-md object-cover" />
          ) : null}
          <p className="mt-3 text-lg font-semibold">{trip?.tripName ?? "Loading trip..."}</p>
          <p className="mt-1 text-sm text-muted-foreground">{trip?.tripCategory ?? "Trip category not available"}</p>
          <div className="mt-4 space-y-2 text-sm text-muted-foreground">
            <p>Destination: {mainDestination}</p>
            <p>
              Dates: {trip?.startDate ?? "--"} to {trip?.endDate ?? "--"}
            </p>
            <p>Organizer: {trip?.organizer ?? "--"}</p>
            <p>
              Payment: {selectedPaymentMethod || "Select a method"}
            </p>
            <p>
              Slots left: {allowedBookingCount} of {trip?.maxParticipants ?? "--"}
            </p>
            <p>Participants: {participants.length}</p>
          </div>
          <p className="mt-4 text-lg font-semibold">{formatCurrencyRs(pricePerPerson * participants.length)}</p>
          <Button variant="outline" className="mt-4 w-full" asChild>
            <Link href={`/trips/${tripId}`}>Back to Trip</Link>
          </Button>
        </aside>
      </main>
      <Footer />

      {/* Success Modal */}
      {showSuccessModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
          <div className="mx-4 w-full max-w-md scale-95 border border-border bg-card p-6 shadow-2xl rounded-xl transition-all duration-300">
            <div className="flex flex-col items-center text-center space-y-4">
              {/* Green Signal Circle Icon */}
              <div className="flex h-16 w-16 items-center justify-center bg-emerald-50 rounded-full border border-emerald-100">
                <span className="h-4 w-4 bg-emerald-500 rounded-full animate-ping absolute" />
                <span className="h-4 w-4 bg-emerald-500 rounded-full relative" />
              </div>

              <div className="space-y-2">
                <h3 className="text-xl font-bold tracking-tight text-foreground">Booking Request Sent!</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  Your booking request has been successfully sent to the guide. After it is accepted, you will be notified through notifications and email.
                </p>
              </div>

              <Button 
                className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-medium shadow-sm transition-all py-2 rounded-lg"
                onClick={() => router.push("/")}
              >
                OK
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
