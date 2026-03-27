import { NextResponse } from "next/server";
import { ObjectId } from "mongodb";
import { getJourneyStepsCollection } from "@/lib/db";

export async function GET(request, { params }) {
  try {
    const { stepId } = await params;
    const col = await getJourneyStepsCollection();

    let step = null;
    if (ObjectId.isValid(stepId)) {
      step = await col.findOne({ _id: new ObjectId(stepId), is_active: { $ne: false } });
    }
    if (!step) {
      step = await col.findOne({ slug: stepId, is_active: { $ne: false } });
    }
    if (!step) return NextResponse.json({ code: "NOT_FOUND", message: "Step not found" }, { status: 404 });

    return NextResponse.json({ ...step, step_id: step._id.toString() });
  } catch (e) {
    return NextResponse.json({ code: "INTERNAL_ERROR", message: e.message }, { status: 500 });
  }
}

