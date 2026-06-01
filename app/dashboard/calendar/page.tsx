"use client";

import { useEffect, useState, useMemo } from "react";
import Link from "next/link";
import { 
  ChevronLeft, 
  ChevronRight, 
  Calendar as CalendarIcon, 
  MapPin, 
  Users, 
  DollarSign, 
  CheckCircle,
  Clock,
  Sparkles,
  ArrowRight
} from "lucide-react";
import { PageHeader } from "@/components/common/page-header";
import { Button } from "@/components/ui/button";
import { tripApiService, type TripApiItem } from "@/lib/services/tripApiService";
import { userSessionService } from "@/lib/services/userSessionService";
import { formatCurrencyRs } from "@/lib/utils";

// Helper date utilities
const startOfDay = (date: Date) => new Date(date.getFullYear(), date.getMonth(), date.getDate());
const endOfDay = (date: Date) => new Date(date.getFullYear(), date.getMonth(), date.getDate(), 23, 59, 59, 999);

const isSameDay = (d1: Date, d2: Date) => {
  return d1.getFullYear() === d2.getFullYear() &&
         d1.getMonth() === d2.getMonth() &&
         d1.getDate() === d2.getDate();
};

export default function CalendarPage() {
  const [trips, setTrips] = useState<TripApiItem[]>([]);
  const [currentDate, setCurrentDate] = useState<Date>(new Date());
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string>("");

  useEffect(() => {
    const loadTrips = async () => {
      const token = userSessionService.getToken();
      if (!token) {
        setError("Please sign in to view your calendar.");
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError("");
        const response = await tripApiService.getMyTrips(token);
        setTrips(response.data);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load trips.");
      } finally {
        setLoading(false);
      }
    };

    loadTrips();
  }, []);

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  // Calendar Calculation Helpers
  const daysInMonth = useMemo(() => new Date(year, month + 1, 0).getDate(), [year, month]);
  const firstDayIndex = useMemo(() => new Date(year, month, 1).getDay(), [year, month]);

  const calendarDays = useMemo(() => {
    const days: (Date | null)[] = [];
    // Padding days from previous month
    for (let i = 0; i < firstDayIndex; i++) {
      days.push(null);
    }
    // Days of current month
    for (let day = 1; day <= daysInMonth; day++) {
      days.push(new Date(year, month, day));
    }
    return days;
  }, [year, month, daysInMonth, firstDayIndex]);

  // Checks if a date falls inside a trip's active dates
  const getTripsOnDate = (date: Date) => {
    return trips.filter((trip) => {
      const start = startOfDay(new Date(trip.startDate));
      const end = endOfDay(new Date(trip.endDate));
      const target = startOfDay(date);
      return target >= start && target <= end;
    });
  };

  // Navigations
  const prevMonth = () => {
    setCurrentDate(new Date(year, month - 1, 1));
  };

  const nextMonth = () => {
    setCurrentDate(new Date(year, month + 1, 1));
  };

  const jumpToToday = () => {
    const today = new Date();
    setCurrentDate(today);
    setSelectedDate(today);
  };

  // Selected date details
  const selectedDateTrips = useMemo(() => getTripsOnDate(selectedDate), [selectedDate, trips]);

  // Upcoming Trips feed
  const upcomingTrips = useMemo(() => {
    const todayStart = startOfDay(new Date());
    return trips
      .filter((trip) => startOfDay(new Date(trip.startDate)) >= todayStart)
      .sort((a, b) => new Date(a.startDate).getTime() - new Date(b.startDate).getTime())
      .slice(0, 4);
  }, [trips]);

  const monthLabel = currentDate.toLocaleString("default", { month: "long" });

  const getStatusColorClass = (status?: string) => {
    switch (status?.toLowerCase()) {
      case "approved":
        return "bg-emerald-500/10 text-emerald-700 border-emerald-500/20 dark:text-emerald-400";
      case "pending":
        return "bg-amber-500/10 text-amber-700 border-amber-500/20 dark:text-amber-400";
      case "in review":
        return "bg-blue-500/10 text-blue-700 border-blue-500/20 dark:text-blue-400";
      default:
        return "bg-zinc-500/10 text-zinc-700 border-zinc-500/20 dark:text-zinc-400";
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Schedule Calendar"
        description="Monitor your active trips, departure timelines, and upcoming tour itineraries."
        actions={
          <Button onClick={jumpToToday} variant="outline" size="sm" className="font-bold cursor-pointer">
            Jump to Today
          </Button>
        }
      />

      {loading ? (
        <div className="flex h-64 items-center justify-center rounded-xl border border-border bg-card">
          <p className="text-sm text-muted-foreground animate-pulse">Loading schedule calendar...</p>
        </div>
      ) : error ? (
        <div className="flex h-64 items-center justify-center rounded-xl border border-border bg-card">
          <p className="text-sm text-destructive font-semibold">{error}</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 items-start">
          
          {/* Main Monthly Calendar Grid (lg:col-span-3) */}
          <div className="lg:col-span-3 border border-border bg-card rounded-2xl p-5 shadow-sm space-y-4">
            
            {/* Header Control Panel */}
            <div className="flex items-center justify-between pb-2 border-b border-border">
              <div className="flex items-center gap-2">
                <CalendarIcon className="size-5 text-primary" />
                <h2 className="text-lg font-black text-foreground">
                  {monthLabel} <span className="text-muted-foreground font-normal">{year}</span>
                </h2>
              </div>
              <div className="flex items-center gap-1">
                <Button onClick={prevMonth} variant="ghost" size="icon" className="h-8 w-8 cursor-pointer">
                  <ChevronLeft className="size-4" />
                </Button>
                <Button onClick={nextMonth} variant="ghost" size="icon" className="h-8 w-8 cursor-pointer">
                  <ChevronRight className="size-4" />
                </Button>
              </div>
            </div>

            {/* Weekday Labels */}
            <div className="grid grid-cols-7 gap-1 text-center font-bold text-xs text-muted-foreground uppercase tracking-wider py-1">
              {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((day) => (
                <div key={day} className="py-1">
                  {day}
                </div>
              ))}
            </div>

            {/* Monthly Calendar Grid */}
            <div className="grid grid-cols-7 gap-1.5 auto-rows-[70px] md:auto-rows-[80px]">
              {calendarDays.map((day, idx) => {
                if (!day) {
                  return (
                    <div 
                      key={`empty-${idx}`} 
                      className="bg-muted/10 border border-border/20 rounded-xl"
                    />
                  );
                }

                const dayTrips = getTripsOnDate(day);
                const today = new Date();
                const isTodayDay = isSameDay(day, today);
                const isSelected = isSameDay(day, selectedDate);

                return (
                  <div
                    key={day.getTime()}
                    onClick={() => setSelectedDate(day)}
                    className={`relative flex flex-col p-2 border rounded-xl cursor-pointer hover:border-primary/50 transition-all select-none overflow-hidden ${
                      isSelected 
                        ? "border-primary bg-primary/5 ring-1 ring-primary/30" 
                        : isTodayDay
                          ? "border-emerald-500 bg-emerald-500/5"
                          : "border-border bg-card"
                    }`}
                  >
                    {/* Day Number Label */}
                    <span className={`text-xs font-black self-end ${
                      isSelected
                        ? "text-primary"
                        : isTodayDay
                          ? "text-emerald-600 dark:text-emerald-400"
                          : "text-muted-foreground"
                    }`}>
                      {day.getDate()}
                    </span>

                    {/* Day Indicators */}
                    <div className="flex-1 mt-1 overflow-y-auto space-y-1 scrollbar-thin">
                      {dayTrips.slice(0, 2).map((trip) => {
                        const isStart = isSameDay(day, new Date(trip.startDate));
                        return (
                          <div 
                            key={trip.id} 
                            className={`text-[9px] font-bold px-1.5 py-0.5 rounded-md border truncate ${getStatusColorClass(trip.status)}`}
                            title={`${trip.tripName} (${trip.status})`}
                          >
                            {isStart && "🛫 "}
                            {trip.tripName}
                          </div>
                        );
                      })}
                      {dayTrips.length > 2 && (
                        <div className="text-[8px] font-black text-center text-muted-foreground uppercase tracking-widest pt-0.5">
                          + {dayTrips.length - 2} more
                        </div>
                      )}
                    </div>

                    {/* Today Glow Dot */}
                    {isTodayDay && (
                      <span className="absolute bottom-1 right-1 flex h-1.5 w-1.5">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-emerald-500"></span>
                      </span>
                    )}
                  </div>
                );
              })}
            </div>

          </div>

          {/* Sidebar panel (Selected Day Detail & Upcoming Operations) (lg:col-span-1) */}
          <div className="space-y-6">
            
            {/* Selected Date departures details card */}
            <div className="border border-border bg-card rounded-2xl p-5 shadow-sm space-y-4">
              <div>
                <span className="text-[10px] font-extrabold text-primary uppercase tracking-widest block">
                  Daily Departures
                </span>
                <h3 className="text-base font-black text-foreground flex items-center gap-1.5">
                  {selectedDate.toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric", year: "numeric" })}
                </h3>
              </div>

              <div className="space-y-3.5 max-h-[250px] overflow-y-auto pr-1">
                {selectedDateTrips.length > 0 ? (
                  selectedDateTrips.map((trip) => (
                    <div key={trip.id} className="border border-border rounded-xl p-3 bg-muted/20 hover:bg-muted/40 transition-colors">
                      <div className="flex items-center justify-between gap-2 pb-2 border-b border-border/60 mb-2">
                        <span className="font-extrabold text-xs text-foreground truncate block">
                          {trip.tripName}
                        </span>
                        <span className={`text-[9px] font-bold px-2 py-0.5 border rounded-full capitalize shrink-0 ${getStatusColorClass(trip.status)}`}>
                          {trip.status}
                        </span>
                      </div>
                      
                      <div className="space-y-1.5 text-xs text-muted-foreground font-semibold">
                        <div className="flex items-center gap-1.5">
                          <MapPin className="size-3 text-primary shrink-0" />
                          <span>{trip.destinations[0]?.name ?? trip.startLocation ?? "Destination"}</span>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <Users className="size-3 shrink-0" />
                          <span>{(trip.participants || []).length} / {trip.maxParticipants || 15} Booked</span>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <DollarSign className="size-3 shrink-0" />
                          <span>{formatCurrencyRs(trip.price)}</span>
                        </div>
                      </div>

                      <div className="mt-3 flex items-center justify-end">
                        <Button size="sm" variant="outline" className="h-7 text-xs font-bold gap-1 cursor-pointer" asChild>
                          <Link href={`/trips/${trip.id}`}>
                            View Details <ArrowRight className="size-3" />
                          </Link>
                        </Button>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="py-6 text-center border border-dashed border-border rounded-xl">
                    <p className="text-xs text-muted-foreground font-medium italic">No active trips scheduled for this date.</p>
                  </div>
                )}
              </div>
            </div>

            {/* Upcoming departures feed */}
            <div className="border border-border bg-card rounded-2xl p-5 shadow-sm space-y-4">
              <div>
                <span className="text-[10px] font-extrabold text-emerald-500 uppercase tracking-widest block">
                  Timeline Overview
                </span>
                <h3 className="text-base font-black text-foreground flex items-center gap-1.5">
                  <Clock className="size-4.5 text-emerald-500" /> Upcoming Operations
                </h3>
              </div>

              <div className="space-y-3">
                {upcomingTrips.length > 0 ? (
                  upcomingTrips.map((trip) => {
                    const start = new Date(trip.startDate);
                    return (
                      <div key={trip.id} className="flex items-center justify-between gap-3 border-b border-border/40 pb-3 last:border-0 last:pb-0">
                        <div className="min-w-0">
                          <p className="font-extrabold text-xs text-foreground truncate">{trip.tripName}</p>
                          <p className="text-[10px] font-bold text-muted-foreground">
                            {start.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                          </p>
                        </div>
                        <Button size="sm" variant="ghost" className="h-7 text-xs font-extrabold text-primary hover:text-primary hover:bg-primary/5 cursor-pointer shrink-0" asChild>
                          <Link href={`/trips/${trip.id}`}>
                            View
                          </Link>
                        </Button>
                      </div>
                    );
                  })
                ) : (
                  <p className="text-xs text-muted-foreground font-medium italic py-2 text-center">No upcoming departures configured.</p>
                )}
              </div>
            </div>

          </div>

        </div>
      )}
    </div>
  );
}
