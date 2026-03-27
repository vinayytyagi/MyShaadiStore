import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { signToken } from "@/lib/auth";
import { getVendorCollection } from "@/lib/db";

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
    const col = await getVendorCollection();
    const vendor = await col.findOne({ email: email.trim().toLowerCase() });
    if (!vendor || vendor.status === "Suspended") {
      return NextResponse.json({ code: "UNAUTHORIZED", message: "Invalid credentials" }, { status: 401 });
    }
    if (!vendor.passwordHash) {
      return NextResponse.json(
        { code: "UNAUTHORIZED", message: "Password not set. Contact admin." },
        { status: 401 }
      );
    }
    const match = await bcrypt.compare(password, vendor.passwordHash);
    if (!match) {
      return NextResponse.json({ code: "UNAUTHORIZED", message: "Invalid credentials" }, { status: 401 });
    }
    const token = signToken({
      type: "vendor",
      vendorId: vendor._id.toString(),
      email: vendor.email,
    });
    return NextResponse.json({
      token,
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
      user: {
        vendorId: vendor._id.toString(),
        email: vendor.email,
        businessName: vendor.business_name,
        type: "vendor",
      },
    });
  } catch (e) {
    return NextResponse.json({ code: "INTERNAL_ERROR", message: e.message }, { status: 500 });
  }
}
