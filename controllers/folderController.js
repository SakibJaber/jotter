const Folder = require("../models/Folder");

exports.createFolder = async (req, res, next) => {
  try {
    const { name } = req.body;
    const folder = new Folder({ name, userId: req.user.id });
    await folder.save();
    res.status(201).json(folder);
  } catch (error) {
    next(error);
  }
};

exports.getFolders = async (req, res, next) => {
  try {
    const {
      sortBy = "createdAt",
      sortOrder = "desc",
      page = 1,
      limit = 10,
    } = req.query;
    const sort = { [sortBy]: sortOrder === "asc" ? 1 : -1 };
    const skip = (page - 1) * limit;

    const folders = await Folder.find({ userId: req.user.id })
      .sort(sort)
      .skip(skip)
      .limit(parseInt(limit));
    const total = await Folder.countDocuments({ userId: req.user.id });

    res.json({
      data: folders,
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

exports.getFolder = async (req, res, next) => {
  try {
    const folder = await Folder.findOne({
      _id: req.params.id,
      userId: req.user.id,
    });
    if (!folder) return res.status(404).json({ message: "Folder not found" });
    res.json(folder);
  } catch (error) {
    next(error);
  }
};

exports.updateFolder = async (req, res, next) => {
  try {
    const { name } = req.body;
    const folder = await Folder.findOneAndUpdate(
      { _id: req.params.id, userId: req.user.id },
      { name },
      { new: true }
    );
    if (!folder) return res.status(404).json({ message: "Folder not found" });
    res.json(folder);
  } catch (error) {
    next(error);
  }
};

exports.deleteFolder = async (req, res, next) => {
  try {
    const folder = await Folder.findOneAndDelete({
      _id: req.params.id,
      userId: req.user.id,
    });
    if (!folder) return res.status(404).json({ message: "Folder not found" });
    res.status(204).json({
      success: true,
      message: "Folder deleted successfully",
    });
  } catch (error) {
    next(error);
  }
};
