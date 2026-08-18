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
  const router = express.Router();

  // Middleware
  app.use(cors());
  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));

  // Serve uploads directly from Express
  app.use("/uploads", express.static(path.join(process.cwd(), "client/public/uploads")));

  // ─── Legacy & Health routes ─────────────────────────────
  router.get("/ping", (_req, res) => {
    const ping = process.env.PING_MESSAGE ?? "ping";
    res.json({ message: ping, status: "ok" });
  });
  router.get("/demo", handleDemo);

  // ─── Public product routes ─────────────────────────────
  router.get("/products", handleListProducts);
  router.get("/products/:slug", handleGetProduct);

  // ─── Public order & payment routes ─────────────────────
  router.post("/orders", handleCreateOrder);
  router.post("/paystack/initialize", handleInitializePaystack);
  router.post("/paystack/verify", handleVerifyPaystack);
  router.get("/orders/:orderId/download/:productId", handleDownloadGuide);
  router.post("/test-upload", upload.single("image"), handleUploadImage);

  // ─── Authenticated user routes ─────────────────────────
  router.get("/user/orders", handleUserOrders);

  // ─── Admin-protected routes ────────────────────────────
  router.post("/admin/upload-image", requireAdmin, upload.single("image"), handleUploadImage);
  router.post("/admin/upload-pdf", requireAdmin, uploadPdf.single("pdf"), handleUploadPdf);
  
  router.post("/admin/products", requireAdmin, handleCreateProduct);
  router.put("/admin/products/:id", requireAdmin, handleUpdateProduct);
  router.delete("/admin/products/:id", requireAdmin, handleDeleteProduct);

  router.get("/admin/orders", requireAdmin, handleListOrders);
  router.get("/admin/orders/:id", requireAdmin, handleGetOrder);
  router.patch("/admin/orders/:id", requireAdmin, handleUpdateOrderStatus);

  router.get("/admin/customers", requireAdmin, handleListCustomers);

  router.get("/admin/promotions", requireAdmin, handleListPromotions);
  router.post("/admin/promotions", requireAdmin, handleCreatePromotion);
  router.put("/admin/promotions/:id", requireAdmin, handleUpdatePromotion);
  router.delete("/admin/promotions/:id", requireAdmin, handleDeletePromotion);

  router.get("/admin/analytics", requireAdmin, handleAnalytics);

  router.get("/admin/settings", requireAdmin, handleGetSettings);
  router.put("/admin/settings", requireAdmin, handleUpdateSettings);
  
  router.put("/admin/credentials", requireAdmin, handleUpdateCredentials);

  // Mount router under BOTH /api and / so all routes match reliably
  app.use("/api", router);
  app.use("/", router);

  return app;
}
