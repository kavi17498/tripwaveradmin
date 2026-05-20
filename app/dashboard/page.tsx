"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { Bell, Calendar, CheckCircle2, ListTodo, TriangleAlert, CalendarDays, Clock3 } from "lucide-react";
import { PageHeader } from "@/components/common/page-header";
import { SummaryCard } from "@/components/common/summary-card";
import { tripApiService, type TripApiItem } from "@/lib/services/tripApiService";
import { notificationService } from "@/lib/services/notificationService";
import { Button } from "@/components/ui/button";
import { Notification } from "@/lib/types";
import { userSessionService } from "@/lib/services/userSessionService";

const startOfDay = (date: Date) => new Date(date.getFullYear(), date.getMonth(), date.getDate());
const endOfDay = (date: Date) => new Date(date.getFullYear(), date.getMonth(), date.getDate(), 23, 59, 59, 999);

const isSameDay = (dateString: string, reference: Date) => {
  const parsed = new Date(dateString);
  if (Number.isNaN(parsed.getTime())) return false;

  return parsed >= startOfDay(reference) && parsed <= endOfDay(reference);
};

const isAfterToday = (dateString: string, reference: Date) => {
  const parsed = new Date(dateString);
  if (Number.isNaN(parsed.getTime())) return false;

  return parsed > endOfDay(reference);
};

const isExpired = (trip: TripApiItem, reference: Date) => {
  const parsed = new Date(`${trip.endDate}T23:59:59.999`);
  if (Number.isNaN(parsed.getTime())) return false;

  return parsed < startOfDay(reference);
};

const isApproved = (trip: TripApiItem) => trip.status === "approved";
const isPending = (trip: TripApiItem) => trip.status === "pending";
const isInReview = (trip: TripApiItem) => trip.status === "in review";
const getDestination = (trip: TripApiItem) => trip.destinations[0]?.name ?? trip.startLocation ?? "Unknown destination";
const getTripTitle = (trip: TripApiItem) => trip.tripName ?? "Untitled trip";

