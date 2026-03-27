import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth";
import { getOrdersCollection } from "@/lib/db";

export async function GET(request) {
  const err = requireAdmin(request);
  if (err) return err;
  try {
    const { searchParams } = new URL(request.url);
    const status = searchParams.get("status");
    const page = Number(searchParams.get("page")) || 1;
    const limit = Number(searchParams.get("limit")) || 20;
    const col = await getOrdersCollection();
    const filter = status ? { status } : {};
    const total = await col.countDocuments(filter);
    const skip = (page - 1) * limit;
    const orders = await col.find(filter).skip(skip).limit(limit).toArray();
    const list = orders.map((o) => ({ ...o, order_id: o._id.toString() }));
    return NextResponse.json({ orders: list, total, page, limit });
  } catch (e) {
    return NextResponse.json({ code: "INTERNAL_ERROR", message: e.message }, { status: 500 });
  }
}
