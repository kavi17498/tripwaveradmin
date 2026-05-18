import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";

import { userSessionService } from "@/lib/services/userSessionService";
import { UserModulePayload } from "@/lib/types";

type CachedUserProfile = Partial<UserModulePayload> & {
  name?: string;
  role?: string;
  dateOfBirth?: string;
  gender?: "male" | "female" | "other";
};

type AuthCacheState = {
  currentUser: CachedUserProfile | null;
  token: string | null;
  hydrated: boolean;
  setSession: (user: CachedUserProfile, token: string) => void;
  clearSession: () => void;
  hydrateFromLegacySession: () => void;
};

export const useAuthCacheStore = create<AuthCacheState>()(
  persist(
    (set) => ({
      currentUser: null,
      token: null,
      hydrated: false,
      setSession(user, token) {
        set({ currentUser: user, token, hydrated: true });
        try {
          userSessionService.saveUserProfile(user);
          userSessionService.saveToken(token);
        } catch {
          // non-fatal: persistence best-effort
        }
      },
      clearSession() {
        set({ currentUser: null, token: null, hydrated: true });
        try {
          userSessionService.clearSession();
        } catch {
          // ignore
        }
      },
      hydrateFromLegacySession() {
        const profile = userSessionService.getUserProfile<CachedUserProfile>();
        const legacyToken = userSessionService.getToken();

        if (profile || legacyToken) {
          set({ currentUser: profile ?? null, token: legacyToken, hydrated: true });
          return;
        }

        set({ hydrated: true });
      },
    }),
    {
      name: "tripwaver:auth-cache",
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({ currentUser: state.currentUser, token: state.token }),
    },
  ),
);

export type { CachedUserProfile };