"use client";

import { useState } from "react";
import { PageHeader } from "@/components/common/page-header";
import { StatusBadge } from "@/components/common/status-badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export default function OrganizerVerificationPage() {
  const [status, setStatus] = useState<"not submitted" | "pending" | "approved" | "rejected">("not submitted");

  return (
    <div className="space-y-6">
      <PageHeader title="Organizer Verification" description="Submit required documents to publish public trips." />

      <div className="flex items-center gap-2">
        <p className="text-sm">Current status:</p>
        <StatusBadge status={status} />
      </div>

      <section className="space-y-4 border border-border bg-card p-5">
        <h2 className="font-semibold">Verification Steps</h2>
        <ol className="list-inside list-decimal space-y-1 text-sm text-muted-foreground">
          <li>Submit legal identity details.</li>
          <li>Upload business or travel operator documents.</li>
          <li>Provide payout account summary details.</li>
        </ol>

        <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
          <Input placeholder="Legal full name" />
          <Input placeholder="Business or operator ID" />
          <Input type="file" />
          <Input type="file" />
        </div>

        <div className="flex gap-2">
          <Button onClick={() => setStatus("pending")}>Submit Verification</Button>
          <Button variant="outline">Save Draft</Button>
        </div>
      </section>
    </div>
  );
}
