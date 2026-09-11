import express from "express";

import { getCurrentUser } from "../core/deps.js";

import {
  createUserProfile,
  getUserProfile,
} from "../services/userService.js";

import {
  PUBLIC_REGISTRATION_ROLES,
} from "../core/roles.js";

const router = express.Router();

router.post("/register", getCurrentUser, async (req, res) => {
  try {
    const { role: requestedRole } = req.body;

    const role = typeof requestedRole === "string"
      ? requestedRole.trim().toUpperCase()
      : "";

    // Never allow ADMIN through public registration
    if (!PUBLIC_REGISTRATION_ROLES.includes(role)) {
      return res.status(400).json({
        success: false,
        message: "Invalid role",
      });
    }

    const profile = await createUserProfile(
      req.user.uid,
      req.user.email,
      role
    );

    return res.status(201).json({
      success: true,
      message: "User profile created successfully",
      data: profile,
    });

  } catch (error) {
    console.error("Registration error:", error);

    if (error.code === "USER_ALREADY_REGISTERED") {
      return res.status(409).json({
        success: false,
        message: "User profile already exists. Please log in instead.",
      });
    }

    return res.status(500).json({
      success: false,
      message: "Failed to create user profile",
    });
  }
});


router.get("/me", getCurrentUser, async (req, res) => {
  try {
    const profile = await getUserProfile(req.user.uid);

    return res.json({
      uid: req.user.uid,
      email: req.user.email,
      profile,
    });

  } catch (error) {
    console.error("Profile error:", error);

    return res.status(500).json({
      detail: "Failed to get user profile",
    });
  }
});

export default router;