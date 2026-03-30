import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth";
import { getJourneyStepsCollection } from "@/lib/db";
import { escapeRegex, parsePagination, parseSort } from "@/lib/adminListQuery";

const SORT_FIELDS = ["order", "title", "slug", "created_at", "updated_at", "is_active"];

export async function GET(request) {
  const err = requireAdmin(request);
  if (err) return err;
  try {
    const { searchParams } = new URL(request.url);
    const q = (searchParams.get("q") || searchParams.get("search") || "").trim();
    const { page, limit, skip } = parsePagination(searchParams, { defaultLimit: 100, maxLimit: 500 });
    const { sort } = parseSort(searchParams, SORT_FIELDS, "order", "asc");

    const col = await getJourneyStepsCollection();
    const filter = {};
    if (q) {
      const rx = { $regex: escapeRegex(q), $options: "i" };
      filter.$or = [{ title: rx }, { slug: rx }, { subtitle: rx }];
    }

    const total = await col.countDocuments(filter);
    const list = await col.find(filter).sort(sort).skip(skip).limit(limit).toArray();
    const out = list.map((s) => ({ ...s, step_id: s._id.toString() }));
    return NextResponse.json({ steps: out, total, page, limit });
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

    const maxDoc = await col.find({}).sort({ order: -1 }).limit(1).toArray();
    const nextOrder = maxDoc.length ? (Number(maxDoc[0].order) || 0) + 1 : 0;

    const doc = {
      slug,
      title,
      subtitle: body.subtitle || null,
      order: nextOrder,
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
