import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth";
import { getCategoriesCollection, getJourneyStepsCollection } from "@/lib/db";
import { escapeRegex, parsePagination, parseSort } from "@/lib/adminListQuery";

const SORT_FIELDS = ["name", "slug", "updated_at", "created_at", "is_active"];

export async function GET(request) {
  const err = requireAdmin(request);
  if (err) return err;
  try {
    const { searchParams } = new URL(request.url);
    let journeyStepId = searchParams.get("journeyStepId") || searchParams.get("journey_step_id") || "";
    const stepSlug = (searchParams.get("step") || searchParams.get("journeyStepSlug") || "").trim();
    if (!journeyStepId && stepSlug) {
      const jcol = await getJourneyStepsCollection();
      const st = await jcol.findOne({ slug: stepSlug.toLowerCase() });
      if (st) journeyStepId = st._id.toString();
    }
    const parentCategoryId = searchParams.get("parentCategoryId") || searchParams.get("parent_category_id");
    const searchQ = (searchParams.get("q") || searchParams.get("search") || "").trim();
    const col = await getCategoriesCollection();
    const filter = {};
    if (journeyStepId) filter.journey_step_id = journeyStepId;
    if (searchQ) {
      const rx = { $regex: escapeRegex(searchQ), $options: "i" };
      filter.$or = [{ name: rx }, { slug: rx }];
    }
    if (parentCategoryId !== null) {
      if (parentCategoryId === "" || parentCategoryId === "null") filter.parent_category_id = null;
      else filter.parent_category_id = parentCategoryId;
    }

    const { sort } = parseSort(searchParams, SORT_FIELDS, "name", "asc");

    let list;
    let total;
    let page = 1;
    let limit;

    if (searchQ) {
      const p = parsePagination(searchParams, { defaultLimit: 50, maxLimit: 200 });
      page = p.page;
      limit = p.limit;
      total = await col.countDocuments(filter);
      list = await col.find(filter).sort(sort).skip(p.skip).limit(p.limit).toArray();
    } else {
      limit = Math.min(Math.max(Number(searchParams.get("limit")) || 2000, 1), 2000);
      total = await col.countDocuments(filter);
      list = await col.find(filter).sort(sort).limit(limit).toArray();
    }

    const out = list.map((c) => ({ ...c, category_id: c._id.toString() }));
    return NextResponse.json({ categories: out, total, page, limit });
  } catch (e) {
    return NextResponse.json({ code: "INTERNAL_ERROR", message: e.message }, { status: 500 });
  }
}

export async function POST(request) {
  const err = requireAdmin(request);
  if (err) return err;
  try {
    const body = await request.json();
    const col = await getCategoriesCollection();
    const journeyStepId = body.journeyStepId || body.journey_step_id;
    if (!journeyStepId) {
      return NextResponse.json(
        { code: "BAD_REQUEST", message: "journey_step_id (journeyStepId) is required" },
        { status: 400 }
      );
    }
    const parentCategoryId = body.parentCategoryId ?? body.parent_category_id ?? null;
    const imageUrl = body.image_url || body.imageUrl || null;
    if (!parentCategoryId && !String(imageUrl || "").trim()) {
      return NextResponse.json(
        { code: "BAD_REQUEST", message: "Image is required for top-level category" },
        { status: 400 }
      );
    }
    const doc = {
      journey_step_id: journeyStepId,
      name: body.name || "",
      slug: body.slug || (body.name || "").toLowerCase().replace(/\s+/g, "-") || "",
      description: body.description || null,
      parent_category_id: parentCategoryId || null,
      image_url: imageUrl,
      is_active: body.is_active !== false,
      created_at: new Date(),
      updated_at: new Date(),
    };
    const result = await col.insertOne(doc);
    const categoryId = result.insertedId.toString();
    return NextResponse.json(
      { categoryId, message: "Category created", category: { ...doc, _id: result.insertedId, category_id: categoryId } },
      { status: 201 }
    );
  } catch (e) {
    return NextResponse.json({ code: "INTERNAL_ERROR", message: e.message }, { status: 500 });
  }
}
