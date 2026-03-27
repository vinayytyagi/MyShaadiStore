import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth";
import { getItemsCollection } from "@/lib/db";

export async function GET(request) {
  const err = requireAdmin(request);
  if (err) return err;
  try {
    const { searchParams } = new URL(request.url);
    const vendorId = searchParams.get("vendorId");
    const categoryId = searchParams.get("categoryId");
    const subcategoryId = searchParams.get("subcategoryId") || searchParams.get("subcategory_id");
    const journeyStepId = searchParams.get("journeyStepId") || searchParams.get("journey_step_id");
    const item_type = searchParams.get("item_type");
    const status = searchParams.get("status");
    const page = Number(searchParams.get("page")) || 1;
    const limit = Number(searchParams.get("limit")) || 20;
    const col = await getItemsCollection();
    const filter = {};
    if (vendorId) filter.vendor_id = vendorId;
    if (categoryId) filter.category_id = categoryId;
    if (subcategoryId) filter.subcategory_id = subcategoryId;
    if (journeyStepId) filter.journey_step_id = journeyStepId;
    if (item_type) filter.item_type = item_type;
    if (status) filter.status = status;
    const total = await col.countDocuments(filter);
    const skip = (page - 1) * limit;
    const items = await col.find(filter).skip(skip).limit(limit).toArray();
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
        returnable: !!policies.returnable,
        replaceable: !!policies.replaceable,
        exchangeable: !!policies.exchangeable,
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