export default function UserDashboardPage() {
  const [trips, setTrips] = useState<TripApiItem[]>([]);
  const [notifications, setNotifications] = useState<Notification[]>([]);

  const today = new Date();
  const expiredTrips = trips.filter((trip) => isExpired(trip, today));
  const activeTrips = trips.filter((trip) => !isExpired(trip, today));
  const todaysTrips = activeTrips.filter((trip) => isSameDay(trip.startDate, today));
  const upcomingTrips = activeTrips.filter((trip) => isAfterToday(trip.startDate, today));
  const approvedTrips = trips.filter((trip) => isApproved(trip) && !isExpired(trip, today));
  const pendingTrips = trips.filter((trip) => isPending(trip) && !isExpired(trip, today));
  const inReviewTrips = trips.filter((trip) => isInReview(trip) && !isExpired(trip, today));

  useEffect(() => {
    const load = async () => {
      const token = userSessionService.getToken();
      const profile = userSessionService.getUserProfile<{ id?: string }>();

      if (!token) {
        setTrips([]);
        setNotifications([]);
        return;
      }

      const [tripRes, notificationRes] = await Promise.all([
        tripApiService.getMyTrips(token),
        profile?.id ? notificationService.getNotifications(profile.id) : Promise.resolve({ data: [] as Notification[] }),
      ]);

      setTrips(tripRes.data);
      setNotifications(notificationRes.data);
    };
    load();
  }, []);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Dashboard"
        description="Overview of your trips, approvals, pending work, and expired plans."
        actions={<Button asChild><Link href="/dashboard/create-trip">Create Trip</Link></Button>}
      />

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-5">
        <SummaryCard title="Today’s Trips" value={`${todaysTrips.length}`} meta="Starting today" icon={<CalendarDays className="size-4" />} />
        <SummaryCard title="Upcoming Trips" value={`${upcomingTrips.length}`} meta="Future departures" icon={<Calendar className="size-4" />} />
        <SummaryCard title="Approved Trips" value={`${approvedTrips.length}`} meta="Ready to share" icon={<CheckCircle2 className="size-4" />} />
        <SummaryCard title="Pending Trips" value={`${pendingTrips.length}`} meta="Still in draft" icon={<ListTodo className="size-4" />} />
        <SummaryCard title="Expired Trips" value={`${expiredTrips.length}`} meta="Past end date" icon={<TriangleAlert className="size-4" />} />
      </div>

      <section className="grid grid-cols-1 gap-4 xl:grid-cols-2">
        <article className="border border-border bg-card p-4">
          <h2 className="mb-3 font-semibold">Today’s trips</h2>
          <div className="space-y-2">
            {todaysTrips.length > 0 ? (
              todaysTrips.slice(0, 3).map((trip) => (
                <div key={trip.id} className="flex items-center justify-between border border-border p-3">
                  <div>
                    <p className="font-medium">{getTripTitle(trip)}</p>
                    <p className="text-xs text-muted-foreground">{trip.startDate} • {getDestination(trip)}</p>
                  </div>
                  <Button size="sm" variant="outline" asChild>
                    <Link href={`/trips/${trip.id}`}>View</Link>
                  </Button>
                </div>
              ))
            ) : (
              <p className="text-sm text-muted-foreground">No trips are starting today.</p>
            )}
          </div>
        </article>

        <article className="border border-border bg-card p-4">
          <h2 className="mb-3 font-semibold">Upcoming trips</h2>
          <div className="space-y-2">
            {upcomingTrips.length > 0 ? (
              upcomingTrips.slice(0, 3).map((trip) => (
                <div key={trip.id} className="flex items-center justify-between border border-border p-3">
                  <div>
                    <p className="font-medium">{getTripTitle(trip)}</p>
                    <p className="text-xs text-muted-foreground">{trip.startDate} • {getDestination(trip)}</p>
                  </div>
                  <Button size="sm" variant="outline" asChild>
                    <Link href={`/trips/${trip.id}`}>View</Link>
                  </Button>
                </div>
              ))
            ) : (
              <p className="text-sm text-muted-foreground">No upcoming trips found.</p>
            )}
          </div>
        </article>

        <article className="border border-border bg-card p-4">
          <h2 className="mb-3 font-semibold">Approved trips</h2>
          <div className="space-y-2">
            {approvedTrips.length > 0 ? (
              approvedTrips.slice(0, 3).map((trip) => (
                <div key={trip.id} className="flex items-center justify-between border border-border p-3">
                  <div>
                    <p className="font-medium">{getTripTitle(trip)}</p>
                    <p className="text-xs text-muted-foreground">{trip.status} • {getDestination(trip)}</p>
                  </div>
                  <Button size="sm" variant="outline" asChild>
                    <Link href={`/trips/${trip.id}`}>View</Link>
                  </Button>
                </div>
              ))
            ) : (
              <p className="text-sm text-muted-foreground">No approved trips yet.</p>
            )}
          </div>
        </article>

        <article className="border border-border bg-card p-4">
          <h2 className="mb-3 font-semibold">Pending trips</h2>
          <div className="space-y-2">
            {pendingTrips.length > 0 ? (
              pendingTrips.slice(0, 3).map((trip) => (
                <div key={trip.id} className="flex items-center justify-between border border-border p-3">
                  <div>
                    <p className="font-medium">{getTripTitle(trip)}</p>
                    <p className="text-xs text-muted-foreground">{trip.status} • {getDestination(trip)}</p>
                  </div>
                  <Button size="sm" variant="outline" asChild>
                    <Link href={`/dashboard/trips/${trip.id}/edit`}>Edit</Link>
                  </Button>
                </div>
              ))
            ) : (
              <p className="text-sm text-muted-foreground">No pending trips found.</p>
            )}
          </div>
        </article>

        <article className="border border-border bg-card p-4">
          <h2 className="mb-3 font-semibold">In review trips</h2>
          <div className="space-y-2">
            {inReviewTrips.length > 0 ? (
              inReviewTrips.slice(0, 3).map((trip) => (
                <div key={trip.id} className="flex items-center justify-between border border-border p-3">
                  <div>
                    <p className="font-medium">{getTripTitle(trip)}</p>
                    <p className="text-xs text-muted-foreground">{trip.status} • {getDestination(trip)}</p>
                  </div>
                  <Button size="sm" variant="outline" asChild>
                    <Link href={`/dashboard/trips/${trip.id}/edit`}>View</Link>
                  </Button>
                </div>
              ))
            ) : (
              <p className="text-sm text-muted-foreground">No trips currently in review.</p>
            )}
          </div>
        </article>

        <article className="border border-border bg-card p-4 xl:col-span-2">
          <h2 className="mb-3 font-semibold">Expired trips</h2>
          <div className="space-y-2">
            {expiredTrips.length > 0 ? (
              expiredTrips.slice(0, 3).map((trip) => (
                <div key={trip.id} className="flex items-center justify-between border border-border p-3">
                  <div>
                    <p className="font-medium">{getTripTitle(trip)}</p>
                    <p className="text-xs text-muted-foreground">Ended on {trip.endDate} • {getDestination(trip)}</p>
                  </div>
                  <Button size="sm" variant="outline" asChild>
                    <Link href={`/trips/${trip.id}`}>View</Link>
                  </Button>
                </div>
              ))
            ) : (
              <p className="text-sm text-muted-foreground">No expired trips found.</p>
            )}
          </div>
        </article>

        <article className="border border-border bg-card p-4">
          <h2 className="mb-3 font-semibold">Notifications preview</h2>
          <div className="space-y-2">
            {notifications.slice(0, 3).map((notification) => (
              <div key={notification.id} className="border border-border p-3 text-sm">
                <p className="font-medium">{notification.title}</p>
                <p className="text-muted-foreground">{notification.description}</p>
              </div>
            ))}
          </div>
        </article>
      </section>
    </div>
  );
}
