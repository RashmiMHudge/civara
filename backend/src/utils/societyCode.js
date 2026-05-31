const SOCIETY_CODE_PATTERN = /^CIV-\d{3,}$/;

export const normalizeSocietyCode = (value) => {
  const raw = String(value || "").trim().toUpperCase();
  if (!raw) return "";

  const parts = raw.split("-");
  if (parts.length < 2) return raw;

  const suffix = parts.slice(1).join("-");
  let prefix = parts[0];
  if (prefix.endsWith("R") || prefix.endsWith("S")) {
    prefix = prefix.slice(0, -1);
  }

  return `${prefix}-${suffix}`;
};

export const isValidSocietyCode = (value) => SOCIETY_CODE_PATTERN.test(normalizeSocietyCode(value));

export const formatSocietyCode = (sequence) => `CIV-${String(sequence).padStart(3, "0")}`;

