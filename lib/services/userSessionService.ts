const USER_STORAGE_KEY = "tripwaver:user-profile";

export const userSessionService = {
  saveUserProfile(profile: unknown) {
    if (typeof window === "undefined") return;
    localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(profile));
  },

  getUserProfile<T>() {
    if (typeof window === "undefined") return null;

    const raw = localStorage.getItem(USER_STORAGE_KEY);
    if (!raw) return null;

    try {
      return JSON.parse(raw) as T;
    } catch {
      localStorage.removeItem(USER_STORAGE_KEY);
      return null;
    }
  },

  clearUserProfile() {
    if (typeof window === "undefined") return;
    localStorage.removeItem(USER_STORAGE_KEY);
  },
};
