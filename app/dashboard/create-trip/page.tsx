"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import { PageHeader } from "@/components/common/page-header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/components/feedback/toast-provider";
import {
  CreateTripApiPayload,
  TripDestinationPayload,
  TripItineraryDayPayload,
  TripParticipantPayload,
} from "@/lib/types";
import { tripApiService } from "@/lib/services/tripApiService";
import { userSessionService } from "@/lib/services/userSessionService";
import LocationPicker from "@/components/common/locationpicker";

type TripCategory = CreateTripApiPayload["tripCategory"];

type DestinationFormItem = {
  name: string;
  description: string;
  latitude: string;
  longitude: string;
  photosEditor: string;
};

type ItineraryFormItem = {
  title: string;
  startTime: string;
  endTime: string;
  activitiesEditor: string;
};

type ParticipantFormItem = {
  name: string;
  address: string;
  phone: string;
  email: string;
};

type StoredUserProfile = {
  id?: string;
  name?: string;
  firstName?: string;
  lastName?: string;
};

const categories: TripCategory[] = ["Travel with Guide", "Join Group Trip", "Family Trip with Guide", "Private trip"];

const emptyDestination = (): DestinationFormItem => ({
  name: "",
  description: "",
  latitude: "",
  longitude: "",
  photosEditor: "",
});

const emptyItineraryDay = (): ItineraryFormItem => ({
  title: "",
  startTime: "08:00",
  endTime: "10:00",
  activitiesEditor: "",
});

const emptyParticipant = (): ParticipantFormItem => ({
  name: "",
  address: "",
  phone: "",
  email: "",
});

const toLines = (value: string) =>
  value
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean);

const to12Hour = (time24: string) => {
  const [hourString, minute] = time24.split(":");
  const hour = Number(hourString);
  if (!Number.isFinite(hour) || !minute) return time24;

  const suffix = hour >= 12 ? "PM" : "AM";
  const hour12 = hour % 12 === 0 ? 12 : hour % 12;
  return `${String(hour12).padStart(2, "0")}:${minute} ${suffix}`;
};

const getOrganizerName = (profile: StoredUserProfile | null) => {
  if (!profile) return "Organizer";

  const fullName = `${profile.firstName ?? ""} ${profile.lastName ?? ""}`.trim();
  if (fullName) return fullName;

  return profile.name || "Organizer";
};

