import { NextResponse } from "next/server";
import { ObjectId } from "mongodb";
import { requireAdmin } from "@/lib/auth";
import { getOrdersCollection } from "@/lib/db";
import { ORDER_STATUS } from "@/lib/orderLifecycle";

export async function PUT(request, { params }) {
  const err = requireAdmin(request);
  if (err) return err;
  try {
    const { orderId } = await params;
    if (!ObjectId.isValid(orderId)) {
      return NextResponse.json({ code: "NOT_FOUND", message: "Order not found" }, { status: 404 });
    }
    const body = await request.json();
    const status = body.status;
    const allowed = Object.values(ORDER_STATUS);
    if (!allowed.includes(status)) {
      return NextResponse.json({ code: "BAD_REQUEST", message: "Invalid order status" }, { status: 400 });
    }
    const col = await getOrdersCollection();
    const result = await col.findOneAndUpdate(
      { _id: new ObjectId(orderId) },
      { $set: { status, updated_at: new Date() } },
      { returnDocument: "after" }
    );
    if (!result) return NextResponse.json({ code: "NOT_FOUND", message: "Order not found" }, { status: 404 });
    return NextResponse.json({ message: "Order status updated", order: { ...result, order_id: result._id.toString() } });
  } catch (e) {
    return NextResponse.json({ code: "INTERNAL_ERROR", message: e.message }, { status: 500 });
  }
}
