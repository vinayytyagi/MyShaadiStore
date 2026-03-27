import bcrypt from "bcryptjs";
import { NextResponse } from "next/server";
import { getUsersCollection } from "@/lib/db";
import { isValidIndianPhone, normalizePhone, validatePasswordStrength, verifyVerificationToken } from "@/lib/userAuth";

export async function POST(request) {
  try {
    const body = await request.json();
    const verificationToken = body?.verification_token || body?.verificationToken;
    const password = String(body?.password || "");

    if (!verificationToken) {
      return NextResponse.json(
        { code: "BAD_REQUEST", message: "Verification token required" },
        { status: 400 }
      );
    }

    const passwordValidationError = validatePasswordStrength(password);
    if (passwordValidationError) {
      return NextResponse.json(
        { code: "BAD_REQUEST", message: passwordValidationError },
        { status: 400 }
      );
    }

    const decoded = verifyVerificationToken(verificationToken, "reset");
    const phone = normalizePhone(decoded.phone);
    if (!isValidIndianPhone(phone)) {
      return NextResponse.json(
        { code: "BAD_REQUEST", message: "Invalid phone number. Enter a valid 10-digit Indian phone number." },
        { status: 400 }
      );
    }
    const col = await getUsersCollection();
    const user = await col.findOne({ phone });

    if (!user) {
      return NextResponse.json(
        { code: "NOT_FOUND", message: "Account not found" },
        { status: 404 }
      );
    }

    const passwordHash = await bcrypt.hash(password, 10);
    await col.updateOne(
      { phone },
      {
        $set: {
          passwordHash,
          updated_at: new Date(),
        },
      }
    );

    return NextResponse.json({ message: "Password reset successful" });
  } catch (e) {
    return NextResponse.json({ code: "INTERNAL_ERROR", message: e.message }, { status: 500 });
  }
}
