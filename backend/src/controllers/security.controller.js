// Upload or update security avatar
import path from "path";
import User from "../models/User.js";
import { generateNextGuardId } from "../utils/generateGuardId.js";

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

async function uploadSecurityAvatar(req, res) {
  try {
    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ message: "Security user not found" });
    }
    if (!req.file) {
      // Remove avatar if no file provided
      user.avatar = null;
      await user.save();
      return res.json({ avatar: null });
    }
    user.avatar = `/uploads/${req.file.filename}`;
    await user.save();
    const absoluteUrl = `${req.protocol}://${req.get("host")}${user.avatar}`;
    res.json({ avatar: absoluteUrl });
  } catch (err) {
    res.status(500).json({ message: err.message || "Avatar upload failed" });
  }
}

async function getSecurityProfile(req, res) {
  try {
    const user = await User.findById(req.user.id).select("-password");
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    if (user.role === "security" && !user.guardId) {
      user.guardId = await generateNextGuardId();
      await user.save();
    }

    const displayGuardId = user.guardId || "SEC-PENDING";
    const avatarUrl = user.avatar
      ? user.avatar.startsWith("http")
        ? user.avatar
        : `${req.protocol}://${req.get("host")}${user.avatar}`
      : null;
    const societyFallback = await getSocietyProfileFallback(user.societyCode);
    res.json({
      _id: user._id,
      guardId: user.guardId || null,
      displayGuardId,
      name: user.name,
      email: user.email,
      phone: user.phone || null,
      role: user.role,
      societyName: user.societyName || societyFallback.societyName,
      societyAddress: user.societyAddress || societyFallback.societyAddress,
      societyContact: user.societyContact || societyFallback.societyContact,
      documents: Array.isArray(user.documents) ? user.documents : [],
      avatar: avatarUrl,
      punchedInAt: user.punchedInAt || null,
      punchedOutAt: user.punchedOutAt || null
    });
  } catch (error) {
    res.status(500).json({ message: error.message || "Failed to fetch profile" });
  }
}

async function updateSecurityPassword(req, res) {
  try {
    const user = await User.findById(req.user.id);
    if (!user) return res.status(404).json({ message: "User not found" });
    const { oldPassword, newPassword } = req.body;
    if (!oldPassword || !newPassword) return res.status(400).json({ message: "Missing fields" });
    if (typeof user.comparePassword === 'function') {
      const isMatch = await user.comparePassword(oldPassword);
      if (!isMatch) return res.status(400).json({ message: "Current password is incorrect" });
    } else {
      // fallback: compare plain text (not secure, but for dev only)
      if (user.password !== oldPassword) return res.status(400).json({ message: "Current password is incorrect" });
    }
    user.password = newPassword;
    await user.save();
    res.json({ message: "Password updated successfully" });
  } catch (error) {
    res.status(500).json({ message: error.message || "Password update failed" });
  }
}

export { uploadSecurityAvatar, getSecurityProfile, updateSecurityPassword };