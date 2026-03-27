import { NextResponse } from "next/server";
import { ObjectId } from "mongodb";
import { requireAdmin } from "@/lib/auth";
import { getItemsCollection, getVariantsCollection } from "@/lib/db";

export async function GET(request, { params }) {
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
    const varCol = await getVariantsCollection();
    const variants = await varCol.find({ item_id: itemId }).toArray();
    const variantList = variants.map((v) => ({ ...v, variant_id: v._id.toString() }));
    return NextResponse.json({ ...item, item_id: item._id.toString(), variants: variantList });
  } catch (e) {
    return NextResponse.json({ code: "INTERNAL_ERROR", message: e.message }, { status: 500 });
  }
}

export async function PUT(request, { params }) {
  const err = requireAdmin(request);
  if (err) return err;
  try {
    const { itemId } = await params;
    if (!ObjectId.isValid(itemId)) {
      return NextResponse.json({ code: "NOT_FOUND", message: "Item not found" }, { status: 404 });
    }
    const body = await request.json();
    const itemCol = await getItemsCollection();
    const keys = [
      "name",
      "description",
      "price",
      "item_type",
      "category_tag",
      "location",
      "location_city",
      "capacity",
      "min_budget",
      "max_budget",
      "status",
      "vendor_id",
      "journey_step_id",
      "category_id",
      "subcategory_id",
      "listing_start_at",
      "listing_end_at",
      "policies",
      "discount",
    ];
    const update = { updated_at: new Date() };
    keys.forEach((k) => {
      if (body[k] !== undefined) update[k] = body[k];
      const camel = k.replace(/_([a-z])/g, (_, l) => l.toUpperCase());
      if (body[camel] !== undefined) update[k] = body[camel];
    });
    const result = await itemCol.findOneAndUpdate(
      { _id: new ObjectId(itemId) },
      { $set: update },
      { returnDocument: "after" }
    );
    if (!result) return NextResponse.json({ code: "NOT_FOUND", message: "Item not found" }, { status: 404 });
    return NextResponse.json({ message: "Item updated", item: { ...result, item_id: result._id.toString() } });
  } catch (e) {
    return NextResponse.json({ code: "INTERNAL_ERROR", message: e.message }, { status: 500 });
  }
}

export async function DELETE(request, { params }) {
  const err = requireAdmin(request);
  if (err) return err;
  try {
    const { itemId } = await params;
    if (!ObjectId.isValid(itemId)) {
      return NextResponse.json({ code: "NOT_FOUND", message: "Item not found" }, { status: 404 });
    }
    const itemCol = await getItemsCollection();
    const result = await itemCol.findOneAndDelete({ _id: new ObjectId(itemId) });
    if (!result) return NextResponse.json({ code: "NOT_FOUND", message: "Item not found" }, { status: 404 });
    const varCol = await getVariantsCollection();
    await varCol.deleteMany({ item_id: itemId });
    return NextResponse.json({ message: "Item deleted" });
  } catch (e) {
    return NextResponse.json({ code: "INTERNAL_ERROR", message: e.message }, { status: 500 });
  }
}
