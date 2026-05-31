import express from "express";
import User from "../models/User.js";
import { protect } from "../middleware/authmiddleware.js";
import { allowRoles } from "../middleware/roleMiddleware.js";
import { getAdminStats } from "../controllers/admin.controller.js";
import { sendMail } from "../services/email.service.js";
import { generateNextGuardId } from "../utils/generateGuardId.js";
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

const getAdminScopeSocietyCode = async (req) => {
  const admin = await User.findById(req.user.id).select("role societyCode");
  if (!admin || admin.role !== "admin") {
    return null;
  }
  return admin.societyCode || req.user.societyCode || null;
};

const getAdminSocietyDetails = async (req) => {
  const admin = await User.findById(req.user.id).select("role societyName societyAddress societyContact");
  if (!admin || admin.role !== "admin") {
    return {
      societyName: "",
      societyAddress: "",
      societyContact: "",
    };
  }

  return {
    societyName: admin.societyName || "",
    societyAddress: admin.societyAddress || "",
    societyContact: admin.societyContact || "",
  };
};

const isValidDocumentNumber = (value) => /^\d{12}$/.test(String(value || "").trim());

const normalizeDocumentType = (value) => String(value || "").trim().toUpperCase();

const validateSecurityDocument = ({ type, number }) => {
  const normalizedType = normalizeDocumentType(type);
  const normalizedNumber = String(number || "").trim();

  if (!normalizedType || !normalizedNumber) {
    return { ok: false, message: "Document type and number are required" };
  }

  if (normalizedType === "AADHAAR") {
    if (!/^\d{12}$/.test(normalizedNumber)) {
      return { ok: false, message: "Aadhaar number must be exactly 12 digits" };
    }
    return { ok: true };
  }

  if (!/^[A-Z0-9-]{4,32}$/i.test(normalizedNumber)) {
    return {
      ok: false,
      message: "Document number must be 4-32 characters (letters, numbers, hyphen)",
    };
  }

  return { ok: true };
};

const findResidentForAdmin = async ({ residentId, email, scopeSocietyCode }) => {
  if (!residentId && !email) return null;

  const societyCodes = getSocietyVariants(scopeSocietyCode);

  if (residentId) {
    return User.findOne({ _id: residentId, role: "resident", societyCode: { $in: societyCodes } });
  }

  const normalizedEmail = String(email).toLowerCase().trim();
  return User.findOne({ role: "resident", email: normalizedEmail, societyCode: { $in: societyCodes } });
};

// CREATE RESIDENT
router.post(
  "/create-resident",
  protect,
  allowRoles("admin"),
  async (req, res) => {
    const scopeSocietyCode = await getAdminScopeSocietyCode(req);
    if (!scopeSocietyCode) {
      return res.status(400).json({ message: "Admin society is not configured" });
    }

    const {
      name,
      email,
      password,
      block,
      flat,
      phone,
      occupancyType,
      emergencyContact,
      documents,
    } = req.body;

    const exists = await User.findOne({ email });
    if (exists) {
      return res.status(400).json({ message: "User already exists" });
    }

    const initialDocuments = Array.isArray(documents) ? documents : [];
    for (const doc of initialDocuments) {
      const validation = validateSecurityDocument({ type: doc?.type, number: doc?.number });
      if (!validation.ok) {
        return res.status(400).json({ message: validation.message });
      }
    }

    const user = await User.create({
      name,
      email,
      password,
      role: "resident",
      societyCode: scopeSocietyCode,
      ...(await getAdminSocietyDetails(req)),
      block,
      flat,
      phone,
      occupancyType: occupancyType || "OWNER",
      emergencyContact: emergencyContact || undefined,
      documents: initialDocuments.map((doc) => ({
        type: normalizeDocumentType(doc?.type),
        number: String(doc?.number || "").trim(),
      })),
    });

    try {
      await sendMail({
        to: email,
        subject: "Welcome to Civara - Your Resident Account",
        text: `Hello ${name},\n\nYour account has been created.\nUser ID: ${email}\nPassword: ${password}\n\nPlease log in and change your password immediately.`,
        html: `<p>Hello ${name},</p><p>Your account has been created.</p><p><b>User ID:</b> ${email}</p><p><b>Password:</b> ${password}</p><p>Please login and change your password immediately.</p>`
      });
    } catch (err) {
      console.error("Failed to send resident onboarding email:", err);
    }

    res.json({ message: "Resident created", userId: user._id });
  }
);

