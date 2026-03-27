import bcrypt from "bcryptjs";
import { NextResponse } from "next/server";
import { signToken } from "@/lib/auth";
import { getUsersCollection } from "@/lib/db";
import { normalizePhone, sanitizeUser } from "@/lib/userAuth";

export async function POST(request) {
  try {
    const body = await request.json();
    const phone = normalizePhone(body?.phone);
    const password = String(body?.password || "");

    if (!phone || phone.length < 10 || !password) {
      return NextResponse.json(
        { code: "BAD_REQUEST", message: "Phone number and password are required" },
        { status: 400 }
      );
    }

    const col = await getUsersCollection();
    const user = await col.findOne({ phone });

    if (!user?.passwordHash) {
      return NextResponse.json(
        { code: "UNAUTHORIZED", message: "Account not found. Please sign up first." },
        { status: 401 }
      );
    }

    const matched = await bcrypt.compare(password, user.passwordHash);
    if (!matched) {
      return NextResponse.json(
        { code: "UNAUTHORIZED", message: "Invalid phone number or password" },
        { status: 401 }
      );
    }

    const token = signToken({ type: "customer", userId: user._id.toString(), phone });

    return NextResponse.json({
      token,
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
      user: sanitizeUser(user),
    });
  } catch (e) {
    return NextResponse.json({ code: "INTERNAL_ERROR", message: e.message }, { status: 500 });
  }
}
