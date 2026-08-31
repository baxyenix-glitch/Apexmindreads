import { initializeApp, getApps, cert } from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";
import { getDatabase } from "firebase-admin/database";
import { getFirestore } from "firebase-admin/firestore";
import fs from "fs";
import path from "path";

const RTDB_URL = "https://apexmindreads-default-rtdb.firebaseio.com";
const PROJECT_ID = "apexmindreads";

function parseServiceAccount(raw: string): any {
  if (!raw) return null;
  const trimmed = raw.trim();
  // 1. Direct JSON parse
  try {
    return JSON.parse(trimmed);
  } catch {}

  // 2. Base64 decoded JSON parse (handles surrounding quotes, spaces, etc.)
  try {
    const unquoted = trimmed.replace(/^["']|["']$/g, "").trim();
    const decoded = Buffer.from(unquoted, "base64").toString("utf-8");
    if (decoded.includes("private_key") || decoded.includes("project_id")) {
      return JSON.parse(decoded);
    }
  } catch {}

  // 3. Normalized string parse
  try {
    const unquoted = trimmed.replace(/^["']|["']$/g, "").trim();
    return JSON.parse(unquoted.replace(/\\n/g, "\n"));
  } catch (e) {
    console.error("Failed to parse FIREBASE_SERVICE_ACCOUNT env variable:", e);
    return null;
  }
}

let serviceAccount: any = null;
if (process.env.FIREBASE_SERVICE_ACCOUNT) {
  serviceAccount = parseServiceAccount(process.env.FIREBASE_SERVICE_ACCOUNT);
} else if (process.env.FIREBASE_SERVICE_ACCOUNT_B64) {
  serviceAccount = parseServiceAccount(process.env.FIREBASE_SERVICE_ACCOUNT_B64);
}

if (!serviceAccount) {
  const serviceAccountPath = path.join(process.cwd(), "server/data/firebase-admin-key.json");
  if (fs.existsSync(serviceAccountPath)) {
    try {
      serviceAccount = JSON.parse(fs.readFileSync(serviceAccountPath, "utf-8"));
    } catch (e) {
      console.error("Failed to read local service account file:", e);
    }
  }
}

if (!getApps().length) {
  if (serviceAccount) {
    if (typeof serviceAccount.private_key === "string") {
      serviceAccount.private_key = serviceAccount.private_key.replace(/\\n/g, "\n");
    }
    initializeApp({
      credential: cert(serviceAccount),
      databaseURL: RTDB_URL,
      projectId: serviceAccount.project_id || PROJECT_ID,
    });
  } else {
    initializeApp({
      projectId: PROJECT_ID,
      databaseURL: RTDB_URL,
    });
  }
}

export const adminAuth = getAuth();
export const adminDb = getDatabase();
export const adminFirestore = getFirestore();

