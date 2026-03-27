import { NextResponse } from "next/server";
import { getUsersCollection } from "@/lib/db";
import { createVerificationToken, normalizePhone } from "@/lib/userAuth";

export async function POST(request) {
  try {
    const body = await request.json();
    const phone = normalizePhone(body?.phone);
    const otp = String(body?.otp || "").trim();
    const purpose = body?.purpose === "reset" ? "reset" : "signup";

    if (!phone || phone.length < 10 || otp.length < 4) {
      return NextResponse.json(
        { code: "BAD_REQUEST", message: "Phone and OTP are required" },
        { status: 400 }
      );
    }

    const col = await getUsersCollection();
    const user = await col.findOne({ phone });

    if (!user?.otp?.code || user.otp.purpose !== purpose) {
      return NextResponse.json(
        { code: "BAD_REQUEST", message: "OTP request not found" },
        { status: 400 }
      );
    }

    if (new Date(user.otp.expires_at).getTime() < Date.now()) {
      return NextResponse.json(
        { code: "BAD_REQUEST", message: "OTP expired. Request a new one." },
        { status: 400 }
      );
    }

    if (user.otp.code !== otp) {
      return NextResponse.json(
        { code: "BAD_REQUEST", message: "Invalid OTP" },
        { status: 400 }
      );
    }

    await col.updateOne(
      { phone },
      {
        $set: { updated_at: new Date() },
        $unset: { otp: "" },
      }
    );

    const verificationToken = createVerificationToken(phone, purpose);

    return NextResponse.json({
      message: "OTP verified successfully",
      verificationToken,
    });
  } catch (e) {
    return NextResponse.json({ code: "INTERNAL_ERROR", message: e.message }, { status: 500 });
  }
}
