import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth";
import { getJourneyStepsCollection } from "@/lib/db";

export async function GET(request) {
  const err = requireAdmin(request);
  if (err) return err;
  try {
    const col = await getJourneyStepsCollection();
    const list = await col.find({}).sort({ order: 1 }).toArray();
    const out = list.map((s) => ({ ...s, step_id: s._id.toString() }));
    return NextResponse.json({ steps: out });
  } catch (e) {
    return NextResponse.json({ code: "INTERNAL_ERROR", message: e.message }, { status: 500 });
  }
}

export async function POST(request) {
  const err = requireAdmin(request);
  if (err) return err;
  try {
    const body = await request.json();
    const title = (body.title || "").trim();
    const slug = (body.slug || "").trim().toLowerCase();
    if (!title || !slug) {
      return NextResponse.json({ code: "BAD_REQUEST", message: "title and slug are required" }, { status: 400 });
    }

    const col = await getJourneyStepsCollection();
    const existing = await col.findOne({ slug });
    if (existing) {
      return NextResponse.json({ code: "BAD_REQUEST", message: "slug already exists" }, { status: 400 });
    }

    const doc = {
      slug,
      title,
      subtitle: body.subtitle || null,
      order: Number(body.order) || 0,
      icon: body.icon || null,
      image_url: body.image_url || null,
      default_budget: Number(body.default_budget) || 0,
      max_budget: Math.max(Number(body.max_budget) || 0, Number(body.default_budget) || 0),
      is_active: body.is_active !== false,
      created_at: new Date(),
      updated_at: new Date(),
    };
    const result = await col.insertOne(doc);
    const stepId = result.insertedId.toString();
    return NextResponse.json(
      { stepId, message: "Step created", step: { ...doc, _id: result.insertedId, step_id: stepId } },
      { status: 201 }
    );
  } catch (e) {
    return NextResponse.json({ code: "INTERNAL_ERROR", message: e.message }, { status: 500 });
  }
}

