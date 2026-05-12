"use client";

import { useEffect, useMemo } from "react";
import { StatusBadge } from "@/components/common/status-badge";
import { Button } from "@/components/ui/button";
import { useAdminDataStore } from "@/lib/stores/useAdminDataStore";
import { formatFirestoreTimestamp } from "@/lib/utils";

export default function AdminVerificationsPage() {
  const { users, fetchUsers } = useAdminDataStore();

  useEffect(() => {
    void fetchUsers();
  }, [fetchUsers]);

  const requests = useMemo(() => users.filter((user) => !user.isVerified), [users]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">User Verification Management</h1>
        <p className="mt-1 text-sm text-muted-foreground">Review unverified user records loaded from the API.</p>
      </div>

      <div className="space-y-2">
        {requests.map((request) => (
          <article key={request.id} className="flex flex-col gap-3 border border-border bg-card p-4 md:flex-row md:items-center md:justify-between">
            <div>
              <p className="font-medium">{request.firstName} {request.lastName}</p>
              <p className="text-sm text-muted-foreground">{request.email}</p>
              <p className="text-xs text-muted-foreground">Joined {formatFirestoreTimestamp(request.createdAt)}</p>
            </div>
            <div className="flex items-center gap-2">
              <StatusBadge status={request.isVerified ? "active" : "pending"} />
              <Button variant="outline" size="sm" disabled>View details</Button>
              <Button size="sm" disabled>Approve</Button>
              <Button size="sm" variant="destructive" disabled>Reject</Button>
            </div>
          </article>
        ))}
      </div>
      {!requests.length ? <p className="text-sm text-muted-foreground">No unverified users found.</p> : null}
    </div>
  );
}
