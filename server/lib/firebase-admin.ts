import { initializeApp, getApps, cert } from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";
import { getFirestore } from "firebase-admin/firestore";
import fs from "fs";
import path from "path";

function parseServiceAccount(raw: string): any {
  if (!raw) return null;
  // 1. Direct JSON parse
  try {
    return JSON.parse(raw);
  } catch {}

  // 2. Base64 decoded JSON parse
  try {
    const decoded = Buffer.from(raw, "base64").toString("utf-8");
    return JSON.parse(decoded);
  } catch {}

  // 3. Normalized string parse
  try {
    const sanitized = raw.trim();
    return JSON.parse(sanitized);
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
      credential: cert(serviceAccount)
    });
  } else {
    initializeApp({
      projectId: "apexmind-a81d0"
    });
  }
}

export const adminAuth = getAuth();
export const adminDb = getFirestore();

try {
  adminDb.settings({ ignoreUndefinedProperties: true });
} catch {
  // Already initialized
}

