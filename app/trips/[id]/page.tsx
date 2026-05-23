"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { Navbar } from "@/components/layout/navbar";
import { Footer } from "@/components/layout/footer";
import { EmptyState } from "@/components/feedback/empty-state";
import { CardSkeletonGrid } from "@/components/feedback/loading-skeletons";
import { Button } from "@/components/ui/button";
import { tripApiService, type TripApiItem } from "@/lib/services/tripApiService";
import { userSessionService } from "@/lib/services/userSessionService";
import { formatCurrencyRs } from "@/lib/utils";
import { MapPin, Calendar, Users, MapPinIcon, Clock, Star } from "lucide-react";

const isTripExpired = (trip: TripApiItem) => {
  const endOfDay = new Date(`${trip.endDate}T23:59:59.999`);
  return Number.isNaN(endOfDay.getTime()) ? false : new Date() > endOfDay;
};

const canBookTrip = (trip: TripApiItem) => trip.status === "approved" && !isTripExpired(trip);

export default function TripDetailsPage() {
  const router = useRouter();
  const { id } = useParams<{ id: string }>();
  const [trip, setTrip] = useState<TripApiItem | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      setError("");

      // Check authentication
      const token = userSessionService.getToken();
      if (!token) {
        setError("You must be logged in to view trip details");
        setLoading(false);
        return;
      }

      try {
        const result = await tripApiService.getTripById(id, token);
        if (!result.data) {
          setError("Trip not found. It may have been removed or you don't have access.");
          setTrip(null);
        } else {
          setTrip(result.data);
          setError("");
        }
      } catch (err) {
        const message = err instanceof Error ? err.message : "Failed to load trip details";
        setError(message);
        setTrip(null);
      } finally {
        setLoading(false);
      }
    };

    if (id) {
      load();
    }
  }, [id]);

  if (loading) {
    return (
      <div>
        <Navbar />
        <main className="mx-auto max-w-7xl px-4 py-8 md:px-6">
          <CardSkeletonGrid />
        </main>
      </div>
    );
  }

  if (error) {
    return (
      <div>
        <Navbar />
        <main className="mx-auto max-w-7xl px-4 py-8 md:px-6">
          <EmptyState
            title={error === "You must be logged in to view trip details" ? "Authentication required" : "Trip not found"}
            description={error}
            action={
              error === "You must be logged in to view trip details" ? (
                <Button asChild>
                  <Link href="/login">Go to Login</Link>
                </Button>
              ) : (
                <Button variant="outline" onClick={() => router.back()}>
                  Go Back
                </Button>
              )
            }
          />
        </main>
      </div>
    );
  }

  if (!trip) {
    return (
      <div>
        <Navbar />
        <main className="mx-auto max-w-7xl px-4 py-8 md:px-6">
          <EmptyState title="Trip not found" description="This trip may have been removed or is no longer available." />
        </main>
      </div>
    );
  }

  const mainDestination = trip.mainDestinations?.[0]?.name || trip.destinations?.[0]?.name || trip.startLocation;
  const endTime = trip.endTime || "Not specified";
  const startTime = trip.startTime || "Not specified";
  const expired = isTripExpired(trip);
  const bookingAllowed = canBookTrip(trip);
  const bookingMessage = expired
    ? "This trip has expired."
    : trip.status !== "approved"
      ? "Booking is available after the trip is approved."
      : "Booking is currently unavailable.";

  return (
    <div>
      <Navbar />
      <main className="mx-auto max-w-7xl space-y-8 px-4 py-8 md:px-6">
        {/* Cover Image */}
        {trip.coverImage && (
          <img src={trip.coverImage} alt={trip.tripName} className="h-80 w-full border border-border rounded-lg object-cover" />
        )}

        {/* Header Section */}
        <section className="grid grid-cols-1 gap-6 md:grid-cols-3">
          <div className="space-y-4 md:col-span-2">
            <div>
              <h1 className="text-4xl font-semibold">{trip.tripName}</h1>
              <p className="mt-2 text-lg text-muted-foreground">{trip.description}</p>
            </div>

            <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <MapPin className="size-4" />
                <span className="font-medium text-foreground">Start location:</span>
                <span>{mainDestination}</span>
              </div>
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Calendar className="size-4" />
                <span className="font-medium text-foreground">Dates:</span>
                <span>
                  {trip.startDate} to {trip.endDate}
                </span>
              </div>
              {trip.startTime && (
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Clock className="size-4" />
                  <span className="font-medium text-foreground">Time:</span>
                  <span>
                    {startTime} - {endTime}
                  </span>
                </div>
              )}
              {trip.maxParticipants && (
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Users className="size-4" />
                  <span>Max {trip.maxParticipants} participants</span>
                </div>
              )}
            </div>

            <div className="border-t border-border pt-4">
              <div className="text-sm text-muted-foreground">
                <span className="font-medium text-foreground">Organized by: </span>
                {trip.organizerProfile ? (
                  <div className="mt-2 flex items-start gap-4">
                    <Link href={`/organizers/${trip.organizerProfile.id}`} className="flex-shrink-0">
                      <img
                        src={trip.organizerProfile.profileImage || '/default-avatar.png'}
                        alt={`${trip.organizerProfile.firstName || ''} ${trip.organizerProfile.lastName || ''}`.trim()}
                        className="h-14 w-14 rounded-full object-cover border border-border"
                      />
                    </Link>

                    <div className="flex flex-col">
                      <Link href={`/organizers/${trip.organizerProfile.id}`} className="inline-flex items-center gap-2">
                        <span className="font-semibold text-foreground text-sm">{`${trip.organizerProfile.firstName || ''} ${trip.organizerProfile.lastName || ''}`.trim() || trip.organizer}</span>
                        {trip.organizerProfile.isVerified && (
                          <span className="ml-1 text-xs text-emerald-600">✓ Verified</span>
                        )}
                        {trip.organizerProfile.overallRating != null && (
                          <span className="ml-3 inline-flex items-center text-sm text-muted-foreground">
                            <Star className="h-4 w-4 text-amber-500" />
                            <span className="ml-1">{trip.organizerProfile.overallRating}</span>
                            <span className="ml-1 text-xs text-muted-foreground">({trip.organizerProfile.totalReviews ?? 0})</span>
                          </span>
                        )}
                      </Link>

                      {trip.organizerProfile.bio && (
                        <p className="mt-1 text-xs text-muted-foreground max-w-xl">{trip.organizerProfile.bio}</p>
                      )}

                      <div className="mt-2 text-xs text-muted-foreground flex gap-3">
                        {trip.organizerProfile.city && <span>{trip.organizerProfile.city}</span>}
                        {trip.organizerProfile.country && <span>{trip.organizerProfile.country}</span>}
                      </div>
                    </div>
                  </div>
                ) : (
                  <span className="block mt-2">{trip.organizer}</span>
                )}
              </div>
              <p className="text-sm text-muted-foreground">
                <span className="font-medium text-foreground">Category: </span>
                {trip.tripCategory}
              </p>
              {!bookingAllowed && (
                <p className="mt-3 rounded border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-800">
                  {bookingMessage}
                </p>
              )}
            </div>
          </div>

          {/* Price Card */}
          <div className="border border-border bg-card p-6 rounded-lg h-fit">
            <p className="text-sm text-muted-foreground">Price per person</p>
            <p className="text-3xl font-semibold">{formatCurrencyRs(trip.price)}</p>
            {bookingAllowed ? (
              <Button className="mt-6 w-full" asChild>
                <Link href={`/booking/${trip.id}`}>Book Now</Link>
              </Button>
            ) : (
              <Button className="mt-6 w-full" disabled title={bookingMessage}>
                Book Now
              </Button>
            )}
          </div>
        </section>

        {/* Destinations Section */}
        {trip.destinations && trip.destinations.length > 0 && (
          <section className="border border-border rounded-lg bg-card p-6">
            <h2 className="text-2xl font-semibold mb-4">Destinations</h2>
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              {trip.destinations.map((dest, idx) => (
                <div key={idx} className="border border-border rounded-lg p-4">
                  <div className="flex items-start gap-2 mb-2">
                    <MapPinIcon className="size-4 mt-1 text-primary" />
                    <div>
                      <h3 className="font-semibold">{dest.name}</h3>
                      <p className="text-xs text-muted-foreground">
                        {dest.geoCode.latitude}, {dest.geoCode.longitude}
                      </p>
                    </div>
                  </div>
                  <p className="text-sm text-muted-foreground">{dest.description}</p>
                  {dest.photos && dest.photos.length > 0 && (
                    <div className="mt-3 grid grid-cols-2 gap-2">
                      {dest.photos.slice(0, 2).map((photo, photoIdx) => (
                        <img
                          key={photoIdx}
                          src={photo}
                          alt={`${dest.name} ${photoIdx + 1}`}
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

        {/* Itinerary Section */}
        {trip.itinerary?.days && trip.itinerary.days.length > 0 && (
          <section className="border border-border rounded-lg bg-card p-6">
            <h2 className="text-2xl font-semibold mb-4">Itinerary</h2>
            <div className="space-y-4">
              {trip.itinerary.days.map((day) => (
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
                            {activity.timeSlot.startTime} - {activity.timeSlot.endTime}
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
        {trip.included && (
          <section className="grid grid-cols-1 gap-6 md:grid-cols-2">
            {/* Included */}
            {(trip.included.hotelFacilities?.length || trip.included.transportFacilities?.length || trip.included.otherInclusions?.length) ? (
              <div className="border border-border rounded-lg bg-card p-6">
                <h3 className="text-xl font-semibold mb-4">What's Included</h3>
                <div className="space-y-3">
                  {trip.included.hotelFacilities && trip.included.hotelFacilities.length > 0 && (
                    <div>
                      <p className="font-medium text-sm mb-2">Hotel Facilities</p>
                      <ul className="space-y-1 text-sm text-muted-foreground">
                        {trip.included.hotelFacilities.map((item, idx) => (
                          <li key={idx} className="flex items-center gap-2">
                            <span className="size-1.5 bg-primary rounded-full" />
                            {item}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                  {trip.included.transportFacilities && trip.included.transportFacilities.length > 0 && (
                    <div>
                      <p className="font-medium text-sm mb-2">Transport Facilities</p>
                      <ul className="space-y-1 text-sm text-muted-foreground">
                        {trip.included.transportFacilities.map((item, idx) => (
                          <li key={idx} className="flex items-center gap-2">
                            <span className="size-1.5 bg-primary rounded-full" />
                            {item}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                  {trip.included.otherInclusions && trip.included.otherInclusions.length > 0 && (
                    <div>
                      <p className="font-medium text-sm mb-2">Other Inclusions</p>
                      <ul className="space-y-1 text-sm text-muted-foreground">
                        {trip.included.otherInclusions.map((item, idx) => (
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
            {trip.included.exclusions && trip.included.exclusions.length > 0 && (
              <div className="border border-border rounded-lg bg-card p-6">
                <h3 className="text-xl font-semibold mb-4">What's Not Included</h3>
                <ul className="space-y-2 text-sm text-muted-foreground">
                  {trip.included.exclusions.map((item, idx) => (
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

        {/* Photos Section */}
        {trip.photos && trip.photos.length > 0 && (
          <section className="border border-border rounded-lg bg-card p-6">
            <h2 className="text-2xl font-semibold mb-4">Gallery</h2>
            <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
              {trip.photos.map((photo, idx) => (
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
          <Button size="lg" asChild>
            <Link href={`/booking/${trip.id}`}>Book This Trip Now</Link>
          </Button>
          <Button size="lg" variant="outline" onClick={() => router.back()}>
            Go Back
          </Button>
        </div>
      </main>
      <Footer />
    </div>
  );
}
          
