import express from "express";
import User from "../models/User.js";
import { sendMail } from "../services/email.service.js";
import { formatSocietyCode, isValidSocietyCode, normalizeSocietyCode } from "../utils/societyCode.js";

const router = express.Router();

const requirePlatformSecret = (req, res, next) => {
  const expected = String(process.env.PLATFORM_ADMIN_SECRET || "").trim();
  const received = String(req.headers["x-platform-secret"] || "").trim();

  if (!expected) {
    return res.status(503).json({ message: "Platform onboarding is not configured" });
  }

  if (!received || received !== expected) {
    return res.status(401).json({ message: "Invalid platform secret" });
  }

  next();
};

const isValidEmail = (value) => /^\S+@\S+\.\S+$/.test(String(value || "").trim().toLowerCase());

const getNextSocietyCode = async () => {
  const existingCodes = await User.distinct("societyCode");
  const maxSequence = existingCodes.reduce((max, code) => {
    const normalized = normalizeSocietyCode(code);
    const match = normalized.match(/^CIV-(\d+)$/);
    if (!match) return max;
    return Math.max(max, Number(match[1]));
  }, 0);

  return formatSocietyCode(maxSequence + 1);
};

router.get("/societies", requirePlatformSecret, async (req, res) => {
  try {
    const admins = await User.find({ role: "admin" })
      .select("name email phone societyCode societyName societyAddress societyContact createdAt")
      .sort({ createdAt: -1 });

    const societies = admins.map((admin) => ({
      societyCode: normalizeSocietyCode(admin.societyCode),
      societyName: admin.societyName || "",
      societyAddress: admin.societyAddress || "",
      societyContact: admin.societyContact || "",
      admin: {
        name: admin.name || "",
        email: admin.email || "",
        phone: admin.phone || "",
      },
      createdAt: admin.createdAt,
    }));

    return res.json({ societies });
  } catch (error) {
    console.error("Platform societies fetch error:", error);
    return res.status(500).json({ message: "Server error" });
  }
});

router.post("/societies", requirePlatformSecret, async (req, res) => {
  try {
    const {
      societyName,
      societyAddress,
      societyContact,
      adminName,
      adminEmail,
      adminPhone,
      adminPassword,
      societyCode,
    } = req.body;

    const normalizedSocietyName = String(societyName || "").trim();
    const normalizedSocietyAddress = String(societyAddress || "").trim();
    const normalizedSocietyContact = String(societyContact || "").trim();
    const normalizedAdminName = String(adminName || "").trim();
    const normalizedAdminEmail = String(adminEmail || "").trim().toLowerCase();
    const normalizedAdminPhone = String(adminPhone || "").trim();
    const normalizedAdminPassword = String(adminPassword || "");
    const requestedSocietyCode = normalizeSocietyCode(societyCode);

    if (!normalizedSocietyName || !normalizedAdminName || !normalizedAdminEmail || !normalizedAdminPassword) {
      return res.status(400).json({
        message: "Society name, admin name, admin email, and admin password are required",
      });
    }

    if (!isValidEmail(normalizedAdminEmail)) {
      return res.status(400).json({ message: "A valid admin email is required" });
    }

    if (normalizedAdminPassword.length < 6) {
      return res.status(400).json({ message: "Admin password must be at least 6 characters" });
    }

    if (requestedSocietyCode && !isValidSocietyCode(requestedSocietyCode)) {
      return res.status(400).json({ message: "Society code must look like CIV-001" });
    }

    const existingAdmin = await User.findOne({ email: normalizedAdminEmail });
    if (existingAdmin) {
      return res.status(400).json({ message: "An account with this admin email already exists" });
    }

    const finalSocietyCode = requestedSocietyCode || await getNextSocietyCode();
    const existingSociety = await User.findOne({ societyCode: finalSocietyCode });
    if (existingSociety) {
      return res.status(400).json({ message: "Society code already exists" });
    }

    const admin = await User.create({
      role: "admin",
      societyCode: finalSocietyCode,
      email: normalizedAdminEmail,
      password: normalizedAdminPassword,
      name: normalizedAdminName,
      phone: normalizedAdminPhone,
      societyName: normalizedSocietyName,
      societyAddress: normalizedSocietyAddress,
      societyContact: normalizedSocietyContact,
    });

    try {
      await sendMail({
        to: normalizedAdminEmail,
        subject: `Welcome to Civara - ${normalizedSocietyName}`,
        text: [
          `Hello ${normalizedAdminName},`,
          "",
          `Your Civara admin account for ${normalizedSocietyName} is ready.`,
          `Society Code: ${finalSocietyCode}`,
          `Login Email: ${normalizedAdminEmail}`,
          `Password: ${normalizedAdminPassword}`,
          "",
          "Please log in and change your password after your first sign-in.",
        ].join("\n"),
        html: `
          <p>Hello ${normalizedAdminName},</p>
          <p>Your Civara admin account for <strong>${normalizedSocietyName}</strong> is ready.</p>
          <p><strong>Society Code:</strong> ${finalSocietyCode}</p>
          <p><strong>Login Email:</strong> ${normalizedAdminEmail}</p>
          <p><strong>Password:</strong> ${normalizedAdminPassword}</p>
          <p>Please log in and change your password after your first sign-in.</p>
        `,
      });
    } catch (mailError) {
      console.error("Platform onboarding email send error:", mailError);
    }

    return res.status(201).json({
      message: "Society and first admin created successfully",
      society: {
        societyCode: finalSocietyCode,
        societyName: normalizedSocietyName,
        societyAddress: normalizedSocietyAddress,
        societyContact: normalizedSocietyContact,
      },
      admin: {
        id: admin._id,
        name: admin.name,
        email: admin.email,
        phone: admin.phone || "",
      },
    });
  } catch (error) {
    console.error("Platform society creation error:", error);
    return res.status(500).json({ message: "Server error" });
  }
});

export default router;
