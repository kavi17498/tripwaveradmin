import { Star } from "lucide-react";
import { cn } from "@/lib/utils";

interface RatingStarsProps {
  rating: number | null;
  outOf?: number;
  className?: string;
}

export function RatingStars({ rating, outOf = 5, className }: RatingStarsProps) {
  if (rating === null) {
    return (
      <div className={cn("flex items-center gap-1", className)}>
        {Array.from({ length: outOf }).map((_, index) => (
          <Star
            key={index}
            className="size-4 text-slate-300"
          />
        ))}
        <span className="ml-1 text-xs text-muted-foreground font-semibold">New</span>
      </div>
    );
  }

  return (
    <div className={cn("flex items-center gap-1", className)}>
      {Array.from({ length: outOf }).map((_, index) => {
        const filled = index < Math.round(rating);
        return (
          <Star
            key={index}
            className={cn("size-4", filled ? "fill-amber-400 text-amber-500" : "text-slate-300")}
          />
        );
      })}
      <span className="ml-1 text-xs text-muted-foreground font-semibold">{rating.toFixed(1)}</span>
    </div>
  );
}
