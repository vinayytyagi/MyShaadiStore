import { NextResponse } from "next/server";
import { ObjectId } from "mongodb";
import { getAuthUser } from "@/lib/auth";
import { getOrdersCollection, getUsersCollection } from "@/lib/db";
import { REFUND_STATUS, canRefundOrder, hasRefundableItems } from "@/lib/orderLifecycle";

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
    const reason = String(body.reason || "").trim() || "Customer requested refund";

    const col = await getOrdersCollection();
    const order = await col.findOne({ _id: new ObjectId(orderId), "customer.phone": user.phone });
    if (!order) {
      return NextResponse.json({ code: "NOT_FOUND", message: "Order not found" }, { status: 404 });
    }
    if (!hasRefundableItems(order)) {
      return NextResponse.json({ code: "BAD_REQUEST", message: "Items in this order are not refundable" }, { status: 400 });
    }
    if (!canRefundOrder(order)) {
      return NextResponse.json({ code: "BAD_REQUEST", message: "This order is not eligible for refund" }, { status: 400 });
    }
    const updated = await col.findOneAndUpdate(
      { _id: new ObjectId(orderId) },
      {
        $set: {
          refund: {
            ...(order.refund || {}),
            status: REFUND_STATUS.REQUESTED,
            reason,
            requested_by: "customer",
            requested_at: new Date(),
          },
          updated_at: new Date(),
        },
      },
      { returnDocument: "after" }
    );
    return NextResponse.json({
      message: "Refund request submitted. Admin will process it.",
      order: { ...updated, order_id: updated._id.toString() },
    });
  } catch (e) {
    return NextResponse.json({ code: "INTERNAL_ERROR", message: e.message }, { status: 500 });
  }
}
