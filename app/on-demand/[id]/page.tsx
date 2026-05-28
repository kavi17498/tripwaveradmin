"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { Navbar } from "@/components/layout/navbar";
import { Footer } from "@/components/layout/footer";
import { EmptyState } from "@/components/feedback/empty-state";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { onDemandTripService, type OnDemandTripTemplateApiItem } from "@/lib/services/onDemandTripService";
import { userSessionService } from "@/lib/services/userSessionService";
import { useToast } from "@/components/feedback/toast-provider";
import { CalendarDays, Clock3, MapPin, ShieldCheck, Sparkles } from "lucide-react";
import { formatCurrencyRs } from "@/lib/utils";

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

export default function OnDemandTripBookingPage() {
  const router = useRouter();
  const { id } = useParams<{ id: string }>();
  const { pushToast } = useToast();

  const [template, setTemplate] = useState<OnDemandTripTemplateApiItem | null>(null);
  const [busyDates, setBusyDates] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [booking, setBooking] = useState(false);
  const [error, setError] = useState("");
  const [selectedDate, setSelectedDate] = useState("");
  const [selectedStartTime, setSelectedStartTime] = useState("08:00");
  const [viewMonth, setViewMonth] = useState(() => startOfMonth(new Date()));

  const busyDateSet = useMemo(() => new Set(busyDates), [busyDates]);

  useEffect(() => {
    const load = async () => {
      if (!id) return;

      setLoading(true);
      setError("");

      try {
        const [templateResponse, availabilityResponse] = await Promise.all([
          onDemandTripService.getTemplateById(id),
          onDemandTripService.getAvailability(id),
        ]);

        if (!templateResponse.data) {
          setTemplate(null);
          setError("On-demand trip not found.");
          return;
        }

        setTemplate(templateResponse.data);
        setBusyDates(availabilityResponse.data.busyDates || []);
      } catch (loadError) {
        setTemplate(null);
        setError(loadError instanceof Error ? loadError.message : "Failed to load on-demand trip details.");
      } finally {
        setLoading(false);
      }
    };

    load();
  }, [id]);

  useEffect(() => {
    if (template && !selectedDate) {
      const nextDay = new Date();
      nextDay.setDate(nextDay.getDate() + 1);
      setSelectedDate(toDateKey(nextDay));
    }
  }, [template, selectedDate]);

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

  const isDateDisabled = (date: Date) => {
    const key = toDateKey(date);
    return busyDateSet.has(key) || isPastDate(date);
  };

  const handleBook = async () => {
    if (!template) return;

    const token = userSessionService.getToken();
    if (!token) {
      pushToast({
        title: "Authentication Required",
        description: "Please sign in to continue booking this trip.",
        type: "error",
      });
      router.push(`/login?redirect=/on-demand/${id}`);
      return;
    }

    if (!selectedDate) {
      pushToast({ title: "Pick a date", description: "Select an available booking date first.", type: "error" });
      return;
    }

    if (busyDateSet.has(selectedDate)) {
      pushToast({ title: "Date unavailable", description: "That date is already booked by the guide.", type: "error" });
      return;
    }

    try {
      setBooking(true);
      const response = await onDemandTripService.bookTemplate(id, { startDate: selectedDate, startTime: selectedStartTime }, token);
      const tripId = response.data?.tripId;
      if (!tripId) {
        throw new Error("Booking could not be created.");
      }

      pushToast({
        title: "Booking prepared",
        description: "Your private trip is ready. Continue with participants and payment.",
        type: "success",
      });
      router.push(`/booking/${tripId}`);
    } catch (bookError) {
      pushToast({
        title: "Booking failed",
        description: bookError instanceof Error ? bookError.message : "Failed to create the private trip.",
        type: "error",
      });
    } finally {
      setBooking(false);
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-screen flex-col bg-background">
        <Navbar />
        <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-10 md:px-6">
          <div className="h-80 animate-pulse rounded-3xl bg-muted" />
        </main>
        <Footer />
      </div>
    );
  }

  if (error || !template) {
    return (
      <div className="flex min-h-screen flex-col bg-background">
        <Navbar />
        <main className="mx-auto flex w-full max-w-4xl flex-1 items-center justify-center px-4 py-16 md:px-6">
          <EmptyState
            title="On-demand trip unavailable"
            description={error || "The requested on-demand trip could not be loaded."}
            action={
              <Button asChild variant="outline" className="gap-2">
                <Link href="/trips">Back to trips</Link>
              </Button>
            }
          />
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <Navbar />
      <main className="flex-1 pb-20">
        <section className="relative overflow-hidden bg-zinc-950">
          <div className="absolute inset-0">
            <img
              src={template.coverImage || template.photos?.[0] || "https://images.unsplash.com/photo-1546708973-b339540b5162?q=80&w=1600&auto=format&fit=crop"}
              alt={template.tripName}
              className="h-full w-full object-cover opacity-55"
            />
            <div className="absolute inset-0 bg-linear-to-t from-background via-black/30 to-black/70" />
          </div>

          <div className="relative mx-auto flex w-full max-w-7xl flex-col gap-6 px-4 py-12 md:px-6 lg:flex-row lg:items-end lg:justify-between lg:py-16">
            <div className="max-w-2xl space-y-4 text-white">
              <div className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-sky-200 backdrop-blur-sm">
                <Sparkles className="size-3.5" />
                On-demand trip template
              </div>
              <h1 className="text-3xl font-black tracking-tight md:text-5xl">{template.tripName}</h1>
              <p className="text-sm leading-relaxed text-zinc-200 md:text-base">{template.description}</p>
              <div className="flex flex-wrap items-center gap-3 text-xs text-white/80">
                <span className="rounded-full bg-white/10 px-3 py-1 backdrop-blur-sm">{template.durationLabel}</span>
                <span className="rounded-full bg-white/10 px-3 py-1 backdrop-blur-sm">{template.organizerName || template.organizer}</span>
                <span className="rounded-full bg-white/10 px-3 py-1 backdrop-blur-sm">{formatCurrencyRs(template.price)}</span>
              </div>
            </div>

            <div className="w-full max-w-sm rounded-3xl border border-white/15 bg-black/35 p-5 text-white backdrop-blur-md">
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-white/60">Book a private trip</p>
              <p className="mt-2 text-sm text-white/80">Choose an available date, then continue to the standard booking flow.</p>
              <Button onClick={handleBook} disabled={booking} className="mt-4 w-full font-bold">
                {booking ? "Creating trip..." : "Continue to booking"}
              </Button>
            </div>
          </div>
        </section>

        <div className="mx-auto grid w-full max-w-7xl grid-cols-1 gap-6 px-4 py-10 md:px-6 lg:grid-cols-3">
          <section className="space-y-6 lg:col-span-2">
            <div className="rounded-3xl border border-border bg-card p-5 shadow-sm md:p-6">
              <div className="flex items-center gap-2 border-b border-border/70 pb-4">
                <CalendarDays className="size-5 text-primary" />
                <h2 className="text-xl font-bold">Choose a date</h2>
              </div>

              <div className="mt-5 flex items-center justify-between gap-3">
                <Button type="button" variant="outline" size="sm" onClick={() => setViewMonth((current) => addMonths(current, -1))}>
                  Previous
                </Button>
                <h3 className="text-sm font-semibold uppercase tracking-[0.2em] text-muted-foreground">{selectedMonthLabel}</h3>
                <Button type="button" variant="outline" size="sm" onClick={() => setViewMonth((current) => addMonths(current, 1))}>
                  Next
                </Button>
              </div>

              <div className="mt-4 grid grid-cols-7 gap-2 text-center text-[10px] font-bold uppercase tracking-[0.18em] text-muted-foreground">
                {weekdayLabels.map((day) => (
                  <div key={day} className="py-2">{day}</div>
                ))}
              </div>

              <div className="mt-2 grid grid-cols-7 gap-2">
                {monthDays.map((cell) => {
                  if (!cell.date) {
                    return <div key={cell.key} className="h-12 rounded-xl" />;
                  }

                  const disabled = isDateDisabled(cell.date);
                  const isSelected = selectedDate === cell.key;

                  return (
                    <button
                      key={cell.key}
                      type="button"
                      disabled={disabled}
                      onClick={() => setSelectedDate(cell.key)}
                      className={`h-12 rounded-xl border text-sm font-semibold transition ${
                        isSelected
                          ? "border-primary bg-primary text-primary-foreground"
                          : disabled
                            ? "cursor-not-allowed border-border/40 bg-muted text-muted-foreground/40"
                            : "border-border bg-card hover:border-primary/50 hover:bg-primary/5"
                      }`}
                    >
                      {cell.label}
                    </button>
                  );
                })}
              </div>

              <div className="mt-4 flex flex-wrap gap-2 text-xs text-muted-foreground">
                <span className="rounded-full border border-border px-3 py-1">Disabled = guide busy or past date</span>
                <span className="rounded-full border border-border px-3 py-1">Template duration: {template.durationLabel}</span>
              </div>
            </div>
          </section>

          <aside className="space-y-6">
            <div className="rounded-3xl border border-border bg-card p-5 shadow-sm md:p-6">
              <h2 className="flex items-center gap-2 text-xl font-bold">
                <Clock3 className="size-5 text-primary" /> Booking details
              </h2>
              <div className="mt-4 space-y-4 text-sm text-muted-foreground">
                <div>
                  <p className="font-semibold text-foreground">Selected date</p>
                  <p>{selectedDateLabel}</p>
                </div>
                <div>
                  <p className="font-semibold text-foreground">Requested pickup / meetup time</p>
                  <Input type="time" value={selectedStartTime} onChange={(event) => setSelectedStartTime(event.target.value)} />
                </div>
                <div>
                  <p className="font-semibold text-foreground">Trip duration</p>
                  <p>{template.durationLabel}</p>
                </div>
                <div>
                  <p className="font-semibold text-foreground">Meeting point</p>
                  <div className="flex items-start gap-2">
                    <MapPin className="mt-0.5 size-4 shrink-0 text-primary" />
                    <p>{template.startLocation}</p>
                  </div>
                </div>
                <div>
                  <p className="font-semibold text-foreground">Price</p>
                  <p>{formatCurrencyRs(template.price)}</p>
                </div>
              </div>
              <Button onClick={handleBook} disabled={booking} className="mt-5 w-full font-bold">
                {booking ? "Creating trip..." : "Continue to booking"}
              </Button>
            </div>

            <div className="rounded-3xl border border-border bg-card p-5 shadow-sm md:p-6">
              <h2 className="flex items-center gap-2 text-lg font-bold">
                <ShieldCheck className="size-5 text-primary" /> Guide availability
              </h2>
              {busyDates.length === 0 ? (
                <p className="mt-3 text-sm text-muted-foreground">No conflicting guide bookings were found.</p>
              ) : (
                <div className="mt-3 space-y-2 text-sm text-muted-foreground">
                  <p>Busy dates are disabled in the calendar. Existing confirmed trips already block these dates.</p>
                  <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground/80">{busyDates.length} blocked date(s)</p>
                  <div className="flex flex-wrap gap-2">
                    {busyDates.slice(0, 8).map((blockedDate) => (
                      <span key={blockedDate} className="rounded-full border border-border bg-muted px-2.5 py-1 text-[11px]">
                        {blockedDate}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </aside>
        </div>
      </main>
      <Footer />
    </div>
  );
}
