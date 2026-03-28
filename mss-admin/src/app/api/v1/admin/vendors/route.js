import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { requireAdmin } from "@/lib/auth";
import { getVendorCollection } from "@/lib/db";

function normalizePickupAddresses(input) {
  const list = Array.isArray(input) ? input : [];
  return list
    .map((addr, idx) => ({
      label: String(addr?.label || `Pickup ${idx + 1}`).trim(),
      line1: String(addr?.line1 || "").trim(),
      line2: String(addr?.line2 || "").trim() || null,
      city: String(addr?.city || "").trim(),
      state: String(addr?.state || "").trim(),
      pincode: String(addr?.pincode || "").trim(),
      contact_name: String(addr?.contact_name || "").trim() || null,
      contact_phone: String(addr?.contact_phone || "").trim() || null,
      is_default: addr?.is_default === true,
    }))
    .filter((addr) => addr.line1 && addr.city && addr.state && addr.pincode)
    .map((addr, idx, arr) => ({
      ...addr,
      is_default: arr.some((item) => item.is_default) ? addr.is_default : idx === 0,
    }));
}

export async function GET(request) {
  const err = requireAdmin(request);
  if (err) return err;
  try {
    const { searchParams } = new URL(request.url);
    const status = searchParams.get("status");
    const page = Number(searchParams.get("page")) || 1;
    const limit = Number(searchParams.get("limit")) || 20;
    const col = await getVendorCollection();
    const filter = status ? { status } : {};
    const total = await col.countDocuments(filter);
    const skip = (page - 1) * limit;
    const vendors = await col
      .find(filter)
      .skip(skip)
      .limit(limit)
      .project({ passwordHash: 0 })
      .toArray();
    const list = vendors.map((v) => ({ ...v, vendor_id: v._id.toString() }));
    return NextResponse.json({ vendors: list, total, page, limit });
  } catch (e) {
    return NextResponse.json({ code: "INTERNAL_ERROR", message: e.message }, { status: 500 });
  }
}

export async function POST(request) {
  const err = requireAdmin(request);
  if (err) return err;
  try {
    const body = await request.json();
    const email = (body.email || body.contact_email || body.contactEmail || "").trim().toLowerCase();
    if (!email) {
      return NextResponse.json(
        { code: "BAD_REQUEST", message: "Vendor email required (for login)" },
        { status: 400 }
      );
    }
    const password = body.password || body.plainPassword;
    if (!password || password.length < 6) {
      return NextResponse.json(
        { code: "BAD_REQUEST", message: "Password required (min 6 chars) – admin sets this for vendor login" },
        { status: 400 }
      );
    }
    const col = await getVendorCollection();
    const existing = await col.findOne({ email });
    if (existing) {
      return NextResponse.json(
        { code: "BAD_REQUEST", message: "Vendor with this email already exists" },
        { status: 400 }
      );
    }
    const passwordHash = await bcrypt.hash(password, 10);
    const slug =
      (body.slug || body.businessName || body.business_name || "").toLowerCase().replace(/\s+/g, "-") || "vendor";
    const doc = {
      business_name: body.businessName || body.business_name || "",
      slug,
      description: body.description || null,
      vendor_type: body.vendorType || body.vendor_type || "Venue",
      city: body.city || null,
      state: body.state || null,
      image_url: body.image_url || null,
      contact_email: email,
      contact_phone: body.contactPhone || body.contact_phone || null,
      min_budget: body.minBudget ?? body.min_budget ?? null,
      max_budget: body.maxBudget ?? body.max_budget ?? null,
      commission_percentage: body.commissionPercentage ?? body.commission_percentage ?? null,
      status: body.status || "Active",
      pickup_addresses: normalizePickupAddresses(body.pickup_addresses || body.pickupAddresses),
      email,
      passwordHash,
      created_at: new Date(),
      updated_at: new Date(),
    };
    const result = await col.insertOne(doc);
    const vendorId = result.insertedId.toString();
    const out = { ...doc, _id: result.insertedId, vendor_id: vendorId };
    delete out.passwordHash;
    return NextResponse.json(
      { vendorId, message: "Vendor created", vendor: { ...out, vendor_id: vendorId } },
      { status: 201 }
    );
  } catch (e) {
    return NextResponse.json({ code: "INTERNAL_ERROR", message: e.message }, { status: 500 });
  }
}
