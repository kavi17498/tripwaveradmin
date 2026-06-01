import Link from "next/link";
import { CalendarDays, Heart, MapPin, Star } from "lucide-react";
import { Trip } from "@/lib/types";
import { formatCurrencyRs } from "@/lib/utils";

interface TripCardEnhancedProps {
  trip: Trip;
  href?: string;
}

export function TripCardEnhanced({ trip, href }: TripCardEnhancedProps) {
  const isPrivate = trip.tripType.toLowerCase() === "private trip" || trip.tripType.toLowerCase() === "private";
  const tripCategoryLabel = isPrivate
    ? "Private Trip"
    : trip.capacity === 1
      ? "Solo Trip"
      : trip.capacity === 2
        ? "Couple Trip"
        : trip.capacity <= 6
          ? "Family Trip"
          : "Team Trip";
  const rating = (trip as any).rating ?? trip.organizerRating;
  const locationLabel = trip.destination
    ? `${trip.destination}${trip.location.country ? `, ${trip.location.country}` : ""}`
    : trip.location.city || "Sri Lanka";
  const dateLabel = trip.startDate && trip.endDate
    ? `${trip.startDate} - ${trip.endDate}`
    : trip.startDate || trip.endDate || "Fixed date trip";
  const pickupText = determinePickupText(trip);

  return (
    <Link href={href ?? `/trips/${trip.id}`} className="group block h-full">
      <article className="flex h-[380px] flex-col overflow-hidden rounded-[24px] border border-border/70 bg-card shadow-sm transition-all duration-300 group-hover:-translate-y-1 group-hover:shadow-xl group-hover:border-primary/20 md:h-[388px]">
        <div className="relative aspect-16/10 overflow-hidden bg-muted">
          {trip.coverImage ? (
            <img
              src={trip.coverImage}
              alt={trip.title}
              className="h-full w-full object-cover transition-transform duration-700 ease-out group-hover:scale-105"
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center bg-linear-to-br from-sky-500/20 to-indigo-600/20 text-primary">
              <span className="text-sm font-bold uppercase tracking-[0.25em]">Trip</span>
            </div>
          )}

          <button
            type="button"
            aria-label="Save trip"
            className="absolute right-3 top-3 grid h-10 w-10 place-items-center rounded-full bg-white text-slate-900 shadow-sm transition-transform duration-300 group-hover:scale-105"
          >
            <Heart className="size-4" />
          </button>
        </div>

        <div className="flex flex-1 flex-col p-3 md:p-3.5">
          <div className="space-y-1.5">
            <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
              <MapPin className="size-4 shrink-0" />
              <span className="line-clamp-1">{locationLabel}</span>
            </div>

            <h3 className="line-clamp-2 text-[1.12rem] font-extrabold leading-snug tracking-tight text-foreground group-hover:text-primary">
              {trip.title}
            </h3>
          </div>

          <div className="mt-2.5 flex items-center gap-2 text-sm text-muted-foreground">
            <CalendarDays className="size-4 shrink-0" />
            <span className="line-clamp-1">{dateLabel}</span>
            <span className="text-muted-foreground/70">•</span>
            <span className="line-clamp-1">{trip.bookedCount}/{trip.capacity} people</span>
          </div>

          <div className="mt-2.5 flex flex-wrap gap-2">
            <span className={`inline-flex items-center rounded-md border bg-white px-2 py-0.75 text-xs font-semibold ${pickupText === "Pickup available" ? "border-amber-500 text-amber-700" : "border-emerald-500 text-emerald-700"}`}>
              {pickupText === "Pickup available" ? "Pickup available" : "Meet at location"}
            </span>
          </div>

          <div className="mt-auto flex items-end justify-between border-t border-border/60 pt-2.5">
            <div className="space-y-1">
              <div className="flex items-center gap-1.5">
                <Star className="size-4 fill-amber-500 text-amber-500" />
                <span className="text-sm font-bold text-foreground">
                  {rating ? rating.toFixed(1) : "New"}
                </span>
              </div>
            </div>

            <div className="text-right">
              <p className="text-xl font-black tracking-tight text-foreground">{formatCurrencyRs(trip.price)}</p>
            </div>
          </div>
        </div>
      </article>
    </Link>
  );
}

function determinePickupText(trip: unknown) {
  const normalizedPickupType = String((trip as { pickupType?: unknown } | null)?.pickupType ?? "").trim().toLowerCase();
  const hasPickupConfig = Boolean(
    (trip as { pickupCostPerKm?: unknown } | null)?.pickupCostPerKm !== undefined ||
    (trip as { pickupStartLocation?: unknown } | null)?.pickupStartLocation ||
    (trip as { pickupCost?: unknown } | null)?.pickupCost !== undefined,
  );

  if (normalizedPickupType.includes("meet at location") && !hasPickupConfig) {
    return "Meet at location";
  }

  if (
    normalizedPickupType.includes("pickup") ||
    normalizedPickupType.includes("airport") ||
    hasPickupConfig
  ) {
    return "Pickup available";
  }

  return "Meet at location";
}

