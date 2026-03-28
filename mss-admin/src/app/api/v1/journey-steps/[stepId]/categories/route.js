import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth";
import { getCategoriesCollection, getJourneyStepsCollection } from "@/lib/db";
import { ObjectId } from "mongodb";

async function resolveStepId(stepIdOrSlug) {
  const stepsCol = await getJourneyStepsCollection();
  if (ObjectId.isValid(stepIdOrSlug)) return stepIdOrSlug;
  const step = await stepsCol.findOne({ slug: stepIdOrSlug });
  return step?._id?.toString() || null;
}

export async function GET(request, { params }) {
  try {
    const { stepId } = await params;
    const resolved = await resolveStepId(stepId);
    if (!resolved) return NextResponse.json({ code: "NOT_FOUND", message: "Step not found" }, { status: 404 });

    const { searchParams } = new URL(request.url);
    const parentCategoryId = searchParams.get("parentCategoryId") || searchParams.get("parent_category_id");

    const col = await getCategoriesCollection();
    const filter = { journey_step_id: resolved, is_active: { $ne: false } };
    if (parentCategoryId !== null) {
      if (parentCategoryId === "" || parentCategoryId === "null") filter.parent_category_id = null;
      else filter.parent_category_id = parentCategoryId;
    }
    const list = await col
      .find(filter)
      .sort({ updated_at: -1, created_at: -1, name: 1 })
      .toArray();
    const out = list.map((c) => ({ ...c, category_id: c._id.toString() }));
    return NextResponse.json(out);
  } catch (e) {
    return NextResponse.json({ code: "INTERNAL_ERROR", message: e.message }, { status: 500 });
  }
}

// Admin convenience: allow creating categories from this endpoint too (admin token required).
export async function POST(request, { params }) {
  const err = requireAdmin(request);
  if (err) return err;
  try {
    const { stepId } = await params;
    const resolved = await resolveStepId(stepId);
    if (!resolved) return NextResponse.json({ code: "NOT_FOUND", message: "Step not found" }, { status: 404 });

    const body = await request.json();
    const name = (body.name || "").trim();
    if (!name) {
      return NextResponse.json({ code: "BAD_REQUEST", message: "Category name required" }, { status: 400 });
    }

    const col = await getCategoriesCollection();
    const parentCategoryId = body.parentCategoryId ?? body.parent_category_id ?? null;
    const imageUrl = body.image_url || body.imageUrl || null;
    if (!parentCategoryId && !String(imageUrl || "").trim()) {
      return NextResponse.json(
        { code: "BAD_REQUEST", message: "Image is required for top-level category" },
        { status: 400 }
      );
    }
    const doc = {
      journey_step_id: resolved,
      name,
      slug: body.slug || name.toLowerCase().replace(/\s+/g, "-"),
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

