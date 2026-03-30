import { NextResponse } from "next/server";
import { ObjectId } from "mongodb";
import { requireAdmin } from "@/lib/auth";
import { getJourneyStepsCollection } from "@/lib/db";

export async function GET(request, { params }) {
  const err = requireAdmin(request);
  if (err) return err;
  try {
    const { stepId } = await params;
    if (!ObjectId.isValid(stepId)) {
      return NextResponse.json({ code: "NOT_FOUND", message: "Step not found" }, { status: 404 });
    }
    const col = await getJourneyStepsCollection();
    const step = await col.findOne({ _id: new ObjectId(stepId) });
    if (!step) return NextResponse.json({ code: "NOT_FOUND", message: "Step not found" }, { status: 404 });
    return NextResponse.json({ ...step, step_id: step._id.toString() });
  } catch (e) {
    return NextResponse.json({ code: "INTERNAL_ERROR", message: e.message }, { status: 500 });
  }
}

export async function PUT(request, { params }) {
  const err = requireAdmin(request);
  if (err) return err;
  try {
    const { stepId } = await params;
    if (!ObjectId.isValid(stepId)) {
      return NextResponse.json({ code: "NOT_FOUND", message: "Step not found" }, { status: 404 });
    }
    const body = await request.json();
    const col = await getJourneyStepsCollection();

    const update = { updated_at: new Date() };
    if (body.title !== undefined) update.title = body.title;
    if (body.subtitle !== undefined) update.subtitle = body.subtitle;
    if (body.icon !== undefined) update.icon = body.icon;
    if (body.image_url !== undefined) update.image_url = body.image_url;
    if (body.default_budget !== undefined) update.default_budget = Number(body.default_budget) || 0;
    if (body.max_budget !== undefined) update.max_budget = Number(body.max_budget) || 0;
    if (body.is_active !== undefined) update.is_active = body.is_active;

    if (update.max_budget !== undefined || update.default_budget !== undefined) {
      const current = await col.findOne({ _id: new ObjectId(stepId) });
      const nextDefault = update.default_budget ?? (Number(current?.default_budget) || 0);
      const nextMax = update.max_budget ?? (Number(current?.max_budget) || 0);
      update.default_budget = Math.max(0, nextDefault);
      update.max_budget = Math.max(update.default_budget, nextMax);
    }

    // slug updates must remain unique
    if (body.slug !== undefined) {
      const slug = String(body.slug || "").trim().toLowerCase();
      if (!slug) return NextResponse.json({ code: "BAD_REQUEST", message: "slug cannot be empty" }, { status: 400 });
      const existing = await col.findOne({ slug, _id: { $ne: new ObjectId(stepId) } });
      if (existing) return NextResponse.json({ code: "BAD_REQUEST", message: "slug already exists" }, { status: 400 });
      update.slug = slug;
    }

    const result = await col.findOneAndUpdate(
      { _id: new ObjectId(stepId) },
      { $set: update },
      { returnDocument: "after" }
    );
    if (!result) return NextResponse.json({ code: "NOT_FOUND", message: "Step not found" }, { status: 404 });
    return NextResponse.json({ message: "Step updated", step: { ...result, step_id: result._id.toString() } });
  } catch (e) {
    return NextResponse.json({ code: "INTERNAL_ERROR", message: e.message }, { status: 500 });
  }
}

export async function DELETE(request, { params }) {
  const err = requireAdmin(request);
  if (err) return err;
  try {
    const { stepId } = await params;
    if (!ObjectId.isValid(stepId)) {
      return NextResponse.json({ code: "NOT_FOUND", message: "Step not found" }, { status: 404 });
    }
    const col = await getJourneyStepsCollection();
    const result = await col.findOneAndDelete({ _id: new ObjectId(stepId) });
    if (!result) return NextResponse.json({ code: "NOT_FOUND", message: "Step not found" }, { status: 404 });
    return NextResponse.json({ message: "Step deleted" });
  } catch (e) {
    return NextResponse.json({ code: "INTERNAL_ERROR", message: e.message }, { status: 500 });
  }
}

