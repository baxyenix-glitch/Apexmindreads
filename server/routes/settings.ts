import type { RequestHandler } from "express";
import { getSettings, updateSettings } from "../data/db.js";
import { UpdateSettingsInputSchema } from "../../shared/schema.js";

/** GET /api/admin/settings */
export const handleGetSettings: RequestHandler = async (_req, res) => {
  try {
    const settings = await getSettings();
    res.json({ settings });
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch settings" });
  }
};

/** GET /api/store/config — Public store settings & active gateway info */
export const handleGetPublicStoreConfig: RequestHandler = async (_req, res) => {
  try {
    const settings = await getSettings();
    res.json({
      storeName: settings.storeName,
      supportEmail: settings.supportEmail,
      downloadMode: settings.downloadMode,
      currency: settings.currency,
      paymentGateway: settings.paymentGateway || "paystack",
      paystackPublicKey: process.env.PAYSTACK_PUBLIC_KEY || process.env.VITE_PAYSTACK_PUBLIC_KEY || "",
      flutterwavePublicKey: process.env.FLUTTERWAVE_PUBLIC_KEY || process.env.VITE_FLUTTERWAVE_PUBLIC_KEY || "",
    });
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch store configuration" });
  }
};

/** PUT /api/admin/settings */
export const handleUpdateSettings: RequestHandler = async (req, res) => {
  const parsed = UpdateSettingsInputSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.issues[0]?.message ?? "Invalid input" });
    return;
  }

  try {
    const adminToken = (req as any).adminToken;
    await updateSettings(parsed.data, adminToken);
    const settings = await getSettings();
    res.json({ settings });
  } catch (err) {
    res.status(500).json({ error: "Failed to update settings" });
  }
};
