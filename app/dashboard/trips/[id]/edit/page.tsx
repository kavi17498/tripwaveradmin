"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { PageHeader } from "@/components/common/page-header";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Modal } from "@/components/common/modal";
import { tripService } from "@/lib/services/tripService";

export default function TripEditPage() {
  const router = useRouter();
  const { id } = useParams<{ id: string }>();
  const [openCancel, setOpenCancel] = useState(false);

  useEffect(() => {
    // Redirect to the Create Trip page in edit mode so users see the full create/edit UI
    if (id) {
      router.push(`/dashboard/create-trip?mode=edit&id=${encodeURIComponent(id)}`);
    }
  }, [id, router]);

  return (
    <div className="space-y-6">
      <PageHeader title="Redirecting to edit" description="Opening the full edit form..." />
      <div className="space-y-4 border border-border bg-card p-5">
        <p className="text-sm text-muted-foreground">Opening the edit form for trip id: {id}</p>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => router.back()}>
            Back
          </Button>
        </div>
      </div>
      <Modal
        open={openCancel}
        title="Cancel this trip?"
        description="This action changes trip status to cancelled and notifies participants."
        onClose={() => setOpenCancel(false)}
        onConfirm={() => setOpenCancel(false)}
        confirmText="Confirm cancel"
      />
    </div>
  );
}
