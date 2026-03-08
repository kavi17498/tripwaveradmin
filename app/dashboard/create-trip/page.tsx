"use client";

import { FormEvent, useState } from "react";
import { PageHeader } from "@/components/common/page-header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/components/feedback/toast-provider";
import { tripService } from "@/lib/services/tripService";

export default function CreateTripPage() {
  const { pushToast } = useToast();
  const [title, setTitle] = useState("");
  const [destination, setDestination] = useState("");
  const [description, setDescription] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [price, setPrice] = useState("");
  const [capacity, setCapacity] = useState("");
  const [tripType, setTripType] = useState<"public" | "private">("public");
  const [errors, setErrors] = useState<string[]>([]);

  const validate = () => {
    const issues: string[] = [];
    if (!title.trim()) issues.push("Title is required.");
    if (!destination.trim()) issues.push("Destination is required.");
    if (!startDate || !endDate) issues.push("Start and end dates are required.");
    if (Number(price) <= 0) issues.push("Price must be greater than 0.");
    if (Number(capacity) <= 0) issues.push("Capacity must be greater than 0.");
    setErrors(issues);
    return issues.length === 0;
  };

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    if (!validate()) return;

    await tripService.createTrip({
      title,
      destination,
      description,
      startDate,
      endDate,
      price: Number(price),
      capacity: Number(capacity),
      tripType,
      status: "draft",
      durationDays: 5,
      coverImage: "https://images.unsplash.com/photo-1452421822248-d4c2b47f0c81?q=80&w=1800&auto=format&fit=crop",
      organizerId: "u2",
      organizerName: "Ethan Cole",
      organizerRating: 4.7,
      location: { city: destination, country: "TBD", lat: 0, lng: 0 },
      included: [],
      excluded: [],
      itinerary: [],
    });

    pushToast({ type: "success", title: "Trip saved", description: "Trip draft has been created." });
  };

  return (
    <div className="space-y-6">
      <PageHeader title="Create Trip" description="Build your trip details. Save as draft or publish later." />

      <form onSubmit={submit} className="space-y-4 border border-border bg-card p-5">
        <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
          <div>
            <label className="mb-1 block text-sm font-medium">Title</label>
            <Input value={title} onChange={(event) => setTitle(event.target.value)} />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium">Destination</label>
            <Input value={destination} onChange={(event) => setDestination(event.target.value)} />
          </div>
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium">Description</label>
          <textarea value={description} onChange={(event) => setDescription(event.target.value)} className="min-h-24 w-full border border-input bg-background px-3 py-2 text-sm" />
        </div>

        <div className="grid grid-cols-1 gap-3 md:grid-cols-4">
          <Input type="date" value={startDate} onChange={(event) => setStartDate(event.target.value)} />
          <Input type="date" value={endDate} onChange={(event) => setEndDate(event.target.value)} />
          <Input type="number" placeholder="Price" value={price} onChange={(event) => setPrice(event.target.value)} />
          <Input type="number" placeholder="Capacity" value={capacity} onChange={(event) => setCapacity(event.target.value)} />
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium">Trip Type</label>
          <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
            <label className="border border-border p-3 text-sm">
              <input type="radio" name="tripType" checked={tripType === "public"} onChange={() => setTripType("public")} className="mr-2" />
              Public Trip
              <p className="mt-1 text-xs text-muted-foreground">Requires organizer verification before publishing.</p>
            </label>
            <label className="border border-border p-3 text-sm">
              <input type="radio" name="tripType" checked={tripType === "private"} onChange={() => setTripType("private")} className="mr-2" />
              Private Trip
              <p className="mt-1 text-xs text-muted-foreground">Invite-link management available after save.</p>
            </label>
          </div>
        </div>

        {errors.length > 0 ? (
          <div className="border border-destructive/30 bg-destructive/5 p-3 text-sm text-destructive">
            {errors.map((error) => <p key={error}>{error}</p>)}
          </div>
        ) : null}

        <div className="flex gap-2">
          <Button type="submit">Save Draft</Button>
          <Button type="button" variant="outline">Save and Continue</Button>
        </div>
      </form>
    </div>
  );
}
