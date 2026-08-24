import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";

const firebaseConfig = {
  apiKey: "AIzaSyCvcJadrotJDxBsNaF1JlZXKSC4y9Bgha4",
  authDomain: "apexmind-673c2.firebaseapp.com",
  projectId: "apexmind-673c2",
  storageBucket: "apexmind-673c2.firebasestorage.app",
  messagingSenderId: "692108358053",
  appId: "1:692108358053:web:31e04a39c960a5b222f84c"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);

// Secondary Firebase app instance for the Admin Dashboard to prevent auth session bleeding
const adminApp = initializeApp(firebaseConfig, "admin");
export const adminAuthClient = getAuth(adminApp);
export const adminStorage = getStorage(adminApp);

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
