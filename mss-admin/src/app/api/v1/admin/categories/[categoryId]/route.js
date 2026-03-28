import { NextResponse } from "next/server";
import { ObjectId } from "mongodb";
import { requireAdmin } from "@/lib/auth";
import { getCategoriesCollection } from "@/lib/db";

export async function GET(request, { params }) {
  const err = requireAdmin(request);
  if (err) return err;
  try {
    const { categoryId } = await params;
    if (!ObjectId.isValid(categoryId)) {
      return NextResponse.json({ code: "NOT_FOUND", message: "Category not found" }, { status: 404 });
    }
    const col = await getCategoriesCollection();
    const category = await col.findOne({ _id: new ObjectId(categoryId) });
    if (!category) return NextResponse.json({ code: "NOT_FOUND", message: "Category not found" }, { status: 404 });
    return NextResponse.json({ ...category, category_id: category._id.toString() });
  } catch (e) {
    return NextResponse.json({ code: "INTERNAL_ERROR", message: e.message }, { status: 500 });
  }
}

export async function PUT(request, { params }) {
  const err = requireAdmin(request);
  if (err) return err;
  try {
    const { categoryId } = await params;
    if (!ObjectId.isValid(categoryId)) {
      return NextResponse.json({ code: "NOT_FOUND", message: "Category not found" }, { status: 404 });
    }
    const body = await request.json();
    const col = await getCategoriesCollection();
    const existing = await col.findOne({ _id: new ObjectId(categoryId) });
    if (!existing) {
      return NextResponse.json({ code: "NOT_FOUND", message: "Category not found" }, { status: 404 });
    }
    const update = { updated_at: new Date() };
    if (body.name !== undefined) update.name = body.name;
    if (body.slug !== undefined) update.slug = body.slug;
    if (body.description !== undefined) update.description = body.description;
    if (body.journeyStepId !== undefined) update.journey_step_id = body.journeyStepId;
    if (body.journey_step_id !== undefined) update.journey_step_id = body.journey_step_id;
    if (body.parentCategoryId !== undefined) update.parent_category_id = body.parentCategoryId;
    if (body.parent_category_id !== undefined) update.parent_category_id = body.parent_category_id;
    if (body.image_url !== undefined) update.image_url = body.image_url;
    if (body.is_active !== undefined) update.is_active = body.is_active;
    const nextParent =
      update.parent_category_id !== undefined ? update.parent_category_id : existing.parent_category_id;
    const nextImage = update.image_url !== undefined ? update.image_url : existing.image_url;
    if (!nextParent && !String(nextImage || "").trim()) {
      return NextResponse.json(
        { code: "BAD_REQUEST", message: "Image is required for top-level category" },
        { status: 400 }
      );
    }
    const result = await col.findOneAndUpdate(
      { _id: new ObjectId(categoryId) },
      { $set: update },
      { returnDocument: "after" }
    );
    return NextResponse.json({ message: "Category updated", category: { ...result, category_id: result._id.toString() } });
  } catch (e) {
    return NextResponse.json({ code: "INTERNAL_ERROR", message: e.message }, { status: 500 });
  }
}

export async function DELETE(request, { params }) {
  const err = requireAdmin(request);
  if (err) return err;
  try {
    const { categoryId } = await params;
    if (!ObjectId.isValid(categoryId)) {
      return NextResponse.json({ code: "NOT_FOUND", message: "Category not found" }, { status: 404 });
    }
    const col = await getCategoriesCollection();
    const result = await col.findOneAndDelete({ _id: new ObjectId(categoryId) });
    if (!result) return NextResponse.json({ code: "NOT_FOUND", message: "Category not found" }, { status: 404 });
    return NextResponse.json({ message: "Category deleted" });
  } catch (e) {
    return NextResponse.json({ code: "INTERNAL_ERROR", message: e.message }, { status: 500 });
  }
}
