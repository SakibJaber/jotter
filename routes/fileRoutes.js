const express = require("express");
const router = express.Router();
const fileController = require("../controllers/fileController");
const authMiddleware = require("../middleware/authMiddleware");
const multer = require("multer");
const fs = require("fs");
const path = require("path");

// Ensure directories exist
const ensureDir = (dir) => {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
};

ensureDir("uploads/images");
ensureDir("uploads/documents");

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    if (file.mimetype === "application/pdf") {
      cb(null, "uploads/documents");
    } else if (file.mimetype.startsWith("image/")) {
      cb(null, "uploads/images");
    } else {
      cb(new Error("Invalid file type"), false);
    }
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    cb(null, uniqueSuffix + "-" + file.originalname);
  },
});

const fileFilter = (req, file, cb) => {
  if (file.mimetype === "application/pdf" || file.mimetype.startsWith("image/")) {
    cb(null, true);
  } else {
    cb(new Error("Invalid file type"), false);
  }
};

const upload = multer({ storage, fileFilter });

router.post("/", authMiddleware, upload.single("file"), fileController.createFile);
router.get("/overview", authMiddleware, fileController.getStorageOverview);
router.get("/storage-details", authMiddleware, fileController.getStorageDetails);
router.get("/", authMiddleware, fileController.getFiles);
router.get("/:id", authMiddleware, fileController.getFile);
router.get("/:id/content", authMiddleware, fileController.getFileContent);
router.put("/:id", authMiddleware, fileController.updateFile);
router.delete("/:id", authMiddleware, fileController.deleteFile);
router.put("/:id/rename", authMiddleware, fileController.renameFile);
router.post("/:id/duplicate", authMiddleware, fileController.duplicateFile);
router.post("/:id/copy", authMiddleware, fileController.copyFile);
router.post("/:id/share", authMiddleware, fileController.shareFile);
router.get("/share/:token", fileController.getSharedFile);
router.get("/share/:token/content", fileController.getSharedFileContent);

module.exports = router;