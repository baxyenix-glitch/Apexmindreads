import type { RequestHandler } from "express";
import { getOrderById, getProductById } from "../data/db.js";
import { adminDb } from "../lib/firebase-admin.js";
import fs from "fs";
import path from "path";

/**
 * GET /api/orders/:orderId/download/:productId
 * Streams the exact digital PDF guide to verified buyers.
 * Handles Chunked Firestore Storage, Google Drive, direct Cloud URLs, and local files.
 * Strict: No placeholder/fallback PDFs are generated.
 */
export const handleDownloadGuide: RequestHandler = async (req, res) => {
  const orderId = req.params.orderId as string;
  const productId = req.params.productId as string;

  try {
    const order = await getOrderById(orderId);
    if (!order) {
      res.status(404).json({ error: "Order not found" });
      return;
    }

    if (order.status !== "Paid") {
      res.status(403).json({ error: "Order has not been paid. Download is locked." });
      return;
    }

    const orderItem = order.items.find((item) => item.productId === productId);
    if (!orderItem) {
      res.status(404).json({ error: "This product was not part of your order" });
      return;
    }

    const product = await getProductById(productId);
    const title = product?.title || orderItem.title || "ApexMindReads Guide";
    const downloadFilename = product?.pdfFileName || `${title.replace(/[^a-zA-Z0-9_-]/g, "_")}.pdf`;

    if (!product?.pdfFileUrl) {
      res.status(404).json({
        error: `No PDF ebook file has been attached to "${title}" yet. Please contact support.`,
      });
      return;
    }

    // 1. Chunked Firestore Ebook Storage (100% persistent on serverless)
    if (product.pdfFileUrl.startsWith("firestore-file://")) {
      const fileId = product.pdfFileUrl.replace("firestore-file://", "").trim();
      const metaDoc = await adminDb.collection("ebook_files").doc(fileId).get();
      if (metaDoc.exists) {
        const chunksSnapshot = await adminDb
          .collection("ebook_files")
          .doc(fileId)
          .collection("chunks")
          .orderBy("index", "asc")
          .get();

        if (!chunksSnapshot.empty) {
          const chunkBuffers: Buffer[] = [];
          for (const doc of chunksSnapshot.docs) {
            const dataBase64 = doc.data().data;
            if (dataBase64) {
              chunkBuffers.push(Buffer.from(dataBase64, "base64"));
            }
          }
          const fullPdfBuffer = Buffer.concat(chunkBuffers);
          res.setHeader("Content-Type", "application/pdf");
          res.setHeader("Content-Disposition", `attachment; filename="${encodeURIComponent(downloadFilename)}"`);
          res.setHeader("Content-Length", fullPdfBuffer.length);
          res.send(fullPdfBuffer);
          return;
        }
      }
    }

    // 2. Direct Cloud URL (Google Drive / Dropbox / S3 / CDN / Cloud Storage)
    if (product.pdfFileUrl.startsWith("http://") || product.pdfFileUrl.startsWith("https://")) {
      let directUrl = product.pdfFileUrl;

      // Auto-convert Google Drive viewer link to direct download stream
      if (directUrl.includes("drive.google.com/file/d/")) {
        const fileId = directUrl.split("/d/")[1]?.split("/")[0]?.split("?")[0];
        if (fileId) {
          directUrl = `https://drive.google.com/uc?export=download&id=${fileId}`;
        }
      } else if (directUrl.includes("dropbox.com") && directUrl.includes("dl=0")) {
        directUrl = directUrl.replace("dl=0", "dl=1");
      }

      try {
        const upstream = await fetch(directUrl);
        if (upstream.ok) {
          const contentType = upstream.headers.get("content-type") || "application/pdf";
          res.setHeader("Content-Type", contentType);
          res.setHeader("Content-Disposition", `attachment; filename="${encodeURIComponent(downloadFilename)}"`);
          const contentLength = upstream.headers.get("content-length");
          if (contentLength) {
            res.setHeader("Content-Length", contentLength);
          }
          const arrayBuffer = await upstream.arrayBuffer();
          res.send(Buffer.from(arrayBuffer));
          return;
        } else {
          console.warn(`Upstream download returned ${upstream.status}, redirecting to directUrl`);
          res.redirect(directUrl);
          return;
        }
      } catch (fetchErr) {
        console.warn("Proxy download failed, redirecting:", fetchErr);
        res.redirect(directUrl);
        return;
      }
    }

    // 3. Base64 Data URL
    if (product.pdfFileUrl.startsWith("data:")) {
      const base64Data = product.pdfFileUrl.split(",")[1];
      if (base64Data) {
        const fileBuffer = Buffer.from(base64Data, "base64");
        res.setHeader("Content-Type", "application/pdf");
        res.setHeader("Content-Disposition", `attachment; filename="${encodeURIComponent(downloadFilename)}"`);
        res.setHeader("Content-Length", fileBuffer.length);
        res.send(fileBuffer);
        return;
      }
    }

    // 4. Local Server Disk Path
    const candidates = [
      path.join(process.cwd(), "client/public", product.pdfFileUrl.replace(/^\//, "")),
      path.join(process.cwd(), product.pdfFileUrl.replace(/^\//, "")),
      path.join("/tmp/uploads/ebooks", path.basename(product.pdfFileUrl)),
    ];
    for (const localFilePath of candidates) {
      if (fs.existsSync(localFilePath)) {
        res.setHeader("Content-Type", "application/pdf");
        res.setHeader("Content-Disposition", `attachment; filename="${encodeURIComponent(downloadFilename)}"`);
        const fileStream = fs.createReadStream(localFilePath);
        fileStream.pipe(res);
        return;
      }
    }

    res.status(404).json({
      error: `Could not locate the PDF file for "${title}". Please contact support.`,
    });
  } catch (err: any) {
    console.error("Download error:", err);
    res.status(500).json({ error: "Failed to download guide" });
  }
};
