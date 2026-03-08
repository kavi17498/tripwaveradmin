"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { Bell, Briefcase, Calendar, ClipboardList } from "lucide-react";
import { PageHeader } from "@/components/common/page-header";
import { SummaryCard } from "@/components/common/summary-card";
import { tripService } from "@/lib/services/tripService";
import { notificationService } from "@/lib/services/notificationService";
import { Button } from "@/components/ui/button";
import { Trip, Notification } from "@/lib/types";

export default function UserDashboardPage() {
  const [trips, setTrips] = useState<Trip[]>([]);
  const [notifications, setNotifications] = useState<Notification[]>([]);

  useEffect(() => {
    const load = async () => {
      const [tripRes, notificationRes] = await Promise.all([
        tripService.getMyTrips("u1"),
        notificationService.getNotifications("u1"),
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
        description="Overview of your upcoming trips, requests, and updates."
        actions={<Button asChild><Link href="/dashboard/create-trip">Create Trip</Link></Button>}
      />

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
        <SummaryCard title="Upcoming Trips" value={`${trips.filter((trip) => trip.status === "published").length}`} meta="Active plans" icon={<Calendar className="size-4" />} />
        <SummaryCard title="Pending Requests" value="4" meta="Awaiting approval" icon={<ClipboardList className="size-4" />} />
        <SummaryCard title="Notifications" value={`${notifications.filter((item) => !item.read).length}`} meta="Unread items" icon={<Bell className="size-4" />} />
        <SummaryCard title="Quick Actions" value="6" meta="Common tasks" icon={<Briefcase className="size-4" />} />
      </div>

      <section className="grid grid-cols-1 gap-4 xl:grid-cols-2">
        <article className="border border-border bg-card p-4">
          <h2 className="mb-3 font-semibold">Upcoming trips</h2>
          <div className="space-y-2">
            {trips.slice(0, 3).map((trip) => (
              <div key={trip.id} className="flex items-center justify-between border border-border p-3">
                <div>
                  <p className="font-medium">{trip.title}</p>
                  <p className="text-xs text-muted-foreground">{trip.startDate} • {trip.destination}</p>
                </div>
                <Button size="sm" variant="outline" asChild>
                  <Link href={`/trips/${trip.id}`}>View</Link>
                </Button>
              </div>
            ))}
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
