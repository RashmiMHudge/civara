import Complaint from "../models/Complaint.js";
import Emergency from "../models/Emergency.js";
import User from "../models/User.js";

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

export const getAdminStats = async (req, res) => {
  try {
    const societyCodes = getSocietyVariants(req.user.societyCode);

    /* =============================
       COMPLAINT STATS
    ============================== */
    const totalComplaints = await Complaint.countDocuments({
      societyCode: { $in: societyCodes }
    });

    const pendingComplaints = await Complaint.countDocuments({
      societyCode: { $in: societyCodes },
      status: { $in: ["OPEN", "ASSIGNED", "IN_PROGRESS"] }
    });

    const resolvedComplaints = await Complaint.countDocuments({
      societyCode: { $in: societyCodes },
      status: "RESOLVED"
    });

    const slaBreached = await Complaint.countDocuments({
      societyCode: { $in: societyCodes },
      "sla.breached": true
    });

    /* =============================
       EMERGENCY STATS
    ============================== */
    const totalEmergencies = await Emergency.countDocuments({
      societyCode: { $in: societyCodes }
    });

    const activeEmergencies = await Emergency.countDocuments({
      societyCode: { $in: societyCodes },
      status: "ACTIVE"
    });

    /* =============================
       USER STATS
    ============================== */
    const totalResidents = await User.countDocuments({
      societyCode: { $in: societyCodes },
      role: "resident"
    });

    const totalSecurity = await User.countDocuments({
      societyCode: { $in: societyCodes },
      role: "security"
    });

    res.json({
      complaints: {
        total: totalComplaints,
        pending: pendingComplaints,
        resolved: resolvedComplaints,
        slaBreached
      },
      emergencies: {
        total: totalEmergencies,
        active: activeEmergencies
      },
      users: {
        residents: totalResidents,
        security: totalSecurity
      }
    });

  } catch (error) {
    console.error("Admin Stats Error:", error);
    res.status(500).json({ message: "Server error" });
  }
};