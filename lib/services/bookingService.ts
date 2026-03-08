import { mockBookings } from "@/lib/data/bookings";
import { Booking, ServiceResponse } from "@/lib/types";
import { sleep } from "@/lib/services/serviceUtils";

export const bookingService = {
  async getBookingsByTrip(tripId: string): Promise<ServiceResponse<Booking[]>> {
    await sleep(450);
    return { data: mockBookings.filter((booking) => booking.tripId === tripId) };
  },

  async submitBooking(payload: Omit<Booking, "id" | "status" | "requestedAt">): Promise<ServiceResponse<Booking>> {
    await sleep(600);
    return {
      data: {
        ...payload,
        id: `b-${Date.now()}`,
        status: "requested",
        requestedAt: new Date().toISOString(),
      },
      message: "Join request submitted",
    };
  },
};
