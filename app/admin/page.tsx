"use client";

import { useEffect } from "react";

import { StatusBadge } from "@/components/common/status-badge";
import { useAdminDataStore } from "@/lib/stores/useAdminDataStore";
import { formatFirestoreTimestamp } from "@/lib/utils";

export default function AdminPage() {
  const { users, tripsByStatus, fetchUsers, fetchTrips } = useAdminDataStore();

  useEffect(() => {
    void fetchUsers();
    void fetchTrips("pending");
    void fetchTrips("approved");
    void fetchTrips("rejected");
    void fetchTrips("draft");
  }, [fetchTrips, fetchUsers]);

  const allTrips = [...(tripsByStatus.pending ?? []), ...(tripsByStatus.approved ?? []), ...(tripsByStatus.rejected ?? []), ...(tripsByStatus.draft ?? [])];
  const pendingTrips = tripsByStatus.pending ?? [];
  const verifiedUsers = users.filter((user) => user.isVerified).length;
  const unverifiedUsers = users.length - verifiedUsers;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Admin Dashboard</h1>
        <p className="mt-1 text-sm text-muted-foreground">Platform-wide overview of users, trips, and verification activity.</p>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
        <article className="border border-border bg-card p-4">
          <p className="text-xs uppercase tracking-wide text-muted-foreground">Total Users</p>
          <p className="mt-2 text-2xl font-semibold">{users.length}</p>
        </article>
        <article className="border border-border bg-card p-4">
          <p className="text-xs uppercase tracking-wide text-muted-foreground">Pending Trips</p>
          <p className="mt-2 text-2xl font-semibold">{pendingTrips.length}</p>
        </article>
        <article className="border border-border bg-card p-4">
          <p className="text-xs uppercase tracking-wide text-muted-foreground">Verified Users</p>
          <p className="mt-2 text-2xl font-semibold">{verifiedUsers}</p>
        </article>
        <article className="border border-border bg-card p-4">
          <p className="text-xs uppercase tracking-wide text-muted-foreground">Draft Trips</p>
          <p className="mt-2 text-2xl font-semibold">{tripsByStatus.draft?.length ?? 0}</p>
        </article>
      </div>

      <section className="grid grid-cols-1 gap-4 xl:grid-cols-2">
        <article className="border border-border bg-card p-4">
          <h2 className="font-semibold">Recent Users</h2>
          <div className="mt-3 space-y-3 text-sm">
            {users.slice(0, 3).map((user) => (
              <div key={user.id} className="flex items-start justify-between gap-3 border border-border p-3">
                <div>
                  <p className="font-medium">{user.firstName} {user.lastName}</p>
                  <p className="text-xs text-muted-foreground">{user.email}</p>
                </div>
                <StatusBadge status={user.isVerified ? "active" : "pending"} />
              </div>
            ))}
          </div>
        </article>
        <article className="border border-border bg-card p-4">
          <h2 className="font-semibold">Recent Trips</h2>
          <div className="mt-3 space-y-3 text-sm">
            {allTrips.slice(0, 3).map((trip) => (
              <div key={trip.id} className="border border-border p-3">
                <div className="flex items-center justify-between gap-3">
                  <p className="font-medium">{trip.tripName}</p>
                  <StatusBadge status={trip.status} />
                </div>
                <p className="mt-1 text-xs text-muted-foreground">
                  {trip.startDate} to {trip.endDate} · {trip.startLocation}
                </p>
              </div>
            ))}
          </div>
        </article>
      </section>

      <section className="grid grid-cols-1 gap-4 xl:grid-cols-2">
        <article className="border border-border bg-card p-4">
          <h2 className="font-semibold">Latest User Sync</h2>
          <p className="mt-3 text-sm text-muted-foreground">
            {users.length ? `Last record created ${formatFirestoreTimestamp(users[0].createdAt)}` : "No users loaded yet."}
          </p>
        </article>
        <article className="border border-border bg-card p-4">
          <h2 className="font-semibold">Verification Queue</h2>
          <p className="mt-3 text-sm text-muted-foreground">{unverifiedUsers} users are currently unverified.</p>
        </article>
      </section>
    </div>
  );
}
