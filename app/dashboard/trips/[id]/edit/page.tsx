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
  const [title, setTitle] = useState("");
  const [destination, setDestination] = useState("");
  const [openCancel, setOpenCancel] = useState(false);

  useEffect(() => {
    const load = async () => {
      const result = await tripService.getTripById(id);
      if (!result.data) return;
      setTitle(result.data.title);
      setDestination(result.data.destination);
    };
    load();
  }, [id]);

  const update = async () => {
    await tripService.updateTrip(id, { title, destination });
  };

  return (
    <div className="space-y-6">
      <PageHeader title="Edit Trip" description="Update trip data and management settings." />
      <div className="space-y-4 border border-border bg-card p-5">
        <div>
          <label className="mb-1 block text-sm font-medium">Trip title</label>
          <Input value={title} onChange={(event) => setTitle(event.target.value)} />
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium">Destination</label>
          <Input value={destination} onChange={(event) => setDestination(event.target.value)} />
        </div>
        <div className="flex gap-2">
          <Button onClick={update}>Update Trip</Button>
          <Button variant="outline" onClick={() => router.back()}>Back</Button>
          <Button variant="destructive" onClick={() => setOpenCancel(true)}>Cancel Trip</Button>
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
