const mongoose = require("mongoose");

const verificationCodeSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    code: { type: String, required: true },
    expiresAt: { type: Date, required: true },
  },
  { timestamps: true }
);

const VerificationCode = mongoose.model(
  "VerificationCode",
  verificationCodeSchema
);

module.exports = VerificationCode;
