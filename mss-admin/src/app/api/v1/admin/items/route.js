import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth";
import { getItemsCollection, getJourneyStepsCollection } from "@/lib/db";
import { escapeRegex, parsePagination, parseSort } from "@/lib/adminListQuery";

const MAX_ADMIN_ITEMS_LIMIT = 500;
const ITEM_SORT = ["name", "price", "status", "created_at", "updated_at", "slug", "location_city"];

export async function GET(request) {
  const err = requireAdmin(request);
  if (err) return err;
  try {
    const { searchParams } = new URL(request.url);
    const vendorId = searchParams.get("vendorId");
    const categoryId = searchParams.get("categoryId");
    const subcategoryId = searchParams.get("subcategoryId") || searchParams.get("subcategory_id");
    let journeyStepId = searchParams.get("journeyStepId") || searchParams.get("journey_step_id") || "";
    const stepSlug = (searchParams.get("step") || searchParams.get("journeyStepSlug") || "").trim();
    if (!journeyStepId && stepSlug) {
      const jcol = await getJourneyStepsCollection();
      const st = await jcol.findOne({ slug: stepSlug.toLowerCase() });
      if (st) journeyStepId = st._id.toString();
    }
    const item_type = searchParams.get("item_type");
    const status = searchParams.get("status");
    const q = (searchParams.get("q") || searchParams.get("search") || "").trim();

    const { page, limit, skip } = parsePagination(searchParams, {
      defaultLimit: 100,
      maxLimit: MAX_ADMIN_ITEMS_LIMIT,
    });
    const { sort } = parseSort(searchParams, ITEM_SORT, "updated_at", "desc");

    const col = await getItemsCollection();
    const filter = {};
    if (vendorId) filter.vendor_id = vendorId;
    if (categoryId) filter.category_id = categoryId;
    if (subcategoryId) filter.subcategory_id = subcategoryId;
    if (journeyStepId) filter.journey_step_id = journeyStepId;
    if (item_type) filter.item_type = item_type;
    if (status) filter.status = status;
    if (q) {
      const rx = { $regex: escapeRegex(q), $options: "i" };
      filter.$or = [{ name: rx }, { slug: rx }, { description: rx }, { location_city: rx }];
    }

    const total = await col.countDocuments(filter);
    const items = await col.find(filter).sort(sort).skip(skip).limit(limit).toArray();
    const list = items.map((i) => ({ ...i, item_id: i._id.toString() }));
    return NextResponse.json({ items: list, total, page, limit });
  } catch (e) {
    return NextResponse.json({ code: "INTERNAL_ERROR", message: e.message }, { status: 500 });
  }
}

export async function POST(request) {
  const err = requireAdmin(request);
  if (err) return err;
  try {
    const body = await request.json();
    const col = await getItemsCollection();
    const journeyStepId = body.journeyStepId || body.journey_step_id;
    const categoryId = body.categoryId || body.category_id;
    const subcategoryId = body.subcategoryId || body.subcategory_id || null;
    const vendorId = body.vendorId || body.vendor_id;
    if (!journeyStepId || !categoryId || !vendorId) {
      return NextResponse.json(
        { code: "BAD_REQUEST", message: "journey_step_id, category_id, vendor_id are required" },
        { status: 400 }
      );
    }

    const listingStartAt = body.listing_start_at || body.listingStartAt || null;
    const listingEndAt = body.listing_end_at || body.listingEndAt || null;
    const discount = body.discount || {};
    const policies = body.policies || {};

    const doc = {
      vendor_id: vendorId,
      journey_step_id: journeyStepId,
      category_id: categoryId,
      subcategory_id: subcategoryId,
      name: body.name || "",
      slug: body.slug || (body.name || "").toLowerCase().replace(/\s+/g, "-") || "",
      description: body.description || null,
      images: Array.isArray(body.images) ? body.images : [],
      price: Number(body.price) || 0,
      item_type: body.itemType || body.item_type || "Product",
      category_tag: body.categoryTag || body.category_tag || null,
      location: body.location || null,
      location_city: body.locationCity || body.location_city || null,
      capacity: body.capacity ?? null,
      min_budget: body.minBudget ?? body.min_budget ?? null,
      max_budget: body.maxBudget ?? body.max_budget ?? null,
      listing_start_at: listingStartAt ? new Date(listingStartAt) : null,
      listing_end_at: listingEndAt ? new Date(listingEndAt) : null,
      policies: {
        cancellable: policies.cancellable !== false,
        refundable: policies.refundable === true,
        returnable: !!policies.returnable,
        replaceable: !!policies.replaceable,
        exchangeable: !!policies.exchangeable,
        cancellation_window_hours: Number(policies.cancellation_window_hours) || 24,
        refund_window_days: Number(policies.refund_window_days) || 0,
        return_window_days: policies.return_window_days ?? null,
        return_policy_text: policies.return_policy_text ?? null,
        exchange_policy_text: policies.exchange_policy_text ?? null,
        damage_policy_text: policies.damage_policy_text ?? null,
      },
      discount: {
        is_enabled: discount.is_enabled === true,
        percentage: Number(discount.percentage) || 0,
        starts_at: discount.starts_at ? new Date(discount.starts_at) : null,
        ends_at: discount.ends_at ? new Date(discount.ends_at) : null,
      },
      status: body.status || "Active",
      created_at: new Date(),
      updated_at: new Date(),
    };
    const result = await col.insertOne(doc);
    const itemId = result.insertedId.toString();
    return NextResponse.json(
      { itemId, message: "Item created", item: { ...doc, _id: result.insertedId, item_id: itemId } },
      { status: 201 }
    );
  } catch (e) {
    return NextResponse.json({ code: "INTERNAL_ERROR", message: e.message }, { status: 500 });
  }
}
