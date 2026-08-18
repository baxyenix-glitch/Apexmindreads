import type { RequestHandler } from "express";
import { adminAuth } from "../lib/firebase-admin.js";

export const handleUpdateCredentials: RequestHandler = async (req, res) => {
  const { email, password } = req.body;
  const adminInfo = (req as any).admin;

  if (!email && !password) {
    res.status(400).json({ error: "Email or password required" });
    return;
  }

  try {
    const updatePayload: any = {};
    if (email) updatePayload.email = email;
    if (password) updatePayload.password = password;

    await adminAuth.updateUser(adminInfo.id, updatePayload);
    res.json({ message: "Credentials updated successfully" });
  } catch (err: any) {
    console.error("Error updating admin credentials:", err);
    res.status(500).json({ error: err.message || "Failed to update credentials" });
  }
};
