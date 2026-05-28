export const getAttendanceStatus = ({
  shift,
  punchedInAt,
  punchedOutAt,
}) => {
  if (!shift) return "NO SHIFT";

  if (!punchedInAt) return "ABSENT";

  if (punchedOutAt) return "COMPLETED";

  // ---- LATE LOGIC ----
  const shiftStart = parseTime(shift.startTime);
  const punchIn = parseTime(punchedInAt);

  if (shiftStart == null || punchIn == null) {
    return "PRESENT";
  }

  const graceMinutes = 10;
  const lateAfter = shiftStart + graceMinutes * 60 * 1000;

  if (punchIn > lateAfter) return "LATE";

  return "PRESENT";
};

const parseTime = (timeStr) => {
  if (!timeStr) return null;
  const value = String(timeStr).trim();

  // ISO datetime case.
  const isoDate = new Date(value);
  if (!Number.isNaN(isoDate.getTime()) && value.includes("T")) {
    return isoDate.getTime();
  }

  // "08:12 AM" or "08:12 PM"
  if (value.includes(" ")) {
    const [time, meridianRaw] = value.split(" ");
    let [hours, minutes] = String(time || "").split(":").map(Number);
    const meridian = String(meridianRaw || "").toUpperCase();

    if (Number.isNaN(hours) || Number.isNaN(minutes)) return null;

    if (meridian === "PM" && hours !== 12) hours += 12;
    if (meridian === "AM" && hours === 12) hours = 0;

    const d = new Date();
    d.setHours(hours, minutes, 0, 0);
    return d.getTime();
  }

  // "HH:mm" case.
  const parts = value.split(":");
  if (parts.length < 2) return null;
  const hours = Number(parts[0]);
  const minutes = Number(parts[1]);
  if (Number.isNaN(hours) || Number.isNaN(minutes)) return null;

  const d = new Date();
  d.setHours(hours, minutes, 0, 0);
  return d.getTime();
};
