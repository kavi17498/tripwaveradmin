import Link from "next/link";
import { CalendarDays, MapPin, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { RatingStars } from "@/components/common/rating-stars";
import { StatusBadge } from "@/components/common/status-badge";
import { Trip } from "@/lib/types";

interface TripCardProps {
  trip: Trip;
  href?: string;
}

export function TripCard({ trip, href }: TripCardProps) {
  return (
    <article className="border border-border bg-card shadow-sm">
      <img src={trip.coverImage} alt={trip.title} className="h-48 w-full object-cover" />
      <div className="space-y-3 p-4">
        <div className="flex items-start justify-between gap-2">
          <h3 className="text-lg font-semibold leading-tight">{trip.title}</h3>
          <StatusBadge status={trip.status} />
        </div>

        <p className="line-clamp-2 text-sm text-muted-foreground">{trip.description}</p>

        <div className="grid gap-1 text-sm text-muted-foreground">
          <p className="flex items-center gap-2">
            <MapPin className="size-4" /> {trip.destination}, {trip.location.country}
          </p>
          <p className="flex items-center gap-2">
            <CalendarDays className="size-4" /> {trip.startDate} to {trip.endDate}
          </p>
          <p className="flex items-center gap-2">
            <Users className="size-4" /> {trip.bookedCount}/{trip.capacity} participants
          </p>
        </div>

        <div className="flex items-center justify-between">
          <div>
            <p className="text-xl font-semibold">${trip.price}</p>
            <RatingStars rating={trip.organizerRating} />
          </div>
          <Button asChild>
            <Link href={href ?? `/trips/${trip.id}`}>View Trip</Link>
          </Button>
        </div>
      </div>
    </article>
  );
}
