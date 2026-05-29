"use client";

import Link from "next/link";
import { FormEvent, useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { Navbar } from "@/components/layout/navbar";
import { Footer } from "@/components/layout/footer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useAuthCacheStore, type CachedUserProfile } from "@/lib/stores/useAuthCacheStore";
import { onDemandTripService, type OnDemandTripTemplateApiItem } from "@/lib/services/onDemandTripService";
import { tripService } from "@/lib/services/tripService";
import { paymentService } from "@/lib/services/paymentService";
import { userSessionService } from "@/lib/services/userSessionService";
import { useToast } from "@/components/feedback/toast-provider";
import { formatCurrencyRs } from "@/lib/utils";
import LocationPicker from "@/components/common/locationpicker";
import { Calendar as CalendarIcon, Clock, MapPin, Star, Users } from "lucide-react";

type ParticipantGender = "male" | "female" | "other" | "";

const weekdayLabels = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

const toDateKey = (date: Date) =>
  `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;

const startOfMonth = (date: Date) => new Date(date.getFullYear(), date.getMonth(), 1);
const endOfMonth = (date: Date) => new Date(date.getFullYear(), date.getMonth() + 1, 0);

const addMonths = (date: Date, months: number) => new Date(date.getFullYear(), date.getMonth() + months, 1);

const isPastDate = (date: Date) => {
  const today = new Date();
  const todayKey = toDateKey(new Date(today.getFullYear(), today.getMonth(), today.getDate()));
  return toDateKey(date) < todayKey;
};

const calculateDistanceKm = (lat1: number, lng1: number, lat2: number, lng2: number): number => {
  const R = 6371; // Earth's radius in km
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLng / 2) *
      Math.sin(dLng / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
};

const airportPickupLocations: Partial<Record<string, { lat: number; lng: number; address: string }>> = {
  "Free Pickup from Bandaranaike International Airport": {
    lat: 7.1808,
    lng: 79.8841,
    address: "Bandaranaike International Airport",
  },
  "Free Pickup from Mattala Airport": {
    lat: 6.2844,
    lng: 81.1241,
    address: "Mattala Rajapaksa International Airport",
  },
};

const isAirportPickupType = (pickupType: string | undefined) =>
  pickupType === "Free Pickup from Bandaranaike International Airport" || pickupType === "Free Pickup from Mattala Airport";

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

export default function BookOnDemandPage() {
  const { templateId } = useParams<{ templateId: string }>();
  const router = useRouter();
  const { pushToast } = useToast();

  const currentUser = useAuthCacheStore((state) => state.currentUser);
  const hydrated = useAuthCacheStore((state) => state.hydrated);
  const hydrateFromLegacySession = useAuthCacheStore((state) => state.hydrateFromLegacySession);
  const token = useAuthCacheStore((state) => state.token);

  const [template, setTemplate] = useState<OnDemandTripTemplateApiItem | null>(null);
  const [busyDates, setBusyDates] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingSubmission, setLoadingSubmission] = useState(false);
  const [error, setError] = useState("");
  const [status, setStatus] = useState<"idle" | "processing" | "success" | "failed">("idle");
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [createdTripId, setCreatedTripId] = useState("");

  // Calendar states
  const [selectedDate, setSelectedDate] = useState("");
  const [viewMonth, setViewMonth] = useState(() => startOfMonth(new Date()));

  // Pickup states
  const [passengerPickupLocation, setPassengerPickupLocation] = useState<{ lat: number; lng: number; address: string } | null>(null);
  const [pickupDistanceKm, setPickupDistanceKm] = useState(0);
  const [pickupCost, setPickupCost] = useState(0);
  const [passengerPickupTime, setPassengerPickupTime] = useState("08:00");

  // Participants states
  const [participantsCount, setParticipantsCount] = useState("1");
  const [participants, setParticipants] = useState<ParticipantForm[]>([emptyParticipant()]);

  // Payment method
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState<string>("");

  const busyDateSet = useMemo(() => new Set(busyDates), [busyDates]);

  useEffect(() => {
    hydrateFromLegacySession();
  }, [hydrateFromLegacySession]);

  // Load template details and availability
  useEffect(() => {
    const loadData = async () => {
      if (!templateId) return;
      setLoading(true);
      setError("");

      try {
        const [templateRes, availabilityRes] = await Promise.all([
          onDemandTripService.getTemplateById(templateId),
          onDemandTripService.getAvailability(templateId),
        ]);

        if (!templateRes.data) {
          setError("On-demand trip template not found.");
          return;
        }

        setTemplate(templateRes.data);
        setBusyDates(availabilityRes.data.busyDates || []);

        const availablePaymentMethods = templateRes.data.paymentMethods ?? [];
        if (availablePaymentMethods.length > 0) {
          setSelectedPaymentMethod(availablePaymentMethods[0]);
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load template data.");
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [templateId]);

  // Pre-fill primary participant info from logged-in user
  useEffect(() => {
    if (!currentUser) return;

    setParticipants((currentParticipants) => {
      const nextParticipants = [...currentParticipants];
      const firstParticipant = nextParticipants[0] ?? emptyParticipant();

      const primaryParticipant = {
        name: getFullName(currentUser),
        email: currentUser.email ?? "",
        phone: currentUser.phone ?? "",
        address: getUserAddress(currentUser),
        gender: (currentUser.gender ?? "") as ParticipantGender,
        age: computeAgeFromDOB(currentUser.dateOfBirth ? String(currentUser.dateOfBirth) : null),
      };

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

  // Setup default pickup location
  useEffect(() => {
    if (!template || template.pickupType === "Meet at Location") {
      setPassengerPickupLocation(null);
      return;
    }

    const presetPickupLocation =
      template.pickupStartLocation ??
      (template.pickupType && isAirportPickupType(template.pickupType)
        ? airportPickupLocations[template.pickupType]
        : undefined);

    if (presetPickupLocation) {
      setPassengerPickupLocation({
        lat: presetPickupLocation.lat,
        lng: presetPickupLocation.lng,
        address: "name" in presetPickupLocation ? presetPickupLocation.name : (presetPickupLocation as any).address || "Airport Meeting Point",
      });
    }
  }, [template]);

  // Distance & cost calculation
  useEffect(() => {
    if (!template || template.pickupType === "Meet at Location" || !passengerPickupLocation) {
      setPickupDistanceKm(0);
      setPickupCost(0);
      return;
    }

    const startLat = template.pickupStartLocation?.lat;
    const startLng = template.pickupStartLocation?.lng;

    if (typeof startLat !== "number" || typeof startLng !== "number") {
      setPickupDistanceKm(0);
      setPickupCost(0);
      return;
    }

    const distance = calculateDistanceKm(
      passengerPickupLocation.lat,
      passengerPickupLocation.lng,
      startLat,
      startLng
    );

    setPickupDistanceKm(distance);

    if (template.pickupType === "Free Pickup") {
      setPickupCost(0);
      return;
    }

    const cost = distance * (template.pickupCostPerKm ?? 0);
    setPickupCost(Number(cost.toFixed(2)));
  }, [passengerPickupLocation, template]);

  // Handle participant count change
  const handleParticipantsCountChange = (countStr: string) => {
    setParticipantsCount(countStr);
    const count = parseInt(countStr, 10);
    if (Number.isNaN(count) || count < 1) return;

    setParticipants((current) => {
      const next = [...current];
      while (next.length < count) {
        next.push(emptyParticipant());
      }
      return next.slice(0, count);
    });
  };

  const updateParticipant = (index: number, field: keyof ParticipantForm, value: string) => {
    setParticipants((currentParticipants) =>
      currentParticipants.map((participant, participantIndex) =>
        participantIndex === index ? { ...participant, [field]: value } : participant,
      ),
    );
  };

  const isDateDisabled = (date: Date) => {
    const key = toDateKey(date);
    return busyDateSet.has(key) || isPastDate(date);
  };

  const selectedDateLabel = useMemo(() => {
    if (!selectedDate) return "No date selected";
    const parsed = new Date(`${selectedDate}T00:00:00`);
    if (Number.isNaN(parsed.getTime())) return selectedDate;
    return parsed.toLocaleDateString(undefined, {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  }, [selectedDate]);

  const monthDays = useMemo(() => {
    const firstDay = startOfMonth(viewMonth);
    const lastDay = endOfMonth(viewMonth);
    const leadingBlanks = firstDay.getDay();
    const cells: Array<{ key: string; label: number; date: Date | null }> = [];

    for (let index = 0; index < leadingBlanks; index += 1) {
      cells.push({ key: `blank-${index}`, label: 0, date: null });
    }

    for (let day = 1; day <= lastDay.getDate(); day += 1) {
      const date = new Date(viewMonth.getFullYear(), viewMonth.getMonth(), day);
      cells.push({ key: toDateKey(date), label: day, date });
    }

    return cells;
  }, [viewMonth]);

  const selectedMonthLabel = useMemo(
    () =>
      viewMonth.toLocaleDateString(undefined, {
        month: "long",
        year: "numeric",
      }),
    [viewMonth],
  );

  const pricePerPerson = template?.price ?? 0;
  const coverImage = template?.coverImage || template?.photos?.[0] || "";
  const mainDestination = template?.mainDestinations?.[0]?.name || template?.destinations?.[0]?.name || template?.startLocation || "Not specified";

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    if (!template) return;

    setError("");

    if (!selectedDate) {
      setError("Please select a date from the guide availability calendar.");
      return;
    }

    if (busyDateSet.has(selectedDate)) {
      setError("The selected date is blocked by the guide. Please pick another date.");
      return;
    }

    if (template.pickupType && template.pickupType !== "Meet at Location") {
      if (!passengerPickupLocation) {
        setError("Please select a pickup location on the map.");
        return;
      }
      if (!passengerPickupTime.trim()) {
        setError("Please select your requested pickup time.");
        return;
      }
    } else if (template.pickupType === "Meet at Location") {
      if (!passengerPickupTime.trim()) {
        setError("Please select your meetup arrival time.");
        return;
      }
    }

    const primaryParticipant = participants[0];
    if (!primaryParticipant || !primaryParticipant.name.trim() || !primaryParticipant.age.trim() || !primaryParticipant.gender) {
      setError("Please complete the first traveler details.");
      return;
    }

    const invalidExtraParticipant = participants.slice(1).find((p) => !p.name.trim() || !p.age.trim() || !p.gender);
    if (invalidExtraParticipant) {
      setError("Please complete name, age, and gender for all extra travelers.");
      return;
    }

    const parentUserId = typeof currentUser?.id === "string" ? currentUser.id.trim() : "";
    if (!parentUserId) {
      setError("Please sign in so we can submit your booking details.");
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
          pickupTime: passengerPickupTime.trim(),
          ...(template.pickupType && template.pickupType !== "Meet at Location" && passengerPickupLocation ? {
            pickupLocation: {
              name: passengerPickupLocation.address,
              lat: passengerPickupLocation.lat,
              lng: passengerPickupLocation.lng,
            },
            pickupDistanceKm,
            pickupCost,
          } : {}),
        };
      }

      return baseParticipant;
    });

    const paymentMethod = (selectedPaymentMethod || "Pay to Guide on Trip Day") as "Pay Online" | "Pay to Guide on Trip Day";

    try {
      setLoadingSubmission(true);
      setStatus("processing");

      // 1. Book the template to generate the private trip instance
      const bookRes = await onDemandTripService.bookTemplate(
        templateId,
        {
          startDate: selectedDate,
          startTime: passengerPickupTime,
          pickupLocation: passengerPickupLocation ? {
            name: passengerPickupLocation.address,
            lat: passengerPickupLocation.lat,
            lng: passengerPickupLocation.lng,
          } : undefined,
          pickupDistanceKm: template.pickupType !== "Meet at Location" ? Number(pickupDistanceKm.toFixed(2)) : undefined,
          pickupCost: template.pickupType !== "Meet at Location" ? Number(pickupCost.toFixed(2)) : undefined,
          participants: [], // Create with empty list, we will call addParticipants right after
        },
        token ?? ""
      );

      const tripId = bookRes.data?.tripId;
      if (!tripId) {
        throw new Error("Failed to initialize private trip instance.");
      }
      setCreatedTripId(tripId);

      // 2. Submit the complete list of participants (including primary and extras)
      const finalizeBooking = async () => {
        await tripService.submitTripParticipants(tripId, participantsPayload, token ?? undefined, paymentMethod);
        setStatus("success");
        setLoadingSubmission(false);
        setShowSuccessModal(true);
      };

      if (paymentMethod === "Pay to Guide on Trip Day") {
        await finalizeBooking();
        return;
      }

      // Card online payment path
      const amount = pricePerPerson * participantsPayload.length + (template.pickupType !== "Meet at Location" ? pickupCost : 0);
      const createRes = await paymentService.createPayment({
        tripId,
        userId: parentUserId,
        method: "card",
        amount,
        firstName: currentUser?.firstName ?? (currentUser?.name ? currentUser.name.split(" ")[0] : ""),
        lastName: currentUser?.lastName ?? (currentUser?.name ? currentUser.name.split(" ").slice(1).join(" ") : ""),
        email: currentUser?.email?.trim() ?? "",
        phone: currentUser?.phone?.trim() ?? "",
      }, token ?? undefined);

      const payment = createRes.data;
      const payhere = (window as any).payhere;

      if (!payhere) {
        throw new Error("PayHere script is not loaded on this browser page.");
      }

      payhere.onCompleted = async () => {
        try {
          await finalizeBooking();
        } catch (submitError: any) {
          setStatus("failed");
          setError(submitError?.message || "Failed to submit traveler profiles after card payment verification.");
        }
      };

      payhere.onDismissed = () => {
        setStatus("idle");
        setLoadingSubmission(false);
        setError("Online card payment was dismissed by user.");
      };

      payhere.onError = (payhereErr: unknown) => {
        setStatus("failed");
        setLoadingSubmission(false);
        setError(payhereErr instanceof Error ? payhereErr.message : "Online gateway error occurred.");
      };

      payhere.startPayment(payment);
    } catch (err: any) {
      setStatus("failed");
      setLoadingSubmission(false);
      setError(err?.message || "Booking submission failed.");
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-screen flex-col bg-background">
        <Navbar />
        <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-10 md:px-6">
          <div className="h-96 animate-pulse rounded-2xl bg-muted" />
        </main>
        <Footer />
      </div>
    );
  }

  if (error && !template) {
    return (
      <div className="flex min-h-screen flex-col bg-background">
        <Navbar />
        <main className="mx-auto flex w-full max-w-xl flex-1 flex-col items-center justify-center text-center px-4 py-16">
          <h2 className="text-2xl font-bold text-destructive">Booking Unavailable</h2>
          <p className="mt-2 text-muted-foreground">{error}</p>
          <Button className="mt-6" asChild>
            <Link href="/trips">Browse other trips</Link>
          </Button>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <Navbar />
      <main className="mx-auto w-full max-w-7xl flex-1 px-4 py-8 md:px-6">
        <div className="flex flex-col gap-8 lg:flex-row">
          
          {/* Booking inputs form (Left) */}
          <div className="flex-1 space-y-8">
            <div>
              <h1 className="text-3xl font-semibold">Book Private Customized Trip</h1>
              <p className="text-muted-foreground text-sm mt-1">
                Customize your departure parameters. Your booking request will generate a private trip with the guide.
              </p>
            </div>

            <form onSubmit={(e) => void submit(e)} className="space-y-6">
              
              {/* 1. Choose Date */}
              <div className="rounded-2xl border border-border bg-card p-6 shadow-sm">
                <h3 className="text-lg font-semibold flex items-center gap-2 mb-4">
                  <span className="flex h-7 w-7 items-center justify-center rounded-full bg-primary text-xs font-bold text-primary-foreground">1</span>
                  Select Departure Date
                </h3>
                
                <div className="space-y-4">
                  <div className="flex items-center justify-between gap-3">
                    <Button type="button" variant="outline" size="sm" onClick={() => setViewMonth((current) => addMonths(current, -1))}>
                      Previous
                    </Button>
                    <h4 className="text-sm font-semibold uppercase tracking-[0.2em] text-muted-foreground">{selectedMonthLabel}</h4>
                    <Button type="button" variant="outline" size="sm" onClick={() => setViewMonth((current) => addMonths(current, 1))}>
                      Next
                    </Button>
                  </div>

                  <div className="grid grid-cols-7 gap-2 text-center text-[10px] font-bold uppercase tracking-[0.18em] text-muted-foreground">
                    {weekdayLabels.map((day) => (
                      <div key={day} className="py-2">{day}</div>
                    ))}
                  </div>

                  <div className="grid grid-cols-7 gap-2">
                    {monthDays.map((cell) => {
                      if (!cell.date) {
                        return <div key={cell.key} className="h-10 rounded-lg" />;
                      }

                      const disabled = isDateDisabled(cell.date);
                      const isSelected = selectedDate === cell.key;

                      return (
                        <button
                          key={cell.key}
                          type="button"
                          disabled={disabled}
                          onClick={() => setSelectedDate(cell.key)}
                          className={`h-10 rounded-lg border text-sm font-medium transition ${
                            isSelected
                              ? "border-primary bg-primary text-primary-foreground"
                              : disabled
                                ? "cursor-not-allowed border-border/45 bg-muted text-muted-foreground/30"
                                : "border-border bg-card hover:border-primary/50 hover:bg-primary/5"
                          }`}
                        >
                          {cell.label}
                        </button>
                      );
                    })}
                  </div>

                  <div className="rounded-xl border border-border bg-muted/30 p-4 text-sm text-muted-foreground">
                    <p className="font-semibold text-foreground">Selected date</p>
                    <p>{selectedDateLabel}</p>
                  </div>
                </div>
              </div>

              {/* 2. Pickup & Timing */}
              <div className="rounded-2xl border border-border bg-card p-6 shadow-sm space-y-4">
                <h3 className="text-lg font-semibold flex items-center gap-2 mb-2">
                  <span className="flex h-7 w-7 items-center justify-center rounded-full bg-primary text-xs font-bold text-primary-foreground">2</span>
                  Timing & Pickup Parameters
                </h3>

                {template?.pickupType !== "Meet at Location" ? (
                  <>
                    <div className="space-y-1">
                      <label className="text-xs font-semibold text-muted-foreground">Pickup Type Options</label>
                      <p className="text-sm font-medium">{template?.pickupType}</p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-1">
                        <label className="text-xs font-semibold text-muted-foreground">Pickup Time</label>
                        <Input
                          type="time"
                          value={passengerPickupTime}
                          onChange={(e) => setPassengerPickupTime(e.target.value)}
                        />
                      </div>
                    </div>

                    <div className="space-y-1">
                      <label className="text-xs font-semibold text-muted-foreground">Choose Pickup Location (Map)</label>
                      <LocationPicker
                        value={passengerPickupLocation}
                        onChange={(loc) => setPassengerPickupLocation(loc)}
                      />
                    </div>
                  </>
                ) : (
                  <>
                    <div className="space-y-1">
                      <label className="text-xs font-semibold text-muted-foreground">Meetup Point Address</label>
                      <p className="text-sm font-medium text-foreground">{mainDestination}</p>
                      <p className="text-xs text-muted-foreground">{template?.startLocation}</p>
                    </div>

                    <div className="space-y-1">
                      <label className="text-xs font-semibold text-muted-foreground">Meetup Arrival Time</label>
                      <Input
                        type="time"
                        value={passengerPickupTime}
                        onChange={(e) => setPassengerPickupTime(e.target.value)}
                      />
                    </div>
                  </>
                )}
              </div>

              {/* 3. Traveler Information */}
              <div className="rounded-2xl border border-border bg-card p-6 shadow-sm space-y-4">
                <div className="flex flex-col justify-between sm:flex-row sm:items-center gap-2">
                  <h3 className="text-lg font-semibold flex items-center gap-2">
                    <span className="flex h-7 w-7 items-center justify-center rounded-full bg-primary text-xs font-bold text-primary-foreground">3</span>
                    Traveler Information
                  </h3>
                  <div className="flex items-center gap-2 text-sm">
                    <label className="text-xs font-semibold text-muted-foreground">Number of travelers:</label>
                    <select
                      className="rounded border border-border bg-background px-2.5 py-1 text-sm font-medium"
                      value={participantsCount}
                      onChange={(e) => handleParticipantsCountChange(e.target.value)}
                    >
                      {Array.from({ length: template?.maxParticipants || 10 }, (_, i) => String(i + 1)).map((num) => (
                        <option key={num} value={num}>
                          {num}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                {participants.map((participant, index) => (
                  <div key={index} className="border-t border-border pt-4 mt-4 space-y-4">
                    <p className="font-semibold text-sm text-primary">
                      {index === 0 ? "Primary Participant (Lead Booker)" : `Additional Participant #${index + 1}`}
                    </p>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div className="space-y-1">
                        <label className="text-xs text-muted-foreground">Name</label>
                        <Input
                          value={participant.name}
                          onChange={(e) => updateParticipant(index, "name", e.target.value)}
                          placeholder="Full Name"
                          required
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-xs text-muted-foreground">Age</label>
                        <Input
                          type="number"
                          value={participant.age}
                          onChange={(e) => updateParticipant(index, "age", e.target.value)}
                          placeholder="Age"
                          min="1"
                          required
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-xs text-muted-foreground">Gender</label>
                        <select
                          className="w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                          value={participant.gender}
                          onChange={(e) => updateParticipant(index, "gender", e.target.value)}
                          required
                        >
                          <option value="">Select Gender</option>
                          <option value="male">Male</option>
                          <option value="female">Female</option>
                        </select>
                      </div>
                    </div>

                    {index === 0 && (
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className="space-y-1">
                          <label className="text-xs text-muted-foreground">Email</label>
                          <Input
                            type="email"
                            value={participant.email}
                            onChange={(e) => updateParticipant(index, "email", e.target.value)}
                            placeholder="Email Address"
                            required
                          />
                        </div>
                        <div className="space-y-1">
                          <label className="text-xs text-muted-foreground">Phone Number</label>
                          <Input
                            type="tel"
                            value={participant.phone}
                            onChange={(e) => updateParticipant(index, "phone", e.target.value)}
                            placeholder="Phone Number"
                            required
                          />
                        </div>
                        <div className="space-y-1">
                          <label className="text-xs text-muted-foreground">Home Address</label>
                          <Input
                            value={participant.address}
                            onChange={(e) => updateParticipant(index, "address", e.target.value)}
                            placeholder="Home Address"
                            required
                          />
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>

              {/* 4. Payment Method */}
              <div className="rounded-2xl border border-border bg-card p-6 shadow-sm space-y-4">
                <h3 className="text-lg font-semibold flex items-center gap-2 mb-2">
                  <span className="flex h-7 w-7 items-center justify-center rounded-full bg-primary text-xs font-bold text-primary-foreground">4</span>
                  Select Payment Method
                </h3>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {(template?.paymentMethods ?? ["Pay to Guide on Trip Day"]).map((method) => (
                    <div
                      key={method}
                      onClick={() => setSelectedPaymentMethod(method)}
                      className={`border rounded-xl p-4 cursor-pointer transition flex items-center justify-between ${
                        selectedPaymentMethod === method
                          ? "border-primary bg-primary/5 font-semibold text-primary"
                          : "border-border bg-card hover:border-primary/50"
                      }`}
                    >
                      <span className="text-sm">{method}</span>
                      <div className={`h-4 w-4 rounded-full border flex items-center justify-center ${selectedPaymentMethod === method ? "border-primary" : "border-muted"}`}>
                        {selectedPaymentMethod === method && <div className="h-2 w-2 rounded-full bg-primary" />}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {error && (
                <div className="rounded-xl bg-destructive/10 border border-destructive/20 p-4 text-sm text-destructive font-medium">
                  {error}
                </div>
              )}
            </form>
          </div>

          {/* Right Summary Column */}
          <div className="w-full lg:w-96 space-y-6">
            
            {/* Trip Details Card */}
            <div className="rounded-2xl border border-border bg-card overflow-hidden shadow-sm">
              {coverImage && (
                <img
                  src={coverImage}
                  alt={template?.tripName}
                  className="h-44 w-full object-cover"
                />
              )}
              <div className="p-5 space-y-4">
                <div>
                  <h3 className="font-semibold text-lg">{template?.tripName}</h3>
                  <p className="text-muted-foreground text-xs mt-0.5">{template?.tripCategory || "On-demand trip"}</p>
                </div>

                <div className="space-y-2 border-t border-border pt-4 text-sm">
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <MapPin className="h-4 w-4 shrink-0 text-primary" />
                    <span className="text-foreground font-medium">Meet point:</span>
                    <span className="truncate">{mainDestination}</span>
                  </div>
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <CalendarIcon className="h-4 w-4 shrink-0 text-primary" />
                    <span className="text-foreground font-medium">Duration:</span>
                    <span>{template?.durationLabel}</span>
                  </div>
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Users className="h-4 w-4 shrink-0 text-primary" />
                    <span className="text-foreground font-medium">Capacity:</span>
                    <span>Max {template?.maxParticipants} travelers</span>
                  </div>
                </div>

                {template?.organizerName && (
                  <div className="border-t border-border pt-4 flex items-center justify-between text-xs text-muted-foreground">
                    <span>Host Guide:</span>
                    <div className="flex items-center gap-1.5 font-medium text-foreground">
                      <span>{template.organizerName}</span>
                      {template.organizerRating != null && (
                        <div className="flex items-center gap-0.5 text-amber-500">
                          <Star className="h-3 w-3 fill-amber-500 text-amber-500" />
                          <span>{template.organizerRating}</span>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Price Calculations */}
            <div className="rounded-2xl border border-border bg-card p-5 shadow-sm space-y-4">
              <h3 className="font-semibold text-base">Booking Estimation</h3>
              
              <div className="space-y-2 text-sm">
                <div className="flex justify-between text-muted-foreground">
                  <span>Price per Traveler:</span>
                  <span className="font-medium text-foreground">{formatCurrencyRs(pricePerPerson)}</span>
                </div>
                <div className="flex justify-between text-muted-foreground">
                  <span>Number of Travelers:</span>
                  <span className="font-medium text-foreground">x {participantsCount}</span>
                </div>
                <div className="border-t border-border/60 my-2 pt-2 flex justify-between font-medium">
                  <span>Base Price Subtotal:</span>
                  <span>{formatCurrencyRs(pricePerPerson * Number(participantsCount))}</span>
                </div>

                {template?.pickupType && template.pickupType !== "Meet at Location" && (
                  <>
                    <div className="flex justify-between text-muted-foreground text-xs pt-1 border-t border-border/40">
                      <span>Pickup Distance:</span>
                      <span>{pickupDistanceKm.toFixed(2)} km</span>
                    </div>
                    <div className="flex justify-between text-muted-foreground text-xs">
                      <span>Pickup Fee ({formatCurrencyRs(template.pickupCostPerKm ?? 0)}/km):</span>
                      <span>{formatCurrencyRs(pickupCost)}</span>
                    </div>
                  </>
                )}

                <div className="border-t border-border/80 pt-3 flex justify-between items-baseline font-bold text-lg text-primary">
                  <span>Estimated Total:</span>
                  <span>{formatCurrencyRs(pricePerPerson * Number(participantsCount) + pickupCost)}</span>
                </div>
              </div>

              <Button
                type="button"
                disabled={loadingSubmission || status === "processing"}
                onClick={(e) => void submit(e)}
                className="w-full font-bold text-sm h-11"
              >
                {loadingSubmission ? "Processing Booking..." : "Request Custom Booking"}
              </Button>

              <p className="text-center text-[10px] text-muted-foreground">
                Your card will only be charged after the host guide accepts the customized private tour request.
              </p>
            </div>

          </div>

        </div>
      </main>
      <Footer />

      {/* Success Modal */}
      {showSuccessModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 px-4">
          <div className="w-full max-w-md border border-border bg-background p-6 rounded-2xl shadow-xl text-center space-y-4">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-emerald-100 text-emerald-600">
              ✓
            </div>
            <h3 className="text-xl font-bold">Booking Request Submitted</h3>
            <p className="text-sm text-muted-foreground">
              We have created a chat group where you can discuss trip details, meetup times, and custom pickup locations directly with the host guide.
            </p>
            <div className="flex flex-col gap-2 pt-2">
              <Button asChild>
                <Link href={`/chat?tripId=${createdTripId}`}>View Chat Group</Link>
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
