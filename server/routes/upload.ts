import type { RequestHandler } from "express";
import multer from "multer";
import { rtdbPut, rtdbGet } from "../lib/firebase-rtdb.js";

// Storage for cover images
const imageStorage = multer.memoryStorage();
export const upload = multer({ 
  storage: imageStorage,
  limits: {
    fileSize: 10 * 1024 * 1024 // 10MB max for images
  }
});

// Memory storage for PDF ebooks
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
  
  const base64 = req.file.buffer.toString("base64");
  const mime = req.file.mimetype || "image/webp";
  const url = `data:${mime};base64,${base64}`;
  res.json({ url });
};

/** 
 * POST /api/admin/upload-pdf-init — admin only
 * Initializes a chunked upload session for large PDF ebooks (up to 100MB+)
 */
export const handleUploadPdfInit: RequestHandler = async (req, res) => {
  try {
    const { fileName, fileSize, totalChunks } = req.body;
    if (!fileName || !fileSize || !totalChunks) {
      res.status(400).json({ error: "Missing required upload metadata (fileName, fileSize, totalChunks)" });
      return;
    }
    const fileId = `ebook_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
    const adminToken = (req as any).adminToken;
    await rtdbPut(`ebook_files/${fileId}`, {
      fileName,
      fileSize: Number(fileSize),
      totalChunks: Number(totalChunks),
      status: "uploading",
      createdAt: new Date().toISOString(),
    }, adminToken);
    res.json({ fileId });
  } catch (err: any) {
    console.error("PDF init error:", err);
    res.status(500).json({ error: err.message || "Failed to initialize upload" });
  }
};

/**
 * POST /api/admin/upload-pdf-chunk — admin only
 * Receives and stores a single chunk (< 1MB) safely into Realtime Database
 */
export const handleUploadPdfChunk: RequestHandler = async (req, res) => {
  try {
    const { fileId, chunkIndex, data } = req.body;
    if (!fileId || chunkIndex === undefined || !data) {
      res.status(400).json({ error: "Missing fileId, chunkIndex, or chunk data" });
      return;
    }
    const adminToken = (req as any).adminToken;
    await rtdbPut(`ebook_files/${fileId}/chunks/${String(chunkIndex).padStart(4, "0")}`, {
      index: Number(chunkIndex),
      data: String(data),
    }, adminToken);
    res.json({ success: true, chunkIndex });
  } catch (err: any) {
    console.error("PDF chunk error:", err);
    res.status(500).json({ error: err.message || "Failed to store PDF chunk" });
  }
};

/**
 * POST /api/admin/upload-pdf-complete — admin only
 * Finalizes chunked upload and returns the direct downloadable ebook URL
 */
export const handleUploadPdfComplete: RequestHandler = async (req, res) => {
  try {
    const { fileId } = req.body;
    if (!fileId) {
      res.status(400).json({ error: "Missing fileId" });
      return;
    }
    const adminToken = (req as any).adminToken;
    const meta = await rtdbGet(`ebook_files/${fileId}`, adminToken);
    if (!meta) {
      res.status(404).json({ error: "File record not found" });
      return;
    }
    await rtdbPut(`ebook_files/${fileId}/status`, "ready", adminToken);

    const url = `/api/ebooks/${fileId}.pdf`;
    res.json({
      url,
      fileName: meta.fileName,
      fileSize: meta.fileSize,
      fileId,
    });
  } catch (err: any) {
    console.error("PDF complete error:", err);
    res.status(500).json({ error: err.message || "Failed to finalize upload" });
  }
};

/** 
 * POST /api/admin/upload-pdf — admin only
 * Legacy direct one-shot upload handler (for smaller files)
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

    // Split file into 500KB chunks
    const CHUNK_SIZE = 500 * 1024;
    const totalChunks = Math.ceil(fileBuffer.length / CHUNK_SIZE);

    const adminToken = (req as any).adminToken;

    // Save metadata
    await rtdbPut(`ebook_files/${fileId}`, {
      fileName,
      fileSize,
      totalChunks,
      status: "ready",
      createdAt: new Date().toISOString(),
    }, adminToken);

    // Write all chunks
    for (let i = 0; i < totalChunks; i++) {
      const start = i * CHUNK_SIZE;
      const end = Math.min(start + CHUNK_SIZE, fileBuffer.length);
      const chunkSlice = fileBuffer.subarray(start, end);
      const chunkBase64 = chunkSlice.toString("base64");

      await rtdbPut(`ebook_files/${fileId}/chunks/${String(i).padStart(4, "0")}`, {
        index: i,
        data: chunkBase64,
      }, adminToken);
    }

    const url = `/api/ebooks/${fileId}.pdf`;
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
 * GET /api/ebooks/:fileId
 * Streams the PDF ebook directly into the browser tab or download
 */
export const handleGetEbookFile: RequestHandler = async (req, res) => {
  let rawId = (req.params.fileId as string) || "";
  const fileId = rawId.replace(/\.pdf$/i, "");
  
  try {
    const meta = await rtdbGet(`ebook_files/${fileId}`);
    if (!meta) {
      res.status(404).send("PDF file not found");
      return;
    }
    const chunksObj = meta.chunks || {};
    const chunkValues = Object.values(chunksObj) as { index: number; data: string }[];
    
    if (chunkValues.length === 0) {
      res.status(404).send("PDF content not found");
      return;
    }

    // Sort by chunk index
    chunkValues.sort((a, b) => a.index - b.index);

    const chunkBuffers: Buffer[] = [];
    for (const c of chunkValues) {
      if (c.data) {
        chunkBuffers.push(Buffer.from(c.data, "base64"));
      }
    }

    const fullPdfBuffer = Buffer.concat(chunkBuffers);
    const fileName = meta.fileName || "guide.pdf";

    res.setHeader("Content-Type", "application/pdf");
    res.setHeader("Content-Disposition", `inline; filename="${encodeURIComponent(fileName)}"`);
    res.setHeader("Content-Length", fullPdfBuffer.length);
    res.send(fullPdfBuffer);
  } catch (err: any) {
    console.error("Error reading ebook file:", err);
    res.status(500).send("Error reading PDF file");
  }
};
