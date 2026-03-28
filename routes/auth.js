// routes/auth.js
// All authentication-related API endpoints

const express = require("express");
const router = express.Router();
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const crypto = require("crypto");
const axios = require("axios");
const User = require("../models/User");
const { sendVerificationEmail, sendPasswordResetEmail } = require("../utils/email");
const { verifyToken } = require("../middleware/auth");

// ─────────────────────────────────────────────
// HELPER: Verify Google reCAPTCHA token
// ─────────────────────────────────────────────
const verifyRecaptcha = async (token) => {
  try {
    const response = await axios.post(
      `https://www.google.com/recaptcha/api/siteverify`,
      null,
      {
        params: {
          secret: process.env.RECAPTCHA_SECRET_KEY,
          response: token,
        },
      }
    );
    return response.data.success; // Returns true if valid
  } catch (err) {
    console.error("reCAPTCHA verification error:", err.message);
    return false;
  }
};

// ─────────────────────────────────────────────
// POST /api/auth/signup
// Register a new user
// ─────────────────────────────────────────────
router.post("/signup", async (req, res) => {
  try {
    const { name, email, password, recaptchaToken } = req.body;

    // 1. Validate required fields
    if (!name || !email || !password) {
      return res.status(400).json({ message: "All fields are required." });
    }

    // 2. Validate reCAPTCHA on backend (important security step)
    if (!recaptchaToken) {
      return res.status(400).json({ message: "Please complete the reCAPTCHA." });
    }
    const captchaValid = await verifyRecaptcha(recaptchaToken);
    if (!captchaValid) {
      return res.status(400).json({ message: "reCAPTCHA verification failed. Please try again." });
    }

    // 3. Check if email already exists
    const existingUser = await User.findOne({ email: email.toLowerCase() });
    if (existingUser) {
      return res.status(409).json({ message: "An account with this email already exists." });
    }

    // 4. Validate password strength
    if (password.length < 6) {
      return res.status(400).json({ message: "Password must be at least 6 characters." });
    }

    // 5. Hash password using bcrypt (salt rounds = 12)
    const hashedPassword = await bcrypt.hash(password, 12);

    // 6. Generate unique email verification token
    const verificationToken = crypto.randomBytes(32).toString("hex");
    const verificationExpires = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

    // 7. Save user to database
    const newUser = new User({
      name: name.trim(),
      email: email.toLowerCase().trim(),
      password: hashedPassword,
      emailVerificationToken: verificationToken,
      emailVerificationExpires: verificationExpires,
    });
    await newUser.save();

    // 8. Send verification email
    await sendVerificationEmail(newUser.email, verificationToken);

    res.status(201).json({
      message: "Account created! Please check your email to verify your account before logging in.",
    });
  } catch (err) {
    console.error("Signup error:", err);
    res.status(500).json({ message: "Server error. Please try again later." });
  }
});

// ─────────────────────────────────────────────
// POST /api/auth/login
// Login existing user
// ─────────────────────────────────────────────
router.post("/login", async (req, res) => {
  try {
    const { email, password, recaptchaToken } = req.body;

    // 1. Validate fields
    if (!email || !password) {
      return res.status(400).json({ message: "Email and password are required." });
    }

    // 2. Verify reCAPTCHA on backend
    if (!recaptchaToken) {
      return res.status(400).json({ message: "Please complete the reCAPTCHA." });
    }
    const captchaValid = await verifyRecaptcha(recaptchaToken);
    if (!captchaValid) {
      return res.status(400).json({ message: "reCAPTCHA verification failed. Please try again." });
    }

    // 3. Find user by email
    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user) {
      return res.status(401).json({ message: "Invalid email or password." }); // Vague for security
    }

    // 4. Check if email is verified
    if (!user.isVerified) {
      return res.status(403).json({
        message: "Please verify your email first. Check your inbox for the verification link.",
      });
    }

    // 5. Compare password with stored hash
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ message: "Invalid email or password." });
    }

    // 6. Generate JWT token (expires in 7 days)
    const token = jwt.sign(
      { userId: user._id, email: user.email },
      process.env.JWT_SECRET,
      { expiresIn: "7d" }
    );

    res.status(200).json({
      message: "Login successful!",
      token,
      user: {
        name: user.name,
        email: user.email,
        createdAt: user.createdAt,
      },
    });
  } catch (err) {
    console.error("Login error:", err);
    res.status(500).json({ message: "Server error. Please try again later." });
  }
});

