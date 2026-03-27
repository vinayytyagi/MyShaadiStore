import { NextResponse } from "next/server";
import { ObjectId } from "mongodb";
import { requireAdmin } from "@/lib/auth";
import { getVendorCollection } from "@/lib/db";

export async function PUT(request, { params }) {
  const err = requireAdmin(request);
  if (err) return err;
  try {
    const { vendorId } = await params;
    if (!ObjectId.isValid(vendorId)) {
      return NextResponse.json({ code: "NOT_FOUND", message: "Vendor not found" }, { status: 404 });
    }
    const col = await getVendorCollection();
    const id = new ObjectId(vendorId);
    const result = await col.findOneAndUpdate(
      { _id: id },
      { $set: { status: "Suspended", updated_at: new Date() } },
      { returnDocument: "after" }
    );
    if (!result) return NextResponse.json({ code: "NOT_FOUND", message: "Vendor not found" }, { status: 404 });
    const out = { ...result, vendor_id: result._id.toString() };
    delete out.passwordHash;
    return NextResponse.json({ message: "Vendor suspended", vendor: out });
  } catch (e) {
    return NextResponse.json({ code: "INTERNAL_ERROR", message: e.message }, { status: 500 });
  }
}
