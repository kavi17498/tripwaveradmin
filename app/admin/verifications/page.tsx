"use client";

import { useState } from "react";
import { Modal } from "@/components/common/modal";
import { StatusBadge } from "@/components/common/status-badge";
import { Button } from "@/components/ui/button";
import { mockUsers } from "@/lib/data/users";

export default function AdminVerificationsPage() {
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);

  const requests = mockUsers.filter((user) => user.role === "organizer");

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Organizer Verification Management</h1>
        <p className="mt-1 text-sm text-muted-foreground">Review verification documents and approve or reject requests.</p>
      </div>

      <div className="space-y-2">
        {requests.map((request) => (
          <article key={request.id} className="flex flex-col gap-3 border border-border bg-card p-4 md:flex-row md:items-center md:justify-between">
            <div>
              <p className="font-medium">{request.name}</p>
              <p className="text-sm text-muted-foreground">{request.email}</p>
            </div>
            <div className="flex items-center gap-2">
              <StatusBadge status={request.status} />
              <Button variant="outline" size="sm" onClick={() => setSelectedUserId(request.id)}>View documents</Button>
              <Button size="sm">Approve</Button>
              <Button size="sm" variant="destructive">Reject</Button>
            </div>
          </article>
        ))}
      </div>

      <Modal
        open={Boolean(selectedUserId)}
        title="Submitted Documents"
        description="Mock document preview for organizer verification request."
        onClose={() => setSelectedUserId(null)}
      >
        <div className="space-y-2 text-sm text-muted-foreground">
          <p>Identity document: uploaded</p>
          <p>Business registration: uploaded</p>
          <p>Payout details: submitted</p>
        </div>
      </Modal>
    </div>
  );
}
