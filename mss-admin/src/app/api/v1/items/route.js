import { NextResponse } from "next/server";
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

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const journeyStepId = searchParams.get("journeyStepId") || searchParams.get("journey_step_id");
    const categoryId = searchParams.get("categoryId") || searchParams.get("category_id");
    const subcategoryId = searchParams.get("subcategoryId") || searchParams.get("subcategory_id");
    const vendorId = searchParams.get("vendorId") || searchParams.get("vendor_id");
    const status = searchParams.get("status");

    const page = Number(searchParams.get("page")) || 1;
    const limit = Number(searchParams.get("limit")) || 20;

    const col = await getItemsCollection();
    const filter = {};
    if (journeyStepId) filter.journey_step_id = journeyStepId;
    if (categoryId) filter.category_id = categoryId;
    if (subcategoryId) filter.subcategory_id = subcategoryId;
    if (vendorId) filter.vendor_id = vendorId;
    if (status) filter.status = status;
    else filter.status = "Active";

    const total = await col.countDocuments(filter);
    const skip = (page - 1) * limit;
    const items = await col.find(filter).skip(skip).limit(limit).toArray();
    const now = Date.now();
    const out = items
      .filter((i) => isWithinWindow(now, i.listing_start_at, i.listing_end_at))
      .map((i) => {
        const computed = computeDiscount(now, i);
        return {
          ...i,
          item_id: i._id.toString(),
          ...computed,
        };
      });

    return NextResponse.json({ items: out, total, page, limit });
  } catch (e) {
    return NextResponse.json({ code: "INTERNAL_ERROR", message: e.message }, { status: 500 });
  }
}

