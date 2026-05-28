import Emergency from "../models/Emergency.js";
import User from "../models/User.js";
import axios from "axios";

const EMERGENCY_WEBHOOK_URL = process.env.N8N_EMERGENCY_WEBHOOK_URL;
const inFlightEmergencyRequests = new Set();
/* =====================================================
    RESIDENT - TRIGGER EMERGENCY
===================================================== */
export const triggerEmergency = async (req, res) => {
  const residentRequestKey = String(req.user?.id || "");
  if (inFlightEmergencyRequests.has(residentRequestKey)) {
    return res.status(429).json({
      message: "An emergency alert is already being processed. Please wait."
    });
  }

  inFlightEmergencyRequests.add(residentRequestKey);
  try {
    const { type, description, location } = req.body;

    const validTypes = ["SOS", "MEDICAL", "SUSPICIOUS", "FIRE"];
    if (!type || !validTypes.includes(type)) {
      return res.status(400).json({ message: `Invalid emergency type. Expected one of ${validTypes.join(", ")}` });
    }

    const resident = await User.findById(req.user.id);
    if (!resident) {
      return res.status(404).json({ message: "Resident not found" });
    }

    const recentEmergency = await Emergency.findOne({
      "resident.id": resident._id,
      status: "ACTIVE",
      createdAt: { $gte: new Date(Date.now() - 15000) }
    });

    if (recentEmergency) {
      console.warn(`Duplicate emergency alert from ${resident.name} blocked.`);
      return res.status(429).json({
        message: "An emergency alert was already sent recently. Please wait before sending another."
      });
    }

    const finalDescription = (description || "").trim() || `${type} alert from resident`;
    const parsedLat = location?.lat != null ? Number(location.lat) : null;
    const parsedLng = location?.lng != null ? Number(location.lng) : null;

    const emergency = await Emergency.create({
      societyCode: resident.societyCode,
      resident: {
        id: resident._id,
        name: resident.name,
        flat: resident.flat,
        phone: resident.phone
      },
      type,
      description: finalDescription,
      location: {
        lat: Number.isFinite(parsedLat) ? parsedLat : null,
        lng: Number.isFinite(parsedLng) ? parsedLng : null
      },
      priority: "CRITICAL"
    });
    console.log("Emergency Alert Created:", type, resident.name);

    /* =============================
       NOTIFY SECURITY VIA N8N WEBHOOK
    ============================== */
    if (EMERGENCY_WEBHOOK_URL) {
      try {
        await axios.post(
          EMERGENCY_WEBHOOK_URL,
          {
            emergencyId: emergency._id,
            residentId: resident._id,
            residentName: resident.name,
            residentFlat: resident.flat,
            residentPhone: resident.phone,
            type: emergency.type,
            description: emergency.description,
            location: emergency.location,
            priority: emergency.priority,
            createdAt: emergency.createdAt
          },
          { timeout: 4000 }
        );
      } catch (err) {
        console.warn(
          `Emergency webhook delivery failed (${err.code || "ERR"}): ${err.message}`
        );
      }
    }

    res.status(201).json(emergency);
  } catch (error) {
    console.error("Error triggering emergency:", error);
    res.status(500).json({ message: "Server error" });
  } finally {
    inFlightEmergencyRequests.delete(residentRequestKey);
  }
};

/* =====================================================
RESIDENT - GET MY EMERGENCIES
===================================================== */
export const getEmergencies = async (req, res) => {
  try {
    const emergencies = await Emergency.find({
      "resident.id": req.user.id
    }).sort({ createdAt: -1 });
    res.json(emergencies);
  } catch (error) {
    console.error("Error fetching emergencies:", error);
    res.status(500).json({ message: "Server error" });
  }
};

/* =====================================================
     EMERGENCIES ADMIN/SECURITY VIEW
===================================================== */
export const getMyEmergencies = async (req, res) => {
  try {
    const emergencies = await Emergency.find({
      "resident.id": req.user.id
    }).sort({ createdAt: -1 });
    res.json(emergencies);
  } catch (error) {
    console.error("Error fetching emergencies:", error);
    res.status(500).json({ message: "Server error" });
  }
};

/* =====================================================
RESOLVE EMERGENCY (SECURITY/ADMIN)
===================================================== */
export const resolveEmergency = async (req, res) => {
  try {
    const emergency = await Emergency.findById(req.params.id);
    if (!emergency) {
      return res.status(404).json({ message: "Emergency not found" });
    }
    emergency.status = "RESOLVED";
    emergency.resolvedAt = new Date();
    emergency.respondedBy = req.user.id;
    await emergency.save();
    res.json({ message: "Emergency resolved" });
  } catch (error) {
    console.error("Error resolving emergency:", error);
    res.status(500).json({ message: "Server error" });
  }
};

/* =====================================================
    GET ALL EMERGENCIES (ADMIN/SECURITY)
===================================================== */
export const getAllEmergencies = async (req, res) => {
  try {
    const emergencies = await Emergency.find().sort({ createdAt: -1 });
    res.json(emergencies);
  } catch (error) {
    console.error("Error fetching emergencies:", error);
    res.status(500).json({ message: "Server error" });
  }
};