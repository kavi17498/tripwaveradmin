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

const buildStoragePath = (userId: string, draftId: string, fileName: string) => {
  const safeName = sanitizeFileName(fileName) || "image";
  const uniquePrefix = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
  return `trip-images/${userId}/${draftId}/${uniquePrefix}-${safeName}`;
};

export const tripImageUploadService = {
  async uploadTripImages(files: File[], draftId: string) {
    if (files.length === 0) return { downloadUrls: [], storagePaths: [] };

    const firebaseUser = await waitForFirebaseUser();
    if (!firebaseUser) {
      throw new Error("You need to sign in with Firebase before uploading trip images.");
    }

    const uploads = await Promise.all(
      files.map(async (file) => {
        const storagePath = buildStoragePath(firebaseUser.uid, draftId, file.name);
        const fileRef = ref(storage, storagePath);
        await uploadBytes(fileRef, file, { contentType: file.type || "image/jpeg" });
        const downloadUrl = await getDownloadURL(fileRef);
        return { storagePath, downloadUrl };
      }),
    );

    return {
      downloadUrls: uploads.map((item) => item.downloadUrl),
      storagePaths: uploads.map((item) => item.storagePath),
    };
  },
};