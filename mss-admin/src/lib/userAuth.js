import { signToken, verifySignedToken } from "@/lib/auth";

export function normalizePhone(value) {
  return String(value || "").trim().replace(/\D/g, "").slice(-10);
}

export function isValidIndianPhone(phone) {
  return /^[6-9]\d{9}$/.test(String(phone || ""));
}

export function validatePasswordStrength(password) {
  const value = String(password || "");
  if (value.length < 8) {
    return "Password must be at least 8 characters";
  }
  if (!/[A-Z]/.test(value)) {
    return "Password must include at least one uppercase letter";
  }
  if (!/[a-z]/.test(value)) {
    return "Password must include at least one lowercase letter";
  }
  if (!/\d/.test(value)) {
    return "Password must include at least one number";
  }
  if (!/[!@#$%^&*()_\-+=[\]{};':"\\|,.<>/?`~]/.test(value)) {
    return "Password must include at least one special character";
  }
  return null;
}

export function generateOtp() {
  return String(Math.floor(100000 + Math.random() * 900000));
}

export function createVerificationToken(phone, purpose) {
  return signToken({ type: "user_verification", phone, purpose }, "15m");
}

export function verifyVerificationToken(token, purpose) {
  const decoded = verifySignedToken(token);
  if (decoded?.type !== "user_verification") {
    throw new Error("Invalid verification token");
  }
  if (purpose && decoded?.purpose !== purpose) {
    throw new Error("Verification token purpose mismatch");
  }
  return decoded;
}

export function sanitizeUser(user) {
  if (!user) return null;
  const out = { ...user };
  delete out.passwordHash;
  delete out.otp;
  if (out._id) out.user_id = out._id.toString();
  return out;
}
