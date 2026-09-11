import express from "express";

import { getCurrentUser } from "../core/deps.js";

import {
  createUserProfile,
  getUserProfile,
  updateUserProfile as updateUser,
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

    if (!PUBLIC_REGISTRATION_ROLES.includes(role)) {
      return res.status(400).json({
        success: false,
        message: "Invalid role",
      });
    }

    let profile;
    try {
      profile = await createUserProfile(req.user.uid, req.user.email, role);
    } catch (err) {
      if (err.code === "USER_ALREADY_REGISTERED") {
        profile = await getUserProfile(req.user.uid);
      } else {
        throw err;
      }
    }

    return res.status(201).json({
      success: true,
      message: "User profile created successfully",
      data: profile,
    });

  } catch (error) {
    console.error("Registration error:", error);

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

router.put("/me", getCurrentUser, async (req, res) => {
  try {
    const updates = req.body;
    const allowedFields = ["name", "phone", "organisation", "address"];
    const filtered = {};
    for (const key of allowedFields) {
      if (updates[key] !== undefined) filtered[key] = updates[key];
    }

    const profile = await updateUser(req.user.uid, filtered);

    return res.json({
      success: true,
      message: "Profile updated successfully",
      data: profile,
    });

  } catch (error) {
    console.error("Profile update error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to update user profile",
    });
  }
});

export default router;