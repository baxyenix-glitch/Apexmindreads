import "dotenv/config";
import express from "express";
import cors from "cors";
import { handleDemo } from "./routes/demo";
import { requireAdmin } from "./routes/admin-auth";
import { handleListProducts, handleGetProduct, handleCreateProduct, handleUpdateProduct, handleDeleteProduct } from "./routes/products";
import { handleListOrders, handleGetOrder, handleUpdateOrderStatus, handleCreateOrder, handleUserOrders } from "./routes/orders";
import { handleListCustomers } from "./routes/customers";
import { handleListPromotions, handleCreatePromotion, handleUpdatePromotion, handleDeletePromotion } from "./routes/promotions";
import { handleAnalytics } from "./routes/analytics";
import { handleGetSettings, handleUpdateSettings } from "./routes/settings";
import { handleUploadImage, handleUploadPdf, upload, uploadPdf } from "./routes/upload";
import { handleUpdateCredentials } from "./routes/admin";
import { handleInitializePaystack, handleVerifyPaystack } from "./routes/paystack";
import { handleDownloadGuide } from "./routes/downloads";
import path from "path";

export function createServer() {
  const app = express();

  // Middleware
  app.use(cors());
  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));

  // Serve uploads directly from Express
  app.use("/uploads", express.static(path.join(process.cwd(), "client/public/uploads")));

  // ─── Legacy routes ─────────────────────────────────────
  app.get("/api/ping", (_req, res) => {
    const ping = process.env.PING_MESSAGE ?? "ping";
    res.json({ message: ping });
  });
  app.get("/api/demo", handleDemo);

  // ─── Public product routes ─────────────────────────────
  app.get("/api/products", handleListProducts);
  app.get("/api/products/:slug", handleGetProduct);

  // ─── Public order & payment routes ─────────────────────
  app.post("/api/orders", handleCreateOrder);
  app.post("/api/paystack/initialize", handleInitializePaystack);
  app.post("/api/paystack/verify", handleVerifyPaystack);
  app.get("/api/orders/:orderId/download/:productId", handleDownloadGuide);
  app.post("/api/test-upload", upload.single("image"), handleUploadImage);

  // ─── Authenticated user routes ─────────────────────────
  app.get("/api/user/orders", handleUserOrders);

  // ─── Admin-protected routes ────────────────────────────
  app.post("/api/admin/upload-image", requireAdmin, upload.single("image"), handleUploadImage);
  app.post("/api/admin/upload-pdf", requireAdmin, uploadPdf.single("pdf"), handleUploadPdf);
  
  app.post("/api/admin/products", requireAdmin, handleCreateProduct);
  app.put("/api/admin/products/:id", requireAdmin, handleUpdateProduct);
  app.delete("/api/admin/products/:id", requireAdmin, handleDeleteProduct);

  app.get("/api/admin/orders", requireAdmin, handleListOrders);
  app.get("/api/admin/orders/:id", requireAdmin, handleGetOrder);
  app.patch("/api/admin/orders/:id", requireAdmin, handleUpdateOrderStatus);

  app.get("/api/admin/customers", requireAdmin, handleListCustomers);

  app.get("/api/admin/promotions", requireAdmin, handleListPromotions);
  app.post("/api/admin/promotions", requireAdmin, handleCreatePromotion);
  app.put("/api/admin/promotions/:id", requireAdmin, handleUpdatePromotion);
  app.delete("/api/admin/promotions/:id", requireAdmin, handleDeletePromotion);

  app.get("/api/admin/analytics", requireAdmin, handleAnalytics);

  app.get("/api/admin/settings", requireAdmin, handleGetSettings);
  app.put("/api/admin/settings", requireAdmin, handleUpdateSettings);
  
  app.put("/api/admin/credentials", requireAdmin, handleUpdateCredentials);

  return app;
}
