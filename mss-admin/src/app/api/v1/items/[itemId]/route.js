import { NextResponse } from "next/server";
import { ObjectId } from "mongodb";
import { getItemsCollection } from "@/lib/db";

function isWithinWindow(now, startAt, endAt) {
  const startOk = !startAt || new Date(startAt).getTime() <= now;
  const endOk = !endAt || new Date(endAt).getTime() >= now;
  return startOk && endOk;
}

function computeDiscount(now, item) {
  const d = item.discount || {};
  const enabled = d.is_enabled === true && Number(d.percentage) > 0;
  if (!enabled) return { is_discount_active: false, discount_percentage: 0, final_price: Number(item.price) || 0 };

  const start = d.starts_at ? new Date(d.starts_at).getTime() : null;
  const end = d.ends_at ? new Date(d.ends_at).getTime() : null;
  const inWindow = (!start || start <= now) && (!end || end >= now);
  if (!inWindow) return { is_discount_active: false, discount_percentage: 0, final_price: Number(item.price) || 0 };

  const pct = Math.min(100, Math.max(0, Number(d.percentage) || 0));
  const base = Number(item.price) || 0;
  const final = Math.round(base * (1 - pct / 100));
  return { is_discount_active: true, discount_percentage: pct, final_price: final };
}

export async function GET(_request, { params }) {
  try {
    const { itemId } = await params;
    if (!ObjectId.isValid(itemId)) {
      return NextResponse.json({ code: "NOT_FOUND", message: "Item not found" }, { status: 404 });
    }

    const col = await getItemsCollection();
    const item = await col.findOne({ _id: new ObjectId(itemId), status: "Active" });
    if (!item) {
      return NextResponse.json({ code: "NOT_FOUND", message: "Item not found" }, { status: 404 });
    }

    const now = Date.now();
    if (!isWithinWindow(now, item.listing_start_at, item.listing_end_at)) {
      return NextResponse.json({ code: "NOT_FOUND", message: "Item not found" }, { status: 404 });
    }

    return NextResponse.json({
      ...item,
      item_id: item._id.toString(),
      ...computeDiscount(now, item),
    });
  } catch (e) {
    return NextResponse.json({ code: "INTERNAL_ERROR", message: e.message }, { status: 500 });
  }
}
