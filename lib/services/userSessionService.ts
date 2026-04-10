const USER_STORAGE_KEY = "tripwaver:user-profile";
const TOKEN_STORAGE_KEY = "tripwaver:auth-token";
const ROLE_STORAGE_KEY = "tripwaver:user-role";

type SessionRole = "user" | "guide" | "admin" | "superadmin";

const toSessionRole = (value: unknown): SessionRole | null => {
  if (value == null) return "user";
  if (typeof value !== "string") return null;

  const normalizedRole = value.trim().toLowerCase();
  if (normalizedRole === "guide") return "guide";
  if (normalizedRole === "admin") return "admin";
  if (normalizedRole === "superadmin") return "superadmin";
  if (normalizedRole === "user") return "user";

  return null;
};

const extractRoleFromToken = (token: string): SessionRole | null => {
  try {
    const tokenParts = token.split(".");
    const payloadPart = tokenParts[1];
    if (!payloadPart) return null;

    const normalizedBase64 = payloadPart.replace(/-/g, "+").replace(/_/g, "/");
    const paddedBase64 = normalizedBase64 + "=".repeat((4 - (normalizedBase64.length % 4)) % 4);
    const payload = JSON.parse(atob(paddedBase64)) as Record<string, unknown>;

    return toSessionRole(payload.role);
  } catch {
    return null;
  }
};

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

    const role = extractRoleFromToken(token);
    if (role) {
      localStorage.setItem(ROLE_STORAGE_KEY, role);
    } else {
      localStorage.removeItem(ROLE_STORAGE_KEY);
    }
  },

  getToken() {
    if (typeof window === "undefined") return null;
    return localStorage.getItem(TOKEN_STORAGE_KEY);
  },

  clearToken() {
    if (typeof window === "undefined") return;
    localStorage.removeItem(TOKEN_STORAGE_KEY);
    localStorage.removeItem(ROLE_STORAGE_KEY);
  },

  getRole() {
    if (typeof window === "undefined") return null;
    return toSessionRole(localStorage.getItem(ROLE_STORAGE_KEY));
  },

  clearSession() {
    if (typeof window === "undefined") return;
    localStorage.removeItem(USER_STORAGE_KEY);
    localStorage.removeItem(TOKEN_STORAGE_KEY);
    localStorage.removeItem(ROLE_STORAGE_KEY);
  },
};
