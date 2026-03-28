import { NextResponse } from "next/server";
import { getItemsCollection, getCategoriesCollection } from "@/lib/db";

const MAX_SCAN_FOR_PRICE_FILTER = 4000;
const MAX_CLIENT_LIMIT = 500;

function escapeRegex(s) {
  return String(s).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function isWithinWindow(now, startAt, endAt) {
  const startOk = !startAt || new Date(startAt).getTime() <= now;
  const endOk = !endAt || new Date(endAt).getTime() >= now;
  return startOk && endOk;
}

function normCatKey(s) {
  return String(s || "").trim().toLowerCase();
}

function isObjectIdLike(s) {
  return /^[a-f\d]{24}$/i.test(String(s || "").trim());
}

async function resolveJourneyCategoryIds(journeyStepId, categoryKey, subcategoryKey) {
  const col = await getCategoriesCollection();
  const list = await col.find({ journey_step_id: journeyStepId }).toArray();
  const cats = list.map((c) => ({ ...c, category_id: c._id.toString() }));
  const tops = cats.filter((c) => !c.parent_category_id);

  let cid = "";
  const ck = String(categoryKey || "").trim();
  if (ck) {
    if (isObjectIdLike(ck) && tops.some((c) => c.category_id === ck)) {
      cid = ck;
    } else {
      const hit =
        tops.find((c) => normCatKey(c.slug) === normCatKey(ck)) || tops.find((c) => c.category_id === ck);
      if (hit) cid = hit.category_id;
    }
  }

  let sid = "";
  const sk = String(subcategoryKey || "").trim();
  if (sk && cid) {
    const subs = cats.filter((c) => c.parent_category_id === cid);
    if (isObjectIdLike(sk) && subs.some((c) => c.category_id === sk)) {
      sid = sk;
    } else {
      const hit =
        subs.find((c) => normCatKey(c.slug) === normCatKey(sk)) || subs.find((c) => c.category_id === sk);
      if (hit) sid = hit.category_id;
    }
  }
  return { categoryId: cid, subcategoryId: sid };
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
    let categoryId = (searchParams.get("categoryId") || searchParams.get("category_id") || "").trim();
    let subcategoryId = (searchParams.get("subcategoryId") || searchParams.get("subcategory_id") || "").trim();
    const categorySlug = (searchParams.get("categorySlug") || searchParams.get("category_slug") || "").trim();
    const subcategorySlug = (searchParams.get("subcategorySlug") || searchParams.get("subcategory_slug") || "").trim();

    const catKey = categoryId || categorySlug;
    const subKey = subcategoryId || subcategorySlug;
    if (journeyStepId && (catKey || subKey)) {
      const r = await resolveJourneyCategoryIds(journeyStepId, catKey, subKey);
      if (r.categoryId) categoryId = r.categoryId;
      if (r.subcategoryId) subcategoryId = r.subcategoryId;
    }
    const vendorId = searchParams.get("vendorId") || searchParams.get("vendor_id");
    const status = searchParams.get("status");
    const search = (searchParams.get("search") || searchParams.get("q") || "").trim();

    const maxFinalPriceRaw = searchParams.get("maxFinalPrice") || searchParams.get("max_final_price");
    const maxFinalPriceNum = maxFinalPriceRaw !== null && maxFinalPriceRaw !== "" ? Number(maxFinalPriceRaw) : NaN;
    /** 0 = only items with final_price ≤ 0 (free); >0 = cap */
    const applyMaxFinalPrice =
      Number.isFinite(maxFinalPriceNum) && maxFinalPriceNum >= 0 && maxFinalPriceNum <= 1e12;

    const page = Math.max(1, Number(searchParams.get("page")) || 1);
    let limit = Number(searchParams.get("limit")) || 20;
    if (!Number.isFinite(limit) || limit < 1) limit = 20;
    if (limit > MAX_CLIENT_LIMIT) limit = MAX_CLIENT_LIMIT;

    const col = await getItemsCollection();
    const filter = {};
    if (journeyStepId) filter.journey_step_id = journeyStepId;
    if (categoryId) filter.category_id = categoryId;
    if (subcategoryId) filter.subcategory_id = subcategoryId;
    if (vendorId) filter.vendor_id = vendorId;
    if (status) filter.status = status;
    else filter.status = "Active";
    if (search) {
      filter.name = { $regex: escapeRegex(search), $options: "i" };
    }

    const now = Date.now();

    if (applyMaxFinalPrice) {
      const items = await col.find(filter).limit(MAX_SCAN_FOR_PRICE_FILTER).toArray();
      let out = items
        .filter((i) => isWithinWindow(now, i.listing_start_at, i.listing_end_at))
        .map((i) => {
          const computed = computeDiscount(now, i);
          return {
            ...i,
            item_id: i._id.toString(),
            ...computed,
          };
        })
        .filter((i) => Number(i.final_price) <= maxFinalPriceNum);

      const total = out.length;
      const skip = (page - 1) * limit;
      out = out.slice(skip, skip + limit);

      return NextResponse.json({
        items: out,
        total,
        page,
        limit,
        applied_max_final_price: maxFinalPriceNum,
      });
    }

    const total = await col.countDocuments(filter);
    const skip = (page - 1) * limit;
    const items = await col.find(filter).skip(skip).limit(limit).toArray();
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

