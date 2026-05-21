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
  createdAt?: { _seconds: number; _nanoseconds: number };
  updatedAt?: { _seconds: number; _nanoseconds: number };
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
};
