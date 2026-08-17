import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyBWZ0V2eLpkIaTj5xToNdRlFI_GrtZLqVg",
  authDomain: "apexmind-a81d0.firebaseapp.com",
  projectId: "apexmind-a81d0",
  storageBucket: "apexmind-a81d0.firebasestorage.app",
  messagingSenderId: "400951100424",
  appId: "1:400951100424:web:4d0d04b5f1e2da172fbdbd"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);

// Secondary Firebase app instance for the Admin Dashboard to prevent auth session bleeding
const adminApp = initializeApp(firebaseConfig, "admin");
export const adminAuthClient = getAuth(adminApp);

export async function getAuthToken(): Promise<string | null> {
  const user = auth.currentUser;
  if (!user) return null;
  return await user.getIdToken();
}

export async function authHeaders(): Promise<HeadersInit> {
  const token = await getAuthToken();
  return token ? { Authorization: `Bearer ${token}` } : {};
}

export async function getAdminAuthToken(): Promise<string | null> {
  const user = adminAuthClient.currentUser;
  if (!user) return null;
  return await user.getIdToken();
}

export async function getAdminAuthHeaders(): Promise<HeadersInit> {
  const token = await getAdminAuthToken();
  return token ? { Authorization: `Bearer ${token}` } : {};
}
