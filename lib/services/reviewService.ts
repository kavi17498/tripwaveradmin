import { mockBookings } from "@/lib/data/bookings";
import { mockReviews } from "@/lib/data/reviews";
import { mockTrips } from "@/lib/data/trips";
import { notificationService } from "@/lib/services/notificationService";
import type { TripApiItem } from "@/lib/services/tripApiService";
import { apiClient } from "@/lib/services/apiClient";
import { userSessionService } from "@/lib/services/userSessionService";
import { Booking, Review, ServiceResponse, Trip } from "@/lib/types";
import { sleep } from "@/lib/services/serviceUtils";

export interface ParticipantReviewSummary {
  trip: Trip;
  booking: Booking;
  reviews: Review[];
  myReview: Review | null;
  participantCount: number;
  tripEnded: boolean;
  canReview: boolean;
  reminderSent: boolean;
}

export interface OrganizedTripReviewSummary {
  trip: TripApiItem;
  participantCount: number;
  reviewCount: number;
  reviews: Review[];
}

export type ReviewSubmission = {
  tripId: string;
  userId: string;
  userName: string;
  rating: number;
  comment?: string;
};

type BackendReview = {
  id?: string;
  tripId: string;
  userId: string;
  userName: string;
  rating: number;
  comment: string;
  createdAt: string;
  updatedAt: string;
};

type BackendTripReviewSummary = {
  tripId: string;
  tripName: string;
  destination: string;
  startDate: string;
  endDate: string;
  startTime?: string;
  endTime?: string;
  participantId?: string;
  participantName: string;
  participantEmail?: string;
  bookingSeatCount: number;
  participantCount: number;
  tripEnded: boolean;
  canReview: boolean;
  reminderSent: boolean;
  reviews: BackendReview[];
  myReview?: BackendReview | null;
};

type BackendOrganizedTripReviewSummary = {
  trip: TripApiItem;
  participantCount: number;
  reviewCount: number;
  reviews: BackendReview[];
};

const reviewStore = mockReviews.map((review) => ({ ...review }));

const normalizeEndTime = (endTime?: string) => {
  if (!endTime) return "23:59:59.999";

  const trimmedEndTime = endTime.trim();
  if (/^\d{2}:\d{2}$/.test(trimmedEndTime)) return `${trimmedEndTime}:59.999`;
  if (/^\d{2}:\d{2}:\d{2}$/.test(trimmedEndTime)) return `${trimmedEndTime}.999`;

  return trimmedEndTime;
};

const getTripEndDateTime = (trip: Trip) => {
  const endDateTime = new Date(`${trip.endDate}T${normalizeEndTime(trip.endTime)}`);
  return Number.isNaN(endDateTime.getTime()) ? null : endDateTime;
};

const isTripEnded = (trip: Trip) => {
  const endDateTime = getTripEndDateTime(trip);
  return endDateTime ? Date.now() > endDateTime.getTime() : false;
};

const getTripReviews = (tripId: string) => {
  return reviewStore.filter((review) => review.tripId === tripId).sort((left, right) => right.createdAt.localeCompare(left.createdAt));
};

const getParticipantBookings = (userId: string) => {
  return mockBookings.filter((booking) => booking.userId === userId);
};

const getTripForBooking = (booking: Booking) => {
  return mockTrips.find((trip) => trip.id === booking.tripId) ?? null;
};

const ensurePostTripReminder = (trip: Trip, booking: Booking, tripEnded: boolean, reviews: Review[]) => {
  if (!tripEnded) return false;
  if (booking.status !== "approved" && booking.status !== "paid") return false;
  if (reviews.some((review) => review.userId === booking.userId)) return false;

  notificationService.queueMockNotification({
    userId: booking.userId,
    type: "reminder",
    title: `Post your review for ${trip.title}`,
    description: `Your ${trip.destination} trip has ended. Share your experience with the other participants.`,
    tripId: trip.id,
    read: false,
  });

  return true;
};

