import { NextResponse } from "next/server";
import { ObjectId } from "mongodb";
import { requireAdmin } from "@/lib/auth";
import { getItemsCollection, getVariantsCollection } from "@/lib/db";

export async function POST(request, { params }) {
  const err = requireAdmin(request);
  if (err) return err;
  try {
    const { itemId } = await params;
    if (!ObjectId.isValid(itemId)) {
      return NextResponse.json({ code: "NOT_FOUND", message: "Item not found" }, { status: 404 });
    }
    const itemCol = await getItemsCollection();
    const item = await itemCol.findOne({ _id: new ObjectId(itemId) });
    if (!item) return NextResponse.json({ code: "NOT_FOUND", message: "Item not found" }, { status: 404 });
    const body = await request.json();
    const varCol = await getVariantsCollection();
    const doc = {
      item_id: itemId,
      sku: body.sku || `SKU-${itemId.slice(-8)}`,
      size: body.size || null,
      color: body.color || null,
      price: Number(body.price) ?? item.price ?? 0,
      stock_quantity: Number(body.stockQuantity ?? body.stock_quantity) || 0,
      low_stock_threshold: body.lowStockThreshold ?? body.low_stock_threshold ?? null,
      is_active: true,
      created_at: new Date(),
      updated_at: new Date(),
    };
    const result = await varCol.insertOne(doc);
    const variantId = result.insertedId.toString();
    return NextResponse.json(
      { variantId, message: "Variant created", variant: { ...doc, _id: result.insertedId, variant_id: variantId } },
      { status: 201 }
    );
  } catch (e) {
    return NextResponse.json({ code: "INTERNAL_ERROR", message: e.message }, { status: 500 });
  }
}
