import { NextResponse } from "next/server";
import { getUsersCollection } from "@/lib/db";
import { generateOtp, normalizePhone } from "@/lib/userAuth";

export async function POST(request) {
  try {
    const body = await request.json();
    const phone = normalizePhone(body?.phone);
    const purpose = body?.purpose === "reset" ? "reset" : "signup";

    if (!phone || phone.length < 10) {
      return NextResponse.json(
        { code: "BAD_REQUEST", message: "Valid phone number required" },
        { status: 400 }
      );
    }

    const col = await getUsersCollection();
    const existing = await col.findOne({ phone });

    if (purpose === "signup" && existing?.passwordHash) {
      return NextResponse.json(
        { code: "BAD_REQUEST", message: "User already exists. Please login instead." },
        { status: 400 }
      );
    }

    if (purpose === "reset" && !existing?.passwordHash) {
      return NextResponse.json(
        { code: "NOT_FOUND", message: "Account not found for this phone number" },
        { status: 404 }
      );
    }

    const otp = generateOtp();
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000);

    await col.updateOne(
      { phone },
      {
        $set: {
          phone,
          status: existing?.status || "Active",
          otp: {
            code: otp,
            purpose,
            expires_at: expiresAt,
          },
          updated_at: new Date(),
        },
        $setOnInsert: {
          created_at: new Date(),
        },
      },
      { upsert: true }
    );

    return NextResponse.json({
      message: "OTP sent successfully",
      purpose,
      expiresAt: expiresAt.toISOString(),
      devOtp: otp,
    });
  } catch (e) {
    return NextResponse.json({ code: "INTERNAL_ERROR", message: e.message }, { status: 500 });
  }
}