const toTripDurationDays = (startDate: string, endDate: string) => {
  const start = new Date(startDate);
  const end = new Date(endDate);
  if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) return 0;

  const diff = Math.max(0, Math.round((end.getTime() - start.getTime()) / 86400000));
  return diff + 1;
};

const toOrganizerTripApiItem = (trip: Trip): TripApiItem => ({
  id: trip.id,
  tripName: trip.title,
  tripCategory: trip.tripType,
  destinations: [
    {
      name: trip.destination,
      description: trip.description,
      geoCode: {
        latitude: trip.location.lat,
        longitude: trip.location.lng,
      },
      photos: trip.coverImage ? [trip.coverImage] : [],
    },
  ],
  mainDestinations: [
    {
      name: trip.destination,
      lat: trip.location.lat,
      lng: trip.location.lng,
    },
  ],
  startDate: trip.startDate,
  endDate: trip.endDate,
  startTime: trip.startTime,
  endTime: trip.endTime,
  startLocation: trip.destination,
  organizer: trip.organizerName || trip.organizerId,
  price: trip.price,
  itinerary: undefined,
  included: undefined,
  participants: [],
  photos: trip.coverImage ? [trip.coverImage] : [],
  coverImage: trip.coverImage,
  description: trip.description,
  maxParticipants: trip.capacity,
  status: trip.status,
});

const toFrontendTrip = (summary: BackendTripReviewSummary): Trip => ({
  id: summary.tripId,
  title: summary.tripName,
  destination: summary.destination,
  description: `${summary.tripName} review summary`,
  startDate: summary.startDate,
  endDate: summary.endDate,
  startTime: summary.startTime,
  endTime: summary.endTime,
  price: 0,
  capacity: summary.participantCount || summary.bookingSeatCount,
  bookedCount: summary.participantCount,
  durationDays: toTripDurationDays(summary.startDate, summary.endDate),
  tripType: "public",
  status: summary.tripEnded ? "completed" : "published",
  coverImage: "",
  organizerId: "",
  organizerName: "",
  organizerRating: 0,
  location: { city: summary.destination, country: "", lat: 0, lng: 0 },
  included: [],
  excluded: [],
  itinerary: [],
});

const toFrontendBooking = (summary: BackendTripReviewSummary, userId: string): Booking => ({
  id: `${summary.tripId}:${summary.participantId ?? summary.participantName}`,
  tripId: summary.tripId,
  userId,
  participantName: summary.participantName,
  participantEmail: summary.participantEmail ?? "",
  seats: summary.bookingSeatCount,
  totalAmount: 0,
  status: summary.tripEnded ? "paid" : "approved",
  requestedAt: summary.startDate,
});

const toFrontendReview = (review: BackendReview): Review => ({
  id: review.id ?? `${review.tripId}:${review.userId}:${review.createdAt}`,
  tripId: review.tripId,
  userId: review.userId,
  userName: review.userName,
  rating: review.rating,
  comment: review.comment,
  createdAt: review.createdAt,
});

const mapBackendSummary = (summary: BackendTripReviewSummary, userId: string): ParticipantReviewSummary => {
  const reviews = summary.reviews.map(toFrontendReview);
  const myReview = summary.myReview ? toFrontendReview(summary.myReview) : null;

  return {
    trip: toFrontendTrip(summary),
    booking: toFrontendBooking(summary, userId),
    reviews,
    myReview,
    participantCount: summary.participantCount,
    tripEnded: summary.tripEnded,
    canReview: summary.canReview,
    reminderSent: summary.reminderSent,
  };
};

const mapBackendOrganizedSummary = (summary: BackendOrganizedTripReviewSummary): OrganizedTripReviewSummary => ({
  trip: summary.trip,
  participantCount: summary.participantCount,
  reviewCount: summary.reviewCount,
  reviews: summary.reviews.map(toFrontendReview),
});

