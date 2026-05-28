import Shift from "../models/Shift.js";
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

const SHIFT_DEFAULT_TIMES = {
  Morning: { startTime: "06:00", endTime: "14:00" },
  Afternoon: { startTime: "14:00", endTime: "22:00" },
  Night: { startTime: "22:00", endTime: "06:00" },
};

const resolveShiftTimes = (shiftType, startTime, endTime) => {
  const defaults = SHIFT_DEFAULT_TIMES[shiftType] || null;
  return {
    startTime: startTime || defaults?.startTime || null,
    endTime: endTime || defaults?.endTime || null,
  };
};

// Create a shift
export const createShift = async (req, res) => {
  try {
    const { guardId, guardName, gate, shiftType, date, startTime, endTime, required } = req.body;
    const societyCode = req.user?.societyCode;
    if (!societyCode) {
      return res.status(400).json({ message: "Society not configured" });
    }

    const resolvedTimes = resolveShiftTimes(shiftType, startTime, endTime);
    if (!resolvedTimes.startTime || !resolvedTimes.endTime) {
      return res.status(400).json({ message: "Shift start time and end time are required" });
    }

    if (!guardId) {
      return res.status(400).json({ message: "Guard assignment is required" });
    }

    const guard = await User.findOne({
      role: "security",
      guardId,
      societyCode: { $in: getSocietyVariants(societyCode) },
    });
    if (!guard) return res.status(404).json({ message: "Guard not found" });

    const shift = await Shift.create({
      societyCode,
      guard: guard._id,
      guardId: guard.guardId,
      guardName: guard.name,
      gate,
      shiftType,
      date,
      startTime: resolvedTimes.startTime,
      endTime: resolvedTimes.endTime,
      required: Number(required) > 0 ? Number(required) : 1,
      assignedGuards: [{ guardId: guard.guardId, guardName: guard.name }],
      status: "Planned"
    });
    res.json(shift);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// Get all shifts
export const getAllShifts = async (req, res) => {
  try {
    const societyCodes = getSocietyVariants(req.user?.societyCode);
    const shifts = await Shift.find({ societyCode: { $in: societyCodes } }).sort({ date: -1, createdAt: -1 });
    res.json(shifts);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// Get shifts for a guard
export const getGuardShifts = async (req, res) => {
  try {
    const { guardId } = req.params;
    const { date } = req.query;
    const societyCodes = getSocietyVariants(req.user?.societyCode);
    const query = {
      societyCode: { $in: societyCodes },
      $or: [
        { guardId },
        { "assignedGuards.guardId": guardId },
      ],
    };
    if (date) query.date = date;
    const shifts = await Shift.find(query).sort({ date: -1, createdAt: -1 });
    res.json(shifts);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// Update shift status
export const updateShiftStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    const societyCodes = getSocietyVariants(req.user?.societyCode);
    const shift = await Shift.findOne({ _id: id, societyCode: { $in: societyCodes } });
    if (!shift) return res.status(404).json({ message: "Shift not found" });
    shift.status = status;
    await shift.save();
    res.json(shift);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// Delete a shift
export const deleteShift = async (req, res) => {
  try {
    const { id } = req.params;
    const societyCodes = getSocietyVariants(req.user?.societyCode);
    const shift = await Shift.findOneAndDelete({ _id: id, societyCode: { $in: societyCodes } });
    if (!shift) return res.status(404).json({ message: "Shift not found" });
    res.json({ message: "Shift deleted successfully" });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
