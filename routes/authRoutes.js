const express = require("express");
const router = express.Router();
const authController = require("../controllers/authController");
const authMiddleware = require("../middleware/authMiddleware");
const passport = require("passport");

router.post("/register", authController.register);
router.post("/login", authController.login);
router.post("/forgot-password", authController.forgotPassword);
router.post("/verify-code", authController.verifyCode);
router.post("/reset-password", authController.resetPassword);
router.post("/logout", authMiddleware, authController.logout);
router.delete("/me", authMiddleware, authController.deleteUser);

// Google OAuth routes
router.get(
  "/google",
  passport.authenticate("google", { scope: ["profile", "email"] })
);
router.get(
  "/google/callback",
  passport.authenticate("google", { session: false }),
  authController.googleCallback
);

module.exports = router;