export const reviewService = {
  async getReviewsByTrip(tripId: string): Promise<ServiceResponse<Review[]>> {
    const token = userSessionService.getToken();

    if (token) {
      const response = await apiClient.authenticatedRequest<BackendReview[]>(`/reviews/trip/${tripId}`, token, {
        method: "GET",
      });

      return { data: response.map(toFrontendReview) };
    }

    await sleep(400);
    return { data: getTripReviews(tripId) };
  },

  async getParticipantReviewSummaries(userId: string): Promise<ServiceResponse<ParticipantReviewSummary[]>> {
    const token = userSessionService.getToken();

    if (token) {
      const response = await apiClient.authenticatedRequest<BackendTripReviewSummary[]>("/reviews/me", token, {
        method: "GET",
      });

      return { data: response.map((summary) => mapBackendSummary(summary, userId)) };
    }

    await sleep(450);

    const participantBookings = getParticipantBookings(userId);
    const summaries = participantBookings
      .map((booking) => {
        const trip = getTripForBooking(booking);
        if (!trip) return null;

        const reviews = getTripReviews(trip.id);
        const tripEnded = isTripEnded(trip);
        const reminderSent = ensurePostTripReminder(trip, booking, tripEnded, reviews);
        const myReview = reviews.find((review) => review.userId === booking.userId) ?? null;

        return {
          trip,
          booking,
          reviews,
          myReview,
          participantCount: mockBookings.filter((item) => item.tripId === trip.id).length,
          tripEnded,
          canReview: tripEnded && (booking.status === "approved" || booking.status === "paid") && !myReview,
          reminderSent,
        } satisfies ParticipantReviewSummary;
      })
      .filter((summary): summary is ParticipantReviewSummary => summary !== null)
      .sort((left, right) => {
        if (left.tripEnded !== right.tripEnded) return left.tripEnded ? -1 : 1;
        return right.trip.endDate.localeCompare(left.trip.endDate);
      });

    return { data: summaries };
  },

  async submitReview(payload: ReviewSubmission): Promise<ServiceResponse<Review>> {
    const token = userSessionService.getToken();

    if (token) {
      const response = await apiClient.authenticatedRequest<BackendReview>("/reviews", token, {
        method: "POST",
        body: {
          tripId: payload.tripId,
          rating: payload.rating,
          comment: payload.comment?.trim() || undefined,
          userName: payload.userName,
        },
      });

      return { data: toFrontendReview(response), message: "Review submitted" };
    }

    await sleep(450);

    const existingReviewIndex = reviewStore.findIndex(
      (review) => review.tripId === payload.tripId && review.userId === payload.userId,
    );

    const submittedReview: Review = {
      ...payload,
      comment: payload.comment?.trim() || "",
      id: existingReviewIndex >= 0 ? reviewStore[existingReviewIndex].id : `r-${Date.now()}`,
      createdAt: existingReviewIndex >= 0 ? reviewStore[existingReviewIndex].createdAt : new Date().toISOString(),
    };

    if (existingReviewIndex >= 0) {
      reviewStore[existingReviewIndex] = submittedReview;
    } else {
      reviewStore.unshift(submittedReview);
    }

    return {
      data: submittedReview,
      message: "Review submitted",
    };
  },

  async getOrganizedTripReviewSummaries(userId: string): Promise<ServiceResponse<OrganizedTripReviewSummary[]>> {
    const token = userSessionService.getToken();

    if (token) {
      const response = await apiClient.authenticatedRequest<BackendOrganizedTripReviewSummary[]>("/reviews/organized", token, {
        method: "GET",
      });

      return { data: response.map(mapBackendOrganizedSummary) };
    }

    await sleep(450);

    const summaries = mockTrips
      .filter((trip) => !trip.organizerId || trip.organizerId === userId)
      .map((trip) => {
        const reviews = getTripReviews(trip.id);
        const apiTrip = toOrganizerTripApiItem(trip);

        return {
          trip: apiTrip,
          participantCount: Array.isArray(apiTrip.participants) ? apiTrip.participants.length : 0,
          reviewCount: reviews.length,
          reviews,
        } satisfies OrganizedTripReviewSummary;
      });

    return { data: summaries };
  },
};
