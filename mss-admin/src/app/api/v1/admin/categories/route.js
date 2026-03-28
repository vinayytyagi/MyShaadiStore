import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth";
import { getCategoriesCollection } from "@/lib/db";

export async function GET(request) {
  const err = requireAdmin(request);
  if (err) return err;
  try {
    const { searchParams } = new URL(request.url);
    const journeyStepId = searchParams.get("journeyStepId") || searchParams.get("journey_step_id");
    const parentCategoryId = searchParams.get("parentCategoryId") || searchParams.get("parent_category_id");
    const col = await getCategoriesCollection();
    const filter = {};
    if (journeyStepId) filter.journey_step_id = journeyStepId;
    if (parentCategoryId !== null) {
      if (parentCategoryId === "" || parentCategoryId === "null") filter.parent_category_id = null;
      else filter.parent_category_id = parentCategoryId;
    }
    const list = await col.find(filter).sort({ updated_at: -1, created_at: -1, name: 1 }).toArray();
    const out = list.map((c) => ({ ...c, category_id: c._id.toString() }));
    return NextResponse.json({ categories: out });
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