// CREATE SECURITY
router.post(
  "/create-security",
  protect,
  allowRoles("admin"),
  async (req, res) => {
    const scopeSocietyCode = await getAdminScopeSocietyCode(req);
    if (!scopeSocietyCode) {
      return res.status(400).json({ message: "Admin society is not configured" });
    }

    const { name, email, password, phone, documents } = req.body;

    if (!email) {
      return res.status(400).json({ message: "Email is required" });
    }

    const initialDocuments = Array.isArray(documents) ? documents : [];
    const hasInvalidDocument = initialDocuments.some((doc) => !isValidDocumentNumber(doc?.number));
    if (hasInvalidDocument) {
      return res.status(400).json({ message: "Document number must be a 12-digit number" });
    }

    const exists = await User.findOne({ email });
    if (exists) {
      return res.status(400).json({ message: "User already exists" });
    }

    const guardId = await generateNextGuardId();

    const securityUser = await User.create({
      name,
      email,
      phone,
      guardId,
      password,
      role: "security",
      societyCode: scopeSocietyCode,
      ...(await getAdminSocietyDetails(req)),
      documents: initialDocuments,
    });

    try {
      await sendMail({
        to: email,
        subject: "Welcome to Civara - Security Account",
        text: `Hello ${name},\n\nYour security guard account has been created.\nGuard ID: ${guardId}\nUser ID: ${email}\nPassword: ${password}\n\nPlease log in and change your password immediately.`,
        html: `<p>Hello ${name},</p><p>Your security guard account has been created.</p><p><b>Guard ID:</b> ${guardId}</p><p><b>User ID:</b> ${email}</p><p><b>Password:</b> ${password}</p><p>Please login and change your password immediately.</p>`
      });
    } catch (err) {
      console.error("Failed to send security onboarding email:", err);
    }

    res.json({ message: "Security created", userId: securityUser._id, guardId });
  }
);

// GET SECURITY STAFF (ADMIN'S SOCIETY)
router.get(
  "/security-staff",
  protect,
  allowRoles("admin"),
  async (req, res) => {
    try {
      const scopeSocietyCode = await getAdminScopeSocietyCode(req);
      if (!scopeSocietyCode) {
        return res.status(400).json({ message: "Admin society is not configured" });
      }

      const guards = await User.find({
        role: "security",
        societyCode: { $in: getSocietyVariants(scopeSocietyCode) },
      })
        .select("name email phone guardId isActive createdAt documents securityStatusMeta")
        .sort({ createdAt: -1 });

      return res.json(guards);
    } catch (err) {
      console.error("Admin security staff fetch error:", err);
      return res.status(500).json({ message: "Server error" });
    }
  }
);

// UPDATE SECURITY STAFF ACTIVE STATUS
router.patch(
  "/security-staff/:securityUserId/status",
  protect,
  allowRoles("admin"),
  async (req, res) => {
    try {
      const { securityUserId } = req.params;
      const { isActive, reason } = req.body;

      if (typeof isActive !== "boolean") {
        return res.status(400).json({ message: "isActive must be true or false" });
      }

      if (!String(reason || "").trim()) {
        return res.status(400).json({ message: "Reason is required" });
      }

      const scopeSocietyCode = await getAdminScopeSocietyCode(req);
      if (!scopeSocietyCode) {
        return res.status(400).json({ message: "Admin society is not configured" });
      }

      const guard = await User.findOne({
        _id: securityUserId,
        role: "security",
        societyCode: { $in: getSocietyVariants(scopeSocietyCode) },
      });

      if (!guard) {
        return res.status(404).json({ message: "Security guard not found in your society" });
      }

      guard.isActive = isActive;
      guard.securityStatusMeta = {
        reason: String(reason).trim(),
        changedAt: new Date(),
        changedBy: req.user.id,
      };
      await guard.save();

      return res.json({
        message: "Security guard status updated",
        guard: {
          _id: guard._id,
          guardId: guard.guardId,
          isActive: guard.isActive,
          securityStatusMeta: guard.securityStatusMeta,
        },
      });
    } catch (err) {
      console.error("Admin security status update error:", err);
      return res.status(500).json({ message: "Server error" });
    }
  }
);

