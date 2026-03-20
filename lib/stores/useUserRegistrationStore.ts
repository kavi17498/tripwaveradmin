import { create } from "zustand";
import { authService } from "@/lib/services/authService";
import { userService } from "@/lib/services/userService";
import { userSessionService } from "@/lib/services/userSessionService";
import { UserModuleRegistrationInput } from "@/lib/types";

type RegistrationState = {
  form: UserModuleRegistrationInput;
  loading: boolean;
  googleLoading: boolean;
  error: string;
  setField: (field: keyof UserModuleRegistrationInput, value: string) => void;
  registerManual: (password: string, confirmPassword: string) => Promise<void>;
  registerWithGoogle: () => Promise<void>;
  resetForm: () => void;
  clearError: () => void;
};

const initialFormState: UserModuleRegistrationInput = {
  firstName: "",
  lastName: "",
  email: "",
  phone: "",
  profileImage: "",
  bio: "",
  street: "",
  city: "",
  state: "",
  postalCode: "",
  country: "",
};

const normalizeOptional = (value?: string) => {
  const trimmed = value?.trim() ?? "";
  return trimmed ? trimmed : undefined;
};

const validateProfileForm = (form: UserModuleRegistrationInput): string | null => {
  if (form.firstName.trim().length < 2) return "First name should have at least 2 characters.";
  if (form.lastName.trim().length < 2) return "Last name should have at least 2 characters.";
  if (!form.email.includes("@")) return "Please enter a valid email.";
  if (form.phone.trim().length < 6) return "Please enter a valid phone number.";
  if (!form.bio.trim()) return "Bio is required.";
  if (!form.street.trim()) return "Street is required.";

  return null;
};

const buildUserPayload = (
  form: UserModuleRegistrationInput,
  id: string,
  fallbackEmail?: string,
) => ({
  id,
  firstName: form.firstName.trim(),
  lastName: form.lastName.trim(),
  email: fallbackEmail ?? form.email.trim(),
  phone: form.phone.trim(),
  profileImage: normalizeOptional(form.profileImage),
  bio: form.bio.trim(),
  street: form.street.trim(),
  city: normalizeOptional(form.city),
  state: normalizeOptional(form.state),
  postalCode: normalizeOptional(form.postalCode),
  country: normalizeOptional(form.country),
  isVerified: false,
});

export const useUserRegistrationStore = create<RegistrationState>((set, get) => ({
  form: initialFormState,
  loading: false,
  googleLoading: false,
  error: "",

  setField: (field, value) => {
    set((state) => ({ form: { ...state.form, [field]: value } }));
  },

  async registerManual(password, confirmPassword) {
    const { form } = get();
    set({ error: "" });

    const profileValidationError = validateProfileForm(form);
    if (profileValidationError) {
      set({ error: profileValidationError });
      throw new Error(profileValidationError);
    }

    if (password.length < 8) {
      const message = "Password should be at least 8 characters.";
      set({ error: message });
      throw new Error(message);
    }

    if (password !== confirmPassword) {
      const message = "Passwords do not match.";
      set({ error: message });
      throw new Error(message);
    }

    set({ loading: true });

    try {
      const authResult = await authService.registerForUserModule({
        email: form.email.trim(),
        password,
        displayName: `${form.firstName.trim()} ${form.lastName.trim()}`.trim(),
      });

      const createResult = await userService.createUserProfile(
        buildUserPayload(form, authResult.data.uid, authResult.data.email || form.email.trim()),
        authResult.data.token,
      );

      userSessionService.saveUserProfile(createResult.data);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unable to create account.";
      set({ error: message });
      throw error;
    } finally {
      set({ loading: false });
    }
  },

  async registerWithGoogle() {
    const { form } = get();
    set({ error: "" });

    const profileValidationError = validateProfileForm(form);
    if (profileValidationError) {
      set({ error: profileValidationError });
      throw new Error(profileValidationError);
    }

    set({ googleLoading: true });

    try {
      const authResult = await authService.loginWithGoogleForUserModule();
      const resolvedEmail = authResult.data.email || form.email.trim();

      if (!resolvedEmail) {
        throw new Error("Google account does not contain an email.");
      }

      const createResult = await userService.createUserProfile(
        buildUserPayload(form, authResult.data.uid, resolvedEmail),
        authResult.data.token,
      );

      userSessionService.saveUserProfile(createResult.data);

      set((state) => ({ form: { ...state.form, email: resolvedEmail } }));
    } catch (error) {
      const message = error instanceof Error ? error.message : "Google signup failed.";
      set({ error: message });
      throw error;
    } finally {
      set({ googleLoading: false });
    }
  },

  resetForm() {
    set({ form: initialFormState, error: "" });
  },

  clearError() {
    set({ error: "" });
  },
}));
