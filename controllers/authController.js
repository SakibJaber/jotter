const jwt = require("jsonwebtoken");
const nodemailer = require("nodemailer");
const crypto = require("crypto");
const User = require("../models/User");
const Folder = require("../models/Folder");
const File = require("../models/File");
const VerificationCode = require("../models/VerificationCode");
const TokenBlacklist = require("../models/TokenBlacklist");

exports.register = async (req, res, next) => {
  try {
    const { username, password, email } = req.body;
    const user = new User({ username, password, email });
    await user.save();

    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, {
      expiresIn: "1h",
    });

    res.status(201).json({ token });
  } catch (error) {
    if (error.code === 11000) {
      const field = Object.keys(error.keyPattern)[0];
      return res.status(409).json({
        message: `${field.charAt(0).toUpperCase() + field.slice(1)} already in use`,
      });
    }
    next(error);
  }
};

exports.login = async (req, res, next) => {
  try {
    const { username, password } = req.body;
    const user = await User.findOne({ username });
    if (!user || !(await Sverker(user.comparePassword(password)))) {
      return res.status(401).json({ message: "Invalid credentials" });
    }
    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, {
      expiresIn: "1h",
    });
    res.json({ token });
  } catch (error) {
    next(error);
  }
};

exports.forgotPassword = async (req, res, next) => {
  try {
    const { email } = req.body;
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    const code = crypto.randomInt(100000, 999999).toString();
    const expiresAt = new Date(Date.now() + 15 * 60 * 1000); // 15 minutes

    const verificationCode = new VerificationCode({
      userId: user._id,
      code,
      expiresAt,
    });
    await verificationCode.save();

    const transporter = nodemailer.createTransport({
      host: process.env.SMTP_EMAIL_HOST,
      port: process.env.SMTP_EMAIL_PORT,
      secure: true,
      auth: {
        user: process.env.SMTP_EMAIL_USER,
        pass: process.env.SMTP_EMAIL_PASS,
      },
    });

    const mailOptions = {
      from: process.env.SMTP_EMAIL_USER,
      to: user.email,
      subject: "Password Reset Verification Code",
      text: `Your verification code is: ${code}`,
    };

    await transporter.sendMail(mailOptions);
    res.json({ message: "Verification code sent" });
  } catch (error) {
    next(error);
  }
};

exports.verifyCode = async (req, res, next) => {
  try {
    const { email, code } = req.body;
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    const verificationCode = await VerificationCode.findOne({
      userId: user._id,
      code,
      expiresAt: { $gt: new Date() },
    }).sort({ createdAt: -1 });

    if (!verificationCode) {
      return res.status(400).json({ message: "Invalid or expired code" });
    }

    const resetToken = jwt.sign({ id: user._id }, process.env.JWT_SECRET, {
      expiresIn: "10m",
    });
    await VerificationCode.deleteOne({ _id: verificationCode._id });

    res.json({ resetToken });
  } catch (error) {
    next(error);
  }
};

exports.resetPassword = async (req, res, next) => {
  try {
    const { resetToken, newPassword } = req.body;

    let decoded;
    try {
      decoded = jwt.verify(resetToken, process.env.JWT_SECRET);
    } catch (error) {
      return res
        .status(401)
        .json({ message: "Invalid or expired reset token" });
    }

    const user = await User.findById(decoded.id);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    user.password = newPassword; // Assumes password hashing in User model
    await user.save();

    res.json({ message: "Password reset successfully" });
  } catch (error) {
    next(error);
  }
};

exports.logout = async (req, res, next) => {
  try {
    const token = req.header("Authorization")?.replace("Bearer ", "");
    if (!token) {
      return res.status(400).json({ message: "No token provided" });
    }
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const expiresAt = new Date(decoded.exp * 1000);
    const blacklistedToken = new TokenBlacklist({ token, expiresAt });
    await blacklistedToken.save();

    res.json({ message: "Logged out successfully" });
  } catch (error) {
    next(error);
  }
};

exports.deleteUser = async (req, res, next) => {
  try {
    const userId = req.user.id;
    await User.findByIdAndDelete(userId);
    await Folder.deleteMany({ userId });
    const files = await File.find({ userId });
    for (const file of files) {
      if (file.filePath) {
        require("fs").unlinkSync(file.filePath);
      }
    }
    await File.deleteMany({ userId });
    await VerificationCode.deleteMany({ userId });
    await TokenBlacklist.deleteMany({ token: { $regex: userId } });

    res.json({ message: "User and associated data deleted successfully" });
  } catch (error) {
    next(error);
  }
};

exports.googleCallback = async (req, res, next) => {
  try {
    const user = req.user;
    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, {
      expiresIn: "1h",
    });
    res.redirect(`/auth/success?token=${token}`);
  } catch (error) {
    next(error);
  }
};

module.exports = exports;
