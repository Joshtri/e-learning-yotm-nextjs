import { initializeApp, getApps } from "firebase/app";
import {
  getStorage,
  ref,
  uploadBytes,
  getDownloadURL,
  deleteObject,
} from "firebase/storage";

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

// Inisialisasi hanya sekali
if (!getApps().length) {
  initializeApp(firebaseConfig);
}

export const storage = getStorage();

/**
 * Upload file ke Firebase (universal)
 * @param {Buffer} fileBuffer - Buffer dari file
 * @param {string} filename - nama file asli
 * @param {string} folder - nama folder penyimpanan (optional, default: 'uploads')
 * @returns {string} fileUrl
 */
export async function uploadFileToFirebase(
  fileBuffer,
  filename,
  folder = "uploads"
) {
  try {
    const timestamp = Date.now();
    const path = `${folder}/${timestamp}_${filename}`;
    const fileRef = ref(storage, path);

    await uploadBytes(fileRef, fileBuffer);
    const fileUrl = await getDownloadURL(fileRef);
    return fileUrl;
  } catch (error) {
    console.error("🔥 Gagal upload file:", error);
    throw error;
  }
}

/**
 * Hapus file dari Firebase berdasarkan URL
 * @param {string} fileUrl
 * @returns {boolean} success
 */
export async function deleteFileFromFirebase(fileUrl) {
  try {
    const path = decodeURIComponent(fileUrl.split("/o/")[1].split("?")[0]);
    const fileRef = ref(storage, path);
    await deleteObject(fileRef);
    return true;
  } catch (error) {
    console.error("🗑️ Gagal hapus file:", error);
    return false;
  }
}
