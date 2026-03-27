import bcrypt from "bcryptjs";
import { NextResponse } from "next/server";
import { signToken } from "@/lib/auth";
import { getUsersCollection } from "@/lib/db";
import { normalizePhone, sanitizeUser, verifyVerificationToken } from "@/lib/userAuth";

export async function POST(request) {
  try {
    const body = await request.json();
    const verificationToken = body?.verification_token || body?.verificationToken;
    const password = String(body?.password || "");
    const name = String(body?.name || "").trim();

    if (!verificationToken) {
      return NextResponse.json(
        { code: "BAD_REQUEST", message: "Verification token required" },
        { status: 400 }
      );
    }

    if (password.length < 6) {
      return NextResponse.json(
        { code: "BAD_REQUEST", message: "Password must be at least 6 characters" },
        { status: 400 }
      );
    }

    if (!name) {
      return NextResponse.json(
        { code: "BAD_REQUEST", message: "Name is required" },
        { status: 400 }
      );
    }

    const decoded = verifyVerificationToken(verificationToken, "signup");
    const phone = normalizePhone(decoded.phone);
    const col = await getUsersCollection();

    const onboarding = {
      engagement_status: body.engagement_status || body.engagementStatus || null,
      wedding_date_type: body.wedding_date_type || body.weddingDateType || null,
      wedding_date: body.wedding_date || body.weddingDate || null,
      wedding_month: body.wedding_month || body.weddingMonth || null,
      budget_total: Number(body.budget_total ?? body.budgetTotal) || 0,
      budget_allocations: Array.isArray(body.budget_allocations || body.budgetAllocations)
        ? (body.budget_allocations || body.budgetAllocations).map((item) => ({
            step_id: item.step_id || item.stepId || "",
            slug: item.slug || "",
            title: item.title || "",
            amount: Number(item.amount) || 0,
            max_budget: Number(item.max_budget || item.maxBudget) || 0,
          }))
        : [],
      venue_location: body.venue_location || body.venueLocation || null,
      guests_count: Number(body.guests_count ?? body.guestsCount) || null,
    };

    const passwordHash = await bcrypt.hash(password, 10);

    await col.updateOne(
      { phone },
      {
        $set: {
          name,
          phone,
          passwordHash,
          status: "Active",
          onboarding,
          completed_signup: true,
          updated_at: new Date(),
        },
        $setOnInsert: {
          created_at: new Date(),
        },
      },
      { upsert: true }
    );

    const user = await col.findOne({ phone });
    const token = signToken({
      type: "customer",
      userId: user._id.toString(),
      phone,
    });

    return NextResponse.json({
      message: "Signup completed",
      token,
      user: sanitizeUser(user),
    });
  } catch (e) {
    return NextResponse.json({ code: "INTERNAL_ERROR", message: e.message }, { status: 500 });
  }
}
