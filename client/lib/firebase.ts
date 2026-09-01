import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getDatabase } from "firebase/database";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";

export const firebaseConfig = {
  apiKey: "AIzaSyDLoTn7XcTs-n5ORFP_hfPPxLepC8RPlLM",
  authDomain: "apexmindreads.firebaseapp.com",
  databaseURL: "https://apexmindreads-default-rtdb.firebaseio.com",
  projectId: "apexmindreads",
  storageBucket: "apexmindreads.firebasestorage.app",
  messagingSenderId: "298338005480",
  appId: "1:298338005480:web:0f1017cca2cd1b0d00745d"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const rtdb = getDatabase(app);
export const db = getFirestore(app);
export const storage = getStorage(app);

// Secondary Firebase app instance for the Admin Dashboard to prevent auth session bleeding
const adminApp = initializeApp(firebaseConfig, "admin");
export const adminAuthClient = getAuth(adminApp);
export const adminRtdb = getDatabase(adminApp);
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

export async function getAdminAuthToken(forceRefresh = false): Promise<string | null> {
  let user = adminAuthClient.currentUser || auth.currentUser;
  if (user) {
    try {
      const token = await user.getIdToken(forceRefresh);
      if (token && typeof window !== "undefined") {
        try { localStorage.setItem("apexmind_admin_id_token", token); } catch {}
      }
      return token;
    } catch {}
  }

  // Check localStorage cached token first
  if (typeof window !== "undefined") {
    const cachedToken = localStorage.getItem("apexmind_admin_id_token");
    if (cachedToken) {
      adminAuthClient.onAuthStateChanged((u) => {
        if (u) u.getIdToken().then((t) => localStorage.setItem("apexmind_admin_id_token", t)).catch(() => {});
      });
      return cachedToken;
    }
  }

  // If no cached token, wait up to 1200ms for onAuthStateChanged
  user = await new Promise((resolve) => {
    const unsub = adminAuthClient.onAuthStateChanged((u) => {
      unsub();
      resolve(u);
    });
    setTimeout(() => resolve(null), 1200);
  });

  if (user) {
    const token = await user.getIdToken(forceRefresh);
    if (token && typeof window !== "undefined") {
      try { localStorage.setItem("apexmind_admin_id_token", token); } catch {}
    }
    return token;
  }

  return typeof window !== "undefined" ? localStorage.getItem("apexmind_admin_id_token") : null;
}

export async function getAdminAuthHeaders(forceRefresh = false): Promise<HeadersInit> {
  const token = await getAdminAuthToken(forceRefresh);
  return token ? { Authorization: `Bearer ${token}` } : {};
}
