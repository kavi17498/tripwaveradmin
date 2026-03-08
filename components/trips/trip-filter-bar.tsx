import { Input } from "@/components/ui/input";
import { TripFilters } from "@/lib/types";

interface TripFilterBarProps {
  filters: TripFilters;
  onChange: (value: TripFilters) => void;
}

export function TripFilterBar({ filters, onChange }: TripFilterBarProps) {
  return (
    <div className="grid grid-cols-1 gap-3 border border-border bg-card p-4 md:grid-cols-2 xl:grid-cols-6">
      <Input
        value={filters.query ?? ""}
        placeholder="Destination"
        onChange={(event) => onChange({ ...filters, query: event.target.value })}
      />
      <Input
        type="date"
        value={filters.startDate ?? ""}
        onChange={(event) => onChange({ ...filters, startDate: event.target.value })}
      />
      <Input
        type="date"
        value={filters.endDate ?? ""}
        onChange={(event) => onChange({ ...filters, endDate: event.target.value })}
      />
      <Input
        type="number"
        value={filters.maxPrice ?? ""}
        placeholder="Max price"
        onChange={(event) => onChange({ ...filters, maxPrice: Number(event.target.value) || undefined })}
      />
      <Input
        type="number"
        value={filters.duration ?? ""}
        placeholder="Max duration"
        onChange={(event) => onChange({ ...filters, duration: Number(event.target.value) || undefined })}
      />
      <select
        value={filters.sortBy ?? ""}
        onChange={(event) => onChange({ ...filters, sortBy: event.target.value as TripFilters["sortBy"] })}
        className="h-9 border border-input bg-background px-3 text-sm"
      >
        <option value="">Sort</option>
        <option value="price-asc">Price: Low to high</option>
        <option value="price-desc">Price: High to low</option>
        <option value="date-asc">Date: Earliest</option>
        <option value="date-desc">Date: Latest</option>
      </select>
    </div>
  );
}
