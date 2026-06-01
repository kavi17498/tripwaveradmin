import { apiClient } from './apiClient';
import { userSessionService } from './userSessionService';

export type VerificationRequest = {
  id?: string;
  userId?: string;
  sltdaGuideLicense: string;
  nicImageFront: string;
  nicImageBack: string;
  registeredBusinessName?: string;
  taxOrBusinessRegistrationNumber?: string;
  socialLinks?: Record<string, string>;
  status?: 'pending' | 'in-review' | 'approved' | 'rejected';
  createdAt?: unknown;
  updatedAt?: unknown;
};

export const verificationApiService = {
  async submit(payload: Omit<VerificationRequest, 'id' | 'userId' | 'status' | 'createdAt' | 'updatedAt'>) {
    const token = userSessionService.getToken();
    if (!token) throw new Error('Not authenticated');
    return apiClient.authenticatedRequest<VerificationRequest>('/verifications', token, { method: 'POST', body: payload });
  },

  async getMyRequests() {
    const token = userSessionService.getToken();
    if (!token) throw new Error('Not authenticated');
    return apiClient.authenticatedRequest<VerificationRequest[]>('/verifications', token, { method: 'GET' });
  },

  async getById(id: string) {
    const token = userSessionService.getToken();
    if (!token) throw new Error('Not authenticated');
    return apiClient.authenticatedRequest<VerificationRequest>(`/verifications/${id}`, token, { method: 'GET' });
  },

  async update(id: string, payload: Partial<VerificationRequest>) {
    const token = userSessionService.getToken();
    if (!token) throw new Error('Not authenticated');
    return apiClient.authenticatedRequest<VerificationRequest>(`/verifications/${id}`, token, { method: 'PATCH', body: payload });
  },

  async remove(id: string) {
    const token = userSessionService.getToken();
    if (!token) throw new Error('Not authenticated');
    return apiClient.authenticatedRequest<void>(`/verifications/${id}`, token, { method: 'DELETE' });
  },
};
