import { Input } from "@/components/ui/input";
import { TripFilters } from "@/lib/types";
import { MapPin, Calendar, DollarSign, Clock, ArrowUpDown } from "lucide-react";

interface TripFilterBarProps {
  filters: TripFilters;
  onChange: (value: TripFilters) => void;
}

export function TripFilterBar({ filters, onChange }: TripFilterBarProps) {
  return (
    <div className="grid grid-cols-1 gap-5 border border-border/80 bg-card/95 backdrop-blur-md p-6 rounded-2xl shadow-xl shadow-black/[0.03] md:grid-cols-3 lg:grid-cols-6 transition-all duration-300">
      
      {/* Destination Field */}
      <div className="space-y-1.5">
        <label className="flex items-center gap-1.5 text-[10px] font-bold text-muted-foreground uppercase tracking-widest">
          <MapPin className="size-3 text-sky-500" />
          <span>Destination</span>
        </label>
        <div className="relative">
          <Input
            value={filters.query ?? ""}
            placeholder="Where to?"
            className="w-full h-10 text-xs bg-background/50 border-input/60 rounded-lg hover:border-input focus-visible:ring-2 focus-visible:ring-primary/20 focus-visible:border-primary transition-all pr-8"
            onChange={(event) => onChange({ ...filters, query: event.target.value })}
          />
        </div>
      </div>

      {/* Start Date Field */}
      <div className="space-y-1.5">
        <label className="flex items-center gap-1.5 text-[10px] font-bold text-muted-foreground uppercase tracking-widest">
          <Calendar className="size-3 text-emerald-500" />
          <span>Start Date</span>
        </label>
        <Input
          type="date"
          value={filters.startDate ?? ""}
          className="w-full h-10 text-xs bg-background/50 border-input/60 rounded-lg hover:border-input focus-visible:ring-2 focus-visible:ring-primary/20 focus-visible:border-primary transition-all"
          onChange={(event) => onChange({ ...filters, startDate: event.target.value })}
        />
      </div>

      {/* End Date Field */}
      <div className="space-y-1.5">
        <label className="flex items-center gap-1.5 text-[10px] font-bold text-muted-foreground uppercase tracking-widest">
          <Calendar className="size-3 text-purple-500" />
          <span>End Date</span>
        </label>
        <Input
          type="date"
          value={filters.endDate ?? ""}
          className="w-full h-10 text-xs bg-background/50 border-input/60 rounded-lg hover:border-input focus-visible:ring-2 focus-visible:ring-primary/20 focus-visible:border-primary transition-all"
          onChange={(event) => onChange({ ...filters, endDate: event.target.value })}
        />
      </div>

      {/* Max Price Field */}
      <div className="space-y-1.5">
        <label className="flex items-center gap-1.5 text-[10px] font-bold text-muted-foreground uppercase tracking-widest">
          <DollarSign className="size-3 text-amber-500" />
          <span>Max Budget</span>
        </label>
        <Input
          type="number"
          value={filters.maxPrice ?? ""}
          placeholder="e.g. 50000"
          className="w-full h-10 text-xs bg-background/50 border-input/60 rounded-lg hover:border-input focus-visible:ring-2 focus-visible:ring-primary/20 focus-visible:border-primary transition-all"
          onChange={(event) => onChange({ ...filters, maxPrice: Number(event.target.value) || undefined })}
        />
      </div>

      {/* Max Duration Field */}
      <div className="space-y-1.5">
        <label className="flex items-center gap-1.5 text-[10px] font-bold text-muted-foreground uppercase tracking-widest">
          <Clock className="size-3 text-indigo-500" />
          <span>Max Duration</span>
        </label>
        <Input
          type="number"
          value={filters.duration ?? ""}
          placeholder="Days..."
          className="w-full h-10 text-xs bg-background/50 border-input/60 rounded-lg hover:border-input focus-visible:ring-2 focus-visible:ring-primary/20 focus-visible:border-primary transition-all"
          onChange={(event) => onChange({ ...filters, duration: Number(event.target.value) || undefined })}
        />
      </div>

      {/* Sort By Dropdown */}
      <div className="space-y-1.5">
        <label className="flex items-center gap-1.5 text-[10px] font-bold text-muted-foreground uppercase tracking-widest">
          <ArrowUpDown className="size-3 text-rose-500" />
          <span>Sort By</span>
        </label>
        <div className="relative">
          <select
            value={filters.sortBy ?? ""}
            onChange={(event) => onChange({ ...filters, sortBy: event.target.value as TripFilters["sortBy"] })}
            className="h-10 w-full appearance-none rounded-lg border border-input/60 bg-background/50 px-3 pr-8 text-xs transition-all outline-none focus-visible:ring-2 focus-visible:ring-primary/20 focus-visible:border-primary hover:border-input cursor-pointer"
          >
            <option value="">Default Order</option>
            <option value="price-asc">Price: Low to High</option>
            <option value="price-desc">Price: High to Low</option>
            <option value="date-asc">Date: Earliest</option>
            <option value="date-desc">Date: Latest</option>
          </select>
          <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-2.5 text-muted-foreground/60">
            <ArrowUpDown className="size-3" />
          </div>
        </div>
      </div>

    </div>
  );
}


