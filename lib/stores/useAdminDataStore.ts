"use client";

import { create } from "zustand";

import { adminService } from "@/lib/services/adminService";
import { AdminOnDemandTripRecord, AdminTripRecord, AdminTripStatus, AdminUserRecord } from "@/lib/types";

type AdminDataState = {
  users: AdminUserRecord[];
  tripsByStatus: Partial<Record<AdminTripStatus, AdminTripRecord[]>>;
  onDemandTripsByStatus: Partial<Record<AdminTripStatus, AdminOnDemandTripRecord[]>>;
  loadingUsers: boolean;
  loadingTrips: boolean;
  error: string | null;
  selectedTripStatus: AdminTripStatus;
  fetchUsers: () => Promise<void>;
  fetchTrips: (status?: AdminTripStatus) => Promise<void>;
  fetchOnDemandTrips: (status?: AdminTripStatus) => Promise<void>;
  updateTripStatus: (tripId: string, status: Exclude<AdminTripStatus, "draft">) => Promise<void>;
  updateOnDemandTripStatus: (tripId: string, status: Exclude<AdminTripStatus, "draft">) => Promise<void>;
  setSelectedTripStatus: (status: AdminTripStatus) => void;
};

export const useAdminDataStore = create<AdminDataState>((set, get) => ({
  users: [],
  tripsByStatus: {},
  onDemandTripsByStatus: {},
  loadingUsers: false,
  loadingTrips: false,
  error: null,
  selectedTripStatus: "pending",
  async fetchUsers() {
    set({ loadingUsers: true, error: null });

    try {
      const response = await adminService.getUsers();
      set({ users: response.data, loadingUsers: false });
    } catch (error) {
      set({ error: error instanceof Error ? error.message : "Failed to fetch users.", loadingUsers: false });
    }
  },
  async fetchTrips(status = get().selectedTripStatus) {
    set({ loadingTrips: true, error: null });

    try {
      const response = await adminService.getTrips(status);
      set((state) => ({
        tripsByStatus: {
          ...state.tripsByStatus,
          [status]: response.data,
        },
        loadingTrips: false,
      }));
    } catch (error) {
      set({ error: error instanceof Error ? error.message : "Failed to fetch trips.", loadingTrips: false });
    }
  },
  async fetchOnDemandTrips(status = get().selectedTripStatus) {
    set({ loadingTrips: true, error: null });

    try {
      const response = await adminService.getOnDemandTrips(status);
      set((state) => ({
        onDemandTripsByStatus: {
          ...state.onDemandTripsByStatus,
          [status]: response.data,
        },
        loadingTrips: false,
      }));
    } catch (error) {
      set({ error: error instanceof Error ? error.message : "Failed to fetch on-demand trips.", loadingTrips: false });
    }
  },
  async updateTripStatus(tripId, status) {
    set({ loadingTrips: true, error: null });

    try {
      const response = await adminService.updateTripStatus(tripId, status);
      set((state) => {
        const nextTripsByStatus = { ...state.tripsByStatus };
        (Object.keys(nextTripsByStatus) as AdminTripStatus[]).forEach((tripStatus) => {
          nextTripsByStatus[tripStatus] = nextTripsByStatus[tripStatus]?.filter((trip) => trip.id !== tripId);
        });

        const currentStatusTrips = nextTripsByStatus[status] ?? [];
        nextTripsByStatus[status] = currentStatusTrips.some((trip) => trip.id === response.data.id)
          ? currentStatusTrips.map((trip) => (trip.id === response.data.id ? response.data : trip))
          : [response.data, ...currentStatusTrips];

        return {
          tripsByStatus: nextTripsByStatus,
          loadingTrips: false,
        };
      });
    } catch (error) {
      set({ error: error instanceof Error ? error.message : "Failed to update trip status.", loadingTrips: false });
    }
  },
  async updateOnDemandTripStatus(tripId, status) {
    set({ loadingTrips: true, error: null });

    try {
      const response = await adminService.updateOnDemandTripStatus(tripId, status);
      set((state) => {
        const nextTripsByStatus = { ...state.onDemandTripsByStatus };
        (Object.keys(nextTripsByStatus) as AdminTripStatus[]).forEach((tripStatus) => {
          nextTripsByStatus[tripStatus] = nextTripsByStatus[tripStatus]?.filter((trip) => trip.id !== tripId);
        });

        const currentStatusTrips = nextTripsByStatus[status] ?? [];
        nextTripsByStatus[status] = currentStatusTrips.some((trip) => trip.id === response.data.id)
          ? currentStatusTrips.map((trip) => (trip.id === response.data.id ? response.data : trip))
          : [response.data, ...currentStatusTrips];

        return {
          onDemandTripsByStatus: nextTripsByStatus,
          loadingTrips: false,
        };
      });
    } catch (error) {
      set({ error: error instanceof Error ? error.message : "Failed to update on-demand trip status.", loadingTrips: false });
    }
  },
  setSelectedTripStatus(status) {
    set({ selectedTripStatus: status });
  },
}));