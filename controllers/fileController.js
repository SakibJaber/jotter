const File = require("../models/File");
const ShareLink = require("../models/ShareLink");
const path = require("path");
const fs = require("fs");
const crypto = require("crypto");

exports.createFile = async (req, res, next) => {
  try {
    const { name, type, folderId } = req.body;
    const userId = req.user.id;
    let filePath, content;

    if (type === "document") {
      content = req.body.content;
      if (!content)
        return res
          .status(400)
          .json({ message: "Content is required for documents" });
    } else if (type === "pdf" || type === "image") {
      if (!req.file)
        return res
          .status(400)
          .json({ message: "File is required for pdf and image types" });
      filePath = req.file.path;
    } else {
      return res.status(400).json({ message: "Invalid file type" });
    }

    const file = new File({
      name,
      type,
      folderId,
      userId,
      filePath,
      content,
      isFavorite: false,
    });
    await file.save();
    res.status(201).json(file);
  } catch (error) {
    next(error);
  }
};

exports.getFiles = async (req, res, next) => {
  try {
    const {
      sortBy = "createdAt",
      sortOrder = "desc",
      page = 1,
      limit = 10,
      folderId,
      isFavorite,
    } = req.query;
    const sort = { [sortBy]: sortOrder === "asc" ? 1 : -1 };
    const skip = (page - 1) * limit;
    const query = { userId: req.user.id };
    if (folderId) query.folderId = folderId;
    if (isFavorite !== undefined) query.isFavorite = isFavorite === "true";

    const files = await File.find(query)
      .sort(sort)
      .skip(skip)
      .limit(parseInt(limit));
    const total = await File.countDocuments(query);

    const formattedFiles = files.map((file) => ({
      ...file.toObject(),
      content: file.type === "document" ? file.content : null,
      contentUrl:
        file.type !== "document" ? `/api/files/${file._id}/content` : null,
    }));

    res.json({
      data: formattedFiles,
      pagination: {
        total,
        page: parseInt(page),
        limit: parseInt(limit),
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    next(error);
  }
};

exports.getFile = async (req, res, next) => {
  try {
    const file = await File.findOne({
      _id: req.params.id,
      userId: req.user.id,
    });
    if (!file) return res.status(404).json({ message: "File not found" });
    const response = {
      ...file.toObject(),
      content: file.type === "document" ? file.content : null,
      contentUrl:
        file.type !== "document" ? `/api/files/${file._id}/content` : null,
    };
    res.json(response);
  } catch (error) {
    next(error);
  }
};

exports.updateFile = async (req, res, next) => {
  try {
    const { name, content, isFavorite } = req.body;
    const file = await File.findOne({
      _id: req.params.id,
      userId: req.user.id,
    });
    if (!file) return res.status(404).json({ message: "File not found" });

    if (name) file.name = name;
    if (file.type === "document" && content !== undefined)
      file.content = content;
    if (isFavorite !== undefined) file.isFavorite = isFavorite;

    await file.save();
    const response = {
      ...file.toObject(),
      content: file.type === "document" ? file.content : null,
      contentUrl:
        file.type !== "document" ? `/api/files/${file._id}/content` : null,
    };
    res.json(response);
  } catch (error) {
    next(error);
  }
};

exports.deleteFile = async (req, res, next) => {
  try {
    const file = await File.findOneAndDelete({
      _id: req.params.id,
      userId: req.user.id,
    });
    if (!file) return res.status(404).json({ message: "File not found" });
    if (file.filePath) fs.unlinkSync(file.filePath);
    res.status(204).send();
  } catch (error) {
    next(error);
  }
};

exports.getFileContent = async (req, res, next) => {
  try {
    const file = await File.findOne({
      _id: req.params.id,
      userId: req.user.id,
    });
    if (!file || file.type === "document")
      return res.status(404).json({ message: "File not found" });
    res.sendFile(path.resolve(file.filePath));
  } catch (error) {
    next(error);
  }
};

exports.getStorageOverview = async (req, res, next) => {
  try {
    const TOTAL_STORAGE = 15 * 1024 * 1024 * 1024; // 15GB in bytes
    const userId = req.user.id;

    // Get all files for the user
    const files = await File.find({ userId });

    let usedSpace = 0;
    for (const file of files) {
      if (file.filePath && (file.type === "pdf" || file.type === "image")) {
        try {
          const stats = fs.statSync(file.filePath);
          usedSpace += stats.size; // Add file size in bytes
        } catch (error) {
          // Skip files that may have been deleted or are inaccessible
          console.error(`Error reading file ${file.filePath}:`, error.message);
        }
      } else if (file.type === "document" && file.content) {
        // Estimate document size (UTF-8 string length in bytes)
        usedSpace += Buffer.byteLength(file.content, "utf8");
      }
    }

    const availableSpace = TOTAL_STORAGE - usedSpace;

    // Convert to human-readable format
    const formatBytes = (bytes) => {
      const units = ["B", "KB", "MB", "GB"];
      let size = bytes;
      let unitIndex = 0;
      while (size >= 1024 && unitIndex < units.length - 1) {
        size /= 1024;
        unitIndex++;
      }
      return `${size.toFixed(2)} ${units[unitIndex]}`;
    };

    res.json({
      totalStorage: {
        bytes: TOTAL_STORAGE,
        humanReadable: formatBytes(TOTAL_STORAGE),
      },
      usedSpace: {
        bytes: usedSpace,
        humanReadable: formatBytes(usedSpace),
      },
      availableSpace: {
        bytes: availableSpace,
        humanReadable: formatBytes(availableSpace),
      },
    });
  } catch (error) {
    next(error);
  }
};

//

exports.renameFile = async (req, res, next) => {
  try {
    const { name } = req.body;
    if (!name) return res.status(400).json({ message: "New name is required" });

    const file = await File.findOne({
      _id: req.params.id,
      userId: req.user.id,
    });
    if (!file) return res.status(404).json({ message: "File not found" });

    // Update file name in database
    file.name = name;

    // For PDFs and images, rename the file on disk
    if (file.filePath && (file.type === "pdf" || file.type === "image")) {
      const oldPath = file.filePath;
      const ext = path.extname(oldPath);
      const dirname = path.dirname(oldPath);
      const newPath = path.join(dirname, `${name}${ext}`);

      try {
        fs.renameSync(oldPath, newPath);
        file.filePath = newPath;
      } catch (error) {
        return res.status(500).json({
          message: "Failed to rename file on disk",
          error: error.message,
        });
      }
    }

    await file.save();
    const response = {
      ...file.toObject(),
      content: file.type === "document" ? file.content : null,
      contentUrl:
        file.type !== "document" ? `/api/files/${file._id}/content` : null,
    };
    res.json(response);
  } catch (error) {
    next(error);
  }
};

exports.duplicateFile = async (req, res, next) => {
  try {
    const file = await File.findOne({
      _id: req.params.id,
      userId: req.user.id,
    });
    if (!file) return res.status(404).json({ message: "File not found" });

    const newFileData = {
      name: `Copy of ${file.name}`,
      type: file.type,
      folderId: file.folderId,
      userId: file.userId,
      isFavorite: false,
    };

    if (file.type === "document") {
      newFileData.content = file.content;
    } else if (
      file.filePath &&
      (file.type === "pdf" || file.type === "image")
    ) {
      const oldPath = file.filePath;
      const ext = path.extname(oldPath);
      const dirname = path.dirname(oldPath);
      const newFileName = `${Date.now()}-${Math.round(Math.random() * 1e9)}${ext}`;
      const newPath = path.join(dirname, newFileName);

      try {
        fs.copyFileSync(oldPath, newPath);
        newFileData.filePath = newPath;
      } catch (error) {
        return res.status(500).json({
          message: "Failed to duplicate file on disk",
          error: error.message,
        });
      }
    }

    const newFile = new File(newFileData);
    await newFile.save();

    const response = {
      ...newFile.toObject(),
      content: newFile.type === "document" ? newFile.content : null,
      contentUrl:
        newFile.type !== "document"
          ? `/api/files/${newFile._id}/content`
          : null,
    };
    res.status(201).json(response);
  } catch (error) {
    next(error);
  }
};

exports.copyFile = async (req, res, next) => {
  try {
    const { folderId } = req.body;
    if (!folderId)
      return res.status(400).json({ message: "Target folderId is required" });

    const file = await File.findOne({
      _id: req.params.id,
      userId: req.user.id,
    });
    if (!file) return res.status(404).json({ message: "File not found" });

    // Verify target folder exists and belongs to user
    const folder = await require("../models/Folder").findOne({
      _id: folderId,
      userId: req.user.id,
    });
    if (!folder)
      return res.status(404).json({ message: "Target folder not found" });

    const newFileData = {
      name: file.name,
      type: file.type,
      folderId,
      userId: file.userId,
      isFavorite: false,
    };

    if (file.type === "document") {
      newFileData.content = file.content;
    } else if (
      file.filePath &&
      (file.type === "pdf" || file.type === "image")
    ) {
      const oldPath = file.filePath;
      const ext = path.extname(oldPath);
      const dirname = path.dirname(oldPath);
      const newFileName = `${Date.now()}-${Math.round(Math.random() * 1e9)}${ext}`;
      const newPath = path.join(dirname, newFileName);

      try {
        fs.copyFileSync(oldPath, newPath);
        newFileData.filePath = newPath;
      } catch (error) {
        return res.status(500).json({
          message: "Failed to copy file on disk",
          error: error.message,
        });
      }
    }

    const newFile = new File(newFileData);
    await newFile.save();

    const response = {
      ...newFile.toObject(),
      content: newFile.type === "document" ? newFile.content : null,
      contentUrl:
        newFile.type !== "document"
          ? `/api/files/${newFile._id}/content`
          : null,
    };
    res.status(201).json(response);
  } catch (error) {
    next(error);
  }
};

exports.shareFile = async (req, res, next) => {
  try {
    const { expiresInDays = 7 } = req.body;
    if (expiresInDays < 1 || expiresInDays > 30) {
      return res
        .status(400)
        .json({ message: "Expiration must be between 1 and 30 days" });
    }

    const file = await File.findOne({
      _id: req.params.id,
      userId: req.user.id,
    });
    if (!file) return res.status(404).json({ message: "File not found" });

    const token = crypto.randomBytes(12).toString("base64url");
    const expiresAt = new Date(
      Date.now() + expiresInDays * 24 * 60 * 60 * 1000
    );

    const shareLink = new ShareLink({ fileId: file._id, token, expiresAt });
    await shareLink.save();

    const shareUrl = `${req.protocol}://${req.get("host")}/api/files/share/${token}`;
    res.json({ shareUrl, expiresAt });
  } catch (error) {
    next(error);
  }
};

exports.getSharedFile = async (req, res, next) => {
  try {
    const shareLink = await ShareLink.findOne({
      token: req.params.token,
      expiresAt: { $gt: new Date() },
    }).populate("fileId");

    if (!shareLink || !shareLink.fileId) {
      return res
        .status(404)
        .json({ message: "Share link is invalid or expired" });
    }
    const file = shareLink.fileId;
    const response = {
      ...file.toObject(),
      content: file.type === "document" ? file.content : null,
      contentUrl:
        file.type !== "document"
          ? `/api/files/share/${req.params.token}/content`
          : null,
    };

    res.json(response);
  } catch (error) {
    next(error);
  }
};

exports.getSharedFileContent = async (req, res, next) => {
  try {
    const shareLink = await ShareLink.findOne({
      token: req.params.token,
      expiresAt: { $gt: new Date() },
    }).populate("fileId");

    if (
      !shareLink ||
      !shareLink.fileId ||
      shareLink.fileId.type === "document"
    ) {
      return res
        .status(404)
        .json({ message: "Share link is invalid or expired" });
    }

    res.sendFile(path.resolve(shareLink.fileId.filePath));
  } catch (error) {
    next(error);
  }
};

module.exports = exports;
