import type { RequestHandler } from "express";
import multer from "multer";
import path from "path";
import fs from "fs";
import { adminDb } from "../lib/firebase-admin.js";

// Ensure upload directories exist safely (supports Vercel serverless /tmp)
const isVercel = Boolean(process.env.VERCEL || process.env.AWS_LAMBDA_FUNCTION_NAME);
const uploadDir = isVercel ? "/tmp/uploads" : path.join(process.cwd(), "client/public/uploads");

function ensureDirs() {
  try {
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
  } catch (e) {
    // Ignore read-only filesystem errors during cold start
  }
}

// Storage for cover images (memory/disk)
const imageStorage = multer.memoryStorage();

export const upload = multer({ 
  storage: imageStorage,
  limits: {
    fileSize: 10 * 1024 * 1024 // 10MB max for images
  }
});

// Memory storage for PDF ebooks so we can persist in Firestore/Storage with zero serverless container loss
const pdfStorage = multer.memoryStorage();

export const uploadPdf = multer({
  storage: pdfStorage,
  limits: {
    fileSize: 60 * 1024 * 1024 // 60MB max for PDF ebooks
  },
  fileFilter: (_req, file, cb) => {
    if (file.mimetype === "application/pdf" || file.originalname.toLowerCase().endsWith(".pdf")) {
      cb(null, true);
    } else {
      cb(new Error("Only PDF files are supported."));
    }
  },
});

/** POST /api/admin/upload-image — admin only */
export const handleUploadImage: RequestHandler = (req, res) => {
  if (!req.file) {
    res.status(400).json({ error: "No image file provided" });
    return;
  }
  
  // Return base64 data url for images
  const base64 = req.file.buffer.toString("base64");
  const mime = req.file.mimetype || "image/webp";
  const url = `data:${mime};base64,${base64}`;
  res.json({ url });
};

/** 
 * POST /api/admin/upload-pdf — admin only
 * Persists the actual PDF in Firestore chunks permanently so it is never lost on serverless restarts
 */
export const handleUploadPdf: RequestHandler = async (req, res) => {
  if (!req.file) {
    res.status(400).json({ error: "No PDF file provided" });
    return;
  }
  
  try {
    const fileBuffer = req.file.buffer;
    const fileName = req.file.originalname;
    const fileSize = req.file.size;
    const fileId = `ebook_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;

    // Split file into 700KB chunks (safe under Firestore 1MB doc limit)
    const CHUNK_SIZE = 700 * 1024;
    const totalChunks = Math.ceil(fileBuffer.length / CHUNK_SIZE);

    // Save metadata
    await adminDb.collection("ebook_files").doc(fileId).set({
      fileName,
      fileSize,
      totalChunks,
      createdAt: new Date().toISOString(),
    });

    // Write all chunks in batches
    for (let i = 0; i < totalChunks; i++) {
      const start = i * CHUNK_SIZE;
      const end = Math.min(start + CHUNK_SIZE, fileBuffer.length);
      const chunkSlice = fileBuffer.subarray(start, end);
      const chunkBase64 = chunkSlice.toString("base64");

      await adminDb.collection("ebook_files").doc(fileId).collection("chunks").doc(String(i).padStart(4, "0")).set({
        index: i,
        data: chunkBase64,
      });
    }

    const url = `firestore-file://${fileId}`;
    res.json({
      url,
      fileName,
      fileSize,
      fileId,
    });
  } catch (err: any) {
    console.error("PDF upload error:", err);
    res.status(500).json({ error: err.message || "Failed to store PDF file" });
  }
};

/**
 * GET /api/admin/test-pdf/:fileId — admin only
 * Allows admin to test and view their uploaded PDF directly in a new tab
 */
export const handleTestPdf: RequestHandler = async (req, res) => {
  const fileId = req.params.fileId as string;
  try {
    const metaDoc = await adminDb.collection("ebook_files").doc(fileId).get();
    if (!metaDoc.exists) {
      res.status(404).send("PDF file not found in storage");
      return;
    }

    const meta = metaDoc.data()!;
    const chunksSnapshot = await adminDb.collection("ebook_files").doc(fileId).collection("chunks").orderBy("index", "asc").get();
    
    if (chunksSnapshot.empty) {
      res.status(404).send("PDF file chunks not found");
      return;
    }

    const chunkBuffers: Buffer[] = [];
    for (const doc of chunksSnapshot.docs) {
      const dataBase64 = doc.data().data;
      if (dataBase64) {
        chunkBuffers.push(Buffer.from(dataBase64, "base64"));
      }
    }

    const fullPdfBuffer = Buffer.concat(chunkBuffers);
    res.setHeader("Content-Type", "application/pdf");
    res.setHeader("Content-Disposition", `inline; filename="${encodeURIComponent(meta.fileName || "ebook.pdf")}"`);
    res.setHeader("Content-Length", fullPdfBuffer.length);
    res.send(fullPdfBuffer);
  } catch (err: any) {
    console.error("Test PDF error:", err);
    res.status(500).send("Error reading PDF file");
  }
};
