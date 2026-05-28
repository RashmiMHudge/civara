import Attendance from "../models/Attendance.js";
import User from "../models/User.js";
import Shift from "../models/Shift.js";

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

const computePunchStatus = (date, startTime) => {
  if (!date || !startTime) return "Present";

  const [hh, mm] = String(startTime).split(":").map((v) => Number(v));
  if (Number.isNaN(hh) || Number.isNaN(mm)) return "Present";

  const scheduled = new Date(`${date}T${String(hh).padStart(2, "0")}:${String(mm).padStart(2, "0")}:00`);
  const now = new Date();
  const lateThreshold = new Date(scheduled.getTime() + 10 * 60 * 1000);
  return now > lateThreshold ? "Late" : "Present";
};

// Punch in (start duty)
export const punchIn = async (req, res) => {
  try {
    const { guardId, gate, shift, date, startTime, endTime } = req.body;
    const guard = req.user?.role === "security"
      ? await User.findById(req.user.id)
      : await User.findOne({ role: "security", guardId });

    if (!guard) return res.status(404).json({ message: "Guard not found" });

    const finalGuardId = guard.guardId || guardId;

    // Check if already punched in for this date/shift
    const existing = await Attendance.findOne({
      guardId: finalGuardId,
      date,
      shift,
      societyCode: guard.societyCode,
    });
    if (existing) return res.status(400).json({ message: "Already punched in" });

    const record = await Attendance.create({
      societyCode: guard.societyCode,
      guard: guard._id,
      guardId: finalGuardId,
      guardName: guard.name,
      gate,
      shift,
      date,
      startTime,
      endTime,
      punchedIn: new Date().toISOString(),
      status: computePunchStatus(date, startTime)
    });
    res.json(record);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// Punch out (end duty)
export const punchOut = async (req, res) => {
  try {
    const { guardId, date, shift } = req.body;
    const guard = req.user?.role === "security"
      ? await User.findById(req.user.id)
      : await User.findOne({ role: "security", guardId });

    const finalGuardId = guard?.guardId || guardId;
    const societyCode = guard?.societyCode || req.user?.societyCode;

    const record = await Attendance.findOne({
      guardId: finalGuardId,
      date,
      shift,
      societyCode,
    });
    if (!record) return res.status(404).json({ message: "No punch-in found" });
    if (record.punchedOut) return res.status(400).json({ message: "Already punched out" });
    record.punchedOut = new Date().toISOString();
    await record.save();
    res.json(record);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// Get today's attendance for all guards
export const getTodayAttendance = async (req, res) => {
  try {
    const { date } = req.query;
    const societyCodes = getSocietyVariants(req.user?.societyCode);
    const records = await Attendance.find({ date, societyCode: { $in: societyCodes } });
    res.json(records);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// Get all attendance records (admin)
export const getAllAttendance = async (req, res) => {
  try {
    const societyCodes = getSocietyVariants(req.user?.societyCode);
    const records = await Attendance.find({ societyCode: { $in: societyCodes } }).sort({ date: -1, createdAt: -1 });
    res.json(records);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// Get attendance history for a specific guard
export const getGuardAttendanceHistory = async (req, res) => {
  try {
    const { guardId } = req.params;
    const days = Math.max(Number(req.query.days) || 7, 1);
    const { date } = req.query;
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - (days - 1));
    const start = startDate.toISOString().split("T")[0];

    const query = { guardId };
    query.societyCode = { $in: getSocietyVariants(req.user?.societyCode) };
    if (date) {
      query.date = date;
    } else {
      query.date = { $gte: start };
    }

    const records = await Attendance.find(query).sort({ date: -1, createdAt: -1 });

    const enriched = await Promise.all(records.map(async (record) => {
      if (record.startTime && record.endTime) return record;

      const shift = await Shift.findOne({
        societyCode: { $in: getSocietyVariants(req.user?.societyCode) },
        $or: [
          { guardId: record.guardId },
          { "assignedGuards.guardId": record.guardId },
        ],
        date: record.date,
        shiftType: record.shift,
      }).select("startTime endTime");

      if (!shift) return record;

      const doc = record.toObject();
      if (!doc.startTime) doc.startTime = shift.startTime;
      if (!doc.endTime) doc.endTime = shift.endTime;
      return doc;
    }));

    res.json(enriched);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
