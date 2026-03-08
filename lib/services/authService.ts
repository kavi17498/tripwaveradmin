import {
  createUserWithEmailAndPassword,
  type User as FirebaseUser,
  onAuthStateChanged,
  sendPasswordResetEmail,
  signInWithEmailAndPassword,
  signInWithPopup,
  signOut,
  updateProfile,
} from "firebase/auth";
import { auth, googleProvider } from "@/lib/config/firebase";
import { mockUsers } from "@/lib/data/users";
import { ServiceResponse, User, UserRole } from "@/lib/types";
import { sleep, sometimesFail } from "@/lib/services/serviceUtils";

const roleByEmail = mockUsers.reduce<Record<string, UserRole>>((acc, user) => {
  acc[user.email.toLowerCase()] = user.role;
  return acc;
}, {});

const toAppUser = (firebaseUser: { uid: string; displayName: string | null; email: string | null }): User => {
  const email = firebaseUser.email ?? "";
  return {
    id: firebaseUser.uid,
    name: firebaseUser.displayName || email.split("@")[0] || "TripWaver User",
    email,
    role: roleByEmail[email.toLowerCase()] ?? "traveler",
    verifiedOrganizer: false,
    status: "active",
    joinedAt: new Date().toISOString(),
  };
};

const mapAuthError = (error: unknown) => {
  if (!(error instanceof Error)) return "Authentication failed. Please try again.";

  if (error.message.includes("auth/invalid-credential")) return "Invalid email or password.";
  if (error.message.includes("auth/email-already-in-use")) return "This email is already in use.";
  if (error.message.includes("auth/weak-password")) return "Password is too weak.";
  if (error.message.includes("auth/popup-closed-by-user")) return "Google sign in popup was closed.";
  if (error.message.includes("auth/user-not-found")) return "No account found with this email.";

  return error.message;
};

const waitForAuthInit = async () => {
  if (auth.currentUser) return auth.currentUser;

  return new Promise<FirebaseUser | null>((resolve) => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      unsubscribe();
      resolve(user);
    });
  });
};

export const authService = {
  async login(email: string, password: string): Promise<ServiceResponse<User>> {
    await sleep(150);
    try {
      const credential = await signInWithEmailAndPassword(auth, email, password);
      return { data: toAppUser(credential.user), message: "Logged in successfully" };
    } catch (error) {
      throw new Error(mapAuthError(error));
    }
  },

  async register(payload: {
    name: string;
    email: string;
    password: string;
    role: UserRole;
  }): Promise<ServiceResponse<User>> {
    await sleep(150);
    try {
      const credential = await createUserWithEmailAndPassword(auth, payload.email, payload.password);
      await updateProfile(credential.user, { displayName: payload.name });
      roleByEmail[payload.email.toLowerCase()] = payload.role;
      return { data: { ...toAppUser(credential.user), role: payload.role }, message: "Account created successfully" };
    } catch (error) {
      throw new Error(mapAuthError(error));
    }
  },

  async loginWithGoogle(): Promise<ServiceResponse<User>> {
    await sleep(100);
    try {
      const credential = await signInWithPopup(auth, googleProvider);
      sometimesFail(0);
      return { data: toAppUser(credential.user), message: "Logged in with Google" };
    } catch (error) {
      throw new Error(mapAuthError(error));
    }
  },

  async forgotPassword(email: string): Promise<ServiceResponse<boolean>> {
    await sleep(100);
    try {
      await sendPasswordResetEmail(auth, email);
      return { data: true, message: "Reset link sent" };
    } catch (error) {
      throw new Error(mapAuthError(error));
    }
  },

  async getCurrentUser(): Promise<ServiceResponse<User | null>> {
    const user = await waitForAuthInit();
    return { data: user ? toAppUser(user) : null };
  },

  async logout(): Promise<ServiceResponse<boolean>> {
    await signOut(auth);
    return { data: true, message: "Logged out" };
  },
};
