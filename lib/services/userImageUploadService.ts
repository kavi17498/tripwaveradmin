import { onAuthStateChanged, type User as FirebaseUser } from "firebase/auth";
import { getDownloadURL, ref, uploadBytes } from "firebase/storage";
import { auth, storage } from "@/lib/config/firebase";

const waitForFirebaseUser = async (): Promise<FirebaseUser | null> => {
  if (auth.currentUser) return auth.currentUser;

  return new Promise<FirebaseUser | null>((resolve) => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      unsubscribe();
      resolve(user);
    });
  });
};

const sanitizeFileName = (name: string) =>
  name
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9._-]+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");

const buildStoragePath = (userId: string, fileName: string) => {
  const safeName = sanitizeFileName(fileName) || "profile";
  const uniquePrefix = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
  return `profile-images/${userId}/${uniquePrefix}-${safeName}`;
};

export const userImageUploadService = {
  async uploadProfileImage(file: File) {
    if (!file) return null;

    const firebaseUser = await waitForFirebaseUser();
    if (!firebaseUser) {
      throw new Error("You need to sign in with Firebase before uploading images.");
    }

    const storagePath = buildStoragePath(firebaseUser.uid, file.name);
    const fileRef = ref(storage, storagePath);
    await uploadBytes(fileRef, file, { contentType: file.type || "image/jpeg" });
    const downloadUrl = await getDownloadURL(fileRef);

    return downloadUrl;
  },
};
