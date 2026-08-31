import { RequestHandler } from "express";
import { adminDb } from "../lib/firebase-admin.js";

export const handleDemo: RequestHandler = async (req, res) => {
  let firestoreStatus = "unknown";
  let productsCount = -1;
  let firestoreError: any = null;

  try {
    const snap = await adminDb.collection("products").get();
    firestoreStatus = "connected";
    productsCount = snap.size;
  } catch (err: any) {
    firestoreStatus = "error";
    firestoreError = {
      message: err?.message,
      code: err?.code,
      stack: err?.stack?.split("\n").slice(0, 3)
    };
  }

  const response = {
    hasEnvServiceAccount: !!process.env.FIREBASE_SERVICE_ACCOUNT,
    hasEnvServiceAccountB64: !!process.env.FIREBASE_SERVICE_ACCOUNT_B64,
    envAccountLen: (process.env.FIREBASE_SERVICE_ACCOUNT || process.env.FIREBASE_SERVICE_ACCOUNT_B64 || "").length,
    firestoreStatus,
    productsCount,
    firestoreError
  };

  res.status(200).json(response);
};
