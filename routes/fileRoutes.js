const express = require("express");
const router = express.Router();
const fileController = require("../controllers/fileController");
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
  if (
    file.mimetype === "application/pdf" ||
    file.mimetype.startsWith("image/")
  ) {
    cb(null, true);
  } else {
    cb(new Error("Invalid file type"), false);
  }
};

const upload = multer({ storage, fileFilter });

router.post("/", upload.single("file"), fileController.createFile);
router.get("/", fileController.getFiles);
router.get("/:id", fileController.getFile);
router.put("/:id", fileController.updateFile);
router.delete("/:id", fileController.deleteFile);
router.get("/:id/content", fileController.getFileContent);

module.exports = router;
