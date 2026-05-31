import express from "express";
import User from "../models/User.js";
import { protect } from "../middleware/authmiddleware.js";
import { allowRoles } from "../middleware/roleMiddleware.js";
import upload from "../middleware/upload.js";
const router = express.Router();

const getSocietyProfileFallback = async (societyCode) => {
  const admin = await User.findOne({ role: "admin", societyCode })
    .select("societyName societyAddress societyContact")
    .lean();

  return {
    societyName: admin?.societyName || "",
    societyAddress: admin?.societyAddress || "",
    societyContact: admin?.societyContact || "",
  };
};

router.get("/me", protect, allowRoles("resident"), async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select("-password");

    if (!user) {
      return res.status(404).json({ message: "Resident not found" });
    }

    const societyFallback = await getSocietyProfileFallback(user.societyCode);

    res.json({
      ...user.toObject(),
      societyName: user.societyName || societyFallback.societyName,
      societyAddress: user.societyAddress || societyFallback.societyAddress,
      societyContact: user.societyContact || societyFallback.societyContact,
    });
  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
});

// UPLOAD OR UPDATE AVATAR
router.post(
  "/me/avatar",
  protect,
  allowRoles("resident"),
  upload.single("avatar"),
  async (req, res) => {
    try {
      const user = await User.findById(req.user.id);
      if (!user) {
        console.error("Avatar upload: user not found", req.user?.id);
        return res.status(404).json({ message: "Resident not found" });
      }

      console.log("Avatar upload request file:", req.file);

      if (!req.file) {
        return res.status(400).json({ message: "No avatar file provided" });
      }

      user.avatar = `/uploads/${req.file.filename}`;
      await user.save();

      const absoluteUrl = `${req.protocol}://${req.get("host")}${user.avatar}`;
      res.json({ avatar: absoluteUrl });
    } catch (err) {
      console.error("Avatar upload error:", err);
      res.status(500).json({ message: err.message || "Avatar upload failed" });
    }
  }
);

// UPDATE PROFILE INFO
router.put("/me", protect, allowRoles("resident"), async (req, res) => {
  try {
    const { name, phone, flat, block } = req.body;

    const user = await User.findById(req.user.id);

    if (!user) {
      return res.status(404).json({ message: "Resident not found" });
    }

    user.name = name ?? user.name;
    user.phone = phone ?? user.phone;
    user.flat = flat ?? user.flat;
    user.block = block ?? user.block;
    if (req.body.avatar !== undefined) {
      user.avatar = req.body.avatar;
    }

    await user.save();

    res.json(user);
  } catch {
    res.status(500).json({ message: "Profile update failed" });
  }
});

// CHANGE PASSWORD
router.put("/change-password", protect, allowRoles("resident"), async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      return res.status(400).json({ message: "Current and new password are required" });
    }

    if (String(newPassword).length < 6) {
      return res.status(400).json({ message: "New password must be at least 6 characters" });
    }

    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ message: "Resident not found" });
    }

    const isMatch = await user.comparePassword(currentPassword);

    if (!isMatch) {
      return res.status(400).json({ message: "Current password incorrect" });
    }

    user.password = newPassword;

    await user.save();

    res.json({ message: "Password updated successfully" });
  } catch (err) {
    console.error("Resident password change failed:", err);
    res.status(500).json({ message: "Password change failed" });
  }
});

//neighbours
router.get(
  "/neighbours",
  protect,
  allowRoles("resident"),
  async (req, res) => {
    try {
      const currentUser = await User.findById(req.user.id);

      if (!currentUser) {
        return res.status(404).json({ message: "User not found" });
      }

      const baseQuery = {
        role: "resident",
        societyCode: currentUser.societyCode,
        _id: { $ne: currentUser._id }
      };

      // Privacy rule: neighbours are only residents of the same society and same block.
      if (!currentUser.block) {
        return res.json([]);
      }

      const neighbours = await User.find({ ...baseQuery, block: currentUser.block })
        .select("-password")
        .sort({ name: 1 });

      res.json(neighbours);
    } catch (err) {
      console.error("Resident neighbours fetch error:", err);
      res.status(500).json({ message: "Server error" });
    }
  }
);

export default router;
