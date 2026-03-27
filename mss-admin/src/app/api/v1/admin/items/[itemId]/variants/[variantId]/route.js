import { NextResponse } from "next/server";
import { ObjectId } from "mongodb";
import { requireAdmin } from "@/lib/auth";
import { getVariantsCollection } from "@/lib/db";

export async function PUT(request, { params }) {
  const err = requireAdmin(request);
  if (err) return err;
  try {
    const { itemId, variantId } = await params;
    if (!ObjectId.isValid(variantId)) {
      return NextResponse.json({ code: "NOT_FOUND", message: "Variant not found" }, { status: 404 });
    }
    const body = await request.json();
    const col = await getVariantsCollection();
    const update = { updated_at: new Date() };
    if (body.stockQuantity !== undefined) update.stock_quantity = body.stockQuantity;
    if (body.stock_quantity !== undefined) update.stock_quantity = body.stock_quantity;
    if (body.price !== undefined) update.price = body.price;
    const result = await col.findOneAndUpdate(
      { _id: new ObjectId(variantId), item_id: itemId },
      { $set: update },
      { returnDocument: "after" }
    );
    if (!result) return NextResponse.json({ code: "NOT_FOUND", message: "Variant not found" }, { status: 404 });
    return NextResponse.json({ message: "Variant updated", variant: { ...result, variant_id: result._id.toString() } });
  } catch (e) {
    return NextResponse.json({ code: "INTERNAL_ERROR", message: e.message }, { status: 500 });
  }
}
