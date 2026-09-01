import type { RequestHandler } from "express";
import { getPromotions, getPromotionById, createPromotion, updatePromotion, deletePromotion, generateId } from "../data/db.js";
import { CreatePromotionInputSchema, UpdatePromotionInputSchema } from "../../shared/schema.js";

/** GET /api/admin/promotions */
export const handleListPromotions: RequestHandler = async (_req, res) => {
  try {
    const promotions = await getPromotions();
    res.json({ promotions });
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch promotions" });
  }
};

/** POST /api/admin/promotions */
export const handleCreatePromotion: RequestHandler = async (req, res) => {
  const parsed = CreatePromotionInputSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.issues[0]?.message ?? "Invalid input" });
    return;
  }

  try {
    const promotion = {
      id: generateId("promo"),
      ...parsed.data,
      createdAt: new Date().toISOString(),
    };

    const adminToken = (req as any).adminToken;
    await createPromotion(promotion, adminToken);
    res.status(201).json({ promotion });
  } catch (err) {
    res.status(500).json({ error: "Failed to create promotion" });
  }
};

/** PUT /api/admin/promotions/:id */
export const handleUpdatePromotion: RequestHandler = async (req, res) => {
  const parsed = UpdatePromotionInputSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.issues[0]?.message ?? "Invalid input" });
    return;
  }

  try {
    const existing = await getPromotionById(req.params.id as string);
    if (!existing) {
      res.status(404).json({ error: "Promotion not found" });
      return;
    }

    const adminToken = (req as any).adminToken;
    await updatePromotion(req.params.id as string, parsed.data, adminToken);
    res.json({ promotion: { ...existing, ...parsed.data } });
  } catch (err) {
    res.status(500).json({ error: "Failed to update promotion" });
  }
};

/** DELETE /api/admin/promotions/:id */
export const handleDeletePromotion: RequestHandler = async (req, res) => {
  try {
    const existing = await getPromotionById(req.params.id as string);
    if (!existing) {
      res.status(404).json({ error: "Promotion not found" });
      return;
    }

    const adminToken = (req as any).adminToken;
    await deletePromotion(req.params.id as string, adminToken);
    res.json({ message: "Promotion deleted" });
  } catch (err) {
    res.status(500).json({ error: "Failed to delete promotion" });
  }
};