export default function CreateTripPage() {
  const { pushToast } = useToast();

  const [tripName, setTripName] = useState("");
  const [tripCategory, setTripCategory] = useState<TripCategory>("Travel with Guide");
  const [canSelectTravelWithGuide, setCanSelectTravelWithGuide] = useState(false);
  const [description, setDescription] = useState("");

  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [startLocation, setStartLocation] = useState("");

  const [destinations, setDestinations] = useState<DestinationFormItem[]>([emptyDestination()]);
  const [itinerary, setItinerary] = useState<ItineraryFormItem[]>([emptyItineraryDay()]);
  const [participants, setParticipants] = useState<ParticipantFormItem[]>([emptyParticipant()]);

  const [hotelFacilitiesEditor, setHotelFacilitiesEditor] = useState("");
  const [transportFacilitiesEditor, setTransportFacilitiesEditor] = useState("");
  const [otherInclusionsEditor, setOtherInclusionsEditor] = useState("");
  const [exclusionsEditor, setExclusionsEditor] = useState("");

  const [tripPhotosEditor, setTripPhotosEditor] = useState("");

  const [price, setPrice] = useState("");
  const [maxParticipants, setMaxParticipants] = useState("");

  const [organizerId, setOrganizerId] = useState("");
  const [organizerName, setOrganizerName] = useState("Organizer");

  const [errors, setErrors] = useState<string[]>([]);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const profile = userSessionService.getUserProfile<StoredUserProfile>();
    if (!profile) return;

    if (profile.id) {
      setOrganizerId(profile.id);
    }

    setOrganizerName(getOrganizerName(profile));
  }, []);

  useEffect(() => {
    const role = userSessionService.getRole();
    const isGuide = role === "guide";
    setCanSelectTravelWithGuide(isGuide);

    if (!isGuide) {
      setTripCategory((current) => (current === "Travel with Guide" ? "Join Group Trip" : current));
    }
  }, []);

  const mapQuery = useMemo(() => {
    const names = destinations.map((destination) => destination.name.trim()).filter(Boolean);
    return names.length ? names.join(" | ") : "Sri Lanka";
  }, [destinations]);

  const updateDestination = (index: number, key: keyof DestinationFormItem, value: string) => {
    setDestinations((prev) => prev.map((destination, currentIndex) => (currentIndex === index ? { ...destination, [key]: value } : destination)));
  };

  const addDestination = () => {
    setDestinations((prev) => [...prev, emptyDestination()]);
  };

  const removeDestination = (index: number) => {
    if (destinations.length === 1) return;
    setDestinations((prev) => prev.filter((_, currentIndex) => currentIndex !== index));
  };

  const updateItinerary = (index: number, key: keyof ItineraryFormItem, value: string) => {
    setItinerary((prev) => prev.map((item, currentIndex) => (currentIndex === index ? { ...item, [key]: value } : item)));
  };

  const addItineraryDay = () => {
    setItinerary((prev) => [...prev, emptyItineraryDay()]);
  };

  const removeItineraryDay = (index: number) => {
    if (itinerary.length === 1) return;
    setItinerary((prev) => prev.filter((_, currentIndex) => currentIndex !== index));
  };

  const updateParticipant = (index: number, key: keyof ParticipantFormItem, value: string) => {
    setParticipants((prev) => prev.map((item, currentIndex) => (currentIndex === index ? { ...item, [key]: value } : item)));
  };

  const addParticipant = () => {
    setParticipants((prev) => [...prev, emptyParticipant()]);
  };

  const removeParticipant = (index: number) => {
    if (participants.length === 1) return;
    setParticipants((prev) => prev.filter((_, currentIndex) => currentIndex !== index));
  };

  const validate = () => {
    const issues: string[] = [];

    if (!tripName.trim()) issues.push("Trip name is required.");
    if (!startDate || !endDate) issues.push("Start date and end date are required.");
    if (!startLocation.trim()) issues.push("Start location is required.");
    if (!organizerId.trim()) issues.push("Organizer id (user id) is required.");
    if (Number(price) <= 0) issues.push("Price must be greater than 0.");
    if (Number(maxParticipants) <= 0) issues.push("Max participants must be greater than 0.");

    const hasInvalidDestination = destinations.some((destination) => {
      if (!destination.name.trim() || !destination.description.trim()) return true;
      if (!destination.latitude.trim() || !destination.longitude.trim()) return true;
      if (Number.isNaN(Number(destination.latitude)) || Number.isNaN(Number(destination.longitude))) return true;
      return toLines(destination.photosEditor).length === 0;
    });
    if (hasInvalidDestination) {
      issues.push("Each destination needs name, description, latitude, longitude, and at least one photo URL.");
    }

    const hasInvalidItinerary = itinerary.some(
      (day) => !day.title.trim() || !day.startTime || !day.endTime || toLines(day.activitiesEditor).length === 0,
    );
    if (hasInvalidItinerary) {
      issues.push("Each itinerary day needs title, start/end time, and at least one activity.");
    }

    const hasInvalidParticipant = participants.some(
      (participant) => !participant.name.trim() || !participant.address.trim() || !participant.phone.trim() || !participant.email.trim(),
    );
    if (hasInvalidParticipant) {
      issues.push("Each participant must include name, address, phone number, and email.");
    }

    const tripPhotos = toLines(tripPhotosEditor);
    if (tripPhotos.length === 0) {
      issues.push("Add at least one trip photo URL.");
    }

    setErrors(issues);
    return issues.length === 0;
  };

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    if (!validate()) return;

    const token = userSessionService.getToken();
    if (!token) {
      setErrors(["Missing auth token. Please login again."]);
      return;
    }

    const destinationsPayload: TripDestinationPayload[] = destinations.map((destination) => ({
      name: destination.name.trim(),
      description: destination.description.trim(),
      geoCode: {
        latitude: Number(destination.latitude),
        longitude: Number(destination.longitude),
      },
      photos: toLines(destination.photosEditor),
    }));

    const itineraryDaysPayload: TripItineraryDayPayload[] = itinerary.map((day, index) => ({
      day: index + 1,
      title: day.title.trim(),
      timeSlot: {
        startTime: to12Hour(day.startTime),
        endTime: to12Hour(day.endTime),
      },
      activities: toLines(day.activitiesEditor),
    }));

    const participantsPayload: TripParticipantPayload[] = participants.map((participant) => ({
      name: participant.name.trim(),
      address: participant.address.trim(),
      phone: participant.phone.trim(),
      email: participant.email.trim(),
    }));

    const tripPhotos = toLines(tripPhotosEditor);

    const payload: CreateTripApiPayload = {
      tripName: tripName.trim(),
      tripCategory,
      destinations: destinationsPayload,
      startDate,
      endDate,
      startLocation: startLocation.trim(),
      organizer: organizerId.trim(),
      price: Number(price),
      itinerary: {
        days: itineraryDaysPayload,
      },
      included: {
        hotelFacilities: toLines(hotelFacilitiesEditor),
        transportFacilities: toLines(transportFacilitiesEditor),
        otherInclusions: toLines(otherInclusionsEditor),
        exclusions: toLines(exclusionsEditor),
      },
      participants: participantsPayload,
      photos: tripPhotos,
      coverImage: tripPhotos[0],
      description: description.trim(),
      maxParticipants: Number(maxParticipants),
    };

    setSaving(true);

    try {
      await tripApiService.createTrip(payload, token);
      pushToast({ type: "success", title: "Trip created", description: "Trip was submitted to /trips endpoint." });
      setErrors([]);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to create trip.";
      pushToast({ type: "error", title: "Create trip failed", description: message });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Create Trip"
        description="Create and submit a trip to API with destinations, itinerary, inclusions, participants, and photos."
      />

      <form onSubmit={submit} className="space-y-6 border border-border bg-card p-5">
        <section className="space-y-4">
          <h2 className="text-lg font-semibold">Basic Details</h2>
          <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
            <div>
              <label className="mb-1 block text-sm font-medium">Trip name</label>
              <Input value={tripName} onChange={(event) => setTripName(event.target.value)} placeholder="Sri Lanka Southern Escape" />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium">Trip category</label>
              <select
                value={tripCategory}
                onChange={(event) => {
                  const nextCategory = event.target.value as TripCategory;
                  if (nextCategory === "Travel with Guide" && !canSelectTravelWithGuide) return;
                  setTripCategory(nextCategory);
                }}
                className="h-9 w-full border border-input bg-background px-3 text-sm"
              >
                {categories.map((categoryItem) => (
                  <option
                    key={categoryItem}
                    value={categoryItem}
                    disabled={categoryItem === "Travel with Guide" && !canSelectTravelWithGuide}
                  >
                    {categoryItem}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium">Description</label>
            <textarea
              value={description}
              onChange={(event) => setDescription(event.target.value)}
              className="min-h-24 w-full border border-input bg-background px-3 py-2 text-sm"
              placeholder="A beautiful guided family trip through Sri Lanka's southern coast"
            />
          </div>
        </section>

        <section className="space-y-4">
          <h2 className="text-lg font-semibold">Schedule & Organizer</h2>
          <div className="grid grid-cols-1 gap-3 md:grid-cols-2 lg:grid-cols-3">
            <div>
              <label className="mb-1 block text-sm font-medium">Start date</label>
              <Input type="date" value={startDate} onChange={(event) => setStartDate(event.target.value)} />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium">End date</label>
              <Input type="date" value={endDate} onChange={(event) => setEndDate(event.target.value)} />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium">Start location</label>
              <Input
                value={startLocation}
                onChange={(event) => setStartLocation(event.target.value)}
                placeholder="Colombo International Airport"
              />
              <LocationPicker onChange={function (location: { lat: number; lng: number; address: string; }): void {
                throw new Error("Function not implemented.");
              } } />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium">Organizer id (user id)</label>
              <Input value={organizerId} onChange={(event) => setOrganizerId(event.target.value)} placeholder="user_12345" />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium">Organizer name (preview)</label>
              <Input value={organizerName} onChange={(event) => setOrganizerName(event.target.value)} />
            </div>
          </div>
        </section>

        <section className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold">Destinations</h2>
            <Button type="button" variant="outline" onClick={addDestination}>Add destination</Button>
          </div>

          <div className="space-y-3">
            {destinations.map((destination, index) => (
              <div key={index} className="space-y-3 border border-border p-3">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-medium">Destination {index + 1}</p>
                  <Button type="button" variant="ghost" onClick={() => removeDestination(index)} disabled={destinations.length === 1}>
                    Remove
                  </Button>
                </div>

                <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                  <Input
                    value={destination.name}
                    onChange={(event) => updateDestination(index, "name", event.target.value)}
                    placeholder="Galle Fort"
                  />
                  <Input
                    value={destination.description}
                    onChange={(event) => updateDestination(index, "description", event.target.value)}
                    placeholder="Historic colonial fort and museum walk"
                  />
                </div>

                <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                  <Input
                    type="number"
                    step="any"
                    value={destination.latitude}
                    onChange={(event) => updateDestination(index, "latitude", event.target.value)}
                    placeholder="Latitude (e.g. 6.0261)"
                  />
                  <Input
                    type="number"
                    step="any"
                    value={destination.longitude}
                    onChange={(event) => updateDestination(index, "longitude", event.target.value)}
                    placeholder="Longitude (e.g. 80.2168)"
                  />
                </div>

                <div>
                  <label className="mb-1 block text-xs font-medium">Destination photos (one URL per line)</label>
                  <textarea
                    value={destination.photosEditor}
                    onChange={(event) => updateDestination(index, "photosEditor", event.target.value)}
                    className="min-h-20 w-full border border-input bg-background px-3 py-2 text-sm"
                    placeholder={"https://example.com/destinations/galle-1.jpg\nhttps://example.com/destinations/galle-2.jpg"}
                  />
                </div>
              </div>
            ))}
          </div>

          <div className="border border-border p-3">
            <h3 className="mb-2 text-sm font-medium">Map preview</h3>
            <iframe
              title="Destinations map"
              className="h-64 w-full border border-border"
              src={`https://maps.google.com/maps?q=${encodeURIComponent(mapQuery)}&z=6&output=embed`}
              loading="lazy"
            />
          </div>
        </section>

        <section className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold">Itinerary</h2>
            <Button type="button" variant="outline" onClick={addItineraryDay}>Add day</Button>
          </div>

          <div className="space-y-3">
            {itinerary.map((item, index) => (
              <div key={index} className="space-y-3 border border-border p-3">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-medium">Day {index + 1}</p>
                  <Button type="button" variant="ghost" onClick={() => removeItineraryDay(index)} disabled={itinerary.length === 1}>
                    Remove
                  </Button>
                </div>

                <Input
                  value={item.title}
                  onChange={(event) => updateItinerary(index, "title", event.target.value)}
                  placeholder="Arrival and check-in"
                />

                <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                  <div>
                    <label className="mb-1 block text-xs font-medium">Start time</label>
                    <Input
                      type="time"
                      value={item.startTime}
                      onChange={(event) => updateItinerary(index, "startTime", event.target.value)}
                    />
                  </div>
                  <div>
                    <label className="mb-1 block text-xs font-medium">End time</label>
                    <Input
                      type="time"
                      value={item.endTime}
                      onChange={(event) => updateItinerary(index, "endTime", event.target.value)}
                    />
                  </div>
                </div>

                <div>
                  <label className="mb-1 block text-xs font-medium">Activities (one per line)</label>
                  <textarea
                    value={item.activitiesEditor}
                    onChange={(event) => updateItinerary(index, "activitiesEditor", event.target.value)}
                    className="min-h-20 w-full border border-input bg-background px-3 py-2 text-sm"
                    placeholder={"Arrival and check-in\nWelcome dinner with southern cuisine tasting"}
                  />
                </div>
              </div>
            ))}
          </div>
        </section>

        <section className="space-y-4">
          <h2 className="text-lg font-semibold">Included</h2>
          <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
            <div>
              <label className="mb-1 block text-sm font-medium">Hotel facilities (one per line)</label>
              <textarea
                value={hotelFacilitiesEditor}
                onChange={(event) => setHotelFacilitiesEditor(event.target.value)}
                className="min-h-24 w-full border border-input bg-background px-3 py-2 text-sm"
                placeholder={"3-star hotel\nWiFi\nAir conditioning"}
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium">Transport facilities (one per line)</label>
              <textarea
                value={transportFacilitiesEditor}
                onChange={(event) => setTransportFacilitiesEditor(event.target.value)}
                className="min-h-24 w-full border border-input bg-background px-3 py-2 text-sm"
                placeholder={"Air-conditioned coach\nAirport transfers\nDaily transport"}
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium">Other inclusions (one per line)</label>
              <textarea
                value={otherInclusionsEditor}
                onChange={(event) => setOtherInclusionsEditor(event.target.value)}
                className="min-h-24 w-full border border-input bg-background px-3 py-2 text-sm"
                placeholder={"Breakfast\nGuided tours\nEntrance fees"}
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium">Exclusions (one per line)</label>
              <textarea
                value={exclusionsEditor}
                onChange={(event) => setExclusionsEditor(event.target.value)}
                className="min-h-24 w-full border border-input bg-background px-3 py-2 text-sm"
                placeholder={"Visa fees\nPersonal expenses\nMeals not mentioned"}
              />
            </div>
          </div>
        </section>

        <section className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold">Participants</h2>
            <Button type="button" variant="outline" onClick={addParticipant}>Add participant</Button>
          </div>

          <div className="space-y-3">
            {participants.map((participant, index) => (
              <div key={index} className="space-y-3 border border-border p-3">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-medium">Participant {index + 1}</p>
                  <Button type="button" variant="ghost" onClick={() => removeParticipant(index)} disabled={participants.length === 1}>
                    Remove
                  </Button>
                </div>

                <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                  <Input
                    value={participant.name}
                    onChange={(event) => updateParticipant(index, "name", event.target.value)}
                    placeholder="John Doe"
                  />
                  <Input
                    value={participant.address}
                    onChange={(event) => updateParticipant(index, "address", event.target.value)}
                    placeholder="123 Main St, New York"
                  />
                  <Input
                    value={participant.phone}
                    onChange={(event) => updateParticipant(index, "phone", event.target.value)}
                    placeholder="+1234567890"
                  />
                  <Input
                    value={participant.email}
                    onChange={(event) => updateParticipant(index, "email", event.target.value)}
                    placeholder="john@example.com"
                  />
                </div>
              </div>
            ))}
          </div>
        </section>

        <section className="space-y-4">
          <h2 className="text-lg font-semibold">Pricing & Trip Photos</h2>
          <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
            <Input type="number" value={price} onChange={(event) => setPrice(event.target.value)} placeholder="Price (e.g. 450)" />
            <Input
              type="number"
              value={maxParticipants}
              onChange={(event) => setMaxParticipants(event.target.value)}
              placeholder="Max participants (e.g. 20)"
            />
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium">Trip photos (one URL per line)</label>
            <textarea
              value={tripPhotosEditor}
              onChange={(event) => setTripPhotosEditor(event.target.value)}
              className="min-h-24 w-full border border-input bg-background px-3 py-2 text-sm"
              placeholder={"https://example.com/trips/sri-lanka-1.jpg\nhttps://example.com/trips/sri-lanka-2.jpg"}
            />
          </div>
        </section>

        {errors.length > 0 ? (
          <div className="border border-destructive/30 bg-destructive/5 p-3 text-sm text-destructive">
            {errors.map((error) => (
              <p key={error}>{error}</p>
            ))}
          </div>
        ) : null}

        <div className="flex gap-2">
          <Button type="submit" disabled={saving}>{saving ? "Submitting..." : "Create Trip"}</Button>
          <Button type="button" variant="outline">Save as local draft</Button>
        </div>
      </form>
    </div>
  );
}
