import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth";
import { getUsersCollection } from "@/lib/db";
import { sanitizeUser } from "@/lib/userAuth";

export async function GET(request) {
  const err = requireAdmin(request);
  if (err) return err;
  try {
    const { searchParams } = new URL(request.url);
    const page = Number(searchParams.get("page")) || 1;
    const limit = Number(searchParams.get("limit")) || 20;
    const col = await getUsersCollection();
    const total = await col.countDocuments({});
    const skip = (page - 1) * limit;
    const users = await col.find({}).sort({ created_at: -1 }).skip(skip).limit(limit).toArray();
    return NextResponse.json({ users: users.map(sanitizeUser), total, page, limit });
  } catch (e) {
    return NextResponse.json({ code: "INTERNAL_ERROR", message: e.message }, { status: 500 });
  }
}
