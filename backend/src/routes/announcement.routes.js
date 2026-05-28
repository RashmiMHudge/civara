import express from "express";
import Announcement from "../models/Announcement.js";
import { protect } from "../middleware/authmiddleware.js";
import { allowRoles } from "../middleware/roleMiddleware.js";
import User from "../models/User.js";
import upload from "../middleware/upload.js";

const router = express.Router();

const getSocietyVariants = (societyCode) => {
  const value = String(societyCode || "").trim().toUpperCase();
  const parts = value.split("-");
  if (parts.length < 2) return [value].filter(Boolean);

  const suffix = parts.slice(1).join("-");
  let prefix = parts[0];
  if (prefix.endsWith("R") || prefix.endsWith("S")) {
    prefix = prefix.slice(0, -1);
  }

  return Array.from(new Set([
    `${prefix}-${suffix}`,
    `${prefix}R-${suffix}`,
    `${prefix}S-${suffix}`,
  ]));
};

const getUserSocietyCode = async (req) => {
  const user = await User.findById(req.user.id).select("societyCode");
  return user?.societyCode || req.user.societyCode || null;
};

router.get("/", protect, async (req, res) => {
  try {
    const societyCode = await getUserSocietyCode(req);
    if (!societyCode) {
      return res.status(400).json({ message: "Society is not configured" });
    }

    const announcements = await Announcement.find({
      societyCode: { $in: getSocietyVariants(societyCode) }
    }).sort({ createdAt: -1 });

    res.json(announcements);
  } catch {
    res.status(500).json({ message: "Error fetching announcements" });
  }
});

router.post("/", protect, allowRoles("admin"), upload.single("image"), async (req, res) => {
  try {
    const { title, message, priority } = req.body;
    if (!title || !message) {
      return res.status(400).json({ message: "Title and message are required" });
    }

    const societyCode = await getUserSocietyCode(req);
    if (!societyCode) {
      return res.status(400).json({ message: "Society is not configured" });
    }

    const announcement = await Announcement.create({
      societyCode,
      createdBy: req.user.id,
      title: String(title).trim(),
      message: String(message).trim(),
      image: req.file ? `/uploads/${req.file.filename}` : null,
      priority: ["Emergency", "Important", "Normal"].includes(priority)
        ? priority
        : "Normal",
    });

    res.status(201).json(announcement);
  } catch {
    res.status(500).json({ message: "Error creating announcement" });
  }
});

router.put("/:id", protect, allowRoles("admin"), upload.single("image"), async (req, res) => {
  try {
    const { title, message, priority, removeImage } = req.body;

    const updates = {};
    if (title !== undefined) updates.title = String(title).trim();
    if (message !== undefined) updates.message = String(message).trim();
    if (priority !== undefined) {
      updates.priority = ["Emergency", "Important", "Normal"].includes(priority)
        ? priority
        : "Normal";
    }

    if (req.file) {
      updates.image = `/uploads/${req.file.filename}`;
    } else if (String(removeImage).toLowerCase() === "true") {
      updates.image = null;
    }

    if (updates.title !== undefined && !updates.title) {
      return res.status(400).json({ message: "Title cannot be empty" });
    }

    if (updates.message !== undefined && !updates.message) {
      return res.status(400).json({ message: "Message cannot be empty" });
    }

    const societyCode = await getUserSocietyCode(req);
    if (!societyCode) {
      return res.status(400).json({ message: "Society is not configured" });
    }

    const announcement = await Announcement.findOneAndUpdate(
      {
        _id: req.params.id,
        societyCode: { $in: getSocietyVariants(societyCode) }
      },
      { $set: updates },
      { new: true }
    );

    if (!announcement) {
      return res.status(404).json({ message: "Announcement not found" });
    }

    res.json(announcement);
  } catch {
    res.status(500).json({ message: "Error updating announcement" });
  }
});

router.delete("/:id", protect, allowRoles("admin"), async (req, res) => {
  try {
    const societyCode = await getUserSocietyCode(req);
    if (!societyCode) {
      return res.status(400).json({ message: "Society is not configured" });
    }

    const announcement = await Announcement.findOneAndDelete({
      _id: req.params.id,
      societyCode: { $in: getSocietyVariants(societyCode) }
    });

    if (!announcement) {
      return res.status(404).json({ message: "Announcement not found" });
    }

    res.json({ message: "Announcement deleted" });
  } catch {
    res.status(500).json({ message: "Error deleting announcement" });
  }
});

export default router;