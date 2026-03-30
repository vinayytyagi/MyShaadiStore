import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth";
import { getOrdersCollection } from "@/lib/db";
import { escapeRegex, parsePagination, parseSort } from "@/lib/adminListQuery";

const ORDER_SORT = ["created_at", "updated_at", "order_number", "status", "total_amount", "customer_name"];

export async function GET(request) {
  const err = requireAdmin(request);
  if (err) return err;
  try {
    const { searchParams } = new URL(request.url);
    const status = searchParams.get("status");
    const q = (searchParams.get("q") || searchParams.get("search") || "").trim();
    const { page, limit, skip } = parsePagination(searchParams, { defaultLimit: 25, maxLimit: 200 });
    const { sort } = parseSort(searchParams, ORDER_SORT, "created_at", "desc");

    const col = await getOrdersCollection();
    const filter = {};
    if (status) filter.status = status;
    if (q) {
      const rx = { $regex: escapeRegex(q), $options: "i" };
      filter.$or = [
        { order_number: rx },
        { customer_name: rx },
        { phone: rx },
        { status: rx },
      ];
    }
    const total = await col.countDocuments(filter);
    const orders = await col.find(filter).sort(sort).skip(skip).limit(limit).toArray();
    const list = orders.map((o) => ({ ...o, order_id: o._id.toString() }));
    return NextResponse.json({ orders: list, total, page, limit });
  } catch (e) {
    return NextResponse.json({ code: "INTERNAL_ERROR", message: e.message }, { status: 500 });
  }
}
