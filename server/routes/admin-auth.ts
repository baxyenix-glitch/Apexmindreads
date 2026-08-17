import type { RequestHandler } from "express";
import { adminAuth } from "../lib/firebase-admin";

// Admin emails are no longer hardcoded
/** Middleware to protect admin routes */
export const requireAdmin: RequestHandler = async (req, res, next) => {
  const token = req.headers.authorization?.replace("Bearer ", "");
  if (!token) {
    res.status(401).json({ error: "Admin authentication required" });
    return;
  }

  try {
    const decodedToken = await adminAuth.verifyIdToken(token);
    
    // Removed email check, any authenticated Firebase user is treated as admin
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
  } catch (err) {
    console.error("Admin verification failed:", err);
    res.status(401).json({ error: "Invalid or expired admin session" });
  }
};
