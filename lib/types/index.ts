export type UserRole = "traveler" | "organizer" | "admin";

export type EntityStatus = "active" | "inactive" | "pending" | "approved" | "rejected";

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  avatarUrl?: string;
  verifiedOrganizer: boolean;
  status: EntityStatus;
  joinedAt: string;
}

export interface ItineraryItem {
  day: number;
  title: string;
  description: string;
}

export interface Trip {
  id: string;
  title: string;
  destination: string;
  description: string;
  startDate: string;
  endDate: string;
  price: number;
  capacity: number;
  bookedCount: number;
  durationDays: number;
  tripType: "public" | "private";
  status: "draft" | "published" | "ongoing" | "completed" | "cancelled";
  coverImage: string;
  organizerId: string;
  organizerName: string;
  organizerRating: number;
  location: {
    city: string;
    country: string;
    lat: number;
    lng: number;
  };
  included: string[];
  excluded: string[];
  itinerary: ItineraryItem[];
}

export interface Review {
  id: string;
  tripId: string;
  userId: string;
  userName: string;
  rating: number;
  comment: string;
  createdAt: string;
}

export interface Notification {
  id: string;
  userId: string;
  type: "join-request" | "payment" | "reminder" | "account-alert";
  title: string;
  description: string;
  read: boolean;
  createdAt: string;
}

export interface ChatMessage {
  id: string;
  tripId: string;
  senderId: string;
  senderName: string;
  message: string;
  imageUrl?: string;
  createdAt: string;
}

export interface Booking {
  id: string;
  tripId: string;
  userId: string;
  participantName: string;
  participantEmail: string;
  seats: number;
  totalAmount: number;
  status: "requested" | "approved" | "rejected" | "paid";
  requestedAt: string;
}

export interface Payment {
  id: string;
  tripId: string;
  bookingId: string;
  userId: string;
  method: "card" | "bank-transfer" | "wallet";
  amount: number;
  status: "success" | "failed" | "pending";
  paidAt: string;
}

export interface TripFilters {
  query?: string;
  minPrice?: number;
  maxPrice?: number;
  duration?: number;
  startDate?: string;
  endDate?: string;
  sortBy?: "price-asc" | "price-desc" | "date-asc" | "date-desc";
}

export interface ServiceResponse<T> {
  data: T;
  message?: string;
}

export interface AuthSession {
  uid: string;
  email: string;
  token: string;
}

export interface UserModuleRegistrationInput {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  profileImage?: string;
  bio: string;
  street: string;
  city?: string;
  state?: string;
  postalCode?: string;
  country?: string;
}

export interface UserModulePayload extends UserModuleRegistrationInput {
  id: string;
  isVerified: boolean;
}

export interface TripDestinationPayload {
  name: string;
  description: string;
  geoCode: {
    latitude: number;
    longitude: number;
  };
  photos: string[];
}

export interface TripItineraryDayPayload {
  day: number;
  title: string;
  timeSlot: {
    startTime: string;
    endTime: string;
  };
  activities: string[];
}

export interface TripIncludedPayload {
  hotelFacilities: string[];
  transportFacilities: string[];
  otherInclusions: string[];
  exclusions: string[];
}

export interface TripParticipantPayload {
  name: string;
  address: string;
  phone: string;
  email: string;
}

export interface CreateTripApiPayload {
  tripName: string;
  tripCategory: "Solo Trip with guide" | "Family Trip with guide" | "Strangers Trip with guide" | "Private trip";
  destinations: TripDestinationPayload[];
  startDate: string;
  endDate: string;
  startTime?: string;
  startLocation: string;
  organizer: string;
  price: number;
  itinerary: {
    days: TripItineraryDayPayload[];
  };
  included: TripIncludedPayload;
  participants: TripParticipantPayload[];
  photos: string[];
  coverImage: string;
  description: string;
  maxParticipants: number;
}
