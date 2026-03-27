import { NextResponse } from "next/server";
import { getJourneyStepsCollection } from "@/lib/db";

export async function GET() {
  try {
    const col = await getJourneyStepsCollection();
    const steps = await col
      .find({ is_active: { $ne: false } })
      .sort({ order: 1 })
      .toArray();
    const out = steps.map((s) => ({ ...s, step_id: s._id.toString() }));
    return NextResponse.json(out);
  } catch (e) {
    return NextResponse.json({ code: "INTERNAL_ERROR", message: e.message }, { status: 500 });
  }
}

