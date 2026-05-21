import Link from "next/link";
import { CalendarDays, MapPin, Users, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { RatingStars } from "@/components/common/rating-stars";
import { Trip } from "@/lib/types";
import { formatCurrencyRs } from "@/lib/utils";

interface TripCardEnhancedProps {
  trip: Trip;
  href?: string;
}

export function TripCardEnhanced({ trip, href }: TripCardEnhancedProps) {
  const displayedItinerary = trip.itinerary.slice(0, 3);
  const displayedIncluded = trip.included.slice(0, 4);
  const tripCategoryLabel =
    trip.tripType === "private"
      ? "Private Trip"
      : trip.title.toLowerCase().includes("solo")
        ? "Solo Trip"
        : trip.title.toLowerCase().includes("family")
          ? "Family Trip"
          : trip.title.toLowerCase().includes("stranger")
            ? "Strangers Trip"
            : "Public Trip";

  return (
    <article className="border border-border bg-card shadow-md overflow-hidden hover:shadow-lg transition-shadow">
      {/* Cover Image */}
      <div className="relative h-56 w-full overflow-hidden bg-muted">
        <img src={trip.coverImage} alt={trip.title} className="h-full w-full object-cover" />
        <div className="absolute left-3 top-3 rounded-full border border-white/20 bg-slate-950/75 px-3 py-1 text-xs font-medium text-white backdrop-blur">
          {tripCategoryLabel}
        </div>
      </div>

      <div className="space-y-4 p-5">
        {/* Title & Location Header */}
        <div className="space-y-2">
          <h3 className="text-xl font-semibold leading-tight line-clamp-2">{trip.title}</h3>
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <MapPin className="size-4 shrink-0" />
            <span>{trip.destination}, {trip.location.country}</span>
          </div>
        </div>

        {/* Description */}
        <p className="line-clamp-2 text-sm text-muted-foreground">{trip.description}</p>

        {/* Dates & Duration */}
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <CalendarDays className="size-4 shrink-0" />
          <span>{trip.startDate} to {trip.endDate} ({trip.durationDays} days)</span>
        </div>

        {/* Organizer Info */}
        <div className="border-t border-border pt-3">
          <p className="text-sm">
            <span className="text-muted-foreground">Organized by </span>
            <span className="font-medium">{trip.organizerName}</span>
          </p>
          <div className="mt-1">
            <RatingStars rating={trip.organizerRating} />
          </div>
        </div>

        {/* Itinerary Preview */}
        {displayedItinerary.length > 0 && (
          <div className="border-t border-border pt-3">
            <p className="text-sm font-semibold mb-2">Itinerary Highlight</p>
            <div className="space-y-1">
              {displayedItinerary.map((item) => (
                <div key={item.day} className="text-sm">
                  <p className="font-medium text-xs text-muted-foreground">Day {item.day}</p>
                  <p className="text-sm">{item.title}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Included Preview */}
        {displayedIncluded.length > 0 && (
          <div className="border-t border-border pt-3">
            <p className="text-sm font-semibold mb-2">What&apos;s Included</p>
            <ul className="space-y-1">
              {displayedIncluded.map((item, idx) => (
                <li key={idx} className="flex items-start gap-2 text-sm text-muted-foreground">
                  <CheckCircle2 className="size-4 shrink-0 mt-0.5 text-green-600" />
                  <span className="line-clamp-1">{item}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Participants & Price Section */}
        <div className="border-t border-border pt-3">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Users className="size-4" />
              <span>{trip.bookedCount}/{trip.capacity} participants</span>
            </div>
            <div className="text-right">
              <p className="text-xs text-muted-foreground">From</p>
              <p className="text-2xl font-semibold">{formatCurrencyRs(trip.price)}</p>
            </div>
          </div>

          <Button asChild className="w-full">
            <Link href={href ?? `/trips/${trip.id}`}>View Full Trip Details</Link>
          </Button>
        </div>
      </div>
    </article>
  );
}
