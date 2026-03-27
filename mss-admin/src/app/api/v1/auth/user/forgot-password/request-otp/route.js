import { NextResponse } from "next/server";
import { getUsersCollection } from "@/lib/db";
import { generateOtp, isValidIndianPhone, normalizePhone } from "@/lib/userAuth";

export async function POST(request) {
  try {
    const body = await request.json();
    const phone = normalizePhone(body?.phone);

    if (!phone || !isValidIndianPhone(phone)) {
      return NextResponse.json(
        { code: "BAD_REQUEST", message: "Enter a valid 10-digit Indian phone number" },
        { status: 400 }
      );
    }

    const col = await getUsersCollection();
    const user = await col.findOne({ phone });

    if (!user?.passwordHash) {
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
          otp: {
            code: otp,
            purpose: "reset",
            expires_at: expiresAt,
          },
          updated_at: new Date(),
        },
      }
    );

    return NextResponse.json({
      message: "Password reset OTP sent successfully",
      expiresAt: expiresAt.toISOString(),
      devOtp: otp,
    });
  } catch (e) {
    return NextResponse.json({ code: "INTERNAL_ERROR", message: e.message }, { status: 500 });
  }
}
