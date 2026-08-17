import type { RequestHandler } from "express";
import { getOrderById, getProductById } from "../data/db";
import fs from "fs";
import path from "path";

/**
 * Generates a clean, valid standard PDF document stream for a digital guide.
 */
function createGuidePdf(title: string, author: string, category: string, customerName: string): Buffer {
  const contentLines = [
    `%PDF-1.4`,
    `1 0 obj << /Type /Catalog /Pages 2 0 R >> endobj`,
    `2 0 obj << /Type /Pages /Kids [3 0 R] /Count 1 >> endobj`,
    `3 0 obj << /Type /Page /Parent 2 0 R /MediaBox [0 0 595 842] /Contents 4 0 R /Resources << /Font << /F1 5 0 R /F2 6 0 R >> >> >> endobj`,
    `5 0 obj << /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Bold >> endobj`,
    `6 0 obj << /Type /Font /Subtype /Type1 /BaseFont /Helvetica >> endobj`,
  ];

  const escapePdfText = (text: string) => text.replace(/\\/g, "\\\\").replace(/\(/g, "\\(").replace(/\)/g, "\\)");

  const streamBody = [
    `BT`,
    // Header Banner
    `/F1 24 Tf 50 780 Td (${escapePdfText(title)}) Tj`,
    `/F2 12 Tf 0 -30 Td (Category: ${escapePdfText(category)}  |  Author: ${escapePdfText(author || "ApexMindReads")}) Tj`,
    `/F2 10 Tf 0 -25 Td (Officially licensed to: ${escapePdfText(customerName)}  |  ApexMindReads Digital Library) Tj`,
    // Divider
    `0 -20 Td (---------------------------------------------------------------------------------------------------) Tj`,
    // Section 1: Welcome
    `/F1 16 Tf 0 -35 Td (1. Welcome to Your Guide) Tj`,
    `/F2 11 Tf 0 -22 Td (Thank you for choosing ApexMindReads. This guide is crafted to bring actionable clarity,) Tj`,
    `0 -16 Td (practical structure, and lasting impact to your daily habits, mindset, and decisions.) Tj`,
    // Section 2: Core Principles
    `/F1 16 Tf 0 -35 Td (2. Key Frameworks & Reflections) Tj`,
    `/F2 11 Tf 0 -22 Td (Principle 1: Clarity Precedes Mastery. Define your core objectives before taking action.) Tj`,
    `0 -18 Td (Principle 2: Sustainable Progress. Small, consistent daily practices outperform sporadic bursts.) Tj`,
    `0 -18 Td (Principle 3: Guarded Focus. Protect your attention and boundaries from unnecessary noise.) Tj`,
    // Section 3: Actionable Exercises
    `/F1 16 Tf 0 -35 Td (3. Weekly Action Plan) Tj`,
    `/F2 11 Tf 0 -22 Td (Step 1: Dedicate 15 minutes each morning to review your daily priorities.) Tj`,
    `0 -18 Td (Step 2: Document weekly reflections in your digital journal.) Tj`,
    `0 -18 Td (Step 3: Apply the core frameworks discussed in this guide to one key area of your life.) Tj`,
    // Footer
    `/F2 9 Tf 0 -70 Td ((c) ApexMindReads - Built for the Becoming. Instant Digital Edition.) Tj`,
    `ET`,
  ].join("\n");

  const streamLength = Buffer.byteLength(streamBody, "utf-8");

  contentLines.push(
    `4 0 obj << /Length ${streamLength} >>`,
    `stream`,
    streamBody,
    `endstream`,
    `endobj`,
    `xref`,
    `0 7`,
    `0000000000 65535 f `,
    `0000000009 00000 n `,
    `0000000058 00000 n `,
    `0000000115 00000 n `,
    `0000000300 00000 n `,
    `0000000235 00000 n `,
    `0000000295 00000 n `,
    `trailer << /Size 7 /Root 1 0 R >>`,
    `startxref`,
    `${contentLines.join("\n").length}`,
    `%%EOF`
  );

  return Buffer.from(contentLines.join("\n"), "utf-8");
}

/**
 * GET /api/orders/:orderId/download/:productId
 * Downloads a purchased guide if the order is marked Paid
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
    const author = product?.cover?.author || "ApexMindReads";
    const category = product?.category || "Digital Guide";

    // If product has a custom uploaded PDF file on the server, stream that file
    if (product?.pdfFileUrl) {
      const candidates = [
        path.join(process.cwd(), "client/public", product.pdfFileUrl.replace(/^\//, "")),
        path.join(process.cwd(), product.pdfFileUrl.replace(/^\//, "")),
      ];
      for (const localFilePath of candidates) {
        if (fs.existsSync(localFilePath)) {
          const downloadFilename = product.pdfFileName || `${title.replace(/[^a-zA-Z0-9_-]/g, "_")}.pdf`;
          res.setHeader("Content-Type", "application/pdf");
          res.setHeader("Content-Disposition", `attachment; filename="${encodeURIComponent(downloadFilename)}"`);
          const fileStream = fs.createReadStream(localFilePath);
          fileStream.pipe(res);
          return;
        }
      }
    }

    // Dynamic clean PDF delivery
    const pdfBuffer = createGuidePdf(title, author, category, order.customerName || "Valued Reader");
    const safeFilename = `${title.replace(/[^a-zA-Z0-9_-]/g, "_")}.pdf`;

    res.setHeader("Content-Type", "application/pdf");
    res.setHeader("Content-Disposition", `attachment; filename="${safeFilename}"`);
    res.setHeader("Content-Length", pdfBuffer.length);
    res.send(pdfBuffer);
  } catch (err: any) {
    console.error("Download error:", err);
    res.status(500).json({ error: "Failed to download guide" });
  }
};
