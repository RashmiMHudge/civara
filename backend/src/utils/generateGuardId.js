import User from "../models/User.js";

export async function generateNextGuardId() {
  const securityUsers = await User.find({
    role: "security",
    guardId: { $exists: true, $ne: null }
  }).select("guardId");

  let maxNumericId = 1000;

  for (const user of securityUsers) {
    const match = String(user.guardId || "").match(/^SEC-(\d+)$/i);
    if (!match) continue;
    const numericPart = Number(match[1]);
    if (Number.isFinite(numericPart) && numericPart > maxNumericId) {
      maxNumericId = numericPart;
    }
  }

  return `SEC-${maxNumericId + 1}`;
}
