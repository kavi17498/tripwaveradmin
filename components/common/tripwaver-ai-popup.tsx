"use client";

import React, { useEffect, useMemo, useState } from "react";
import LocationPicker from "@/components/common/locationpicker";

type TripwaverAIPopupProps = {
  isOpen: boolean;
  startDate: string;
  endDate: string;
  startLocation: string;
  onClose: () => void;
};

type LocationValue = {
  lat: number;
  lng: number;
  address: string;
};

export default function TripwaverAIPopup({
  isOpen,
  startDate,
  endDate,
  startLocation,
  onClose,
}: TripwaverAIPopupProps) {
  if (!isOpen) return null;

  const dayCount = useMemo(() => {
    const start = new Date(startDate);
    const end = new Date(endDate);
    if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) return 0;
    const diffMs = end.getTime() - start.getTime();
    if (diffMs < 0) return 0;
    return Math.floor(diffMs / (1000 * 60 * 60 * 24)) + 1;
  }, [startDate, endDate]);

  const [selectedLocation, setSelectedLocation] = useState<LocationValue | null>(null);
  const [mainLocations, setMainLocations] = useState<LocationValue[]>([]);
  const [autoDestinations, setAutoDestinations] = useState<string[]>([]);

  useEffect(() => {
    if (dayCount <= 0) {
      setMainLocations([]);
      setAutoDestinations([]);
      return;
    }

    setMainLocations((prev) => prev.slice(0, dayCount));
  }, [dayCount]);

  useEffect(() => {
    if (mainLocations.length === 0) {
      setAutoDestinations([]);
      return;
    }

    const placeholder = mainLocations.map((location, index) =>
      `Suggested destinations for ${location.address || `Location ${index + 1}`}`
    );
    setAutoDestinations(placeholder);
  }, [mainLocations]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="w-full max-w-2xl rounded-lg border border-border bg-card p-4 shadow-lg">
        <div className="flex items-center justify-between">
          <h3 className="text-base font-semibold">TripWaver AI</h3>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close TripWaver AI popup"
            className="flex h-8 w-8 items-center justify-center rounded border border-border text-lg"
          >
            ×
          </button>
        </div>
        <div className="mt-3 text-sm text-muted-foreground">
          Start location: {startLocation || "Not selected"}
        </div>
        <div className="mt-1 text-sm">
          You are planning {dayCount} day{dayCount === 1 ? "" : "s"} trip from {startLocation || "your start location"}.
        </div>

        {dayCount === 0 ? (
          <div className="mt-4 rounded border border-destructive/30 bg-destructive/5 p-3 text-sm text-destructive">
            Select a valid start date and end date to continue.
          </div>
        ) : (
          <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-[1fr_1.2fr]">
            <div className="space-y-4">
              <div className="space-y-2 rounded border border-border p-3">
                <p className="text-sm font-medium">Selected location</p>
                <p className="text-xs text-muted-foreground">
                  {selectedLocation?.address || "Click the map to choose a location."}
                </p>
                <div className="flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      if (!selectedLocation) return;
                      setMainLocations((prev) => {
                        if (prev.length >= dayCount) return prev;
                        return [...prev, selectedLocation];
                      });
                    }}
                    className="rounded border border-border px-3 py-1 text-xs"
                    disabled={!selectedLocation || mainLocations.length >= dayCount}
                  >
                    Add as main location
                  </button>
                </div>
              </div>

              <div className="space-y-2">
                <p className="text-sm font-medium">Main locations ({mainLocations.length}/{dayCount})</p>
                {mainLocations.length === 0 ? (
                  <p className="text-xs text-muted-foreground">No main locations added yet.</p>
                ) : (
                  <ul className="space-y-2 text-xs">
                    {mainLocations.map((location, index) => (
                      <li key={`main-location-${index}`} className="flex items-start justify-between gap-2">
                        <span className="text-muted-foreground">
                          {index + 1}. {location.address || `${location.lat}, ${location.lng}`}
                        </span>
                        <button
                          type="button"
                          onClick={() =>
                            setMainLocations((prev) => prev.filter((_, currentIndex) => currentIndex !== index))
                          }
                          className="rounded border border-border px-2 py-0.5"
                        >
                          Remove
                        </button>
                      </li>
                    ))}
                  </ul>
                )}
              </div>

              <div className="space-y-2">
                <p className="text-sm font-medium">Auto destinations</p>
                {autoDestinations.length === 0 ? (
                  <p className="text-xs text-muted-foreground">
                    Add main locations to see suggested destinations.
                  </p>
                ) : (
                  <ul className="space-y-1 text-xs text-muted-foreground">
                    {autoDestinations.map((destination, index) => (
                      <li key={`auto-destination-${index}`}>{destination}</li>
                    ))}
                  </ul>
                )}
              </div>
            </div>

            <div className="space-y-2">
              <p className="text-sm font-medium">Map</p>
              <LocationPicker value={selectedLocation} onChange={setSelectedLocation} />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
