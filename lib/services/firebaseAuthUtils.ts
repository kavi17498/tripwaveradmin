import { onAuthStateChanged, type User as FirebaseUser } from "firebase/auth";
import { auth } from "@/lib/config/firebase";

export const waitForFirebaseUser = async (): Promise<FirebaseUser | null> => {
  if (auth.currentUser) return auth.currentUser;

  return new Promise<FirebaseUser | null>((resolve) => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      unsubscribe();
      resolve(user);
    });
  });
};