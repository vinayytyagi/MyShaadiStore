import { NextResponse } from "next/server";
import { signToken } from "@/lib/auth";
import { getUsersCollection } from "@/lib/db";
import { normalizePhone, sanitizeUser, verifyVerificationToken } from "@/lib/userAuth";

/**
 * Progressive save endpoint - saves partial signup data at each step
 * This allows saving user data progressively without completing the full signup
 */
export async function POST(request) {
  try {
    const body = await request.json();
    let phone = null;
    
    // Check if we have a verification token or just saving initial data
    const verification_token = body?.verification_token || body?.verificationToken;
    
    if (verification_token) {
      const decoded = verifyVerificationToken(verification_token, "signup");
      phone = normalizePhone(decoded.phone);
    } else if (body.phone) {
      // Allow saving initial name and phone without verification token
      phone = normalizePhone(body.phone);
    }
    
    if (!phone || phone.length < 10) {
      return NextResponse.json(
        { code: "BAD_REQUEST", message: "Valid phone number required" },
        { status: 400 }
      );
    }
    
    const col = await getUsersCollection();

    // Build update object dynamically based on what's provided
    const update = {
      phone,
      updated_at: new Date(),
    };

    // Save name if provided
    if (body.name !== undefined && body.name !== null) {
      update.name = String(body.name).trim();
    }

    // Save onboarding data if provided
    if (body.onboarding !== undefined && body.onboarding !== null) {
      const { honeymoon_status, honeymoon_destination, ...cleanOnboarding } = body.onboarding;
      update.onboarding = cleanOnboarding;
    }

    // Save engagement_status separately for easy access
    if (body.engagement_status !== undefined) {
      if (!update.onboarding) update.onboarding = {};
      update.onboarding.engagement_status = body.engagement_status;
    }

    // Save wedding_date_type and related fields
    if (body.wedding_date_type !== undefined) {
      if (!update.onboarding) update.onboarding = {};
      update.onboarding.wedding_date_type = body.wedding_date_type;
    }

    if (body.wedding_date !== undefined) {
      if (!update.onboarding) update.onboarding = {};
      update.onboarding.wedding_date = body.wedding_date;
    }

    if (body.wedding_month !== undefined) {
      if (!update.onboarding) update.onboarding = {};
      update.onboarding.wedding_month = body.wedding_month;
    }

    // Save venue_location
    if (body.venue_location !== undefined) {
      if (!update.onboarding) update.onboarding = {};
      update.onboarding.venue_location = body.venue_location;
    }

    // Save guests_count
    if (body.guests_count !== undefined) {
      if (!update.onboarding) update.onboarding = {};
      update.onboarding.guests_count = Number(body.guests_count) || null;
    }

    // Save budget data
    if (body.budget_total !== undefined) {
      if (!update.onboarding) update.onboarding = {};
      update.onboarding.budget_total = Number(body.budget_total) || 0;
    }

    if (body.budget_allocations !== undefined && Array.isArray(body.budget_allocations)) {
      if (!update.onboarding) update.onboarding = {};
      update.onboarding.budget_allocations = body.budget_allocations.map((item) => ({
        step_id: item.step_id || "",
        slug: item.slug || "",
        title: item.title || "",
        amount: Number(item.amount) || 0,
        max_budget: Number(item.max_budget || item.maxBudget) || 0,
      }));
    }

    // Check if user exists
    const existingUser = await col.findOne({ phone });

    let user;
    if (existingUser) {
      // Update existing partial signup
      await col.updateOne(
        { phone },
        {
          $set: update,
          $setOnInsert: {
            created_at: new Date(),
          },
        },
        { upsert: true }
      );
      user = await col.findOne({ phone });
    } else {
      // Create new partial signup record
      const newUser = {
        ...update,
        created_at: new Date(),
        completed_signup: false,
        status: "Partial",
      };
      
      await col.insertOne(newUser);
      user = await col.findOne({ phone });
    }

    // If password is provided, this is the final save
    if (body.password && String(body.password).length >= 6) {
      const bcrypt = await import("bcryptjs");
      const passwordHash = await bcrypt.default.hash(String(body.password), 10);
      
      await col.updateOne(
        { phone },
        {
          $set: {
            passwordHash,
            status: "Active",
            completed_signup: true,
            updated_at: new Date(),
          },
        }
      );

      user = await col.findOne({ phone });
      const token = signToken({
        type: "customer",
        userId: user._id.toString(),
        phone,
      });

      return NextResponse.json({
        message: "Signup completed successfully",
        token,
        user: sanitizeUser(user),
        completed: true,
      });
    }

    // Return partial save success
    return NextResponse.json({
      message: "Progress saved successfully",
      user: sanitizeUser(user),
      completed: false,
    });
  } catch (e) {
    console.error("[POST /api/v1/auth/user/progressive-save]", e);
    return NextResponse.json({ code: "INTERNAL_ERROR", message: e.message }, { status: 500 });
  }
}
