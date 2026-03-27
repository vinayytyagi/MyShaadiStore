import { NextResponse } from "next/server";
import { signToken } from "@/lib/auth";

export async function POST(request) {
  try {
    const body = await request.json();
    const { email, password } = body || {};
    if (!email || !password) {
      return NextResponse.json(
        { code: "BAD_REQUEST", message: "Email and password required" },
        { status: 400 }
      );
    }
    const adminEmail = process.env.ADMIN_EMAIL;
    const adminPassword = process.env.ADMIN_PASSWORD;
    if (!adminEmail || !adminPassword) {
      return NextResponse.json(
        { code: "CONFIG_ERROR", message: "Admin credentials not configured (ADMIN_EMAIL, ADMIN_PASSWORD in env)" },
        { status: 500 }
      );
    }
    if (email.trim().toLowerCase() !== adminEmail.toLowerCase() || password !== adminPassword) {
      return NextResponse.json({ code: "UNAUTHORIZED", message: "Invalid credentials" }, { status: 401 });
    }
    const token = signToken({ type: "admin", email: adminEmail });
    return NextResponse.json({
      token,
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
      user: { email: adminEmail, type: "admin" },
    });
  } catch (e) {
    return NextResponse.json({ code: "INTERNAL_ERROR", message: e.message }, { status: 500 });
  }
}
