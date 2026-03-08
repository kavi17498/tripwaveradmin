import { mockTrips } from "@/lib/data/trips";
import { ServiceResponse, Trip, TripFilters } from "@/lib/types";
import { sleep, sometimesFail } from "@/lib/services/serviceUtils";

const applyFilters = (trips: Trip[], filters: TripFilters): Trip[] => {
  let results = [...trips];

  if (filters.query) {
    const query = filters.query.toLowerCase();
    results = results.filter(
      (trip) => trip.destination.toLowerCase().includes(query) || trip.title.toLowerCase().includes(query),
    );
  }
  if (typeof filters.minPrice === "number") results = results.filter((trip) => trip.price >= filters.minPrice!);
  if (typeof filters.maxPrice === "number") results = results.filter((trip) => trip.price <= filters.maxPrice!);
  if (typeof filters.duration === "number") results = results.filter((trip) => trip.durationDays <= filters.duration!);
  if (filters.startDate) results = results.filter((trip) => trip.startDate >= filters.startDate!);
  if (filters.endDate) results = results.filter((trip) => trip.endDate <= filters.endDate!);

  switch (filters.sortBy) {
    case "price-asc":
      results.sort((a, b) => a.price - b.price);
      break;
    case "price-desc":
      results.sort((a, b) => b.price - a.price);
      break;
    case "date-asc":
      results.sort((a, b) => a.startDate.localeCompare(b.startDate));
      break;
    case "date-desc":
      results.sort((a, b) => b.startDate.localeCompare(a.startDate));
      break;
    default:
      break;
  }

  return results;
};

export const tripService = {
  async getPublicTrips(filters: TripFilters = {}): Promise<ServiceResponse<Trip[]>> {
    await sleep(500);
    sometimesFail(0.03);
    const publicTrips = mockTrips.filter((trip) => trip.tripType === "public" && trip.status === "published");
    return { data: applyFilters(publicTrips, filters) };
  },

  async getMyTrips(userId: string): Promise<ServiceResponse<Trip[]>> {
    await sleep(550);
    void userId;
    return { data: mockTrips };
  },

  async getTripById(id: string): Promise<ServiceResponse<Trip | null>> {
    await sleep(400);
    return { data: mockTrips.find((trip) => trip.id === id) ?? null };
  },

  async createTrip(payload: Omit<Trip, "id" | "bookedCount">): Promise<ServiceResponse<Trip>> {
    await sleep(600);
    const newTrip: Trip = { ...payload, id: `t-${Date.now()}`, bookedCount: 0 };
    return { data: newTrip, message: "Trip created in draft mode" };
  },

  async updateTrip(id: string, payload: Partial<Trip>): Promise<ServiceResponse<Trip | null>> {
    await sleep(500);
    const trip = mockTrips.find((item) => item.id === id);
    if (!trip) return { data: null, message: "Trip not found" };
    return { data: { ...trip, ...payload }, message: "Trip updated" };
  },
};