// VERIFY A SECURITY DOCUMENT
router.patch(
  "/security-staff/:securityUserId/documents/:documentId/verify",
  protect,
  allowRoles("admin"),
  async (req, res) => {
    try {
      const { securityUserId, documentId } = req.params;

      const scopeSocietyCode = await getAdminScopeSocietyCode(req);
      if (!scopeSocietyCode) {
        return res.status(400).json({ message: "Admin society is not configured" });
      }

      const guard = await User.findOne({
        _id: securityUserId,
        role: "security",
        societyCode: { $in: getSocietyVariants(scopeSocietyCode) },
      });

      if (!guard) {
        return res.status(404).json({ message: "Security guard not found in your society" });
      }

      const document = guard.documents.id(documentId);
      if (!document) {
        return res.status(404).json({ message: "Document not found" });
      }

      document.verified = true;
      document.verification = new Date();

      await guard.save();

      return res.json({ message: "Document verified successfully", guard });
    } catch (err) {
      console.error("Admin verify security document error:", err);
      return res.status(500).json({ message: "Server error" });
    }
  }
);

// ADD A SECURITY DOCUMENT
router.post(
  "/security-staff/:securityUserId/documents",
  protect,
  allowRoles("admin"),
  async (req, res) => {
    try {
      const { securityUserId } = req.params;
      const { type, number } = req.body;

      const validation = validateSecurityDocument({ type, number });
      if (!validation.ok) {
        return res.status(400).json({ message: validation.message });
      }

      const scopeSocietyCode = await getAdminScopeSocietyCode(req);
      if (!scopeSocietyCode) {
        return res.status(400).json({ message: "Admin society is not configured" });
      }

      const guard = await User.findOne({
        _id: securityUserId,
        role: "security",
        societyCode: { $in: getSocietyVariants(scopeSocietyCode) },
      });

      if (!guard) {
        return res.status(404).json({ message: "Security guard not found in your society" });
      }

      guard.documents.push({
        type: normalizeDocumentType(type),
        number: String(number || "").trim(),
        verified: false,
      });

      await guard.save();

      return res.json({ message: "Document added successfully", guard });
    } catch (err) {
      console.error("Admin add security document error:", err);
      return res.status(500).json({ message: "Server error" });
    }
  }
);

// ADMIN RESET SECURITY PASSWORD
router.post(
  "/security-staff/:securityUserId/reset-password",
  protect,
  allowRoles("admin"),
  async (req, res) => {
    try {
      const { securityUserId } = req.params;
      const { newPassword, confirmPassword } = req.body;

      if (!newPassword || !confirmPassword) {
        return res.status(400).json({ message: "Password fields are required" });
      }

      if (newPassword !== confirmPassword) {
        return res.status(400).json({ message: "Passwords do not match" });
      }

      if (String(newPassword).length < 6) {
        return res.status(400).json({ message: "Password must be at least 6 characters" });
      }

      const scopeSocietyCode = await getAdminScopeSocietyCode(req);
      if (!scopeSocietyCode) {
        return res.status(400).json({ message: "Admin society is not configured" });
      }

      const guard = await User.findOne({
        _id: securityUserId,
        role: "security",
        societyCode: { $in: getSocietyVariants(scopeSocietyCode) },
      });

      if (!guard) {
        return res.status(404).json({ message: "Security guard not found in your society" });
      }

      guard.password = newPassword;
      await guard.save();

      try {
        await sendMail({
          to: guard.email,
          subject: "Civara Security Password Updated by Admin",
          text: `Hello ${guard.name},\n\nYour security portal password was reset by your society admin.\nIf this was not expected, contact your admin immediately.`,
          html: `<p>Hello ${guard.name},</p><p>Your security portal password was reset by your society admin.</p><p>If this was not expected, contact your admin immediately.</p>`,
        });
      } catch (err) {
        console.error("Failed to send security reset notification email:", err);
      }

      return res.json({ message: "Security guard password reset successfully" });
    } catch (err) {
      console.error("Admin security password reset error:", err);
      return res.status(500).json({ message: "Server error" });
    }
  }
);

// GET ALL USERS (RESIDENT + SECURITY)
router.get(
  "/users",
  protect,
  allowRoles("admin"),
  async (req, res) => {
    try {
      const scopeSocietyCode = await getAdminScopeSocietyCode(req);
      if (!scopeSocietyCode) {
        return res.status(400).json({ message: "Admin society is not configured" });
      }

      const users = await User.find({ societyCode: { $in: getSocietyVariants(scopeSocietyCode) } }).select("-password");

      res.json(users);
    } catch (err) {
      console.error("Admin Users Fetch Error:", err);
      res.status(500).json({ message: "Server error" });
    }
  }
);

