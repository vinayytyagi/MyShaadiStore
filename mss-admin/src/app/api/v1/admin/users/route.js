import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth";
import { getUsersCollection } from "@/lib/db";
import { sanitizeUser } from "@/lib/userAuth";
import { escapeRegex, parsePagination, parseSort } from "@/lib/adminListQuery";

const USER_SORT = ["name", "phone", "email", "created_at", "updated_at"];

export async function GET(request) {
  const err = requireAdmin(request);
  if (err) return err;
  try {
    const { searchParams } = new URL(request.url);
    const q = (searchParams.get("q") || searchParams.get("search") || "").trim();
    const { page, limit, skip } = parsePagination(searchParams, { defaultLimit: 25, maxLimit: 200 });
    const { sort } = parseSort(searchParams, USER_SORT, "created_at", "desc");

    const col = await getUsersCollection();
    const filter = {};
    if (q) {
      const rx = { $regex: escapeRegex(q), $options: "i" };
      filter.$or = [{ name: rx }, { phone: rx }, { email: rx }];
    }
    const total = await col.countDocuments(filter);
    const users = await col.find(filter).sort(sort).skip(skip).limit(limit).toArray();
    return NextResponse.json({ users: users.map(sanitizeUser), total, page, limit });
  } catch (e) {
    return NextResponse.json({ code: "INTERNAL_ERROR", message: e.message }, { status: 500 });
  }
}
