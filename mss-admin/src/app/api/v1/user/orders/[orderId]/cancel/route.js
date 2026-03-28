import { NextResponse } from "next/server";
import { ObjectId } from "mongodb";
import { getAuthUser } from "@/lib/auth";
import { getOrdersCollection, getUsersCollection } from "@/lib/db";
import { ORDER_STATUS, canCancelOrder, hasCancellableItems } from "@/lib/orderLifecycle";

export async function POST(request, { params }) {
  try {
    const decoded = getAuthUser(request);
    if (!decoded || decoded.type !== "customer") {
      return NextResponse.json({ code: "UNAUTHORIZED", message: "Login required" }, { status: 401 });
    }
    const { orderId } = await params;
    if (!ObjectId.isValid(orderId)) {
      return NextResponse.json({ code: "NOT_FOUND", message: "Order not found" }, { status: 404 });
    }
    const usersCol = await getUsersCollection();
    const user = await usersCol.findOne({ _id: new ObjectId(decoded.userId) });
    if (!user) {
      return NextResponse.json({ code: "NOT_FOUND", message: "User not found" }, { status: 404 });
    }
    const body = await request.json().catch(() => ({}));
    const reason = String(body.reason || "").trim() || "Cancelled by user";
    const col = await getOrdersCollection();
    const order = await col.findOne({ _id: new ObjectId(orderId), "customer.phone": user.phone });
    if (!order) {
      return NextResponse.json({ code: "NOT_FOUND", message: "Order not found" }, { status: 404 });
    }
    if (!hasCancellableItems(order)) {
      return NextResponse.json({ code: "BAD_REQUEST", message: "Items in this order are not cancellable" }, { status: 400 });
    }
    if (!canCancelOrder(order)) {
      return NextResponse.json({ code: "BAD_REQUEST", message: "This order can no longer be cancelled" }, { status: 400 });
    }
    const updated = await col.findOneAndUpdate(
      { _id: new ObjectId(orderId) },
      {
        $set: {
          status: ORDER_STATUS.CANCELLED,
          cancellation: {
            status: "Approved",
            requested_by: "customer",
            reason,
            requested_at: new Date(),
            approved_at: new Date(),
          },
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
