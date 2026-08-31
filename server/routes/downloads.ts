import type { RequestHandler } from "express";
import { getOrderById, getProductById } from "../data/db.js";
import { adminDb } from "../lib/firebase-admin.js";
import fs from "fs";
import path from "path";

/**
 * GET /api/orders/:orderId/download/:productId
 * Delivers the purchased digital PDF guide to verified customers.
 * Handles /api/ebooks/ files, Cloud URLs, Base64 data, and server files.
 * Strict: No mock/placeholder PDFs.
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

    // 1. Check if it references a stored ebook file (/api/ebooks/fileId.pdf or firestore-file:// or ebook_...)
    let fileId: string | null = null;
    if (product.pdfFileUrl.includes("/ebooks/")) {
      fileId = product.pdfFileUrl.split("/ebooks/")[1]?.replace(/\.pdf$/i, "")?.split("?")[0] || null;
    } else if (product.pdfFileUrl.startsWith("firestore-file://")) {
      fileId = product.pdfFileUrl.replace("firestore-file://", "").trim();
    } else if (product.pdfFileUrl.startsWith("ebook_")) {
      fileId = product.pdfFileUrl;
    }

    if (fileId) {
      const snap = await adminDb.ref(`ebook_files/${fileId}`).get();
      if (snap.exists()) {
        const meta = snap.val();
        const chunksObj = meta.chunks || {};
        const chunkValues = Object.values(chunksObj) as { index: number; data: string }[];
        if (chunkValues.length > 0) {
          chunkValues.sort((a, b) => a.index - b.index);
          const chunkBuffers: Buffer[] = [];
          for (const c of chunkValues) {
            if (c.data) {
              chunkBuffers.push(Buffer.from(c.data, "base64"));
            }
          }
          const fullPdfBuffer = Buffer.concat(chunkBuffers);
          res.setHeader("Content-Type", "application/octet-stream");
          res.setHeader("Content-Disposition", `attachment; filename="${downloadFilename.replace(/"/g, '')}"`);
          res.setHeader("Content-Transfer-Encoding", "binary");
          res.setHeader("X-Content-Type-Options", "nosniff");
          res.setHeader("Content-Length", fullPdfBuffer.length);
          res.send(fullPdfBuffer);
          return;
        }
      }
    }

    // 2. Direct Cloud URL (External HTTP/HTTPS e.g. Google Drive)
    if (product.pdfFileUrl.startsWith("http://") || product.pdfFileUrl.startsWith("https://")) {
      let directUrl = product.pdfFileUrl;

      // Auto-convert Google Drive viewer link to direct download stream
      if (directUrl.includes("drive.google.com/file/d/")) {
        const parsedFileId = directUrl.split("/d/")[1]?.split("/")[0]?.split("?")[0];
        if (parsedFileId) {
          directUrl = `https://drive.google.com/uc?export=download&id=${parsedFileId}`;
        }
      } else if (directUrl.includes("dropbox.com") && directUrl.includes("dl=0")) {
        directUrl = directUrl.replace("dl=0", "dl=1");
      }

      try {
        const upstream = await fetch(directUrl);
        if (upstream.ok) {
          res.setHeader("Content-Type", "application/octet-stream");
          res.setHeader("Content-Disposition", `attachment; filename="${downloadFilename.replace(/"/g, '')}"`);
          res.setHeader("Content-Transfer-Encoding", "binary");
          res.setHeader("X-Content-Type-Options", "nosniff");
          const contentLength = upstream.headers.get("content-length");
          if (contentLength) {
            res.setHeader("Content-Length", contentLength);
          }
          const arrayBuffer = await upstream.arrayBuffer();
          res.send(Buffer.from(arrayBuffer));
          return;
        } else {
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
        res.setHeader("Content-Type", "application/octet-stream");
        res.setHeader("Content-Disposition", `attachment; filename="${downloadFilename.replace(/"/g, '')}"`);
        res.setHeader("Content-Transfer-Encoding", "binary");
        res.setHeader("X-Content-Type-Options", "nosniff");
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
        res.setHeader("Content-Type", "application/octet-stream");
        res.setHeader("Content-Disposition", `attachment; filename="${downloadFilename.replace(/"/g, '')}"`);
        res.setHeader("Content-Transfer-Encoding", "binary");
        res.setHeader("X-Content-Type-Options", "nosniff");
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
