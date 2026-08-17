import type { RequestHandler } from "express";
import { getSettings, updateSettings } from "../data/db";
import { UpdateSettingsInputSchema } from "../../shared/schema";

/** GET /api/admin/settings */
export const handleGetSettings: RequestHandler = async (_req, res) => {
  try {
    const settings = await getSettings();
    res.json({ settings });
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch settings" });
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
    await updateSettings(parsed.data);
    const settings = await getSettings();
    res.json({ settings });
  } catch (err) {
    res.status(500).json({ error: "Failed to update settings" });
  }
};
