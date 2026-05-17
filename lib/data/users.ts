import { User } from "@/lib/types";

export const mockUsers: User[] = [
  {
    id: "u1",
    name: "Maya Fernandes",
    email: "maya@tripwaver.com",
    role: "traveler",
    verifiedOrganizer: false,
    status: "active",
    joinedAt: "2025-01-12",
  },
  {
    id: "u2",
    name: "Ethan Cole",
    email: "ethan@tripwaver.com",
    role: "organizer",
    verifiedOrganizer: true,
    status: "approved",
    joinedAt: "2024-10-03",
  },
  {
    id: "u3",
    name: "TripWaver Admin",
    email: "admin@tripwaver.com",
    role: "admin",
    verifiedOrganizer: false,
    status: "active",
    joinedAt: "2024-01-01",
  },
  {
    id: "u5",
    name: "TripWaver Super Admin",
    email: "superadmin@tripwaver.com",
    role: "superadmin",
    verifiedOrganizer: false,
    status: "active",
    joinedAt: "2024-01-02",
  },
  {
    id: "u4",
    name: "Sofia Park",
    email: "sofia@tripwaver.com",
    role: "organizer",
    verifiedOrganizer: false,
    status: "pending",
    joinedAt: "2025-06-14",
  },
];
