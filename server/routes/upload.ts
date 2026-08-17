import type { RequestHandler } from "express";
import multer from "multer";
import path from "path";
import fs from "fs";

// Ensure upload directories exist
const uploadDir = path.join(process.cwd(), "client/public/uploads");
const ebooksDir = path.join(process.cwd(), "client/public/uploads/ebooks");

if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}
if (!fs.existsSync(ebooksDir)) {
  fs.mkdirSync(ebooksDir, { recursive: true });
}

// Storage for cover images
const imageStorage = multer.diskStorage({
  destination: (_req, _file, cb) => {
    cb(null, uploadDir);
  },
  filename: (_req, file, cb) => {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    const ext = path.extname(file.originalname);
    cb(null, `cover-${uniqueSuffix}${ext}`);
  },
});

export const upload = multer({ 
  storage: imageStorage,
  limits: {
    fileSize: 10 * 1024 * 1024 // 10MB max for images
  }
});

// Storage for PDF ebooks
const pdfStorage = multer.diskStorage({
  destination: (_req, _file, cb) => {
    cb(null, ebooksDir);
  },
  filename: (_req, file, cb) => {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    const sanitizedName = path.basename(file.originalname, path.extname(file.originalname)).replace(/[^a-zA-Z0-9_-]/g, "_");
    cb(null, `${sanitizedName}-${uniqueSuffix}.pdf`);
  },
});

export const uploadPdf = multer({
  storage: pdfStorage,
  limits: {
    fileSize: 100 * 1024 * 1024 // 100MB max for PDF ebooks
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
  
  const url = `/uploads/${req.file.filename}`;
  res.json({ url });
};

/** POST /api/admin/upload-pdf — admin only */
export const handleUploadPdf: RequestHandler = (req, res) => {
  if (!req.file) {
    res.status(400).json({ error: "No PDF file provided" });
    return;
  }
  
  const url = `/uploads/ebooks/${req.file.filename}`;
  res.json({ 
    url,
    fileName: req.file.originalname,
    fileSize: req.file.size
  });
};
