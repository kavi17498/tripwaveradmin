"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import { PageHeader } from "@/components/common/page-header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/components/feedback/toast-provider";
import { Bus, Car, Train, Truck } from "lucide-react";
import {
  CreateTripApiPayload,
  TripDestinationPayload,
  TripItineraryDayPayload,
  TripParticipantPayload,
} from "@/lib/types";
import { tripApiService } from "@/lib/services/tripApiService";
import { userSessionService } from "@/lib/services/userSessionService";
import { tripPlanService, TripPlanLocationResult } from "@/lib/services/tripPlanService";
import LocationPicker from "@/components/common/locationpicker";
import TripwaverAIPopup from "@/components/common/tripwaver-ai-popup";

type TripCategory = CreateTripApiPayload["tripCategory"];

type DestinationFormItem = {
  name: string;
  description: string;
  latitude: string;
  longitude: string;
  photosEditor: string;
};

type ActivityFormItem = {
  title: string;
  startTime: string;
  endTime: string;
  notesEditor: string;
  isAIGenerated?: boolean;
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

type MainDestination = {
  lat: number;
  lng: number;
  address: string;
};

type SelectedTravelDestination = {
  location: string;
  name: string;
  lat: number;
  lng: number;
  imageUrl: string | null;
  description: string;
};

const categories: TripCategory[] = ["Solo Trip with guide", "Family Trip with guide", "Strangers Trip with guide", "Private trip"];

const emptyDestination = (): DestinationFormItem => ({
  name: "",
  description: "",
  latitude: "",
  longitude: "",
  photosEditor: "",
});

const emptyActivity = (): ActivityFormItem => ({
  title: "",
  startTime: "08:00",
  endTime: "10:00",
  notesEditor: "",
});

const travelMethods = [
  { key: "bus", label: "Bus", icon: Bus },
  { key: "train", label: "Train", icon: Train },
  { key: "car", label: "Car", icon: Car },
  { key: "van", label: "Van", icon: Car },
  { key: "lorry", label: "Lorry", icon: Truck },
];

const toDateOnly = (value: string) => {
  if (!value) return null;
  const date = new Date(`${value}T00:00:00`);
  return Number.isNaN(date.getTime()) ? null : date;
};

const getDayCount = (startDate: string, endDate: string) => {
  const start = toDateOnly(startDate);
  const end = toDateOnly(endDate);
  if (!start || !end) return 0;
  if (end < start) return 0;
  const diffMs = end.getTime() - start.getTime();
  return Math.floor(diffMs / (24 * 60 * 60 * 1000)) + 1;
};

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
  const [tripCategory, setTripCategory] = useState<TripCategory>("Solo Trip with guide");
  const [canSelectTravelWithGuide, setCanSelectTravelWithGuide] = useState(false);
  const [description, setDescription] = useState("");

  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [startTime, setStartTime] = useState("");
  const [endTime, setEndTime] = useState("");
  const [startLocation, setStartLocation] = useState("");
  const [mainDestination, setMainDestination] = useState<MainDestination | null>(null);
  const [mainDestinations, setMainDestinations] = useState<MainDestination[]>([]);
  const [travelDestinationGroups, setTravelDestinationGroups] = useState<TripPlanLocationResult[]>([]);
  const [isLoadingTravelDestinations, setIsLoadingTravelDestinations] = useState(false);
  const [selectedTravelDestinations, setSelectedTravelDestinations] = useState<SelectedTravelDestination[]>([]);

  const [destinations, setDestinations] = useState<DestinationFormItem[]>([emptyDestination()]);
  const [activitiesByDay, setActivitiesByDay] = useState<ActivityFormItem[][]>([[emptyActivity()]]);
  const [participants, setParticipants] = useState<ParticipantFormItem[]>([emptyParticipant()]);

  const [hotelFacilitiesEditor, setHotelFacilitiesEditor] = useState("");
  const [travelBy, setTravelBy] = useState<string>("");
  const [otherInclusionsEditor, setOtherInclusionsEditor] = useState("");
  const [exclusionsEditor, setExclusionsEditor] = useState("");

  const [tripPhotosEditor, setTripPhotosEditor] = useState("");

  const [price, setPrice] = useState("");
  const [maxParticipants, setMaxParticipants] = useState("");

  const [organizerId, setOrganizerId] = useState("");
  const [organizerName, setOrganizerName] = useState("Organizer");

  const [errors, setErrors] = useState<string[]>([]);
  const [saving, setSaving] = useState(false);
  const [isTripwaverAIOpen, setIsTripwaverAIOpen] = useState(false);
  const [tripwaverAIError, setTripwaverAIError] = useState("");

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
      setTripCategory((current) => (current === "Solo Trip with guide" ? "Family Trip with guide" : current));
    }
  }, []);

  const dayCount = useMemo(() => getDayCount(startDate, endDate), [startDate, endDate]);

  useEffect(() => {
    if (dayCount === 0) {
      setActivitiesByDay([]);
      return;
    }

    setActivitiesByDay((prev) => {
      const next = [...prev];
      while (next.length < dayCount) {
        next.push([emptyActivity()]);
      }
      while (next.length > dayCount) {
        next.pop();
      }
      return next;
    });
  }, [dayCount]);

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

  const updateActivity = (dayIndex: number, activityIndex: number, key: keyof ActivityFormItem, value: string) => {
    setActivitiesByDay((prev) =>
      prev.map((day, currentDayIndex) => {
        if (currentDayIndex !== dayIndex) return day;
        return day.map((item, currentActivityIndex) =>
          currentActivityIndex === activityIndex ? { ...item, [key]: value } : item,
        );
      }),
    );
  };

  const [isGenerating, setIsGenerating] = useState(false);

  const addActivity = (dayIndex: number) => {
    setActivitiesByDay((prev) =>
      prev.map((day, currentDayIndex) => (currentDayIndex === dayIndex ? [...day, emptyActivity()] : day)),
    );
  };

  const removeActivity = (dayIndex: number, activityIndex: number) => {
    setActivitiesByDay((prev) =>
      prev.map((day, currentDayIndex) => {
        if (currentDayIndex !== dayIndex) return day;
        if (day.length === 1) return day;
        return day.filter((_, currentActivityIndex) => currentActivityIndex !== activityIndex);
      }),
    );
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

  const toggleTravelBy = (method: string) => {
    setTravelBy((prev) => (prev === method ? "" : method));
  };

  const addMainDestination = () => {
    if (!mainDestination || !mainDestination.address.trim()) {
      pushToast({ type: "error", title: "Select a location", description: "Pick a location before adding it as a main destination." });
      return;
    }

    setMainDestinations((prev) => {
      const exists = prev.some((item) => item.address === mainDestination.address);
      return exists ? prev : [...prev, mainDestination];
    });
  };

  const removeMainDestination = (index: number) => {
    setMainDestinations((prev) => prev.filter((_, currentIndex) => currentIndex !== index));
  };

  const loadTravelDestinations = async () => {
    const token = userSessionService.getToken();
    if (!token) {
      pushToast({ type: "error", title: "Missing auth token", description: "Please login again." });
      return;
    }

    if (mainDestinations.length === 0) {
      pushToast({ type: "error", title: "Add main destinations", description: "Add at least one main destination first." });
      return;
    }

    const locations = mainDestinations.map((destination) => destination.address).filter(Boolean);
    if (locations.length === 0) {
      pushToast({ type: "error", title: "Invalid locations", description: "Main destinations need valid addresses." });
      return;
    }

    setIsLoadingTravelDestinations(true);
    try {
      const results = await tripPlanService.getDestinations(locations, token);
      setTravelDestinationGroups(results);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to load travel destinations.";
      pushToast({ type: "error", title: "Load failed", description: message });
    } finally {
      setIsLoadingTravelDestinations(false);
    }
  };

  const validateForAuto = () => {
    const issues: string[] = [];
    if (!tripName.trim()) issues.push("Trip name is required.");
    if (!tripCategory) issues.push("Trip category is required.");
    const hasManualDest = destinations.some((d) => d.name.trim() && d.latitude.trim() && d.longitude.trim());
    const hasSelectedDest = selectedTravelDestinations.length > 0;
    if (!hasManualDest && !hasSelectedDest) {
      issues.push("At least one destination with latitude and longitude is required. Add one in Destinations or pick from Travel Destinations.");
    }
    if (!startDate || !endDate) issues.push("Start date and end date are required.");
    if (!startTime) issues.push("Start time is required.");
    if (!endTime) issues.push("End time is required.");
    if (!startLocation.trim()) issues.push("Start location is required.");
    if (Number(maxParticipants) <= 0) issues.push("Max participants must be greater than 0.");
    const hotel = toLines(hotelFacilitiesEditor);
    if (hotel.length === 0) issues.push("At least one hotel facility is required in Included.");

    if (issues.length > 0) {
      pushToast({ type: "error", title: "Missing fields", description: issues.join(" ") });
      return false;
    }
    return true;
  };

  const parse12HourTo24 = (time12: string) => {
    // expects "08:00 AM" or "8:00 PM" -> returns "08:00"
    if (!time12) return "";
    const m = time12.match(/^(\d{1,2}):(\d{2})\s*(AM|PM)$/i);
    if (!m) return time12;
    let hour = parseInt(m[1], 10);
    const minute = m[2];
    const suffix = m[3].toUpperCase();
    if (suffix === "AM") {
      if (hour === 12) hour = 0;
    } else {
      if (hour !== 12) hour += 12;
    }
    return `${String(hour).padStart(2, "0")}:${minute}`;
  };

  const generateItinerary = async () => {
    if (!validateForAuto()) return;

    const token = userSessionService.getToken();
    if (!token) {
      pushToast({ type: "error", title: "Missing auth token", description: "Please login again." });
      return;
    }

    const manualPayload = destinations
      .map((d) => {
        if (!d.name.trim() || !d.latitude.trim() || !d.longitude.trim()) return null;
        return {
          name: d.name.trim(),
          description: d.description.trim(),
          geoCode: {
            latitude: Number(d.latitude),
            longitude: Number(d.longitude),
          },
        };
      })
      .filter(Boolean);

    const selectedPayload = selectedTravelDestinations.map((s) => ({
      name: s.name,
      description: s.description || "",
      geoCode: { latitude: Number(s.lat), longitude: Number(s.lng) },
    }));

    const destinationsPayload = [...manualPayload, ...selectedPayload];

    const payload = {
      tripName: tripName.trim(),
      tripCategory,
      destinations: destinationsPayload,
      startDate,
      endDate,
      startTime: to12Hour(startTime),
      endTime: to12Hour(endTime),
      startLocation: startLocation.trim(),
      included: {
        hotelFacilities: toLines(hotelFacilitiesEditor),
        transportFacilities: travelBy ? [travelBy] : [],
        otherInclusions: toLines(otherInclusionsEditor),
        exclusions: toLines(exclusionsEditor),
      },
      maxParticipants: Number(maxParticipants),
    };

    setIsGenerating(true);
    try {
      const resp = await tripPlanService.generateAutoItinerary(payload, token);
      const days: any[] = resp?.days ?? [];

      const next: ActivityFormItem[][] = Array.from({ length: dayCount }, (_, i) => []);
      for (let i = 0; i < dayCount; i++) {
        const day = days[i];
        if (!day || !Array.isArray(day.activities) || day.activities.length === 0) {
          next[i] = [emptyActivity()];
          continue;
        }

        next[i] = day.activities.map((act: any) => ({
          title: act.activity || act.title || "",
          startTime: parse12HourTo24(act.startTime || ""),
          endTime: parse12HourTo24(act.endTime || ""),
          notesEditor: act.description || "",
          isAIGenerated: true,
        }));
      }

      setActivitiesByDay(next);
      pushToast({ type: "success", title: "Itinerary generated", description: "AI itinerary added to activities. You can edit them." });
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to generate itinerary.";
      pushToast({ type: "error", title: "Generate failed", description: message });
    } finally {
      setIsGenerating(false);
    }
  };

  const clearAIGenerated = () => {
    const confirmClear = window.confirm("Clear AI suggestions? This will remove AI-generated activities.");
    if (!confirmClear) return;

    setActivitiesByDay((prev) => prev.map((day) => {
      const filtered = day.filter((item) => !item.isAIGenerated);
      return filtered.length ? filtered : [emptyActivity()];
    }));
    pushToast({ type: "success", title: "AI suggestions cleared" });
  };

  const clearEntireGenerated = () => {
    const confirmClear = window.confirm("Clear entire generated itinerary? This will reset all activities. Are you sure?");
    if (!confirmClear) return;

    setActivitiesByDay(() => Array.from({ length: dayCount }, () => [emptyActivity()]));
    pushToast({ type: "success", title: "Generated itinerary cleared" });
  };

  const addSelectedTravelDestination = (location: string, destination: TripPlanLocationResult["destinations"][number]) => {
    setSelectedTravelDestinations((prev) => {
      const exists = prev.some((item) => item.location === location && item.name === destination.name);
      if (exists) return prev;
      return [
        ...prev,
        {
          location,
          name: destination.name,
          lat: destination.lat,
          lng: destination.lng,
          imageUrl: destination.imageUrl,
          description: destination.description,
        },
      ];
    });
  };

  const removeSelectedTravelDestination = (location: string, name: string) => {
    setSelectedTravelDestinations((prev) => prev.filter((item) => !(item.location === location && item.name === name)));
  };

  const validate = () => {
    const issues: string[] = [];

    if (!tripName.trim()) issues.push("Trip name is required.");
    if (!startDate || !endDate) issues.push("Start date and end date are required.");
    if (!startTime) issues.push("Start time is required.");
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

    const hasInvalidActivities = activitiesByDay.some((day) =>
      day.some((activity) => !activity.title.trim() || !activity.startTime || !activity.endTime || toLines(activity.notesEditor).length === 0),
    );
    if (hasInvalidActivities) {
      issues.push("Each activity needs title, start/end time, and at least one note.");
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

    const itineraryDaysPayload: TripItineraryDayPayload[] = activitiesByDay.map((dayActivities, index) => {
      const first = dayActivities[0];
      const last = dayActivities[dayActivities.length - 1];
      const activities = dayActivities.flatMap((activity) => {
        const notes = toLines(activity.notesEditor);
        if (notes.length === 0) {
          return [`${activity.title.trim()} (${to12Hour(activity.startTime)} - ${to12Hour(activity.endTime)})`];
        }
        return notes.map((note) => `${activity.title.trim()} (${to12Hour(activity.startTime)} - ${to12Hour(activity.endTime)}): ${note}`);
      });

      return {
        day: index + 1,
        title: `Day ${index + 1}`,
        timeSlot: {
          startTime: to12Hour(first.startTime),
          endTime: to12Hour(last.endTime),
        },
        activities,
      };
    });

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
      startTime,
      startLocation: startLocation.trim(),
      organizer: organizerId.trim(),
      price: Number(price),
      itinerary: {
        days: itineraryDaysPayload,
      },
      included: {
        hotelFacilities: toLines(hotelFacilitiesEditor),
        transportFacilities: travelBy ? [travelBy] : [],
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

  const openTripwaverAIpopup = () => {
    if (!startDate || !endDate || !startLocation.trim()) {
      setTripwaverAIError("Start date, end date, and start destination should be selected.");
      return;
    }

    setTripwaverAIError("");
    setIsTripwaverAIOpen(true);
  };

  const closeTripwaverAIpopup = () => {
    setIsTripwaverAIOpen(false);
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
                  if (nextCategory === "Solo Trip with guide" && !canSelectTravelWithGuide) return;
                  setTripCategory(nextCategory);
                }}
                className="h-9 w-full border border-input bg-background px-3 text-sm"
              >
                {categories.map((categoryItem) => (
                  <option
                    key={categoryItem}
                    value={categoryItem}
                    disabled={categoryItem === "Strangers Trip with guide" && !canSelectTravelWithGuide}
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
              <label className="mb-1 block text-sm font-medium">Start time</label>
              <Input type="time" value={startTime} onChange={(event) => setStartTime(event.target.value)} />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium">End time</label>
              <Input type="time" value={endTime} onChange={(event) => setEndTime(event.target.value)} />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium">Start location</label>
              <LocationPicker
                onChange={(location) => {
                  setStartLocation(location.address);
                }}
              />
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
            <h2 className="text-lg font-semibold">Main Destination Select</h2>
          </div>
          <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
            <div className="space-y-3">
              <LocationPicker value={mainDestination} onChange={setMainDestination} />
              <div className="flex justify-end">
                <Button type="button" variant="outline" onClick={addMainDestination}>
                  Add as main destination
                </Button>
              </div>
            </div>
            <div className="space-y-3 rounded border border-border p-3">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-medium">Main destinations</h3>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-muted-foreground">{mainDestinations.length}</span>
                  <Button type="button" variant="outline" size="sm" onClick={loadTravelDestinations} disabled={isLoadingTravelDestinations}>
                    {isLoadingTravelDestinations ? "Loading..." : "Load travel destinations"}
                  </Button>
                </div>
              </div>
              {mainDestinations.length === 0 ? (
                <p className="text-sm text-muted-foreground">No main destinations added yet.</p>
              ) : (
                <div className="space-y-2">
                  {mainDestinations.map((destination, index) => (
                    <div key={`${destination.address}-${index}`} className="flex items-center justify-between gap-2 rounded border border-border px-3 py-2">
                      <div className="text-sm">
                        <p className="font-medium">{destination.address}</p>
                        <p className="text-xs text-muted-foreground">
                          {destination.lat.toFixed(5)}, {destination.lng.toFixed(5)}
                        </p>
                      </div>
                      <Button type="button" variant="ghost" onClick={() => removeMainDestination(index)}>
                        Remove
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </section>

        <section className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold">Travel Destinations</h2>
          </div>
          {travelDestinationGroups.length === 0 ? (
            <p className="text-sm text-muted-foreground">Load travel destinations to see recommendations.</p>
          ) : (
            <div className="space-y-6">
              {travelDestinationGroups.map((group, groupIndex) => (
                <div key={`${group.location}-${groupIndex}`} className="space-y-3">
                  <h3 className="text-sm font-semibold">{group.location}</h3>
                  <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
                    <div className="space-y-2">
                      {group.destinations.map((destination, destinationIndex) => (
                        <button
                          key={`${destination.name}-${destinationIndex}`}
                          type="button"
                          onClick={() => addSelectedTravelDestination(group.location, destination)}
                          className="flex w-full items-center gap-3 rounded border border-border bg-card p-2 text-left transition hover:bg-accent"
                        >
                          {destination.imageUrl ? (
                            <img src={destination.imageUrl} alt={destination.name} className="h-12 w-12 rounded object-cover" />
                          ) : (
                            <div className="flex h-12 w-12 items-center justify-center rounded bg-muted text-xs text-muted-foreground">
                              No image
                            </div>
                          )}
                          <div className="min-w-0">
                            <p className="truncate text-sm font-medium">{destination.name}</p>
                            <p className="truncate text-xs text-muted-foreground">{destination.description}</p>
                          </div>
                        </button>
                      ))}
                    </div>
                    <div className="space-y-2 rounded border border-dashed border-border p-3">
                      <p className="text-xs font-semibold text-muted-foreground">Selected destinations</p>
                      {selectedTravelDestinations.filter((item) => item.location === group.location).length === 0 ? (
                        <p className="text-xs text-muted-foreground">Click a destination to add it here.</p>
                      ) : (
                        <div className="space-y-2">
                          {selectedTravelDestinations
                            .filter((item) => item.location === group.location)
                            .map((item) => (
                              <button
                                key={`${item.location}-${item.name}`}
                                type="button"
                                onClick={() => removeSelectedTravelDestination(item.location, item.name)}
                                className="flex w-full items-center gap-3 rounded border border-border bg-background p-2 text-left transition hover:bg-accent"
                              >
                                {item.imageUrl ? (
                                  <img src={item.imageUrl} alt={item.name} className="h-10 w-10 rounded object-cover" />
                                ) : (
                                  <div className="flex h-10 w-10 items-center justify-center rounded bg-muted text-xs text-muted-foreground">
                                    No image
                                  </div>
                                )}
                                <div className="min-w-0">
                                  <p className="truncate text-sm font-medium">{item.name}</p>
                                  <p className="truncate text-xs text-muted-foreground">{item.description}</p>
                                </div>
                              </button>
                            ))}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* <section className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold">Destinations</h2>
            <Button type="button" variant="outline" onClick={addDestination}>Add destination</Button>
             <Button type="button" variant="outline" onClick={openTripwaverAIpopup}>Use TripWaver AI to List Destinations</Button>
          </div>
          {tripwaverAIError ? (
            <div className="rounded border border-destructive/30 bg-destructive/5 p-3 text-sm text-destructive">
              {tripwaverAIError}
            </div>
          ) : null}

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
        </section> */}

        <section className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold">Travel By</h2>
          </div>
          <div className="grid grid-cols-2 gap-3 md:grid-cols-3">
            {travelMethods.map((method) => {
              const Icon = method.icon;
              const isSelected = travelBy === method.label;
              return (
                <button
                  key={method.key}
                  type="button"
                  onClick={() => toggleTravelBy(method.label)}
                  className={
                    "flex items-center gap-2 rounded border px-3 py-2 text-left transition" +
                    (isSelected ? " border-primary bg-primary/10" : " border-border bg-card hover:bg-accent")
                  }
                >
                  <Icon className="size-4" />
                  <span className="text-sm font-medium">{method.label}</span>
                </button>
              );
            })}
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

        <section className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold">itinerary</h2>
            <div className="flex items-center gap-2">
              <span className="text-xs text-muted-foreground">{dayCount} day(s)</span>
              <Button type="button" variant="outline" size="sm" onClick={generateItinerary} disabled={isGenerating}>
                {isGenerating ? "Generating..." : "Generate itinerary"}
              </Button>
              <Button type="button" variant="outline" size="sm" onClick={clearEntireGenerated}>
                Clear generated
              </Button>
            </div>
          </div>

          {dayCount === 0 ? (
            <p className="text-sm text-muted-foreground">Select start and end dates to build the day plan.</p>
          ) : (
            <div className="space-y-4">
              {activitiesByDay.map((dayActivities, dayIndex) => (
                <div key={dayIndex} className="space-y-3 border border-border p-3">
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-medium">Day {dayIndex + 1}</p>
                    <Button type="button" variant="outline" size="sm" onClick={() => addActivity(dayIndex)}>
                      Add activity
                    </Button>
                  </div>

                  <div className="space-y-3">
                    {dayActivities.map((item, activityIndex) => (
                      <div key={activityIndex} className="space-y-3 rounded border border-border p-3">
                        <div className="flex items-center justify-between">
                          <p className="text-sm font-medium">Activity {activityIndex + 1}</p>
                          <Button
                            type="button"
                            variant="ghost"
                            onClick={() => removeActivity(dayIndex, activityIndex)}
                            disabled={dayActivities.length === 1}
                          >
                            Remove
                          </Button>
                        </div>

                        <Input
                          value={item.title}
                          onChange={(event) => updateActivity(dayIndex, activityIndex, "title", event.target.value)}
                          placeholder="Arrival and check-in"
                        />

                        <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                          <div>
                            <label className="mb-1 block text-xs font-medium">Start time</label>
                            <Input
                              type="time"
                              value={item.startTime}
                              onChange={(event) => updateActivity(dayIndex, activityIndex, "startTime", event.target.value)}
                            />
                          </div>
                          <div>
                            <label className="mb-1 block text-xs font-medium">End time</label>
                            <Input
                              type="time"
                              value={item.endTime}
                              onChange={(event) => updateActivity(dayIndex, activityIndex, "endTime", event.target.value)}
                            />
                          </div>
                        </div>

                        <div>
                          <label className="mb-1 block text-xs font-medium">Notes (one per line)</label>
                          <textarea
                            value={item.notesEditor}
                            onChange={(event) => updateActivity(dayIndex, activityIndex, "notesEditor", event.target.value)}
                            className="min-h-20 w-full border border-input bg-background px-3 py-2 text-sm"
                            placeholder={"Arrival and check-in\nWelcome dinner with southern cuisine tasting"}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
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

      <TripwaverAIPopup
        isOpen={isTripwaverAIOpen}
        startDate={startDate}
        endDate={endDate}
        startLocation={startLocation}
        onClose={closeTripwaverAIpopup}
      />
    </div>
  );
}
