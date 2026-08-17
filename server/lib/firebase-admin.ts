import { initializeApp, getApps, cert } from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";
import { getFirestore } from "firebase-admin/firestore";
import fs from "fs";
import path from "path";

// Load service account key from env variable or local file
let serviceAccount: any;
if (process.env.FIREBASE_SERVICE_ACCOUNT) {
  try {
    serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);
  } catch {
    try {
      serviceAccount = JSON.parse(Buffer.from(process.env.FIREBASE_SERVICE_ACCOUNT, "base64").toString("utf-8"));
    } catch (e) {
      console.error("Failed to parse FIREBASE_SERVICE_ACCOUNT env:", e);
    }
  }
}

if (!serviceAccount) {
  const serviceAccountPath = path.join(process.cwd(), "server/data/firebase-admin-key.json");
  if (fs.existsSync(serviceAccountPath)) {
    serviceAccount = JSON.parse(fs.readFileSync(serviceAccountPath, "utf-8"));
  }
}

if (!getApps().length) {
  if (serviceAccount) {
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