// ADMIN DASHBOARD STATS
router.get(
  "/stats",
  protect,
  allowRoles("admin"),
  getAdminStats
);

// ADMIN RESET RESIDENT PASSWORD (fallback when email reset is not usable)
router.post(
  "/residents/reset-password",
  protect,
  allowRoles("admin"),
  async (req, res) => {
    try {
      const scopeSocietyCode = await getAdminScopeSocietyCode(req);
      if (!scopeSocietyCode) {
        return res.status(400).json({ message: "Admin society is not configured" });
      }

      const { residentId, email, newPassword, confirmPassword } = req.body;

      if ((!residentId && !email) || !newPassword || !confirmPassword) {
        return res.status(400).json({ message: "Resident reference and password fields are required" });
      }

      if (newPassword !== confirmPassword) {
        return res.status(400).json({ message: "Passwords do not match" });
      }

      if (String(newPassword).length < 6) {
        return res.status(400).json({ message: "Password must be at least 6 characters" });
      }

      const resident = await findResidentForAdmin({ residentId, email, scopeSocietyCode });

      if (!resident) {
        return res.status(404).json({ message: "Resident not found in your society" });
      }

      resident.password = newPassword;
      await resident.save();

      try {
        await sendMail({
          to: resident.email,
          subject: "Civara Password Updated by Admin",
          text: `Hello ${resident.name},\n\nYour account password was reset by your society admin.\nIf this was not expected, contact your admin immediately.`,
          html: `<p>Hello ${resident.name},</p><p>Your account password was reset by your society admin.</p><p>If this was not expected, contact your admin immediately.</p>`,
        });
      } catch (err) {
        console.error("Failed to send resident reset notification email:", err);
      }

      return res.json({ message: "Resident password reset successfully" });
    } catch (err) {
      console.error("Admin resident password reset error:", err);
      return res.status(500).json({ message: "Server error" });
    }
  }
);

// UPDATE RESIDENT ACTIVE STATUS
router.patch(
  "/residents/:residentId/status",
  protect,
  allowRoles("admin"),
  async (req, res) => {
    try {
      const { residentId } = req.params;
      const { isActive } = req.body;

      if (typeof isActive !== "boolean") {
        return res.status(400).json({ message: "isActive must be true or false" });
      }

      const scopeSocietyCode = await getAdminScopeSocietyCode(req);
      if (!scopeSocietyCode) {
        return res.status(400).json({ message: "Admin society is not configured" });
      }

      const resident = await findResidentForAdmin({ residentId, scopeSocietyCode });

      if (!resident) {
        return res.status(404).json({ message: "Resident not found in your society" });
      }

      resident.isActive = isActive;
      await resident.save();

      return res.json({ message: "Resident status updated", resident });
    } catch (err) {
      console.error("Admin resident status update error:", err);
      return res.status(500).json({ message: "Server error" });
    }
  }
);

// UPDATE RESIDENT MAINTENANCE STATUS
router.patch(
  "/residents/:residentId/maintenance",
  protect,
  allowRoles("admin"),
  async (req, res) => {
    try {
      const { residentId } = req.params;
      const { maintenanceStatus } = req.body;

      const allowed = ["Pending", "Paid", "Overdue", "pending", "paid", "overdue"];
      if (!maintenanceStatus || !allowed.includes(String(maintenanceStatus))) {
        return res.status(400).json({ message: "Invalid maintenance status" });
      }

      const normalized = String(maintenanceStatus).toLowerCase();
      const finalStatus = normalized.charAt(0).toUpperCase() + normalized.slice(1);

      const scopeSocietyCode = await getAdminScopeSocietyCode(req);
      if (!scopeSocietyCode) {
        return res.status(400).json({ message: "Admin society is not configured" });
      }

      const resident = await findResidentForAdmin({ residentId, scopeSocietyCode });

      if (!resident) {
        return res.status(404).json({ message: "Resident not found in your society" });
      }

      resident.maintenanceStatus = finalStatus;
      await resident.save();

      return res.json({ message: "Maintenance status updated", resident });
    } catch (err) {
      console.error("Admin resident maintenance update error:", err);
      return res.status(500).json({ message: "Server error" });
    }
  }
);

