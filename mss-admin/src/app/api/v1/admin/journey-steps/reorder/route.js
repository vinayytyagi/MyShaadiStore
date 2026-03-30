import { NextResponse } from "next/server";
import { ObjectId } from "mongodb";
import { requireAdmin } from "@/lib/auth";
import { getJourneyStepsCollection } from "@/lib/db";

/**
 * POST { "stepIds": ["id1", "id2", ...] } — full ordered list; sets order = index.
 */
export async function POST(request) {
  const err = requireAdmin(request);
  if (err) return err;
  try {
    const body = await request.json();
    const stepIds = body.stepIds || body.step_ids;
    if (!Array.isArray(stepIds) || stepIds.length === 0) {
      return NextResponse.json({ code: "BAD_REQUEST", message: "stepIds array required" }, { status: 400 });
    }
    const col = await getJourneyStepsCollection();
    const now = new Date();
    for (let i = 0; i < stepIds.length; i++) {
      const id = stepIds[i];
      if (!ObjectId.isValid(id)) {
        return NextResponse.json({ code: "BAD_REQUEST", message: `Invalid step id: ${id}` }, { status: 400 });
      }
      const r = await col.updateOne({ _id: new ObjectId(id) }, { $set: { order: i, updated_at: now } });
      if (r.matchedCount === 0) {
        return NextResponse.json({ code: "BAD_REQUEST", message: `Step not found: ${id}` }, { status: 400 });
      }
    }
    return NextResponse.json({ message: "Order updated", count: stepIds.length });
  } catch (e) {
    return NextResponse.json({ code: "INTERNAL_ERROR", message: e.message }, { status: 500 });
  }
}
