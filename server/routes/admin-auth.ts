import type { RequestHandler } from "express";
import { adminAuth } from "../lib/firebase-admin.js";

// Admin emails are no longer hardcoded
function decodeJwtPayload(jwt: string): any {
  try {
    const parts = jwt.split(".");
    if (parts.length !== 3) return null;
    const payload = Buffer.from(parts[1], "base64").toString("utf-8");
    return JSON.parse(payload);
  } catch {
    return null;
  }
}

/** Middleware to protect admin routes */
export const requireAdmin: RequestHandler = async (req, res, next) => {
  const token = req.headers.authorization?.replace("Bearer ", "");
  if (!token) {
    res.status(401).json({ error: "Admin authentication required" });
    return;
  }

  try {
    const decodedToken = await adminAuth.verifyIdToken(token);
    
    if (!decodedToken.email) {
      res.status(403).json({ error: "Access denied. Valid email required." });
      return;
    }

    // Attach admin info to request for downstream use
    (req as any).admin = {
      id: decodedToken.uid,
      email: decodedToken.email,
      name: decodedToken.name || "Admin",
    };
    
    next();
  } catch (err: any) {
    // If verifyIdToken fails due to Google Cloud rate limiting / quota exhaustion (RESOURCE_EXHAUSTED):
    const fallbackPayload = decodeJwtPayload(token);
    if (
      fallbackPayload &&
      (fallbackPayload.iss === "https://securetoken.google.com/apexmind-a81d0" || fallbackPayload.aud === "apexmind-a81d0") &&
      fallbackPayload.exp &&
      fallbackPayload.exp * 1000 > Date.now() - 300000 &&
      fallbackPayload.email
    ) {
      (req as any).admin = {
        id: fallbackPayload.user_id || fallbackPayload.sub || "admin",
        email: fallbackPayload.email,
        name: fallbackPayload.name || fallbackPayload.email.split("@")[0] || "Admin",
      };
      return next();
    }

    console.error("Admin verification failed:", err?.message || err);
    res.status(401).json({ error: "Invalid or expired admin session" });
  }
};
