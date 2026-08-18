import type { RequestHandler } from "express";
import { getProducts, getProductBySlug, createProduct, updateProduct, deleteProduct, generateId, getProductById } from "../data/db.js";
import { CreateProductInputSchema, UpdateProductInputSchema } from "../../shared/schema.js";

/** GET /api/products — public */
export const handleListProducts: RequestHandler = async (_req, res) => {
  try {
    const products = await getProducts();
    res.json({ products });
  } catch (err: any) {
    console.error("Failed to fetch products:", err);
    res.status(500).json({ error: err.message || "Failed to fetch products" });
  }
};

/** GET /api/products/:slug — public */
export const handleGetProduct: RequestHandler = async (req, res) => {
  try {
    const product = await getProductBySlug(req.params.slug as string);
    if (!product) {
      res.status(404).json({ error: "Product not found" });
      return;
    }
    res.json({ product });
  } catch (err: any) {
    console.error("Failed to fetch product:", err);
    res.status(500).json({ error: err.message || "Failed to fetch product" });
  }
};

/** POST /api/admin/products — admin only */
export const handleCreateProduct: RequestHandler = async (req, res) => {
  const parsed = CreateProductInputSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.issues[0]?.message ?? "Invalid input" });
    return;
  }

  try {
    // Check slug uniqueness
    const existing = await getProductBySlug(parsed.data.slug);
    if (existing) {
      res.status(409).json({ error: "A product with this slug already exists" });
      return;
    }

    const product = { id: generateId("p"), ...parsed.data };
    await createProduct(product);
    res.status(201).json({ product });
  } catch (err) {
    res.status(500).json({ error: "Failed to create product" });
  }
};

/** PUT /api/admin/products/:id — admin only */
export const handleUpdateProduct: RequestHandler = async (req, res) => {
  const parsed = UpdateProductInputSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.issues[0]?.message ?? "Invalid input" });
    return;
  }

  try {
    const existing = await getProductById(req.params.id as string);
    if (!existing) {
      res.status(404).json({ error: "Product not found" });
      return;
    }

    await updateProduct(req.params.id as string, parsed.data);
    res.json({ product: { ...existing, ...parsed.data } });
  } catch (err) {
    res.status(500).json({ error: "Failed to update product" });
  }
};

/** DELETE /api/admin/products/:id — admin only */
export const handleDeleteProduct: RequestHandler = async (req, res) => {
  try {
    const existing = await getProductById(req.params.id as string);
    if (!existing) {
      res.status(404).json({ error: "Product not found" });
      return;
    }

    await deleteProduct(req.params.id as string);
    res.json({ message: "Product deleted" });
  } catch (err) {
    res.status(500).json({ error: "Failed to delete product" });
  }
};
