const USER_STORAGE_KEY = "tripwaver:user-profile";
const TOKEN_STORAGE_KEY = "tripwaver:auth-token";

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

  saveToken(token: string) {
    if (typeof window === "undefined") return;
    localStorage.setItem(TOKEN_STORAGE_KEY, token);
  },

  getToken() {
    if (typeof window === "undefined") return null;
    return localStorage.getItem(TOKEN_STORAGE_KEY);
  },

  clearToken() {
    if (typeof window === "undefined") return;
    localStorage.removeItem(TOKEN_STORAGE_KEY);
  },

  clearSession() {
    if (typeof window === "undefined") return;
    localStorage.removeItem(USER_STORAGE_KEY);
    localStorage.removeItem(TOKEN_STORAGE_KEY);
  },
};
