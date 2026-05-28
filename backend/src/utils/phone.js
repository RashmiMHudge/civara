export const normalizeIndianPhone = (value) => {
  const raw = String(value || "").trim();
  if (!raw) return "";

  const digits = raw.replace(/\D/g, "");

  // Already in international format (e.g. +1260..., +91...)
  if (raw.startsWith("+") && digits.length >= 8) {
    return `+${digits}`;
  }

  // Indian local mobile number: 10 digits starting 6-9
  if (/^[6-9]\d{9}$/.test(digits)) {
    return `+91${digits}`;
  }

  // Indian number already prefixed with 91
  if (/^91[6-9]\d{9}$/.test(digits)) {
    return `+${digits}`;
  }

  return raw;
};
