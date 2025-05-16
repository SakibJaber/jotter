const mongoose = require('mongoose');

const fileSchema = new mongoose.Schema({
  name: { type: String, required: true },
  type: { type: String, enum: ['document', 'pdf', 'image'], required: true },
  folderId: { type: mongoose.Schema.Types.ObjectId, ref: 'Folder', default: null },
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  filePath: { type: String, default: null },
  content: { type: String, default: null },
  isFavorite: { type: Boolean, default: false },
}, { timestamps: true });

module.exports = mongoose.model('File', fileSchema);
