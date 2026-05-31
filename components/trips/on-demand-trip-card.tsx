import Link from "next/link";
import { CalendarDays, Heart, MapPin, Star } from "lucide-react";
import { OnDemandTripTemplateApiItem } from "@/lib/services/onDemandTripService";
import { formatCurrencyRs } from "@/lib/utils";

interface OnDemandTripCardProps {
  trip: OnDemandTripTemplateApiItem;
}

export function OnDemandTripCard({ trip }: OnDemandTripCardProps) {
  const destinationsLabel = trip.mainDestinations && trip.mainDestinations.length > 0
    ? trip.mainDestinations.map((d) => d.name).join(", ")
    : trip.destinations?.[0]?.name ?? trip.startLocation ?? "Sri Lanka";
  const rating = trip.organizerRating;
  const pickupText = determinePickupText(trip.pickupType);

  return (
    <Link href={`/on-demand/${trip.id}`} className="group block h-full">
      <article className="flex h-full flex-col overflow-hidden rounded-[24px] border border-border/70 bg-card shadow-sm transition-all duration-300 group-hover:-translate-y-1 group-hover:shadow-xl group-hover:border-primary/20">
        <div className="relative aspect-16/10 overflow-hidden bg-muted">
          {trip.coverImage ? (
            <img
              src={trip.coverImage}
              alt={trip.tripName}
              className="h-full w-full object-cover transition-transform duration-700 ease-out group-hover:scale-105"
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center bg-linear-to-br from-sky-500/20 to-indigo-600/20 text-primary">
              <span className="text-sm font-bold uppercase tracking-[0.25em]">On-demand</span>
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

        <div className="flex flex-1 flex-col p-3.5 md:p-4">
          <div className="space-y-1.5">
            <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
              <MapPin className="size-4 shrink-0" />
              <span className="line-clamp-1">{destinationsLabel}</span>
            </div>

            <h3 className="line-clamp-2 text-[1.18rem] font-extrabold leading-snug tracking-tight text-foreground group-hover:text-primary">
              {trip.tripName}
            </h3>
          </div>

          <div className="mt-2.5 flex items-center gap-2 text-sm text-muted-foreground">
            <CalendarDays className="size-4 shrink-0" />
            <span className="line-clamp-1">{trip.durationLabel}</span>
            <span className="text-muted-foreground/70">•</span>
            <span className="line-clamp-1">{trip.maxParticipants} people</span>
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

function determinePickupText(value: unknown) {
  const normalized = String(value ?? "").toLowerCase();
  if (normalized.includes("pickup")) return "Pickup available";
  return "Meet at location";
}