// ADD NEW DOCUMENT FOR RESIDENT
router.post(
  "/residents/:residentId/documents",
  protect,
  allowRoles("admin"),
  async (req, res) => {
    try {
      const { residentId } = req.params;
      const { type, number } = req.body;

      if (!type || !number) {
        return res.status(400).json({ message: "Document type and number are required" });
      }

      if (!isValidDocumentNumber(number)) {
        return res.status(400).json({ message: "Document number must be a 12-digit number" });
      }

      const scopeSocietyCode = await getAdminScopeSocietyCode(req);
      if (!scopeSocietyCode) {
        return res.status(400).json({ message: "Admin society is not configured" });
      }

      const resident = await findResidentForAdmin({ residentId, scopeSocietyCode });

      if (!resident) {
        return res.status(404).json({ message: "Resident not found in your society" });
      }

      resident.documents.push({
        type: String(type).trim(),
        number: String(number).trim(),
        verified: false,
      });

      await resident.save();

      return res.json({ message: "Document added successfully", resident });
    } catch (err) {
      console.error("Admin add resident document error:", err);
      return res.status(500).json({ message: "Server error" });
    }
  }
);

// VERIFY A RESIDENT DOCUMENT
router.patch(
  "/residents/:residentId/documents/:documentId/verify",
  protect,
  allowRoles("admin"),
  async (req, res) => {
    try {
      const { residentId, documentId } = req.params;

      const scopeSocietyCode = await getAdminScopeSocietyCode(req);
      if (!scopeSocietyCode) {
        return res.status(400).json({ message: "Admin society is not configured" });
      }

      const resident = await findResidentForAdmin({ residentId, scopeSocietyCode });

      if (!resident) {
        return res.status(404).json({ message: "Resident not found in your society" });
      }

      const document = resident.documents.id(documentId);
      if (!document) {
        return res.status(404).json({ message: "Document not found" });
      }

      document.verified = true;
      document.verification = new Date();

      await resident.save();

      return res.json({ message: "Document verified successfully", resident });
    } catch (err) {
      console.error("Admin verify resident document error:", err);
      return res.status(500).json({ message: "Server error" });
    }
  }
);

// GET ADMIN SETTINGS
router.get(
  "/settings",
  protect,
  allowRoles("admin"),
  async (req, res) => {
    try {
      const admin = await User.findById(req.user.id).select("-password");
      if (!admin || admin.role !== "admin") {
        return res.status(404).json({ message: "Admin not found" });
      }

      const avatarUrl = admin.avatar
        ? admin.avatar.startsWith("http")
          ? admin.avatar
          : `${req.protocol}://${req.get("host")}${admin.avatar}`
        : null;

      return res.json({
        profile: {
          name: admin.name || "",
          email: admin.email || "",
          phone: admin.phone || "",
          avatar: avatarUrl,
        },
        appearance: {
          theme: admin.themePreference || "light",
        },
        society: {
          code: admin.societyCode || "",
          name: admin.societyName || "",
          address: admin.societyAddress || "",
          contact: admin.societyContact || "",
        },
      });
    } catch (err) {
      console.error("Admin settings fetch error:", err);
      return res.status(500).json({ message: "Server error" });
    }
  }
);

// UPDATE ADMIN PROFILE
router.put(
  "/settings/profile",
  protect,
  allowRoles("admin"),
  async (req, res) => {
    try {
      const { name, email, phone } = req.body;

      if (!String(name || "").trim()) {
        return res.status(400).json({ message: "Admin name is required" });
      }

      const normalizedEmail = String(email || "").toLowerCase().trim();
      if (!normalizedEmail || !/^\S+@\S+\.\S+$/.test(normalizedEmail)) {
        return res.status(400).json({ message: "Valid email is required" });
      }

      const admin = await User.findById(req.user.id);
      if (!admin || admin.role !== "admin") {
        return res.status(404).json({ message: "Admin not found" });
      }

      const existing = await User.findOne({ email: normalizedEmail, _id: { $ne: admin._id } });
      if (existing) {
        return res.status(400).json({ message: "Email already in use" });
      }

      admin.name = String(name).trim();
      admin.email = normalizedEmail;
      admin.phone = String(phone || "").trim();
      await admin.save();

      return res.json({
        message: "Profile updated successfully",
        profile: {
          name: admin.name,
          email: admin.email,
          phone: admin.phone || "",
          avatar: admin.avatar || null,
        },
      });
    } catch (err) {
      console.error("Admin settings profile update error:", err);
      return res.status(500).json({ message: "Server error" });
    }
  }
);

