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

const buildStoragePath = (tripId: string, userId: string, fileName: string) => {
  const safeName = sanitizeFileName(fileName) || "chat";
  const uniquePrefix = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
  return `chat-images/${tripId}/${userId}/${uniquePrefix}-${safeName}`;
};

export const chatImageUploadService = {
  async uploadChatImage(file: File, tripId: string) {
    if (!file) return null;

    const firebaseUser = await waitForFirebaseUser();
    if (!firebaseUser) {
      throw new Error("You need to sign in with Firebase before uploading chat images.");
    }

    const storagePath = buildStoragePath(tripId, firebaseUser.uid, file.name);
    const fileRef = ref(storage, storagePath);
    await uploadBytes(fileRef, file, { contentType: file.type || "image/jpeg" });
    const downloadUrl = await getDownloadURL(fileRef);

    return downloadUrl;
  },
};
