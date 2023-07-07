const express = require("express");
const passport = require("passport");
const bcrypt = require("bcrypt");
const { v4: uuidv4 } = require("uuid");
const User = require("../models/User");

const router = express.Router();

// Signup route
router.post("/signup", async (req, res) => {
  const { fullName, email, password } = req.body;

  try {
    const user = await User.findOne({ email });
    if (user) {
      return res.status(409).json({ message: "User already exists" });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const newUser = new User({
      fullName,
      email,
      password: hashedPassword,
    });

    const createdUser = await newUser.save();

    res
      .status(201)
      .json({ message: "User created successfully", user: createdUser });
  } catch (err) {
    console.error("Error signing up", err);
    res.status(500).json({ message: "Failed to sign up" });
  }
});

// Login route
router.post("/login", passport.authenticate("local"), (req, res) => {
  res.status(200).json({ message: "Login successful" });
});

// Profile update route
router.put("/profile", async (req, res) => {
  const { userId, email, fullName, password } = req.body;

  try {
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    user.email = email;
    user.fullName = fullName;
    user.password = await bcrypt.hash(password, 10);
    user.updatedAt = new Date();

    const updatedUser = await user.save();

    res
      .status(200)
      .json({ message: "Profile updated successfully", user: updatedUser });
  } catch (err) {
    console.error("Error updating profile", err);
    res.status(500).json({ message: "Failed to update profile" });
  }
});

// Email verification route
router.post("/verify-email", async (req, res) => {
  const { email, token } = req.body;

  try {
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    if (user.verificationToken !== token) {
      return res.status(401).json({ message: "Invalid verification token" });
    }

    user.isVerified = true;
    user.verificationToken = null;
    await user.save();

    res.status(200).json({ message: "Email verification successful" });
  } catch (err) {
    console.error("Error verifying email", err);
    res.status(500).json({ message: "Failed to verify email" });
  }
});

// Forgot password route
router.post("/forgot-password", async (req, res) => {
  const { email } = req.body;

  try {
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    const passwordResetToken = uuidv4();
    user.passwordResetToken = passwordResetToken;
    await user.save();

    // Send password reset email

    res.status(200).json({ message: "Password reset email sent" });
  } catch (err) {
    console.error("Error sending password reset email", err);
    res.status(500).json({ message: "Failed to send password reset email" });
  }
});

// Reset password route
router.post("/reset-password", async (req, res) => {
  const { email, token, newPassword } = req.body;

  try {
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    if (user.passwordResetToken !== token) {
      return res.status(401).json({ message: "Invalid password reset token" });
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);
    user.password = hashedPassword;
    user.passwordResetToken = null;
    await user.save();

    res.status(200).json({ message: "Password reset successful" });
  } catch (err) {
    console.error("Error resetting password", err);
    res.status(500).json({ message: "Failed to reset password" });
  }
});

module.exports = router;
