import "dotenv/config";
import express from "express";
import cors from "cors";
import { handleDemo } from "./routes/demo.js";
import { requireAdmin } from "./routes/admin-auth.js";
import { handleListProducts, handleGetProduct, handleCreateProduct, handleUpdateProduct, handleDeleteProduct } from "./routes/products.js";
import { handleListOrders, handleGetOrder, handleUpdateOrderStatus, handleCreateOrder, handleUserOrders } from "./routes/orders.js";
import { handleListCustomers } from "./routes/customers.js";
import { handleListPromotions, handleCreatePromotion, handleUpdatePromotion, handleDeletePromotion } from "./routes/promotions.js";
import { handleAnalytics } from "./routes/analytics.js";
import { handleGetSettings, handleUpdateSettings } from "./routes/settings.js";
import { 
  handleUploadImage, 
  handleUploadPdf, 
  handleUploadPdfInit, 
  handleUploadPdfChunk, 
  handleUploadPdfComplete, 
  upload, 
  uploadPdf, 
  handleGetEbookFile 
} from "./routes/upload.js";
import { handleUpdateCredentials } from "./routes/admin.js";
import { handleInitializePaystack, handleVerifyPaystack } from "./routes/paystack.js";
import { handleDownloadGuide } from "./routes/downloads.js";
import { 
  handleGetVapidPublicKey, 
  handlePushSubscribe, 
  handlePushUnsubscribe, 
  handlePushTest 
} from "./routes/push.js";
import path from "path";

export function createServer() {
  const app = express();
  const router = express.Router();

  // Middleware
  app.use(cors());
  app.use(express.json({ limit: "50mb" }));
  app.use(express.urlencoded({ limit: "50mb", extended: true }));

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
  router.get("/ebooks/:fileId", handleGetEbookFile);
  router.post("/test-upload", upload.single("image"), handleUploadImage);

  // ─── Authenticated user routes ─────────────────────────
  router.get("/user/orders", handleUserOrders);

  // ─── Admin-protected routes ────────────────────────────
  router.post("/admin/upload-image", requireAdmin, upload.single("image"), handleUploadImage);
  router.post("/admin/upload-pdf", requireAdmin, uploadPdf.single("pdf"), handleUploadPdf);
  router.post("/admin/upload-pdf-init", requireAdmin, handleUploadPdfInit);
  router.post("/admin/upload-pdf-chunk", requireAdmin, handleUploadPdfChunk);
  router.post("/admin/upload-pdf-complete", requireAdmin, handleUploadPdfComplete);
  
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
  
  // ─── Admin Web Push routes (Background mobile notifications) ──
  router.get("/admin/push-vapid-public-key", requireAdmin, handleGetVapidPublicKey);
  router.post("/admin/push-subscribe", requireAdmin, handlePushSubscribe);
  router.post("/admin/push-unsubscribe", requireAdmin, handlePushUnsubscribe);
  router.post("/admin/push-test", requireAdmin, handlePushTest);

  // Mount router under BOTH /api and / so all routes match reliably
  app.use("/api", router);
  app.use("/", router);

  return app;
}
