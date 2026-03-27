import jwt from "jsonwebtoken";
import { NextResponse } from "next/server";

const JWT_SECRET = process.env.JWT_SECRET || "dev-secret-change-me";

export function signToken(payload, expiresIn = process.env.JWT_EXPIRES_IN || "7d") {
  return jwt.sign(payload, JWT_SECRET, { expiresIn });
}

export function verifySignedToken(token) {
  return jwt.verify(token, JWT_SECRET);
}

/** Get decoded user from Authorization header. Returns null if invalid/missing. */
export function getAuthUser(request) {
  const authHeader = request.headers.get("authorization");
  const token = authHeader?.startsWith("Bearer ") ? authHeader.slice(7) : null;
  if (!token) return null;
  try {
    return verifySignedToken(token);
  } catch {
    return null;
  }
}

/** Use in admin API routes: returns NextResponse error if not admin, else returns null (proceed). */
export function requireAdmin(request) {
  const user = getAuthUser(request);
  if (!user) return NextResponse.json({ code: "UNAUTHORIZED", message: "Token required" }, { status: 401 });
  if (user.type !== "admin") return NextResponse.json({ code: "FORBIDDEN", message: "Admin only" }, { status: 403 });
  return null;
}
