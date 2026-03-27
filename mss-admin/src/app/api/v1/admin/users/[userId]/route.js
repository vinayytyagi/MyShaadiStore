import { NextResponse } from "next/server";
import { ObjectId } from "mongodb";
import { requireAdmin } from "@/lib/auth";
import { getUsersCollection } from "@/lib/db";
import { sanitizeUser } from "@/lib/userAuth";

export async function GET(request, { params }) {
  const err = requireAdmin(request);
  if (err) return err;
  try {
    const { userId } = await params;
    if (!ObjectId.isValid(userId)) {
      return NextResponse.json({ code: "NOT_FOUND", message: "User not found" }, { status: 404 });
    }
    const col = await getUsersCollection();
    const user = await col.findOne({ _id: new ObjectId(userId) });
    if (!user) return NextResponse.json({ code: "NOT_FOUND", message: "User not found" }, { status: 404 });
    return NextResponse.json(sanitizeUser(user));
  } catch (e) {
    return NextResponse.json({ code: "INTERNAL_ERROR", message: e.message }, { status: 500 });
  }
}

export async function PUT(request, { params }) {
  const err = requireAdmin(request);
  if (err) return err;
  try {
    const { userId } = await params;
    if (!ObjectId.isValid(userId)) {
      return NextResponse.json({ code: "NOT_FOUND", message: "User not found" }, { status: 404 });
    }
    const body = await request.json();
    const update = { updated_at: new Date() };
    if (body.status !== undefined) update.status = body.status;
    if (body.onboarding !== undefined) update.onboarding = body.onboarding;
    const col = await getUsersCollection();
    const user = await col.findOneAndUpdate(
      { _id: new ObjectId(userId) },
      { $set: update },
      { returnDocument: "after" }
    );
    if (!user) return NextResponse.json({ code: "NOT_FOUND", message: "User not found" }, { status: 404 });
    return NextResponse.json({ message: "User updated", user: sanitizeUser(user) });
  } catch (e) {
    return NextResponse.json({ code: "INTERNAL_ERROR", message: e.message }, { status: 500 });
  }
}
