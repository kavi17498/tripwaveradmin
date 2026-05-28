"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { Navbar } from "@/components/layout/navbar";
import { Footer } from "@/components/layout/footer";
import { EmptyState } from "@/components/feedback/empty-state";
import { Button } from "@/components/ui/button";
import { Modal } from "@/components/common/modal";
import { onDemandTripService, type OnDemandTripTemplateApiItem } from "@/lib/services/onDemandTripService";
import { userService } from "@/lib/services/userService";
import { userSessionService } from "@/lib/services/userSessionService";
import { useToast } from "@/components/feedback/toast-provider";
import { Calendar, Clock, MapPin, MapPinIcon, ShieldCheck, Sparkles, Star, Users } from "lucide-react";
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

type OrganizerProfile = {
  id?: string;
  firstName?: string;
  lastName?: string;
  profileImage?: string;
  bio?: string;
  city?: string;
  country?: string;
  isVerified?: boolean;
  overallRating?: number | null;
  totalReviews?: number;
};

const getOrganizerName = (template: OnDemandTripTemplateApiItem | null, profile: OrganizerProfile | null) => {
  const fullName = `${profile?.firstName || ""} ${profile?.lastName || ""}`.trim();
  return fullName || template?.organizerName || "Organizer";
};

export default function OnDemandTripBookingPage() {
  const router = useRouter();
  const { id } = useParams<{ id: string }>();
  const { pushToast } = useToast();

  const [template, setTemplate] = useState<OnDemandTripTemplateApiItem | null>(null);
  const [organizerProfile, setOrganizerProfile] = useState<OrganizerProfile | null>(null);
  const [busyDates, setBusyDates] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [booking, setBooking] = useState(false);
  const [error, setError] = useState("");
  const [selectedDate, setSelectedDate] = useState("");
  const [selectedStartTime, setSelectedStartTime] = useState("08:00");
  const [viewMonth, setViewMonth] = useState(() => startOfMonth(new Date()));
  const [bookingModalOpen, setBookingModalOpen] = useState(false);

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

        if (templateResponse.data.organizer) {
          try {
            const organizerResponse = await userService.getOrganizerProfile(templateResponse.data.organizer);
            const organizerData = organizerResponse.data;
            if (organizerData && organizerData.organizer) {
              setOrganizerProfile({
                ...organizerData.organizer,
                overallRating: organizerData.overallRating ?? null,
                totalReviews: organizerData.totalReviews ?? 0,
              });
            } else {
              setOrganizerProfile(null);
            }
          } catch {
            setOrganizerProfile(null);
          }
        } else {
          setOrganizerProfile(null);
        }
      } catch (loadError) {
        setTemplate(null);
        setOrganizerProfile(null);
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

  const organizerName = getOrganizerName(template, organizerProfile);
  const organizerLink = organizerProfile?.id || template?.organizer ? `/organizers/${organizerProfile?.id || template?.organizer}` : null;
  const tripPhotos = useMemo(() => {
    const photos = new Set<string>();

    if (template?.coverImage) {
      photos.add(template.coverImage);
    }

    template?.photos?.forEach((photo) => photos.add(photo));
    template?.destinations?.forEach((destination) => destination.photos?.forEach((photo) => photos.add(photo)));

    return Array.from(photos);
  }, [template]);

  const mainDestination = template?.mainDestinations?.[0]?.name || template?.destinations?.[0]?.name || template?.startLocation || "Meeting point";

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
      setBookingModalOpen(false);
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
      <main className="mx-auto max-w-7xl space-y-8 px-4 py-8 md:px-6">
        {/* Cover Image */}
        {(template.coverImage || template.photos?.[0]) && (
          <img
            src={template.coverImage || template.photos?.[0]}
            alt={template.tripName}
            className="h-80 w-full border border-border rounded-lg object-cover"
          />
        )}

        {/* Header Section */}
        <section className="grid grid-cols-1 gap-6 md:grid-cols-3">
          <div className="space-y-4 md:col-span-2">
            <div>
              <h1 className="text-4xl font-semibold">{template.tripName}</h1>
              <p className="mt-2 text-lg text-muted-foreground">{template.description}</p>
            </div>

            <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <MapPin className="size-4" />
                <span className="font-medium text-foreground">Start location:</span>
                <span>{mainDestination}</span>
              </div>
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Calendar className="size-4" />
                <span className="font-medium text-foreground">Duration:</span>
                <span>{template.durationLabel}</span>
              </div>
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Users className="size-4" />
                <span>Max {template.maxParticipants} travelers</span>
              </div>
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Sparkles className="size-4" />
                <span className="font-medium text-foreground">Type:</span>
                <span>{template.tripCategory || "On-demand trip"}</span>
              </div>
            </div>

            <div className="border-t border-border pt-4">
              <div className="text-sm text-muted-foreground">
                <span className="font-medium text-foreground">Organized by: </span>
                {organizerProfile ? (
                  <div className="mt-2 flex items-start gap-4">
                    <Link href={`/organizers/${organizerProfile.id || template.organizer}`} className="shrink-0">
                      <img
                        src={organizerProfile.profileImage || '/default-avatar.png'}
                        alt={organizerName}
                        className="h-14 w-14 rounded-full object-cover border border-border"
                      />
                    </Link>

                    <div className="flex flex-col">
                      <Link href={`/organizers/${organizerProfile.id || template.organizer}`} className="inline-flex items-center gap-2">
                        <span className="font-semibold text-foreground text-sm">{organizerName}</span>
                        {organizerProfile.isVerified && (
                          <span className="ml-1 text-xs text-emerald-600">✓ Verified</span>
                        )}
                        {organizerProfile.overallRating != null && (
                          <span className="ml-3 inline-flex items-center text-sm text-muted-foreground">
                            <Star className="h-4 w-4 text-amber-500" />
                            <span className="ml-1">{organizerProfile.overallRating}</span>
                            <span className="ml-1 text-xs text-muted-foreground">({organizerProfile.totalReviews ?? 0})</span>
                          </span>
                        )}
                      </Link>

                      {organizerProfile.bio && (
                        <p className="mt-1 text-xs text-muted-foreground max-w-xl">{organizerProfile.bio}</p>
                      )}

                      <div className="mt-2 text-xs text-muted-foreground flex gap-3">
                        {organizerProfile.city && <span>{organizerProfile.city}</span>}
                        {organizerProfile.country && <span>{organizerProfile.country}</span>}
                      </div>
                    </div>
                  </div>
                ) : (
                  <span className="block mt-2 font-semibold text-foreground">{organizerName}</span>
                )}
              </div>
              <p className="mt-3 text-sm text-muted-foreground">
                <span className="font-medium text-foreground">Category: </span>
                {template.tripCategory || "On-demand trip"}
              </p>
            </div>
          </div>

          {/* Price Card */}
          <div className="border border-border bg-card p-6 rounded-lg h-fit">
            <p className="text-sm text-muted-foreground">Price per booking</p>
            <p className="text-3xl font-semibold">{formatCurrencyRs(template.price)}</p>
            <Button className="mt-6 w-full font-bold" onClick={() => setBookingModalOpen(true)}>
              Choose Date & Book
            </Button>
            <p className="mt-3 text-xs text-muted-foreground text-center">
              Review availability and book a customized departure for you and your group.
            </p>
          </div>
        </section>

        {/* Guide Availability Section */}
        <section className="border border-border rounded-lg bg-card p-6">
          <h2 className="text-2xl font-semibold mb-4">Guide Availability</h2>
          <div className="space-y-3 text-sm text-muted-foreground">
            {busyDates.length === 0 ? (
              <p>No conflicting guide bookings were found. All dates are currently open for booking.</p>
            ) : (
              <>
                <p>The guide has {busyDates.length} blocked date(s) that are unavailable for booking. These dates will be hidden from the interactive calendar when you choose a date.</p>
                <div className="mt-3 flex flex-wrap gap-2">
                  {busyDates.slice(0, 12).map((blockedDate) => (
                    <span key={blockedDate} className="rounded-full border border-border bg-muted px-2.5 py-1 text-xs">
                      {blockedDate}
                    </span>
                  ))}
                  {busyDates.length > 12 && (
                    <span className="rounded-full border border-border bg-muted/50 px-2.5 py-1 text-xs font-medium">
                      + {busyDates.length - 12} more days
                    </span>
                  )}
                </div>
              </>
            )}
          </div>
        </section>

        {/* Destinations Section */}
        {template.destinations && template.destinations.length > 0 && (
          <section className="border border-border rounded-lg bg-card p-6">
            <h2 className="text-2xl font-semibold mb-4">Destinations</h2>
            <p className="mb-4 text-sm text-muted-foreground">Primary route: {mainDestination}</p>
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              {template.destinations.map((destination, idx) => (
                <div key={`${destination.name}-${idx}`} className="border border-border rounded-lg p-4">
                  <div className="flex items-start gap-2 mb-2">
                    <MapPinIcon className="size-4 mt-1 text-primary" />
                    <div>
                      <h3 className="font-semibold">{destination.name}</h3>
                      {destination.geoCode && (
                        <p className="text-xs text-muted-foreground">
                          {destination.geoCode.latitude}, {destination.geoCode.longitude}
                        </p>
                      )}
                    </div>
                  </div>
                  <p className="text-sm text-muted-foreground">{destination.description}</p>
                  {destination.photos && destination.photos.length > 0 && (
                    <div className="mt-3 grid grid-cols-2 gap-2">
                      {destination.photos.slice(0, 2).map((photo, photoIdx) => (
                        <img
                          key={photoIdx}
                          src={photo}
                          alt={`${destination.name} ${photoIdx + 1}`}
                          className="h-24 w-full rounded object-cover"
                        />
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Main Destinations Section */}
        {template.mainDestinations && template.mainDestinations.length > 0 && (
          <section className="border border-border rounded-lg bg-card p-6">
            <h2 className="text-2xl font-semibold mb-4">Main Destinations</h2>
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              {template.mainDestinations.map((destination) => (
                <div key={destination.name} className="border border-border rounded-lg p-4">
                  <h3 className="font-semibold">{destination.name}</h3>
                  <p className="text-xs text-muted-foreground">
                    {destination.lat}, {destination.lng}
                  </p>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Itinerary Section */}
        {template.itinerary?.days && template.itinerary.days.length > 0 && (
          <section className="border border-border rounded-lg bg-card p-6">
            <h2 className="text-2xl font-semibold mb-4">Itinerary</h2>
            <div className="space-y-4">
              {template.itinerary.days.map((day) => (
                <div key={day.day} className="border-l-4 border-primary pl-4">
                  <h3 className="font-semibold text-lg">
                    Day {day.day}: {day.title}
                  </h3>
                  {day.activities && day.activities.length > 0 && (
                    <div className="mt-3 space-y-2">
                      {day.activities.map((activity, actIdx) => (
                        <div key={actIdx} className="text-sm bg-muted/30 rounded p-3">
                          <div className="flex items-start justify-between gap-2 mb-1">
                            <p className="font-medium">{activity.title}</p>
                          </div>
                          <p className="text-xs text-muted-foreground mb-2">
                            {activity.timeSlot?.startTime && activity.timeSlot?.endTime
                              ? `${activity.timeSlot.startTime} - ${activity.timeSlot.endTime}`
                              : "All day"}
                          </p>
                          {activity.notes && activity.notes.length > 0 && (
                            <ul className="text-xs text-muted-foreground list-disc list-inside">
                              {activity.notes.map((note, noteIdx) => (
                                <li key={noteIdx}>{note}</li>
                              ))}
                            </ul>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Included/Excluded Section */}
        {template.included && (
          <section className="grid grid-cols-1 gap-6 md:grid-cols-2">
            {/* Included */}
            {(template.included.hotelFacilities?.length || template.included.transportFacilities?.length || template.included.otherInclusions?.length) ? (
              <div className="border border-border rounded-lg bg-card p-6">
                <h3 className="text-xl font-semibold mb-4">What's Included</h3>
                <div className="space-y-3">
                  {template.included.hotelFacilities && template.included.hotelFacilities.length > 0 && (
                    <div>
                      <p className="font-medium text-sm mb-2">Hotel Facilities</p>
                      <ul className="space-y-1 text-sm text-muted-foreground">
                        {template.included.hotelFacilities.map((item, idx) => (
                          <li key={idx} className="flex items-center gap-2">
                            <span className="size-1.5 bg-primary rounded-full" />
                            {item}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                  {template.included.transportFacilities && template.included.transportFacilities.length > 0 && (
                    <div>
                      <p className="font-medium text-sm mb-2">Transport Facilities</p>
                      <ul className="space-y-1 text-sm text-muted-foreground">
                        {template.included.transportFacilities.map((item, idx) => (
                          <li key={idx} className="flex items-center gap-2">
                            <span className="size-1.5 bg-primary rounded-full" />
                            {item}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                  {template.included.otherInclusions && template.included.otherInclusions.length > 0 && (
                    <div>
                      <p className="font-medium text-sm mb-2">Other Inclusions</p>
                      <ul className="space-y-1 text-sm text-muted-foreground">
                        {template.included.otherInclusions.map((item, idx) => (
                          <li key={idx} className="flex items-center gap-2">
                            <span className="size-1.5 bg-primary rounded-full" />
                            {item}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              </div>
            ) : null}

            {/* Excluded */}
            {template.included.exclusions && template.included.exclusions.length > 0 && (
              <div className="border border-border rounded-lg bg-card p-6">
                <h3 className="text-xl font-semibold mb-4">What's Not Included</h3>
                <ul className="space-y-2 text-sm text-muted-foreground">
                  {template.included.exclusions.map((item, idx) => (
                    <li key={idx} className="flex items-center gap-2">
                      <span className="size-1.5 bg-destructive rounded-full" />
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </section>
        )}

        {/* Gallery */}
        {template.photos && template.photos.length > 0 && (
          <section className="border border-border rounded-lg bg-card p-6">
            <h2 className="text-2xl font-semibold mb-4">Gallery</h2>
            <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
              {template.photos.map((photo, idx) => (
                <img
                  key={idx}
                  src={photo}
                  alt={`Trip photo ${idx + 1}`}
                  className="h-40 w-full rounded object-cover"
                />
              ))}
            </div>
          </section>
        )}

        {/* Gallery Fallback */}
        {(!template.photos || template.photos.length === 0) && tripPhotos.length > 0 && (
          <section className="border border-border rounded-lg bg-card p-6">
            <h2 className="text-2xl font-semibold mb-4">Gallery</h2>
            <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
              {tripPhotos.slice(0, 8).map((photo, idx) => (
                <img
                  key={idx}
                  src={photo}
                  alt={`Trip photo ${idx + 1}`}
                  className="h-40 w-full rounded object-cover"
                />
              ))}
            </div>
          </section>
        )}

        {/* Call to Action */}
        <div className="flex gap-3 justify-center py-6">
          <Button size="lg" onClick={() => setBookingModalOpen(true)}>
            Book This Trip Now
          </Button>
          <Button size="lg" variant="outline" onClick={() => router.back()}>
            Go Back
          </Button>
        </div>
      </main>
      <Footer />

      <Modal
        open={bookingModalOpen}
        title="Choose your date"
        description="Pick an available day from the calendar, then confirm your booking."
        onClose={() => setBookingModalOpen(false)}
        onConfirm={() => void handleBook()}
        confirmText={booking ? "Creating trip..." : "Book now"}
      >
        <div className="space-y-4">
          <div className="flex items-center justify-between gap-3">
            <Button type="button" variant="outline" size="sm" onClick={() => setViewMonth((current) => addMonths(current, -1))}>
              Previous
            </Button>
            <h3 className="text-sm font-semibold uppercase tracking-[0.2em] text-muted-foreground">{selectedMonthLabel}</h3>
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

          <div className="rounded-2xl border border-border bg-muted/30 p-4 text-sm text-muted-foreground">
            <p className="font-semibold text-foreground">Selected date</p>
            <p>{selectedDateLabel}</p>
            <p className="mt-2 text-xs">A default meetup time is used for booking. You only need to choose the date here.</p>
          </div>
        </div>
      </Modal>
    </div>
  );
}