// ─────────────────────────────────────────────
// GET /api/auth/verify-email?token=...
// Verify user's email address
// ─────────────────────────────────────────────
router.get("/verify-email", async (req, res) => {
  try {
    const { token } = req.query;

    if (!token) {
      return res.status(400).json({ message: "Verification token is missing." });
    }

    // Find user with matching token that hasn't expired
    const user = await User.findOne({
      emailVerificationToken: token,
      emailVerificationExpires: { $gt: new Date() }, // Token must not be expired
    });

    if (!user) {
      return res.status(400).json({ message: "Invalid or expired verification link. Please sign up again." });
    }

    // Mark user as verified and clear the token
    user.isVerified = true;
    user.emailVerificationToken = null;
    user.emailVerificationExpires = null;
    await user.save();

    res.status(200).json({ message: "Email verified successfully! You can now log in." });
  } catch (err) {
    console.error("Email verification error:", err);
    res.status(500).json({ message: "Server error. Please try again later." });
  }
});

// ─────────────────────────────────────────────
// POST /api/auth/forgot-password
// Send password reset link to email
// ─────────────────────────────────────────────
router.post("/forgot-password", async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ message: "Email is required." });
    }

    const user = await User.findOne({ email: email.toLowerCase() });

    // IMPORTANT: Always respond the same way whether user exists or not
    // This prevents email enumeration attacks
    if (!user) {
      return res.status(200).json({
        message: "If this email is registered, you'll receive a password reset link shortly.",
      });
    }

    // Generate a secure random reset token
    const resetToken = crypto.randomBytes(32).toString("hex");
    const resetExpires = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

    user.resetPasswordToken = resetToken;
    user.resetPasswordExpires = resetExpires;
    await user.save();

    await sendPasswordResetEmail(user.email, resetToken);

    res.status(200).json({
      message: "If this email is registered, you'll receive a password reset link shortly.",
    });
  } catch (err) {
    console.error("Forgot password error:", err);
    res.status(500).json({ message: "Server error. Please try again later." });
  }
});

// ─────────────────────────────────────────────
// POST /api/auth/reset-password
// Set a new password using the reset token
// ─────────────────────────────────────────────
router.post("/reset-password", async (req, res) => {
  try {
    const { token, password } = req.body;

    if (!token || !password) {
      return res.status(400).json({ message: "Token and new password are required." });
    }

    if (password.length < 6) {
      return res.status(400).json({ message: "Password must be at least 6 characters." });
    }

    // Find user with valid (non-expired) reset token
    const user = await User.findOne({
      resetPasswordToken: token,
      resetPasswordExpires: { $gt: new Date() },
    });

    if (!user) {
      return res.status(400).json({ message: "Invalid or expired reset link. Please request a new one." });
    }

    // Hash the new password
    user.password = await bcrypt.hash(password, 12);
    user.resetPasswordToken = null;
    user.resetPasswordExpires = null;
    await user.save();

    res.status(200).json({ message: "Password reset successfully! You can now log in." });
  } catch (err) {
    console.error("Reset password error:", err);
    res.status(500).json({ message: "Server error. Please try again later." });
  }
});

// ─────────────────────────────────────────────
// GET /api/auth/me
// Get logged-in user's profile (protected route)
// ─────────────────────────────────────────────
router.get("/me", verifyToken, async (req, res) => {
  try {
    // req.user is set by the verifyToken middleware
    const user = await User.findById(req.user.userId).select("-password -emailVerificationToken -resetPasswordToken");

    if (!user) {
      return res.status(404).json({ message: "User not found." });
    }

    res.status(200).json({ user });
  } catch (err) {
    console.error("Get profile error:", err);
    res.status(500).json({ message: "Server error." });
  }
});

module.exports = router;
