import { onAuthStateChanged } from "firebase/auth";

import { auth } from "@/lib/config/firebase";
import { apiClient } from "@/lib/services/apiClient";

export type AdminVerificationRequest = {
  id: string;
  userId: string;
  sltdaGuideLicense: string;
  nicImageFront: string;
  nicImageBack: string;
  registeredBusinessName?: string;
  taxOrBusinessRegistrationNumber?: string;
  status: "pending" | "in-review" | "approved" | "rejected";
  inReviewBy?: string;
  inReviewByName?: string;
  inReviewAssignedAt?: { _seconds: number; _nanoseconds: number };
  approvedBy?: string;
  approvedByName?: string;
  approvedAt?: { _seconds: number; _nanoseconds: number };
  rejectionReason?: string;
  rejectedBy?: string;
  rejectedByName?: string;
  rejectedAt?: { _seconds: number; _nanoseconds: number };
  createdAt?: { _seconds: number; _nanoseconds: number };
  updatedAt?: { _seconds: number; _nanoseconds: number };
};

export type VerificationMeeting = {
  id?: string;
  verificationId: string;
  userId: string;
  scheduledAt: string;
  createdBy: string;
  createdByName?: string;
  mailSentAt?: { _seconds: number; _nanoseconds: number };
  meetingSummary?: string;
  summarySubmittedAt?: { _seconds: number; _nanoseconds: number };
  createdAt?: { _seconds: number; _nanoseconds: number };
  updatedAt?: { _seconds: number; _nanoseconds: number };
};

export type AdminVerificationReviewDetails = {
  verification: AdminVerificationRequest;
  user: Record<string, unknown> & { id: string; firstName?: string; lastName?: string; email?: string; phone?: string };
  trips: Array<Record<string, unknown> & { id: string; tripName?: string; status?: string; startDate?: string; endDate?: string; startLocation?: string }>;
  meeting: VerificationMeeting | null;
};

type BulkMoveResult = {
  movedIds: string[];
  skippedIds: string[];
};

const waitForAuthToken = async () => {
  const currentUser = auth.currentUser;
  if (currentUser) {
    return currentUser.getIdToken();
  }

  return new Promise<string>((resolve, reject) => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      unsubscribe();
      if (!user) {
        reject(new Error("Authentication required. Please sign in again."));
        return;
      }

      resolve(await user.getIdToken());
    });
  });
};

export const adminVerificationService = {
  async getPendingRequests() {
    const token = await waitForAuthToken();
    return apiClient.authenticatedRequest<AdminVerificationRequest[]>("/verifications/admin/pending", token, {
      method: "GET",
    });
  },

  async getInReviewRequestsAssignedToMe() {
    const token = await waitForAuthToken();
    return apiClient.authenticatedRequest<AdminVerificationRequest[]>("/verifications/admin/in-review", token, {
      method: "GET",
    });
  },

  async moveToInReview(ids: string[]) {
    const token = await waitForAuthToken();
    return apiClient.authenticatedRequest<BulkMoveResult>("/verifications/admin/bulk-in-review", token, {
      method: "PATCH",
      body: { ids },
    });
  },

  async getReviewDetails(verificationId: string) {
    const token = await waitForAuthToken();
    return apiClient.authenticatedRequest<AdminVerificationReviewDetails>(`/verifications/admin/${verificationId}/details`, token, {
      method: "GET",
    });
  },

  async createMeeting(verificationId: string, scheduledAt: string) {
    const token = await waitForAuthToken();
    return apiClient.authenticatedRequest<VerificationMeeting>("/verification-meetings", token, {
      method: "POST",
      body: { verificationId, scheduledAt },
    });
  },

  async submitMeetingSummary(verificationId: string, summary: string) {
    const token = await waitForAuthToken();
    return apiClient.authenticatedRequest<VerificationMeeting>(`/verification-meetings/${verificationId}/summary`, token, {
      method: "PATCH",
      body: { summary },
    });
  },

  async assignGuideRole(userId: string) {
    const token = await waitForAuthToken();
    return apiClient.authenticatedRequest<{ status: string; assigned: string[]; failed: Array<{ userId: string; reason: string }> }>("/users/assign-roles", token, {
      method: "POST",
      body: {
        userIds: userId,
        role: "guide",
      },
    });
  },

  async approveVerification(verificationId: string) {
    const token = await waitForAuthToken();
    return apiClient.authenticatedRequest<AdminVerificationRequest>(`/verifications/admin/${verificationId}/approve`, token, {
      method: "PATCH",
    });
  },

  async rejectVerification(verificationId: string, reason: string) {
    const token = await waitForAuthToken();
    return apiClient.authenticatedRequest<AdminVerificationRequest>(`/verifications/admin/${verificationId}/reject`, token, {
      method: "PATCH",
      body: { reason },
    });
  },
};
