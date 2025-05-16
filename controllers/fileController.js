const File = require('../models/File');
const path = require('path');
const fs = require('fs');

exports.createFile = async (req, res, next) => {
  try {
    const { name, type, folderId } = req.body;
    const userId = req.user.id;
    let filePath, content;

    if (type === 'document') {
      content = req.body.content;
      if (!content) {
        return res.status(400).json({ message: 'Content is required for documents' });
      }
    } else if (type === 'pdf' || type === 'image') {
      if (!req.file) {
        return res.status(400).json({ message: 'File is required for pdf and image types' });
      }
      filePath = req.file.path;
    } else {
      return res.status(400).json({ message: 'Invalid file type' });
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
      sortBy = 'createdAt',
      sortOrder = 'desc',
      page = 1,
      limit = 10,
      folderId,
      isFavorite,
    } = req.query;
    const sort = { [sortBy]: sortOrder === 'asc' ? 1 : -1 };
    const skip = (page - 1) * limit;
    const query = { userId: req.user.id };
    if (folderId) query.folderId = folderId;
    if (isFavorite !== undefined) query.isFavorite = isFavorite === 'true';

    const files = await File.find(query)
      .sort(sort)
      .skip(skip)
      .limit(parseInt(limit));
    const total = await File.countDocuments(query);

    const formattedFiles = files.map((file) => ({
      ...file.toObject(),
      content: file.type === 'document' ? file.content : null,
      contentUrl: file.type !== 'document' ? `/api/files/${file._id}/content` : null,
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
    if (!file) return res.status(404).json({ message: 'File not found' });
    const response = {
      ...file.toObject(),
      content: file.type === 'document' ? file.content : null,
      contentUrl: file.type !== 'document' ? `/api/files/${file._id}/content` : null,
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
    if (!file) return res.status(404).json({ message: 'File not found' });

    if (name) file.name = name;
    if (file.type === 'document' && content !== undefined) {
      file.content = content;
    }
    if (isFavorite !== undefined) file.isFavorite = isFavorite;

    await file.save();
    const response = {
      ...file.toObject(),
      content: file.type === 'document' ? file.content : null,
      contentUrl: file.type !== 'document' ? `/api/files/${file._id}/content` : null,
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
    if (!file) return res.status(404).json({ message: 'File not found' });
    if (file.filePath) fs.unlinkSync(file.filePath);
    res.status(204).json({
      success: true,
      message: 'File deleted successfully',
    });
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
    if (!file || file.type === 'document') {
      return res.status(404).json({ message: 'File not found' });
    }
    res.sendFile(path.resolve(file.filePath));
  } catch (error) {
    next(error);
  }
};

module.exports = exports;