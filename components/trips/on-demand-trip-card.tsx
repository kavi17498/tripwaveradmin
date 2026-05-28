import Link from "next/link";
import { CalendarDays, MapPin, Users, CheckCircle2, Star } from "lucide-react";
import { Button } from "@/components/ui/button";
import { OnDemandTripTemplateApiItem } from "@/lib/services/onDemandTripService";
import { formatCurrencyRs } from "@/lib/utils";

interface OnDemandTripCardProps {
  trip: OnDemandTripTemplateApiItem;
}

export function OnDemandTripCard({ trip }: OnDemandTripCardProps) {
  const hotelFac = trip.included?.hotelFacilities || [];
  const transFac = trip.included?.transportFacilities || [];
  const otherInc = trip.included?.otherInclusions || [];
  const displayedIncluded = [...hotelFac, ...transFac, ...otherInc].slice(0, 4);

  const destinationsLabel = trip.mainDestinations && trip.mainDestinations.length > 0
    ? trip.mainDestinations.map((d) => d.name).join(", ")
    : trip.destinations?.[0]?.name ?? trip.startLocation ?? "Sri Lanka";

  return (
    <article className="group flex flex-col justify-between overflow-hidden rounded-2xl border border-border/80 bg-card hover:border-primary/20 hover:shadow-xl hover:-translate-y-1 transition-all duration-300 h-full">
      {/* Cover Image */}
      <div className="relative h-52 w-full overflow-hidden bg-muted">
        {trip.coverImage ? (
          <img 
            src={trip.coverImage} 
            alt={trip.tripName} 
            className="h-full w-full object-cover transition-transform duration-700 ease-out group-hover:scale-105" 
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-sky-500/20 to-indigo-600/20 text-primary">
            <span className="text-sm font-bold uppercase tracking-[0.25em]">On-demand</span>
          </div>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-black/10 to-transparent" />
        <div className="absolute left-3 top-3 rounded-full border border-white/20 bg-black/60 px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-white backdrop-blur-md">
          On-demand
        </div>
      </div>

      <div className="flex-1 flex flex-col justify-between p-5 space-y-4">
        {/* Title & Location Header */}
        <div className="space-y-2">
          <div className="flex items-center gap-1.5 text-xs font-semibold text-primary/80">
            <MapPin className="size-3.5 shrink-0" />
            <span className="line-clamp-1">{destinationsLabel}</span>
          </div>
          <h3 className="text-lg font-bold leading-snug tracking-tight text-foreground line-clamp-2 group-hover:text-primary transition-colors">
            {trip.tripName}
          </h3>
          <p className="line-clamp-2 text-xs text-muted-foreground leading-relaxed">{trip.description}</p>
        </div>

        {/* Dates & Duration */}
        <div className="flex items-center gap-2 text-xs text-muted-foreground/80 bg-muted/40 p-2.5 rounded-lg border border-border/30">
          <CalendarDays className="size-4 shrink-0 text-primary/60" />
          <span className="font-semibold">
            Flexible Dates ({trip.durationLabel})
          </span>
        </div>

        {/* Included Preview */}
        {displayedIncluded.length > 0 && (
          <div className="space-y-2">
            <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Included Perks</p>
            <div className="flex flex-wrap gap-1.5">
              {displayedIncluded.map((item, idx) => (
                <span 
                  key={idx} 
                  className="inline-flex items-center gap-1 rounded-md bg-secondary/80 px-2 py-0.5 text-[11px] font-semibold text-secondary-foreground border border-border/40"
                >
                  <CheckCircle2 className="size-3 text-emerald-500 shrink-0" />
                  <span className="line-clamp-1 max-w-[130px]">{item}</span>
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Organizer Info */}
        <div className="border-t border-border/60 pt-4 flex items-center justify-between">
          <div className="space-y-0.5">
            <span className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider block">Host Guide</span>
            {trip.organizer ? (
              <Link 
                href={`/organizers/${trip.organizer}`} 
                className="font-bold text-xs text-foreground hover:text-primary transition-colors cursor-pointer block"
              >
                {trip.organizerName || trip.organizer}
              </Link>
            ) : (
              <span className="font-bold text-xs text-foreground block">{trip.organizerName || "Guide"}</span>
            )}
          </div>
          {trip.organizerRating ? (
            <div className="flex items-center gap-1.5 bg-amber-500/5 px-2.5 py-1 rounded-md border border-amber-500/10" title="Real review rating">
              <Star className="size-3.5 fill-amber-500 text-amber-500" />
              <span className="text-xs font-extrabold text-amber-600">{trip.organizerRating}</span>
            </div>
          ) : (
            <div className="flex items-center gap-1.5 bg-muted/65 px-2.5 py-1 rounded-md border border-border/40" title="No reviews yet">
              <Star className="size-3.5 text-muted-foreground" />
              <span className="text-xs font-semibold text-muted-foreground">New</span>
            </div>
          )}
        </div>

        {/* Participants & Price Section */}
        <div className="border-t border-border/60 pt-4 space-y-4">
          <div className="flex items-end justify-between">
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground font-medium">
              <Users className="size-4 text-sky-500" />
              <span>{trip.maxParticipants} Max capacity</span>
            </div>
            <div className="text-right">
              <p className="text-[10px] text-muted-foreground font-semibold uppercase tracking-wider">Full Price</p>
              <p className="text-xl font-extrabold text-foreground">{formatCurrencyRs(trip.price)}</p>
              <p className="text-[11px] text-muted-foreground font-medium mt-0.5">
                {formatCurrencyRs(trip.maxParticipants > 0 ? Math.round(trip.price / trip.maxParticipants) : trip.price)} / person
              </p>
            </div>
          </div>

          <Button asChild className="w-full h-10 font-bold transition-all duration-300 shadow-xs hover:shadow-md cursor-pointer">
            <Link href={`/on-demand/${trip.id}`}>Choose dates & book</Link>
          </Button>
        </div>
      </div>
    </article>
  );
}