// UPDATE SOCIETY SETTINGS
router.put(
  "/settings/society",
  protect,
  allowRoles("admin"),
  async (req, res) => {
    try {
      const { name, address, contact } = req.body;
      const societyName = String(name || "").trim();
      const societyAddress = String(address || "").trim();
      const societyContact = String(contact || "").trim();
      const scopeSocietyCode = await getAdminScopeSocietyCode(req);
      if (!scopeSocietyCode) {
        return res.status(400).json({ message: "Admin society is not configured" });
      }
      const societyCodes = getSocietyVariants(scopeSocietyCode);

      const updatedAdmin = await User.findByIdAndUpdate(
        req.user.id,
        {
          $set: {
            societyName,
            societyAddress,
            societyContact,
          },
        },
        { new: true, runValidators: false }
      );

      if (!updatedAdmin || updatedAdmin.role !== "admin") {
        return res.status(404).json({ message: "Admin not found" });
      }

      await User.updateMany(
        { societyCode: { $in: societyCodes } },
        {
          $set: {
            societyName,
            societyAddress,
            societyContact,
          },
        }
      );

      return res.json({
        message: "Society settings updated successfully",
        society: {
          code: updatedAdmin.societyCode || "",
          name: updatedAdmin.societyName || "",
          address: updatedAdmin.societyAddress || "",
          contact: updatedAdmin.societyContact || "",
        },
      });
    } catch (err) {
      console.error("Admin settings society update error:", err);
      return res.status(500).json({ message: "Server error" });
    }
  }
);

// UPDATE ADMIN THEME PREFERENCE
router.put(
  "/settings/theme",
  protect,
  allowRoles("admin"),
  async (req, res) => {
    try {
      const { theme } = req.body;
      if (!["light", "dark"].includes(String(theme || "").toLowerCase())) {
        return res.status(400).json({ message: "Theme must be light or dark" });
      }

      const admin = await User.findById(req.user.id);
      if (!admin || admin.role !== "admin") {
        return res.status(404).json({ message: "Admin not found" });
      }

      admin.themePreference = String(theme).toLowerCase();
      await admin.save();

      return res.json({
        message: "Theme updated successfully",
        appearance: { theme: admin.themePreference },
      });
    } catch (err) {
      console.error("Admin settings theme update error:", err);
      return res.status(500).json({ message: "Server error" });
    }
  }
);

// CHANGE ADMIN PASSWORD
router.put(
  "/settings/change-password",
  protect,
  allowRoles("admin"),
  async (req, res) => {
    try {
      const { currentPassword, newPassword, confirmPassword } = req.body;

      if (!currentPassword || !newPassword || !confirmPassword) {
        return res.status(400).json({ message: "All password fields are required" });
      }

      if (String(newPassword) !== String(confirmPassword)) {
        return res.status(400).json({ message: "New password and confirm password must match" });
      }

      if (String(newPassword).length < 6) {
        return res.status(400).json({ message: "Password must be at least 6 characters" });
      }

      const admin = await User.findById(req.user.id);
      if (!admin || admin.role !== "admin") {
        return res.status(404).json({ message: "Admin not found" });
      }

      const isMatch = await admin.comparePassword(String(currentPassword));
      if (!isMatch) {
        return res.status(400).json({ message: "Current password is incorrect" });
      }

      admin.password = String(newPassword);
      await admin.save();

      return res.json({ message: "Password updated successfully" });
    } catch (err) {
      console.error("Admin settings change password error:", err);
      return res.status(500).json({ message: "Server error" });
    }
  }
);

// UPLOAD OR REMOVE ADMIN AVATAR
router.post(
  "/settings/avatar",
  protect,
  allowRoles("admin"),
  upload.single("avatar"),
  async (req, res) => {
    try {
      const admin = await User.findById(req.user.id);
      if (!admin || admin.role !== "admin") {
        return res.status(404).json({ message: "Admin not found" });
      }

      if (!req.file) {
        admin.avatar = null;
        await admin.save();
        return res.json({ message: "Profile photo removed", avatar: null });
      }

      admin.avatar = `/uploads/${req.file.filename}`;
      await admin.save();

      const absoluteUrl = `${req.protocol}://${req.get("host")}${admin.avatar}`;
      return res.json({ message: "Profile photo updated", avatar: absoluteUrl });
    } catch (err) {
      console.error("Admin settings avatar update error:", err);
      return res.status(500).json({ message: "Server error" });
    }
  }
);

export default router;
