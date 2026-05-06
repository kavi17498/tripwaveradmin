import React, { useCallback, useEffect, useState } from "react";
import { Input } from "@/components/ui/input";
import {
  GoogleMap,
  Marker,
  useLoadScript,
} from "@react-google-maps/api";
import usePlacesAutocomplete, {
  getGeocode,
  getLatLng,
} from "use-places-autocomplete";

const containerStyle = {
  width: "100%",
  height: "300px",
};

const defaultCenter = {
  lat: 6.9271, // Colombo
  lng: 79.8612,
};

const googleMapsLibraries: ("places")[] = ["places"];
const googleMapsApiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY ?? "";

type LocationValue = {
  lat: number;
  lng: number;
  address: string;
};

type LocationPickerProps = {
  value?: LocationValue | null;
  onChange: (location: LocationValue) => void;
};

function LocationPicker({ value, onChange }: LocationPickerProps) {
  const { isLoaded } = useLoadScript({
    googleMapsApiKey,
    libraries: googleMapsLibraries,
  });

  const [marker, setMarker] = useState<google.maps.LatLngLiteral>(value ?? defaultCenter);

  // 🔍 Autocomplete hook
  const {
    ready,
    value: search,
    setValue,
    suggestions: { status, data },
    clearSuggestions,
    init,
  } = usePlacesAutocomplete({
    debounce: 300,
    initOnMount: false,
    requestOptions: {
      componentRestrictions: { country: "lk" }, // Sri Lanka only
    },
  });

  useEffect(() => {
    if (!isLoaded) return;
    init();
  }, [init, isLoaded]);

  useEffect(() => {
    if (!value) return;
    setMarker({ lat: value.lat, lng: value.lng });
    setValue(value.address, false);
  }, [setValue, value]);

  // 📍 Handle map click
  const handleMapClick = useCallback(async (e: google.maps.MapMouseEvent) => {
    if (!e.latLng) return;

    const lat = e.latLng.lat();
    const lng = e.latLng.lng();

    setMarker({ lat, lng });

    // reverse geocode (lat,lng → address)
    const results = await getGeocode({ location: { lat, lng } });
    const address = results[0]?.formatted_address || "";

    setValue(address, false);
    clearSuggestions();
    onChange({ lat, lng, address });
  }, [clearSuggestions, onChange, setValue]);

  // 📍 Handle marker drag
  const handleMarkerDragEnd = useCallback(async (e: google.maps.MapMouseEvent) => {
    if (!e.latLng) return;

    const lat = e.latLng.lat();
    const lng = e.latLng.lng();

    setMarker({ lat, lng });

    const results = await getGeocode({ location: { lat, lng } });
    const address = results[0]?.formatted_address || "";

    setValue(address, false);
    clearSuggestions();
    onChange({ lat, lng, address });
  }, [clearSuggestions, onChange, setValue]);

  // 🔍 Handle search select
  const handleSelect = async (description: string) => {
    setValue(description, false);
    clearSuggestions();

    const results = await getGeocode({ address: description });
    const { lat, lng } = await getLatLng(results[0]);

    setMarker({ lat, lng });

    onChange({
      lat,
      lng,
      address: description,
    });
  };

  if (!isLoaded) return <div>Loading Map...</div>;

  return (
    <div className="space-y-3">
      
      {/* 🔍 Search Box */}
      <div>
        <Input
          value={search}
          onChange={(event) => setValue(event.target.value)}
          placeholder="Search for a location"
          disabled={!ready}
        />

        {/* Suggestions */}
        {status === "OK" && search.trim().length > 0 && (
          <div className="border rounded bg-white shadow mt-1 max-h-40 overflow-y-auto">
            {data.map(({ place_id, description }) => (
              <div
                key={place_id}
                onClick={() => handleSelect(description)}
                className="p-2 hover:bg-gray-100 cursor-pointer text-sm"
              >
                {description}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* 🗺️ Map */}
      <GoogleMap
        mapContainerStyle={containerStyle}
        center={marker}
        zoom={12}
        onClick={handleMapClick}
      >
        <Marker
          position={marker}
          draggable
          onDragEnd={handleMarkerDragEnd}
        />
      </GoogleMap>

      {/* 📤 Output */}
      <div className="text-xs text-gray-500">
        <p><strong>Lat:</strong> {marker.lat}</p>
        <p><strong>Lng:</strong> {marker.lng}</p>
      </div>
    </div>
  );
}

export default LocationPicker;