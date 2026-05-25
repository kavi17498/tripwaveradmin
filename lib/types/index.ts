export type UserRole = "traveler" | "organizer" | "admin" | "superadmin";

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
  startTime?: string;
  endTime?: string;
  price: number;
  capacity: number;
  bookedCount: number;
  durationDays: number;
  tripType: string;
  status: "draft" | "published" | "ongoing" | "completed" | "cancelled";
  coverImage: string;
  organizerId: string;
  organizerName: string;
  organizerRating: number | null;
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
  type: "trip-approved" | "join-request" | "payment" | "reminder" | "account-alert";
  title: string;
  description: string;
  tripId?: string;
  read: boolean;
  createdAt: string;
}

export interface ChatMessage {
  id: string;
  chatGroupId?: string;
  tripId: string;
  senderId: string;
  senderName: string;
  message: string;
  imageUrl?: string;
  createdAt: string;
}

export interface ChatGroup {
  id: string;
  name: string;
  tripId?: string;
  adminId?: string;
  adminName?: string;
  description?: string;
  members?: string[];
  lastMessage?: string;
  lastMessageAt?: FirestoreTimestamp | string;
  lastMessageSenderId?: string;
  unreadCounts?: Record<string, number>;
  createdAt?: FirestoreTimestamp | string;
  updatedAt?: FirestoreTimestamp | string;
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
  dateOfBirth: string;
  gender: "male" | "female" | "other";
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
  activities: Array<{
    title: string;
    timeSlot: {
      startTime: string;
      endTime: string;
    };
    notes?: string[];
    isAIGenerated?: boolean;
  }>;
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

export interface BookingParticipantPayload {
  parentUserId?: string | null;
  name: string;
  gender: "male" | "female" | "other";
  age: number;
  address?: string;
  phone?: string;
  email?: string;
}

export interface CreateTripApiPayload {
  tripName: string;
  tripCategory: "Public trip" | "Private trip";
  status?: "pending" | "draft";
  paymentMethods: ("Pay Online" | "Pay to Guide on Trip Day")[];
  destinations: TripDestinationPayload[];
  mainDestinations?: Array<{
    name: string;
    lat: number;
    lng: number;
  }>;
  startDate: string;
  endDate: string;
  startTime?: string;
  endTime?: string;
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

export interface FirestoreTimestamp {
  _seconds: number;
  _nanoseconds: number;
}

export interface AdminUserRecord {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  role?: UserRole;
  profileImage?: string;
  bio: string;
  street: string;
  city: string;
  state: string;
  postalCode: string;
  country: string;
  dateOfBirth?: string;
  gender?: "male" | "female" | "other";
  isVerified: boolean;
  createdAt: FirestoreTimestamp;
  updatedAt: FirestoreTimestamp;
}

export type AdminTripStatus = "pending" | "in review" | "approved" | "rejected" | "draft";

export interface AdminTripDestination {
  name: string;
  description: string;
  geoCode?: {
    latitude: number;
    longitude: number;
  };
  photos?: string[];
}

export interface AdminTripRecord {
  id: string;
  tripName: string;
  tripCategory: string;
  paymentMethods?: ("Pay Online" | "Pay to Guide on Trip Day")[];
  destinations: AdminTripDestination[];
  mainDestinations?: Array<{
    name: string;
    lat: number;
    lng: number;
  }>;
  startDate: string;
  endDate: string;
  startTime?: string;
  endTime?: string;
  startLocation: string;
  organizer: string;
  price: number;
  itinerary?: {
    days: Array<{
      day: number;
      title: string;
      activities: Array<{
        title: string;
        timeSlot: {
          startTime: string;
          endTime: string;
        };
        notes?: string[];
        isAIGenerated?: boolean;
      }>;
    }>;
  };
  included?: {
    hotelFacilities: string[];
    transportFacilities: string[];
    otherInclusions: string[];
    exclusions: string[];
  };
  participants?: TripParticipantPayload[];
  photos: string[];
  coverImage: string;
  description: string;
  maxParticipants: number;
  status: AdminTripStatus;
  createdAt: FirestoreTimestamp;
  updatedAt: FirestoreTimestamp;
}
