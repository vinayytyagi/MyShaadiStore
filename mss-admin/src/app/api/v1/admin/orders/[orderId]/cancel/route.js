import { NextResponse } from "next/server";
import { ObjectId } from "mongodb";
import { requireAdmin } from "@/lib/auth";
import { getOrdersCollection } from "@/lib/db";
import { ORDER_STATUS, canCancelOrder, hasCancellableItems } from "@/lib/orderLifecycle";

export async function POST(request, { params }) {
  const err = requireAdmin(request);
  if (err) return err;
  try {
    const { orderId } = await params;
    if (!ObjectId.isValid(orderId)) {
      return NextResponse.json({ code: "NOT_FOUND", message: "Order not found" }, { status: 404 });
    }
    const body = await request.json().catch(() => ({}));
    const reason = String(body.reason || "").trim() || "Cancelled by admin";
    const col = await getOrdersCollection();
    const current = await col.findOne({ _id: new ObjectId(orderId) });
    if (!current) {
      return NextResponse.json({ code: "NOT_FOUND", message: "Order not found" }, { status: 404 });
    }
    if (!hasCancellableItems(current)) {
      return NextResponse.json({ code: "BAD_REQUEST", message: "No cancellable items in this order" }, { status: 400 });
    }
    if (!canCancelOrder(current)) {
      return NextResponse.json(
        { code: "BAD_REQUEST", message: `Order cannot be cancelled from status '${current.status}'` },
        { status: 400 }
      );
    }
    const cancellation = {
      status: "Approved",
      requested_by: "admin",
      reason,
      requested_at: new Date(),
      approved_at: new Date(),
    };
    const updated = await col.findOneAndUpdate(
      { _id: new ObjectId(orderId) },
      {
        $set: {
          status: ORDER_STATUS.CANCELLED,
          cancellation,
          updated_at: new Date(),
        },
      },
      { returnDocument: "after" }
    );
    return NextResponse.json({ message: "Order cancelled", order: { ...updated, order_id: updated._id.toString() } });
  } catch (e) {
    return NextResponse.json({ code: "INTERNAL_ERROR", message: e.message }, { status: 500 });
  }
}
