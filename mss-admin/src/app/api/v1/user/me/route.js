import { NextResponse } from "next/server";
import { ObjectId } from "mongodb";
import { getAuthUser } from "@/lib/auth";
import { getUsersCollection } from "@/lib/db";
import { sanitizeUser } from "@/lib/userAuth";

/**
 * GET /api/v1/user/me
 * Returns the authenticated user's full profile.
 */
export async function GET(request) {
  try {
    const decoded = getAuthUser(request);
    if (!decoded || decoded.type !== "customer") {
      return NextResponse.json({ code: "UNAUTHORIZED", message: "Login required" }, { status: 401 });
    }

    const col = await getUsersCollection();
    const user = await col.findOne({ _id: new ObjectId(decoded.userId) });
    if (!user) {
      return NextResponse.json({ code: "NOT_FOUND", message: "User not found" }, { status: 404 });
    }

    return NextResponse.json(sanitizeUser(user));
  } catch (e) {
    console.error("[GET /api/v1/user/me]", e);
    return NextResponse.json({ code: "INTERNAL_ERROR", message: e.message }, { status: 500 });
  }
}

/**
 * PUT /api/v1/user/me
 * Update the authenticated user's profile (name, email, addresses).
 */
export async function PUT(request) {
  try {
    const decoded = getAuthUser(request);
    if (!decoded || decoded.type !== "customer") {
      return NextResponse.json({ code: "UNAUTHORIZED", message: "Login required" }, { status: 401 });
    }

    const body = await request.json();
    const update = { updated_at: new Date() };

    if (body.name !== undefined) update.name = String(body.name).trim();
    if (body.email !== undefined) update.email = String(body.email).trim();
    if (body.image_url !== undefined) update.image_url = String(body.image_url).trim();
    if (body.addresses !== undefined && Array.isArray(body.addresses)) {
      update.addresses = body.addresses.map((addr) => ({
        label: String(addr.label || "Home").trim(),
        line1: String(addr.line1 || "").trim(),
        line2: String(addr.line2 || "").trim(),
        city: String(addr.city || "").trim(),
        state: String(addr.state || "").trim(),
        pincode: String(addr.pincode || "").trim(),
      }));
    }

    if (body.onboarding !== undefined) {
      update.onboarding = body.onboarding;
    }

    const col = await getUsersCollection();
    const user = await col.findOneAndUpdate(
      { _id: new ObjectId(decoded.userId) },
      { $set: update },
      { returnDocument: "after" }
    );

    if (!user) {
      return NextResponse.json({ code: "NOT_FOUND", message: "User not found" }, { status: 404 });
    }

    return NextResponse.json({ message: "Profile updated", user: sanitizeUser(user) });
  } catch (e) {
    console.error("[PUT /api/v1/user/me]", e);
    return NextResponse.json({ code: "INTERNAL_ERROR", message: e.message }, { status: 500 });
  }
}
