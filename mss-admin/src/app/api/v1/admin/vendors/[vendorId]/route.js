import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { ObjectId } from "mongodb";
import { requireAdmin } from "@/lib/auth";
import { getVendorCollection } from "@/lib/db";

export async function GET(request, { params }) {
  const err = requireAdmin(request);
  if (err) return err;
  try {
    const { vendorId } = await params;
    if (!ObjectId.isValid(vendorId)) {
      return NextResponse.json({ code: "NOT_FOUND", message: "Vendor not found" }, { status: 404 });
    }
    const col = await getVendorCollection();
    const doc = await col.findOne(
      { _id: new ObjectId(vendorId) },
      { projection: { passwordHash: 0 } }
    );
    if (!doc) return NextResponse.json({ code: "NOT_FOUND", message: "Vendor not found" }, { status: 404 });
    return NextResponse.json({ ...doc, vendor_id: doc._id.toString() });
  } catch (e) {
    return NextResponse.json({ code: "INTERNAL_ERROR", message: e.message }, { status: 500 });
  }
}

export async function PUT(request, { params }) {
  const err = requireAdmin(request);
  if (err) return err;
  try {
    const { vendorId } = await params;
    if (!ObjectId.isValid(vendorId)) {
      return NextResponse.json({ code: "NOT_FOUND", message: "Vendor not found" }, { status: 404 });
    }
    const body = await request.json();
    const col = await getVendorCollection();
    const id = new ObjectId(vendorId);
    const update = { updated_at: new Date() };
    const allowed = [
      "business_name",
      "description",
      "vendor_type",
      "city",
      "state",
      "contact_phone",
      "min_budget",
      "max_budget",
      "commission_percentage",
      "image_url",
      "status",
    ];
    allowed.forEach((k) => {
      if (body[k] !== undefined) update[k] = body[k];
      const camel = k.replace(/_([a-z])/g, (_, l) => l.toUpperCase());
      if (body[camel] !== undefined) update[k] = body[camel];
    });
    if (body.password && body.password.length >= 6) {
      update.passwordHash = await bcrypt.hash(body.password, 10);
    }
    const result = await col.findOneAndUpdate({ _id: id }, { $set: update }, { returnDocument: "after" });
    if (!result) return NextResponse.json({ code: "NOT_FOUND", message: "Vendor not found" }, { status: 404 });
    const out = { ...result, vendor_id: result._id.toString() };
    delete out.passwordHash;
    return NextResponse.json({ message: "Vendor updated", vendor: out });
  } catch (e) {
    return NextResponse.json({ code: "INTERNAL_ERROR", message: e.message }, { status: 500 });
  }
}
