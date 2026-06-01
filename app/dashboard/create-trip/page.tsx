"use client";

import { ChangeEvent, FormEvent, useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { PageHeader } from "@/components/common/page-header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/components/feedback/toast-provider";
import { Bus, Car, ChevronDown, ChevronUp, Train, Truck } from "lucide-react";
import {
  CreateTripApiPayload,
  TripDestinationPayload,
  TripItineraryDayPayload,
} from "@/lib/types";
import { tripApiService } from "@/lib/services/tripApiService";
import { onDemandTripService, type CreateOnDemandTripTemplatePayload } from "@/lib/services/onDemandTripService";
import { userSessionService } from "@/lib/services/userSessionService";
import { tripImageUploadService } from "@/lib/services/tripImageUploadService";
import { tripPlanService, TripPlanLocationResult } from "@/lib/services/tripPlanService";
import LocationPicker from "@/components/common/locationpicker";
import TripwaverAIPopup from "@/components/common/tripwaver-ai-popup";
import { SavingOverlay } from "@/components/common/saving-overlay";

type TripCategory = CreateTripApiPayload["tripCategory"];
type PickupType = CreateTripApiPayload["pickupType"];
type AirportPickupType = Exclude<PickupType, "Free Pickup" | "Pickup Available" | "Meet at Location">;
type TripFlow = "scheduled" | "on-demand";

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

const categories: TripCategory[] = ["Public trip", "Private trip"];

const paymentMethodOptions = ["Pay Online", "Pay to Guide on Trip Day"] as const;
type PaymentMethod = (typeof paymentMethodOptions)[number];

const leadTimeTripCategories: TripCategory[] = ["Public trip"];

const airportPickupLocations: Record<AirportPickupType, MainDestination> = {
  "Free Pickup from Bandaranaike International Airport": {
    lat: 7.1808,
    lng: 79.8841,
    address: "Bandaranaike International Airport",
  },
  "Free Pickup from Mattala Airport": {
    lat: 6.2844,
    lng: 81.1241,
    address: "Mattala Rajapaksa International Airport",
  },
};

const getDefaultPickupLocation = (pickupType: PickupType): MainDestination | null => {
  if (pickupType === "Free Pickup from Bandaranaike International Airport") {
    return airportPickupLocations["Free Pickup from Bandaranaike International Airport"];
  }

  if (pickupType === "Free Pickup from Mattala Airport") {
    return airportPickupLocations["Free Pickup from Mattala Airport"];
  }

  return null;
};

const isAirportPickupType = (pickupType: PickupType) =>
  pickupType === "Free Pickup from Bandaranaike International Airport" || pickupType === "Free Pickup from Mattala Airport";

const pickupTypeOptions: Array<{ value: PickupType; label: string }> = [
  { value: "Meet at Location", label: "Meet at Location" },
  { value: "Free Pickup", label: "Free Pickup" },
  { value: "Pickup Available", label: "Pickup Available" },
  { value: "Free Pickup from Bandaranaike International Airport", label: "Free Pickup from Bandaranaike International Airport" },
  { value: "Free Pickup from Mattala Airport", label: "Free Pickup from Mattala Airport" },
];

const getLocalDateString = (date: Date) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

const getMinStartDate = (leadDays: number) => {
  const date = new Date();
  date.setHours(0, 0, 0, 0);
  date.setDate(date.getDate() + leadDays);
  return getLocalDateString(date);
};

const timeToMinutes = (value: string) => {
  const match = value.match(/^(\d{2}):(\d{2})$/);
  if (!match) return Number.NaN;

  const hours = Number(match[1]);
  const minutes = Number(match[2]);
  return hours * 60 + minutes;
};

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
  { key: "three-wheel", label: "Three Wheel", icon: Car },
  { key: "bike", label: "Bike", icon: Car },
  { key: "four-by-four", label: "4x4", icon: Truck },
  { key: "suv", label: "SUV", icon: Car },
  { key: "minibus", label: "Mini Bus", icon: Bus },
  { key: "coach", label: "Coach", icon: Bus },
  { key: "boat", label: "Boat", icon: Truck },
  { key: "ferry", label: "Ferry", icon: Truck },
  { key: "airplane", label: "Airplane", icon: Truck },
  { key: "helicopter", label: "Helicopter", icon: Truck },
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

const toMainDestinationValue = (destination: { name?: string; lat?: number; lng?: number } | null) => {
  if (!destination) return null;

  const lat = destination.lat;
  const lng = destination.lng;
  const address = destination.name?.trim() || "";

  if (typeof lat !== "number" || typeof lng !== "number" || !address) return null;

  return { lat, lng, address };
};

const durationOptions: Array<{ label: string; value: string; days: number; durationLabel: string }> = [
  { label: "Half day", value: "0.5", days: 1, durationLabel: "Half day" },
  { label: "1 day", value: "1", days: 1, durationLabel: "1 day" },
  { label: "2 days", value: "2", days: 2, durationLabel: "2 days" },
  { label: "3 days", value: "3", days: 3, durationLabel: "3 days" },
  { label: "4 days", value: "4", days: 4, durationLabel: "4 days" },
  { label: "5 days", value: "5", days: 5, durationLabel: "5 days" },
  { label: "7 days", value: "7", days: 7, durationLabel: "7 days" },
];

const getOnDemandDurationOption = (value: string) =>
  durationOptions.find((option) => option.value === value) ?? durationOptions[1];

export default function CreateTripPage() {
  const { pushToast } = useToast();
  const router = useRouter();
  const searchParams = useSearchParams();

  const isEditMode = searchParams?.get("mode") === "edit";
  const editTripId = searchParams?.get("id") ?? null;
  const [tripFlow, setTripFlow] = useState<TripFlow>("scheduled");

  const [tripName, setTripName] = useState("");
  const [tripCategory, setTripCategory] = useState<TripCategory>("Public trip");
  const [canSelectAllCategories, setCanSelectAllCategories] = useState(false);
  const [description, setDescription] = useState("");
  const [pickupType, setPickupType] = useState<PickupType>("Meet at Location");
  const [pickupCostPerKm, setPickupCostPerKm] = useState("");
  const [pickupStartLocation, setPickupStartLocation] = useState<MainDestination | null>(null);
  const [onDemandDurationDays, setOnDemandDurationDays] = useState("3");

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

  const [hotelFacilitiesEditor, setHotelFacilitiesEditor] = useState("");
  const [travelMethodsSelected, setTravelMethodsSelected] = useState<string[]>([]);
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>([]);
  const [otherInclusionsEditor, setOtherInclusionsEditor] = useState("");
  const [exclusionsEditor, setExclusionsEditor] = useState("");

  const [tripPhotosEditor, setTripPhotosEditor] = useState("");
  const [tripPhotoFiles, setTripPhotoFiles] = useState<File[]>([]);
  const [tripPhotoPreviews, setTripPhotoPreviews] = useState<string[]>([]);
  const [tripUploadDraftId] = useState(() => crypto.randomUUID());

  const handleTripPhotosChange = (event: ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files ? Array.from(event.target.files) : [];
    if (files.length === 0) return;
    setTripPhotoFiles((prev) => [...prev, ...files]);
    event.target.value = "";
  };

  const removeTripPhotoFile = (index: number) => {
    setTripPhotoFiles((prev) => prev.filter((_, i) => i !== index));
  };

  useEffect(() => {
    if (tripPhotoFiles.length === 0) {
      setTripPhotoPreviews([]);
      return;
    }

    const previewUrls = tripPhotoFiles.map((file) => URL.createObjectURL(file));
    setTripPhotoPreviews(previewUrls);

    return () => {
      previewUrls.forEach((url) => URL.revokeObjectURL(url));
    };
  }, [tripPhotoFiles]);

  const [price, setPrice] = useState("");
  const [maxParticipants, setMaxParticipants] = useState("");

  const [organizerId, setOrganizerId] = useState("");
  const [organizerName, setOrganizerName] = useState("Organizer");

  const [errors, setErrors] = useState<string[]>([]);
  const [saving, setSaving] = useState(false);
  const [isTripwaverAIOpen, setIsTripwaverAIOpen] = useState(false);
  const [tripwaverAIError, setTripwaverAIError] = useState("");
  const [openSections, setOpenSections] = useState<Record<string, boolean>>({
    basicDetails: true,
    schedule: true,
    mainDestinations: false,
    travelDestinations: false,
    selectedDestinations: false,
    travelBy: false,
    paymentMethod: false,
    included: false,
    pricingPhotos: false,
    itinerary: false,
  });

  const toggleSection = (sectionKey: string) => {
    setOpenSections((prev) => ({ ...prev, [sectionKey]: !prev[sectionKey] }));
  };

  const minStartDate = useMemo(() => getMinStartDate(3), []);
  const endDateMin = startDate || minStartDate;
  const isOnDemandTrip = tripFlow === "on-demand";
  const dayCount = useMemo(() => getDayCount(startDate, endDate), [startDate, endDate]);
  const selectedDuration = useMemo(() => getOnDemandDurationOption(onDemandDurationDays), [onDemandDurationDays]);
  const effectiveDayCount = isOnDemandTrip ? Math.max(1, selectedDuration.days) : dayCount;

  const syntheticAiDates = useMemo(() => {
    const start = new Date(`${minStartDate}T00:00:00`);
    const end = new Date(start);
    end.setDate(end.getDate() + Math.max(1, effectiveDayCount) - 1);

    return {
      startDate: isOnDemandTrip ? start.toISOString().slice(0, 10) : startDate,
      endDate: isOnDemandTrip ? end.toISOString().slice(0, 10) : endDate,
    };
  }, [effectiveDayCount, endDate, isOnDemandTrip, minStartDate, startDate]);

  useEffect(() => {
    const profile = userSessionService.getUserProfile<StoredUserProfile>();
    if (!profile) return;

    if (profile.id) {
      setOrganizerId(profile.id);
    }

    setOrganizerName(getOrganizerName(profile));
  }, []);

  useEffect(() => {
    if (!isEditMode || !editTripId) return;

    const loadTrip = async () => {
      const token = userSessionService.getToken();
      if (!token) {
        pushToast({ type: "error", title: "Missing auth", description: "Please login to edit trips." });
        return;
      }

      try {
        let trip: any = null;
        let isOnDemand = false;

        try {
          const result = await tripApiService.getTripById(editTripId, token);
          trip = result.data;
        } catch {
          // If scheduled trip fetch fails, try on-demand template
        }

        if (!trip) {
          try {
            const templateResult = await onDemandTripService.getTemplateById(editTripId);
            trip = templateResult.data;
            if (trip) {
              isOnDemand = true;
            }
          } catch {
            // Ignore
          }
        }

        if (!trip) {
          pushToast({ type: "error", title: "Not found", description: "Trip or template not found." });
          return;
        }

        setTripName(trip.tripName ?? "");
        setTripCategory((trip.tripCategory as any) ?? tripCategory);
        setDescription(trip.description ?? "");

        if (isOnDemand) {
          setTripFlow("on-demand");
          setOnDemandDurationDays(String(trip.durationDays ?? "3"));
          const loadedDurationLabel = typeof trip.durationLabel === "string" ? trip.durationLabel.trim().toLowerCase() : "";
          if (loadedDurationLabel === "half day") {
            setOnDemandDurationDays("0.5");
          } else {
            setOnDemandDurationDays(String(trip.durationDays ?? "3"));
          }
        } else {
          setTripFlow("scheduled");
          setStartDate(trip.startDate ?? "");
          setEndDate(trip.endDate ?? "");
          setStartTime(trip.startTime ?? "");
          setEndTime(trip.endTime ?? "");
        }

        setStartLocation(trip.startLocation ?? "");
        setPrice(String(trip.price ?? ""));
        setMaxParticipants(String(trip.maxParticipants ?? ""));
        setPaymentMethods((trip.paymentMethods as PaymentMethod[] | undefined) ?? []);
        const loadedPickupType = (trip.pickupType as PickupType) ?? "Meet at Location";
        setPickupType(loadedPickupType);
        setPickupCostPerKm(trip.pickupCostPerKm !== undefined ? String(trip.pickupCostPerKm) : "");
        const loadedPickupStartLocation = trip.pickupStartLocation
          ? {
              lat: trip.pickupStartLocation.lat,
              lng: trip.pickupStartLocation.lng,
              address: trip.pickupStartLocation.name,
            }
          : getDefaultPickupLocation(loadedPickupType);

        setPickupStartLocation(loadedPickupStartLocation ?? null);
        if (loadedPickupStartLocation) {
          setStartLocation(loadedPickupStartLocation.address);
        }
        if (trip.included) {
          setHotelFacilitiesEditor((trip.included.hotelFacilities || []).join("\n"));
          setOtherInclusionsEditor((trip.included.otherInclusions || []).join("\n"));
          setExclusionsEditor((trip.included.exclusions || []).join("\n"));
          setTravelMethodsSelected(trip.included.transportFacilities || []);
        }

        if (trip.mainDestinations && trip.mainDestinations.length > 0) {
          const mappedMainDestinations = trip.mainDestinations
            .map((destination: any) => toMainDestinationValue({
              name: destination.name,
              lat: destination.lat,
              lng: destination.lng,
            }))
            .filter((destination: any): destination is MainDestination => destination !== null);

          setMainDestinations(mappedMainDestinations);
          setMainDestination(mappedMainDestinations[0] ?? null);
        }

        // map destinations
        if (trip.destinations && trip.destinations.length > 0) {
          const mapped = trip.destinations.map((d: any) => ({
            name: d.name ?? "",
            description: d.description ?? "",
            latitude: String(d.geoCode?.latitude ?? ""),
            longitude: String(d.geoCode?.longitude ?? ""),
            photosEditor: (d.photos || []).join("\n"),
          }));
          setDestinations(mapped.length ? mapped : [emptyDestination()]);
        }

        // itinerary => activitiesByDay
        if (trip.itinerary?.days && trip.itinerary.days.length > 0) {
          const activities = trip.itinerary.days.map((day: any) => {
            const items: ActivityFormItem[] = (day.activities || []).map((act: any) => {
              return {
                title: act.title ?? "",
                startTime: parse12HourTo24(act.timeSlot?.startTime ?? "08:00"),
                endTime: parse12HourTo24(act.timeSlot?.endTime ?? "10:00"),
                notesEditor: (act.notes || []).join("\n"),
                isAIGenerated: act.isAIGenerated,
              };
            });
            return items.length ? items : [emptyActivity()];
          });
          setActivitiesByDay(activities);
        }

        // photos
        if (trip.photos && trip.photos.length > 0) {
          setTripPhotosEditor(trip.photos.join("\n"));
          setTripPhotoPreviews(trip.photos);
          setTripPhotoFiles([]);
        }

        setOrganizerId(trip.organizer ?? "");

        const role = userSessionService.getRole();
        const canSelectAnyCategory = role === "guide" || role === "admin" || role === "superadmin";
        if (!canSelectAnyCategory) {
          setTripCategory("Private trip");
        }
      } catch (err) {
        const message = err instanceof Error ? err.message : "Failed to load trip.";
        pushToast({ type: "error", title: "Load failed", description: message });
      }
    };

    void loadTrip();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isEditMode, editTripId]);

  useEffect(() => {
    const role = userSessionService.getRole();
    const canSelectAnyCategory = role === "guide" || role === "admin" || role === "superadmin";
    setCanSelectAllCategories(canSelectAnyCategory);

    if (!canSelectAnyCategory) {
      setTripCategory("Private trip");
    }
  }, []);

  const allowedTripCategory: TripCategory = canSelectAllCategories ? tripCategory : "Private trip";

  useEffect(() => {
    if (effectiveDayCount === 0) {
      setActivitiesByDay([]);
      return;
    }

    setActivitiesByDay((prev) => {
      const next = [...prev];
      while (next.length < effectiveDayCount) {
        next.push([emptyActivity()]);
      }
      while (next.length > effectiveDayCount) {
        next.pop();
      }
      return next;
    });
  }, [effectiveDayCount]);

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

  const removeDestinationInEdit = (index: number) => {
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

  const toggleTravelMethod = (method: string) => {
    setTravelMethodsSelected((prev) => (prev.includes(method) ? prev.filter((item) => item !== method) : [...prev, method]));
  };

  const togglePaymentMethod = (method: PaymentMethod) => {
    setPaymentMethods((prev) => (prev.includes(method) ? prev.filter((item) => item !== method) : [...prev, method]));
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
    if (!isOnDemandTrip && !isEditMode && leadTimeTripCategories.includes(allowedTripCategory) && (!startDate || startDate < minStartDate)) {
      issues.push(`For guided trips, start date must be at least 3 days from today (${minStartDate}).`);
    }
    if (!isOnDemandTrip && startDate && endDate && endDate < startDate) {
      issues.push("End date must be the same as or later than the start date.");
    }
    if (!isOnDemandTrip && startDate && endDate && startDate === endDate) {
      const startMinutes = timeToMinutes(startTime);
      const endMinutes = timeToMinutes(endTime);
      if (!Number.isNaN(startMinutes) && !Number.isNaN(endMinutes) && endMinutes <= startMinutes) {
        issues.push("For a one-day trip, end time must be later than start time.");
      }
    }
    const hasManualDest = destinations.some((d) => d.name.trim() && d.latitude.trim() && d.longitude.trim());
    const hasSelectedDest = selectedTravelDestinations.length > 0;
    if (!hasManualDest && !hasSelectedDest) {
      issues.push("At least one destination with latitude and longitude is required. Add one in Destinations or pick from Travel Destinations.");
    }
    if (isOnDemandTrip) {
      if (Number(onDemandDurationDays) <= 0) issues.push("Select a trip duration.");
      if (!selectedDuration) issues.push("Select a trip duration.");
    } else {
      if (!startDate || !endDate) issues.push("Start date and end date are required.");
      if (!startTime) issues.push("Start time is required.");
      if (!endTime) issues.push("End time is required.");
    }
    if (!isOnDemandTrip && !startLocation.trim()) issues.push("Start location is required.");
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

    const generatedStartDate = syntheticAiDates.startDate || minStartDate;
    const generatedEndDate = syntheticAiDates.endDate || generatedStartDate;

    const payload = {
      tripName: tripName.trim(),
      tripCategory: allowedTripCategory,
      destinations: destinationsPayload,
      startDate: generatedStartDate,
      endDate: generatedEndDate,
      ...(isOnDemandTrip
        ? {}
        : {
            startTime: to12Hour(startTime),
            endTime: to12Hour(endTime),
            startLocation: startLocation.trim(),
          }),
      included: {
        hotelFacilities: toLines(hotelFacilitiesEditor),
        transportFacilities: travelMethodsSelected,
        otherInclusions: toLines(otherInclusionsEditor),
        exclusions: toLines(exclusionsEditor),
      },
      maxParticipants: Number(maxParticipants),
    };

    setIsGenerating(true);
    try {
      const resp = await tripPlanService.generateAutoItinerary(payload, token);
      const days: any[] = resp?.days ?? [];

      const next: ActivityFormItem[][] = Array.from({ length: effectiveDayCount }, (_, i) => []);
      for (let i = 0; i < effectiveDayCount; i++) {
        const day = days[i];
        if (!day || !Array.isArray(day.activities) || day.activities.length === 0) {
          next[i] = [emptyActivity()];
          continue;
        }

        next[i] = day.activities.map((act: any) => ({
          title: act.activity || act.title || "",
          startTime: isOnDemandTrip ? "" : parse12HourTo24(act.startTime || ""),
          endTime: isOnDemandTrip ? "" : parse12HourTo24(act.endTime || ""),
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

    setActivitiesByDay(() => Array.from({ length: effectiveDayCount }, () => [emptyActivity()]));
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
    if (!isOnDemandTrip && (!startDate || !endDate)) issues.push("Start date and end date are required.");
    if (!isOnDemandTrip && !isEditMode && leadTimeTripCategories.includes(allowedTripCategory) && (!startDate || startDate < minStartDate)) {
      issues.push(`For guided trips, start date must be at least 3 days from today (${minStartDate}).`);
    }
    if (!isOnDemandTrip && startDate && endDate && endDate < startDate) {
      issues.push("End date must be the same as or later than the start date.");
    }
    if (!isOnDemandTrip && startDate && endDate && startDate === endDate) {
      const startMinutes = timeToMinutes(startTime);
      const endMinutes = timeToMinutes(endTime);
      if (!Number.isNaN(startMinutes) && !Number.isNaN(endMinutes) && endMinutes <= startMinutes) {
        issues.push("For a one-day trip, end time must be later than start time.");
      }
    }
    if (!isOnDemandTrip && !startTime) issues.push("Start time is required.");
    if (!isOnDemandTrip && pickupType === "Meet at Location" && !startLocation.trim()) {
      issues.push("Start location is required.");
    }
    if (pickupType !== "Meet at Location" && !pickupStartLocation) {
      issues.push("Pickup origin (Guide's start location) is required.");
    }
    if ((pickupType === "Pickup Available" || isAirportPickupType(pickupType)) && (!pickupCostPerKm.trim() || Number(pickupCostPerKm) <= 0 || Number.isNaN(Number(pickupCostPerKm)))) {
      issues.push("Pickup cost per km must be a positive number.");
    }
    if (!organizerId.trim()) issues.push("Organizer id (user id) is required.");
    if (Number(price) <= 0) issues.push("Price must be greater than 0.");
    if (Number(maxParticipants) <= 0) issues.push("Max participants must be greater than 0.");
    if (paymentMethods.length === 0) issues.push("Select at least one payment method.");

    const hasSelectedDestinations = selectedTravelDestinations.length > 0;
    const hasManualDestinationInput = destinations.some((destination) =>
      [destination.name, destination.description, destination.latitude, destination.longitude, destination.photosEditor].some((value) => value.trim()),
    );

    if (!hasSelectedDestinations) {
      const hasValidManualDestination = destinations.some((destination) => {
        if (!destination.name.trim() || !destination.description.trim()) return false;
        if (!destination.latitude.trim() || !destination.longitude.trim()) return false;
        if (Number.isNaN(Number(destination.latitude)) || Number.isNaN(Number(destination.longitude))) return false;
        return toLines(destination.photosEditor).length > 0;
      });

      const hasInvalidManualDestination = hasManualDestinationInput && destinations.some((destination) => {
        const isBlankRow =
          !destination.name.trim() &&
          !destination.description.trim() &&
          !destination.latitude.trim() &&
          !destination.longitude.trim() &&
          !destination.photosEditor.trim();

        if (isBlankRow) return false;

        const hasAllFields =
          destination.name.trim() &&
          destination.description.trim() &&
          destination.latitude.trim() &&
          destination.longitude.trim() &&
          !Number.isNaN(Number(destination.latitude)) &&
          !Number.isNaN(Number(destination.longitude)) &&
          toLines(destination.photosEditor).length > 0;

        return !hasAllFields;
      });

      if (!hasValidManualDestination || hasInvalidManualDestination) {
        issues.push("Each destination needs name, description, latitude, longitude, and at least one photo URL.");
      }
    }

    const hasInvalidActivities = activitiesByDay.some((day) =>
      day.some(
        (activity) =>
          !activity.title.trim() ||
          (!isOnDemandTrip && (!activity.startTime || !activity.endTime)) ||
          (!isOnDemandTrip && toLines(activity.notesEditor).length === 0),
      ),
    );
    if (hasInvalidActivities) {
      issues.push(isOnDemandTrip ? "Each activity needs a title." : "Each activity needs title, start/end time, and at least one note.");
    }

    const tripPhotos = toLines(tripPhotosEditor);
    if (tripPhotos.length === 0 && tripPhotoFiles.length === 0) {
      issues.push("Add at least one trip photo (upload or URL).");
    }

    setErrors(issues);
    return issues.length === 0;
  };

  const buildTripPayload = (status: "pending" | "draft"): CreateTripApiPayload => {
    const destinationsPayload: TripDestinationPayload[] = [
      ...destinations
        .filter((destination) => {
          const hasAnyInput = [destination.name, destination.description, destination.latitude, destination.longitude, destination.photosEditor].some((value) =>
            value.trim(),
          );

          if (!hasAnyInput) return false;

          return (
            destination.name.trim() &&
            destination.description.trim() &&
            destination.latitude.trim() &&
            destination.longitude.trim() &&
            !Number.isNaN(Number(destination.latitude)) &&
            !Number.isNaN(Number(destination.longitude)) &&
            toLines(destination.photosEditor).length > 0
          );
        })
        .map((destination) => ({
          name: destination.name.trim(),
          description: destination.description.trim(),
          geoCode: {
            latitude: Number(destination.latitude),
            longitude: Number(destination.longitude),
          },
          photos: toLines(destination.photosEditor),
        })),
      ...selectedTravelDestinations.map((destination) => ({
        name: destination.name,
        description: destination.description,
        geoCode: {
          latitude: destination.lat,
          longitude: destination.lng,
        },
        photos: destination.imageUrl ? [destination.imageUrl] : [],
      })),
    ];

    const itineraryDaysPayload: TripItineraryDayPayload[] = activitiesByDay.map((dayActivities, index) => {
      return {
        day: index + 1,
        title: `Day ${index + 1}`,
        activities: dayActivities.map((activity) => ({
          title: activity.title.trim(),
          ...(isOnDemandTrip
            ? {}
            : {
                timeSlot: {
                  startTime: to12Hour(activity.startTime),
                  endTime: to12Hour(activity.endTime),
                },
              }),
          ...(isOnDemandTrip ? {} : { notes: toLines(activity.notesEditor) }),
          isAIGenerated: activity.isAIGenerated ?? false,
        })),
      };
    });

    const manualTripPhotos = toLines(tripPhotosEditor);
    const tripPhotos = [...manualTripPhotos];

    return {
      status,
      tripName: tripName.trim(),
      tripCategory: allowedTripCategory,
      destinations: destinationsPayload,
      mainDestinations: mainDestinations.map((destination) => ({
        name: destination.address.trim(),
        lat: destination.lat,
        lng: destination.lng,
      })),
      startDate,
      endDate,
      startTime,
      endTime,
      startLocation: startLocation.trim(),
      organizer: organizerId.trim(),
      price: Number(price),
      paymentMethods,
      itinerary: {
        days: itineraryDaysPayload,
      },
      pickupType,
      ...(pickupType !== "Meet at Location" && pickupStartLocation ? {
        pickupStartLocation: {
          name: pickupStartLocation.address.trim(),
          lat: pickupStartLocation.lat,
          lng: pickupStartLocation.lng,
        },
      } : {}),
      ...((pickupType === "Pickup Available" || isAirportPickupType(pickupType)) ? {
        pickupCostPerKm: Number(pickupCostPerKm),
      } : {}),
      included: {
        hotelFacilities: dayCount > 1 ? toLines(hotelFacilitiesEditor) : [],
        transportFacilities: travelMethodsSelected,
        otherInclusions: toLines(otherInclusionsEditor),
        exclusions: toLines(exclusionsEditor),
      },
      participants: [],
      photos: tripPhotos,
      coverImage: tripPhotos[0] ?? "",
      description: description.trim(),
      maxParticipants: Number(maxParticipants),
    };
  };

  const buildOnDemandTemplatePayload = (status: "pending" | "draft"): CreateOnDemandTripTemplatePayload => {
    const destinationsPayload = destinations
      .filter((destination) => {
        const hasAnyInput = [destination.name, destination.description, destination.latitude, destination.longitude, destination.photosEditor].some((value) => value.trim());

        if (!hasAnyInput) return false;

        return (
          destination.name.trim() &&
          destination.description.trim() &&
          destination.latitude.trim() &&
          destination.longitude.trim() &&
          !Number.isNaN(Number(destination.latitude)) &&
          !Number.isNaN(Number(destination.longitude)) &&
          toLines(destination.photosEditor).length > 0
        );
      })
      .map((destination) => ({
        name: destination.name.trim(),
        description: destination.description.trim(),
        geoCode: {
          latitude: Number(destination.latitude),
          longitude: Number(destination.longitude),
        },
        photos: toLines(destination.photosEditor),
      }));

    const itineraryDaysPayload: TripItineraryDayPayload[] = activitiesByDay.map((dayActivities, index) => ({
      day: index + 1,
      title: `Day ${index + 1}`,
      activities: dayActivities.map((activity) => ({
        title: activity.title.trim(),
        ...(isOnDemandTrip
          ? {}
          : {
              timeSlot: {
                startTime: to12Hour(activity.startTime),
                endTime: to12Hour(activity.endTime),
              },
            }),
        ...(isOnDemandTrip ? {} : { notes: toLines(activity.notesEditor) }),
        isAIGenerated: activity.isAIGenerated ?? false,
      })),
    }));

    const manualTripPhotos = toLines(tripPhotosEditor);
    const tripPhotos = [...manualTripPhotos];

    return {
      status,
      tripName: tripName.trim(),
      durationLabel: selectedDuration.durationLabel,
      durationDays: selectedDuration.days,
      tripCategory: "On-demand trip",
      destinations: destinationsPayload,
      mainDestinations: mainDestinations.map((destination) => ({
        name: destination.address.trim(),
        lat: destination.lat,
        lng: destination.lng,
      })),
      description: description.trim(),
      organizer: organizerId.trim(),
      price: Number(price),
      itinerary: {
        days: itineraryDaysPayload,
      },
      included: {
        hotelFacilities: toLines(hotelFacilitiesEditor),
        transportFacilities: travelMethodsSelected,
        otherInclusions: toLines(otherInclusionsEditor),
        exclusions: toLines(exclusionsEditor),
      },
      paymentMethods,
      maxParticipants: Number(maxParticipants),
      photos: tripPhotos,
      coverImage: tripPhotos[0] ?? "",
      startLocation: startLocation.trim(),
      pickupType,
      ...(pickupType !== "Meet at Location" && pickupStartLocation ? {
        pickupStartLocation: {
          name: pickupStartLocation.address.trim(),
          lat: pickupStartLocation.lat,
          lng: pickupStartLocation.lng,
        },
      } : {}),
      ...((pickupType === "Pickup Available" || isAirportPickupType(pickupType)) ? {
        pickupCostPerKm: Number(pickupCostPerKm),
      } : {}),
    };
  };

  const submit = async (event?: { preventDefault: () => void }, status: "pending" | "draft" = "pending") => {
    event?.preventDefault();

    if (status === "pending" && !validate()) return;

    if (isEditMode && !editTripId) {
      pushToast({ type: "error", title: "Missing trip id", description: "Cannot update trip without a trip id." });
      return;
    }

    const token = userSessionService.getToken();
    if (!token) {
      setErrors(["Missing auth token. Please login again."]);
      return;
    }

    setSaving(true);

    try {
      let uploadedTripPhotos: string[] = [];
      if (tripPhotoFiles.length > 0) {
        const result = await tripImageUploadService.uploadTripImages(tripPhotoFiles, tripUploadDraftId);
        uploadedTripPhotos = result.downloadUrls;
      }

      if (isOnDemandTrip) {
        const payload = buildOnDemandTemplatePayload(status);
        payload.photos = [...uploadedTripPhotos, ...(payload.photos || [])];
        payload.coverImage = payload.photos[0] ?? "";

        if (isEditMode) {
          await onDemandTripService.updateTemplate(editTripId as string, payload, token);
          pushToast({ type: "success", title: "On-demand trip updated", description: "On-demand trip template was updated successfully." });
        } else {
          await onDemandTripService.createTemplate(payload, token);
          pushToast({
            type: "success",
            title: status === "draft" ? "Template draft saved" : "On-demand trip created",
            description: status === "draft" ? "Template draft was saved successfully." : "On-demand trip template was sent for review.",
          });
        }
      } else {
        const payload = buildTripPayload(status);
        payload.photos = [...uploadedTripPhotos, ...payload.photos];
        payload.coverImage = payload.photos[0] ?? "";

        if (isEditMode) {
          await tripApiService.updateTrip(editTripId as string, payload, token);
          pushToast({ type: "success", title: "Trip updated", description: "Trip was updated successfully." });
        } else {
          await tripApiService.createTrip(payload, token);
          pushToast({
            type: "success",
            title: status === "draft" ? "Draft saved" : "Trip created",
            description: status === "draft" ? "Trip draft was saved successfully." : "Trip was submitted to /trips endpoint.",
          });
        }
      }
      setErrors([]);
      router.push("/dashboard");
    } catch (error) {
      const message = error instanceof Error ? error.message : isEditMode ? "Failed to update trip." : status === "draft" ? "Failed to save draft." : "Failed to create trip.";
      pushToast({
        type: "error",
        title: isEditMode ? "Update failed" : status === "draft" ? "Draft save failed" : "Create trip failed",
        description: message,
      });
    } finally {
      setSaving(false);
    }
  };

  const openTripwaverAIpopup = () => {
    if ((!isOnDemandTrip && (!startDate || !endDate)) || !startLocation.trim()) {
      setTripwaverAIError("Start date, end date, and start destination should be selected.");
      return;
    }

    setTripwaverAIError("");
    setIsTripwaverAIOpen(true);
  };

  const closeTripwaverAIpopup = () => {
    setIsTripwaverAIOpen(false);
  };

  const editModePhotoUrls = useMemo(() => toLines(tripPhotosEditor), [tripPhotosEditor]);

  const removeEditModePhotoUrl = (index: number) => {
    const nextUrls = editModePhotoUrls.filter((_, currentIndex) => currentIndex !== index);
    setTripPhotosEditor(nextUrls.join("\n"));
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title={isEditMode ? "Edit Trip" : "Create Trip"}
        description={
          isEditMode
            ? "Edit and update trip details: schedule, itinerary, and photos."
            : "Create and submit a trip to API with destinations, itinerary, inclusions, and photos."
        }
      />

      <div className="flex flex-wrap items-center gap-2 rounded-2xl border border-border bg-card p-2">
        <Button type="button" variant={tripFlow === "scheduled" ? "default" : "ghost"} onClick={() => setTripFlow("scheduled")}>Scheduled trip</Button>
        <Button type="button" variant={tripFlow === "on-demand" ? "default" : "ghost"} onClick={() => setTripFlow("on-demand")}>On-demand trip</Button>
        <p className="ml-auto text-xs text-muted-foreground">
          {isOnDemandTrip ? "Template trips stay visible until hidden or deleted, then get dated at booking time." : "Fixed-date trips keep the current booking flow."}
        </p>
      </div>

      <form onSubmit={(event) => void submit(event, "pending")} className="space-y-6 border border-border bg-card p-5">
        {/* Section 1: Basic Details */}
        <div className="border border-border rounded-xl overflow-hidden bg-card transition-all">
          <button
            type="button"
            onClick={() => toggleSection("basicDetails")}
            className="flex w-full items-center justify-between p-4 bg-muted/30 hover:bg-muted/50 transition-colors"
          >
            <div className="flex items-center gap-2">
              <h2 className="text-sm font-bold text-foreground uppercase tracking-wider">Basic Details</h2>
              <span className="text-xs text-muted-foreground hidden sm:inline">- Name, category, description</span>
            </div>
            {openSections.basicDetails ? <ChevronUp className="size-4 text-muted-foreground" /> : <ChevronDown className="size-4 text-muted-foreground" />}
          </button>
          
          {openSections.basicDetails && (
            <div className="p-5 border-t border-border space-y-4">
              <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                <div>
                  <label className="mb-1 block text-sm font-medium">Trip Name</label>
                  <Input value={tripName} onChange={(event) => setTripName(event.target.value)} placeholder="e.g., Sri Lanka Southern Escape" />
                </div>
                <div>
                  <label className="mb-1 block text-sm font-medium">Category</label>
                  <select
                    value={tripCategory}
                    onChange={(event) => {
                      const nextCategory = event.target.value as TripCategory;
                      if (!canSelectAllCategories) {
                        setTripCategory("Private trip");
                        return;
                      }
                      setTripCategory(nextCategory);
                    }}
                    className="h-9 w-full border border-input bg-background px-3 text-sm rounded-md"
                  >
                    {(canSelectAllCategories ? categories : ["Private trip"]).map((categoryItem) => (
                      <option
                        key={categoryItem}
                        value={categoryItem}
                        disabled={!canSelectAllCategories && categoryItem !== "Private trip"}
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
                  className="min-h-24 w-full border border-input bg-background px-3 py-2 text-sm rounded-md"
                  placeholder="Brief overview of this trip..."
                />
              </div>
            </div>
          )}
        </div>

        {/* Section 2: Schedule & Organizer / Template Details */}
        <div className="border border-border rounded-xl overflow-hidden bg-card transition-all">
          <button
            type="button"
            onClick={() => toggleSection("schedule")}
            className="flex w-full items-center justify-between p-4 bg-muted/30 hover:bg-muted/50 transition-colors"
          >
            <div className="flex items-center gap-2">
              <h2 className="text-sm font-bold text-foreground uppercase tracking-wider">
                {isOnDemandTrip ? "Template Details" : "Schedule & Organizer"}
              </h2>
              <span className="text-xs text-muted-foreground hidden sm:inline">
                - {isOnDemandTrip ? "Duration and flexible rules" : "Dates, times, and pickup settings"}
              </span>
            </div>
            {openSections.schedule ? <ChevronUp className="size-4 text-muted-foreground" /> : <ChevronDown className="size-4 text-muted-foreground" />}
          </button>
          
          {openSections.schedule && (
            <div className="p-5 border-t border-border space-y-4">
              {isOnDemandTrip ? (
                <div className="grid grid-cols-1 gap-3 md:grid-cols-2 lg:grid-cols-3">
                  <div>
                    <label className="mb-1 block text-sm font-medium">Duration</label>
                    <select
                      value={onDemandDurationDays}
                      onChange={(event) => setOnDemandDurationDays(event.target.value)}
                      className="h-9 w-full border border-input bg-background px-3 text-sm rounded-md"
                    >
                      {durationOptions.map((option) => (
                        <option key={option.value} value={option.value}>
                          {option.label}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="rounded-xl border border-dashed border-border bg-muted/20 p-4 text-sm text-muted-foreground lg:col-span-2 flex items-center">
                    Flexible date trip. Traveler chooses booking dates later.
                  </div>
                </div>
              ) : (
                <div className="grid grid-cols-1 gap-3 md:grid-cols-2 lg:grid-cols-3">
                  <div>
                    <label className="mb-1 block text-sm font-medium">Start Date</label>
                    <Input
                      type="date"
                      value={startDate}
                      min={isEditMode ? undefined : minStartDate}
                      onChange={(event) => setStartDate(event.target.value)}
                    />
                  </div>
                  <div>
                    <label className="mb-1 block text-sm font-medium">End Date</label>
                    <Input type="date" value={endDate} min={endDateMin} onChange={(event) => setEndDate(event.target.value)} />
                  </div>
                  <div>
                    <label className="mb-1 block text-sm font-medium">Start Time</label>
                    <Input type="time" value={startTime} onChange={(event) => setStartTime(event.target.value)} />
                  </div>
                  <div>
                    <label className="mb-1 block text-sm font-medium">End Time</label>
                    <Input type="time" value={endTime} onChange={(event) => setEndTime(event.target.value)} />
                  </div>
                  <div>
                    <label className="mb-1 block text-sm font-medium">Pickup Option</label>
                    <select
                      value={pickupType}
                      onChange={(event) => {
                        const nextType = event.target.value as PickupType;
                        setPickupType(nextType);

                        const defaultPickupLocation = getDefaultPickupLocation(nextType);
                        if (defaultPickupLocation) {
                          setPickupStartLocation(defaultPickupLocation);
                          setStartLocation(defaultPickupLocation.address);
                        }
                      }}
                      className="h-9 w-full border border-input bg-background px-3 text-sm rounded-md"
                    >
                      {pickupTypeOptions.map((option) => (
                        <option key={option.value} value={option.value}>
                          {option.label}
                        </option>
                      ))}
                    </select>
                  </div>

                  {pickupType === "Meet at Location" ? (
                    <div>
                      <label className="mb-1 block text-sm font-medium">Start Location</label>
                      <LocationPicker
                        value={startLocation ? { address: startLocation, lat: mainDestination?.lat ?? 0, lng: mainDestination?.lng ?? 0 } : undefined}
                        onChange={(location) => {
                          setStartLocation(location.address);
                        }}
                      />
                    </div>
                  ) : (
                    <>
                      <div>
                        <label className="mb-1 block text-sm font-medium">Pickup Origin (Guide&apos;s start location)</label>
                        <LocationPicker
                          value={pickupStartLocation}
                          onChange={(location) => {
                            setPickupStartLocation(location);
                            setStartLocation(location.address);
                          }}
                        />
                      </div>
                      {pickupType === "Pickup Available" || isAirportPickupType(pickupType) ? (
                        <div>
                          <label className="mb-1 block text-sm font-medium">Pickup Cost Per Km (LKR)</label>
                          <Input
                            type="number"
                            min={0}
                            value={pickupCostPerKm}
                            onChange={(event) => setPickupCostPerKm(event.target.value)}
                            placeholder="e.g., 100"
                          />
                        </div>
                      ) : null}
                    </>
                  )}
                  <div>
                    <label className="mb-1 block text-sm font-medium">Organizer ID</label>
                    <Input value={organizerId} onChange={(event) => setOrganizerId(event.target.value)} placeholder="user_12345" />
                  </div>
                  <div>
                    <label className="mb-1 block text-sm font-medium">Organizer Name</label>
                    <Input value={organizerName} readOnly />
                  </div>
                </div>
              )}
            </div>
          )}
        </div>


        {/* Section 3: Add Main Destinations */}
        <div className="border border-border rounded-xl overflow-hidden bg-card transition-all">
          <button
            type="button"
            onClick={() => toggleSection("mainDestinations")}
            className="flex w-full items-center justify-between p-4 bg-muted/30 hover:bg-muted/50 transition-colors"
          >
            <div className="flex items-center gap-2">
              <h2 className="text-sm font-bold text-foreground uppercase tracking-wider">Add Main Destinations</h2>
              <span className="text-xs text-muted-foreground hidden sm:inline">- Cities & route highlights</span>
            </div>
            {openSections.mainDestinations ? <ChevronUp className="size-4 text-muted-foreground" /> : <ChevronDown className="size-4 text-muted-foreground" />}
          </button>
          
          {openSections.mainDestinations && (
            <div className="p-5 border-t border-border space-y-4">
              <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
                <div className="space-y-3">
                  <LocationPicker value={mainDestination} onChange={setMainDestination} />
                  <div className="flex justify-end">
                    <Button type="button" variant="outline" onClick={addMainDestination}>
                      Add to Route
                    </Button>
                  </div>
                </div>
                <div className="space-y-3 rounded-lg border border-border p-3">
                  <div className="flex items-center justify-between">
                    <h3 className="text-sm font-medium">Main Route Destinations</h3>
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-muted-foreground font-semibold">{mainDestinations.length} added</span>
                      <Button type="button" variant="outline" size="sm" onClick={loadTravelDestinations} disabled={isLoadingTravelDestinations}>
                        {isLoadingTravelDestinations ? "Loading..." : "Get Recommendations"}
                      </Button>
                    </div>
                  </div>
                  {mainDestinations.length === 0 ? (
                    <p className="text-sm text-muted-foreground">No main destinations added yet.</p>
                  ) : (
                    <div className="space-y-2">
                      {mainDestinations.map((destination, index) => (
                        <div key={`${destination.address}-${index}`} className="flex items-center justify-between gap-2 rounded border border-border px-3 py-2 bg-muted/20">
                          <div className="text-sm min-w-0">
                            <p className="font-medium truncate">{destination.address}</p>
                            <p className="text-xs text-muted-foreground">
                              {destination.lat.toFixed(5)}, {destination.lng.toFixed(5)}
                            </p>
                          </div>
                          <Button type="button" variant="ghost" size="sm" onClick={() => removeMainDestination(index)}>
                            Remove
                          </Button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Section 4: Recommended Locations */}
        <div className="border border-border rounded-xl overflow-hidden bg-card transition-all">
          <button
            type="button"
            onClick={() => toggleSection("travelDestinations")}
            className="flex w-full items-center justify-between p-4 bg-muted/30 hover:bg-muted/50 transition-colors"
          >
            <div className="flex items-center gap-2">
              <h2 className="text-sm font-bold text-foreground uppercase tracking-wider">Recommended Attractions</h2>
              <span className="text-xs text-muted-foreground hidden sm:inline">- Sightseeing recommendations near your route</span>
            </div>
            {openSections.travelDestinations ? <ChevronUp className="size-4 text-muted-foreground" /> : <ChevronDown className="size-4 text-muted-foreground" />}
          </button>
          
          {openSections.travelDestinations && (
            <div className="p-5 border-t border-border space-y-4">
              {travelDestinationGroups.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-4">Click &quot;Get Recommendations&quot; in the Main Destinations section to find nearby sightseeing spots.</p>
              ) : (
                <div className="space-y-6">
                  {travelDestinationGroups.map((group, groupIndex) => (
                    <div key={`${group.location}-${groupIndex}`} className="space-y-3">
                      <h3 className="text-sm font-semibold border-b pb-1 text-primary">{group.location}</h3>
                      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
                        <div className="space-y-2">
                          <p className="text-xs font-semibold text-muted-foreground">Nearby Places</p>
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
                        <div className="space-y-2 rounded-lg border border-dashed border-border p-3 bg-muted/10">
                          <p className="text-xs font-semibold text-muted-foreground">Selected Attractions</p>
                          {selectedTravelDestinations.filter((item) => item.location === group.location).length === 0 ? (
                            <p className="text-xs text-muted-foreground py-2">Click places on the left to add them to your trip.</p>
                          ) : (
                            <div className="space-y-2">
                              {selectedTravelDestinations
                                .filter((item) => item.location === group.location)
                                .map((item) => (
                                  <button
                                    key={`${item.location}-${item.name}`}
                                    type="button"
                                    onClick={() => removeSelectedTravelDestination(item.location, item.name)}
                                    className="flex w-full items-center gap-3 rounded border border-border bg-background p-2 text-left transition hover:bg-accent hover:border-destructive/30"
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
            </div>
          )}
        </div>

        {/* Section 5: Selected Destinations (Edit Mode Only) */}
        {isEditMode && (
          <div className="border border-border rounded-xl overflow-hidden bg-card transition-all">
            <button
              type="button"
              onClick={() => toggleSection("selectedDestinations")}
              className="flex w-full items-center justify-between p-4 bg-muted/30 hover:bg-muted/50 transition-colors"
            >
              <div className="flex items-center gap-2">
                <h2 className="text-sm font-bold text-foreground uppercase tracking-wider">Saved Trip Destinations</h2>
                <span className="text-xs text-muted-foreground hidden sm:inline">- {destinations.length} destinations saved</span>
              </div>
              {openSections.selectedDestinations ? <ChevronUp className="size-4 text-muted-foreground" /> : <ChevronDown className="size-4 text-muted-foreground" />}
            </button>
            
            {openSections.selectedDestinations && (
              <div className="p-5 border-t border-border space-y-4">
                {destinations.length === 0 ? (
                  <p className="text-sm text-muted-foreground">No saved destinations found.</p>
                ) : (
                  <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-3">
                    {destinations.map((destination, index) => {
                      const firstPhoto = toLines(destination.photosEditor)[0];
                      return (
                        <div key={`${destination.name}-${index}`} className="relative rounded-lg border border-border bg-card p-3">
                          <button
                            type="button"
                            onClick={() => removeDestinationInEdit(index)}
                            className="absolute right-2 top-2 rounded border border-border bg-background px-2 py-0.5 text-xs text-muted-foreground hover:bg-accent"
                            aria-label={`Remove destination ${destination.name || index + 1}`}
                          >
                            Remove
                          </button>
                          {firstPhoto ? (
                            <img src={firstPhoto} alt={destination.name || "Destination"} className="mb-2 h-24 w-full rounded object-cover" />
                          ) : null}
                          <p className="pr-16 text-sm font-medium truncate">{destination.name || "Unnamed destination"}</p>
                          <p className="text-xs text-muted-foreground truncate">{destination.description || "No description"}</p>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}
          </div>
        )}

  

        {/* Section 6: Transport Modes */}
        <div className="border border-border rounded-xl overflow-hidden bg-card transition-all">
          <button
            type="button"
            onClick={() => toggleSection("travelBy")}
            className="flex w-full items-center justify-between p-4 bg-muted/30 hover:bg-muted/50 transition-colors"
          >
            <div className="flex items-center gap-2">
              <h2 className="text-sm font-bold text-foreground uppercase tracking-wider">Transport Modes</h2>
              <span className="text-xs text-muted-foreground hidden sm:inline">- Choose transport options</span>
            </div>
            {openSections.travelBy ? <ChevronUp className="size-4 text-muted-foreground" /> : <ChevronDown className="size-4 text-muted-foreground" />}
          </button>
          
          {openSections.travelBy && (
            <div className="p-5 border-t border-border space-y-4">
              <div className="grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-4">
                {travelMethods.map((method) => {
                  const Icon = method.icon;
                  const isSelected = travelMethodsSelected.includes(method.label);
                  return (
                    <button
                      key={method.key}
                      type="button"
                      onClick={() => toggleTravelMethod(method.label)}
                      className={
                        "flex items-center gap-2 rounded-lg border px-3 py-2 text-left transition" +
                        (isSelected ? " border-primary bg-primary/10" : " border-border bg-card hover:bg-accent")
                      }
                    >
                      <Icon className="size-4 text-muted-foreground" />
                      <span className="text-sm font-medium">{method.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* Section 7: Payment Methods */}
        <div className="border border-border rounded-xl overflow-hidden bg-card transition-all">
          <button
            type="button"
            onClick={() => toggleSection("paymentMethod")}
            className="flex w-full items-center justify-between p-4 bg-muted/30 hover:bg-muted/50 transition-colors"
          >
            <div className="flex items-center gap-2">
              <h2 className="text-sm font-bold text-foreground uppercase tracking-wider">Payment Methods</h2>
              <span className="text-xs text-muted-foreground hidden sm:inline">- Select online or on-trip payments</span>
            </div>
            {openSections.paymentMethod ? <ChevronUp className="size-4 text-muted-foreground" /> : <ChevronDown className="size-4 text-muted-foreground" />}
          </button>
          
          {openSections.paymentMethod && (
            <div className="p-5 border-t border-border space-y-4">
              <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                {paymentMethodOptions.map((method) => {
                  const isSelected = paymentMethods.includes(method);

                  return (
                    <label
                      key={method}
                      className={
                        "flex cursor-pointer items-start gap-3 rounded-lg border p-3 text-left transition" +
                        (isSelected ? " border-primary bg-primary/10" : " border-border bg-card hover:bg-accent")
                      }
                    >
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => togglePaymentMethod(method)}
                        className="mt-1"
                      />
                      <span>
                        <span className="block text-sm font-medium">{method}</span>
                        <span className="block text-xs text-muted-foreground">
                          {method === "Pay Online" ? "Guests pay digitally in advance." : "Guests pay the guide on the trip day."}
                        </span>
                      </span>
                    </label>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* Section 8: Inclusions & Exclusions */}
        <div className="border border-border rounded-xl overflow-hidden bg-card transition-all">
          <button
            type="button"
            onClick={() => toggleSection("included")}
            className="flex w-full items-center justify-between p-4 bg-muted/30 hover:bg-muted/50 transition-colors"
          >
            <div className="flex items-center gap-2">
              <h2 className="text-sm font-bold text-foreground uppercase tracking-wider">Inclusions & Exclusions</h2>
              <span className="text-xs text-muted-foreground hidden sm:inline">- Hotel facilities, other inclusions, exclusions</span>
            </div>
            {openSections.included ? <ChevronUp className="size-4 text-muted-foreground" /> : <ChevronDown className="size-4 text-muted-foreground" />}
          </button>
          
          {openSections.included && (
            <div className="p-5 border-t border-border space-y-4">
              <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                <div>
                  <label className="mb-1 block text-sm font-medium">Hotel Facilities (one per line)</label>
                  <textarea
                    value={hotelFacilitiesEditor}
                    onChange={(event) => setHotelFacilitiesEditor(event.target.value)}
                    className="min-h-24 w-full border border-input bg-background px-3 py-2 text-sm rounded-md"
                    placeholder={"3-star hotel\nWiFi\nAir conditioning"}
                  />
                </div>
                <div>
                  <label className="mb-1 block text-sm font-medium">Other Inclusions (one per line)</label>
                  <textarea
                    value={otherInclusionsEditor}
                    onChange={(event) => setOtherInclusionsEditor(event.target.value)}
                    className="min-h-24 w-full border border-input bg-background px-3 py-2 text-sm rounded-md"
                    placeholder={"Breakfast\nGuided tours\nEntrance fees"}
                  />
                </div>
                <div className="md:col-span-2">
                  <label className="mb-1 block text-sm font-medium">Exclusions (one per line)</label>
                  <textarea
                    value={exclusionsEditor}
                    onChange={(event) => setExclusionsEditor(event.target.value)}
                    className="min-h-24 w-full border border-input bg-background px-3 py-2 text-sm rounded-md"
                    placeholder={"Visa fees\nPersonal expenses\nMeals not mentioned"}
                  />
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Section 9: Pricing & Photos */}
        <div className="border border-border rounded-xl overflow-hidden bg-card transition-all">
          <button
            type="button"
            onClick={() => toggleSection("pricingPhotos")}
            className="flex w-full items-center justify-between p-4 bg-muted/30 hover:bg-muted/50 transition-colors"
          >
            <div className="flex items-center gap-2">
              <h2 className="text-sm font-bold text-foreground uppercase tracking-wider">Pricing & Photos</h2>
              <span className="text-xs text-muted-foreground hidden sm:inline">- Cost, traveler limits, images</span>
            </div>
            {openSections.pricingPhotos ? <ChevronUp className="size-4 text-muted-foreground" /> : <ChevronDown className="size-4 text-muted-foreground" />}
          </button>
          
          {openSections.pricingPhotos && (
            <div className="p-5 border-t border-border space-y-4">
              <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                <div>
                  <label className="mb-1 block text-sm font-medium">Price (USD)</label>
                  <Input type="number" value={price} onChange={(event) => setPrice(event.target.value)} placeholder="Price (e.g., 450)" />
                </div>
                <div>
                  <label className="mb-1 block text-sm font-medium">Max Travelers</label>
                  <Input
                    type="number"
                    value={maxParticipants}
                    onChange={(event) => setMaxParticipants(event.target.value)}
                    placeholder="Max participants (e.g., 20)"
                  />
                </div>
              </div>

              <div>
                <label className="mb-1 block text-sm font-medium">Trip Photos</label>
                <div className="flex items-center gap-3">
                  <input
                    type="file"
                    accept="image/*"
                    multiple
                    onChange={handleTripPhotosChange}
                    className="text-sm"
                  />
                </div>

                {tripPhotoFiles.length > 0 ? (
                  <div className="mt-3 grid grid-cols-3 gap-2">
                    {tripPhotoFiles.map((file, idx) => (
                      <div key={`${file.name}-${idx}`} className="flex flex-col items-center gap-1 rounded border p-2 bg-muted/10">
                        <img src={tripPhotoPreviews[idx]} alt={file.name} className="h-20 w-28 rounded object-cover" />
                        <div className="flex items-center gap-2 text-xs w-full justify-between">
                          <span className="truncate max-w-[80px] font-medium">{file.name}</span>
                          <button type="button" className="text-primary text-xs font-semibold" onClick={() => removeTripPhotoFile(idx)}>
                            Remove
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : null}

                {isEditMode && editModePhotoUrls.length > 0 ? (
                  <div className="mt-3 grid grid-cols-2 gap-3 md:grid-cols-3">
                    {editModePhotoUrls.map((photoUrl, index) => (
                      <div key={`${photoUrl}-${index}`} className="relative rounded-lg border border-border p-2">
                        <button
                          type="button"
                          onClick={() => removeEditModePhotoUrl(index)}
                          className="absolute right-2 top-2 rounded border border-border bg-background px-2 py-0.5 text-xs text-muted-foreground hover:bg-accent"
                          aria-label={`Remove photo ${index + 1}`}
                        >
                          Remove
                        </button>
                        <img src={photoUrl} alt={`Trip photo ${index + 1}`} className="h-28 w-full rounded object-cover" />
                      </div>
                    ))}
                  </div>
                ) : null}

                {!isEditMode ? (
                  <div className="mt-4">
                    <label className="mb-1 block text-xs text-muted-foreground">Optional: Paste photo URLs (one per line)</label>
                    <textarea
                      value={tripPhotosEditor}
                      onChange={(event) => setTripPhotosEditor(event.target.value)}
                      className="min-h-24 w-full border border-input bg-background px-3 py-2 text-sm rounded-md"
                      placeholder={"https://example.com/photo1.jpg\nhttps://example.com/photo2.jpg"}
                    />
                  </div>
                ) : null}
              </div>
            </div>
          )}
        </div>

        {/* Section 10: Itinerary Day Plan */}
        <div className="border border-border rounded-xl overflow-hidden bg-card transition-all">
          <button
            type="button"
            onClick={() => toggleSection("itinerary")}
            className="flex w-full items-center justify-between p-4 bg-muted/30 hover:bg-muted/50 transition-colors"
          >
            <div className="flex items-center gap-2">
              <h2 className="text-sm font-bold text-foreground uppercase tracking-wider">Itinerary Day Plan</h2>
              <span className="text-xs text-muted-foreground hidden sm:inline">- Daily schedule of activities</span>
            </div>
            {openSections.itinerary ? <ChevronUp className="size-4 text-muted-foreground" /> : <ChevronDown className="size-4 text-muted-foreground" />}
          </button>
          
          {openSections.itinerary && (
            <div className="p-5 border-t border-border space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-3 bg-muted/20 p-3 rounded-lg">
                <span className="text-xs font-semibold text-muted-foreground">{effectiveDayCount} day(s) planned</span>
                <div className="flex items-center gap-2">
                  <Button type="button" variant="outline" size="sm" onClick={generateItinerary} disabled={isGenerating}>
                    {isGenerating ? "Generating..." : "AI Generate Plan"}
                  </Button>
                  <Button type="button" variant="outline" size="sm" onClick={clearEntireGenerated}>
                    Reset All
                  </Button>
                </div>
              </div>

              {effectiveDayCount === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-4">
                  {isOnDemandTrip ? "Select duration in Template Details to build schedule." : "Select dates in Schedule Details to build schedule."}
                </p>
              ) : (
                <div className="space-y-4">
                  {activitiesByDay.map((dayActivities, dayIndex) => (
                    <div key={dayIndex} className="space-y-3 border border-border p-4 rounded-lg bg-muted/5">
                      <div className="flex items-center justify-between border-b pb-2">
                        <p className="text-sm font-bold text-primary">Day {dayIndex + 1}</p>
                        <Button type="button" variant="outline" size="sm" onClick={() => addActivity(dayIndex)}>
                          Add Activity
                        </Button>
                      </div>

                      <div className="space-y-3">
                        {dayActivities.map((item, activityIndex) => (
                          <div key={activityIndex} className="space-y-3 rounded-lg border border-border p-3 bg-background shadow-xs">
                            <div className="flex items-center justify-between">
                              <p className="text-xs font-semibold text-muted-foreground">Activity {activityIndex + 1}</p>
                              <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                className="text-xs text-destructive hover:text-destructive hover:bg-destructive/10"
                                onClick={() => removeActivity(dayIndex, activityIndex)}
                                disabled={dayActivities.length === 1}
                              >
                                Remove
                              </Button>
                            </div>

                            <Input
                              value={item.title}
                              onChange={(event) => updateActivity(dayIndex, activityIndex, "title", event.target.value)}
                              placeholder="e.g., Hotel arrival & check-in"
                            />

                            {!isOnDemandTrip ? (
                              <div className="grid grid-cols-2 gap-3">
                                <div>
                                  <label className="mb-1 block text-[10px] font-bold text-muted-foreground uppercase">Start Time</label>
                                  <Input
                                    type="time"
                                    value={item.startTime}
                                    onChange={(event) => updateActivity(dayIndex, activityIndex, "startTime", event.target.value)}
                                  />
                                </div>
                                <div>
                                  <label className="mb-1 block text-[10px] font-bold text-muted-foreground uppercase">End Time</label>
                                  <Input
                                    type="time"
                                    value={item.endTime}
                                    onChange={(event) => updateActivity(dayIndex, activityIndex, "endTime", event.target.value)}
                                  />
                                </div>
                              </div>
                            ) : null}

                            <div>
                              <label className="mb-1 block text-[10px] font-bold text-muted-foreground uppercase">Notes (one per line)</label>
                              <textarea
                                value={item.notesEditor}
                                onChange={(event) => updateActivity(dayIndex, activityIndex, "notesEditor", event.target.value)}
                                className="min-h-20 w-full border border-input bg-background px-3 py-2 text-sm rounded-md"
                                placeholder={"e.g., Transfer to hotel\nWelcome drinks on arrival"}
                              />
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        {errors.length > 0 ? (
          <div className="border border-destructive/30 bg-destructive/5 p-3 text-sm text-destructive">
            {errors.map((error) => (
              <p key={error}>{error}</p>
            ))}
          </div>
        ) : null}

        <div className="flex gap-2">
          <Button type="submit" disabled={saving}>{saving ? "Saving..." : isEditMode ? "Update Trip" : "Create Trip"}</Button>
          <Button type="button" variant="outline" onClick={() => void submit(undefined, "draft")} disabled={saving}>
            Save as local draft
          </Button>
        </div>
      </form>

      <SavingOverlay
        open={saving}
        title="Saving trip..."
        description="Uploading photos, preparing trip data, and submitting everything now."
      />

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
