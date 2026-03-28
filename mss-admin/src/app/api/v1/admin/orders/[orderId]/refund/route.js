import { NextResponse } from "next/server";
import { ObjectId } from "mongodb";
import { requireAdmin } from "@/lib/auth";
import { getOrdersCollection } from "@/lib/db";
import { createRazorpayRefund } from "@/lib/razorpay";
import { PAYMENT_STATUS, REFUND_STATUS, canRefundOrder, hasRefundableItems } from "@/lib/orderLifecycle";

export async function POST(request, { params }) {
  const err = requireAdmin(request);
  if (err) return err;
  try {
    const { orderId } = await params;
    if (!ObjectId.isValid(orderId)) {
      return NextResponse.json({ code: "NOT_FOUND", message: "Order not found" }, { status: 404 });
    }
    const body = await request.json().catch(() => ({}));
    const requestedAmount = Number(body.amount);
    const reason = String(body.reason || "").trim() || "admin_refund";

    const col = await getOrdersCollection();
    const order = await col.findOne({ _id: new ObjectId(orderId) });
    if (!order) {
      return NextResponse.json({ code: "NOT_FOUND", message: "Order not found" }, { status: 404 });
    }
    if (!order.razorpay_payment_id) {
      return NextResponse.json({ code: "BAD_REQUEST", message: "Razorpay payment not available for refund" }, { status: 400 });
    }
    if (!hasRefundableItems(order)) {
      return NextResponse.json({ code: "BAD_REQUEST", message: "No refundable items in this order" }, { status: 400 });
    }
    if (!canRefundOrder(order)) {
      return NextResponse.json({ code: "BAD_REQUEST", message: "Order is not eligible for refund" }, { status: 400 });
    }

    const maxAmount = Number(order.total_amount) || 0;
    const refundAmount = requestedAmount > 0 ? Math.min(requestedAmount, maxAmount) : maxAmount;
    if (refundAmount <= 0) {
      return NextResponse.json({ code: "BAD_REQUEST", message: "Invalid refund amount" }, { status: 400 });
    }

    const refund = await createRazorpayRefund(order.razorpay_payment_id, Math.round(refundAmount * 100), {
      order_number: order.order_number,
      reason,
    });

    const mappedStatus = refund?.status === "processed" ? REFUND_STATUS.PROCESSED : REFUND_STATUS.PROCESSING;
    const paymentStatus = mappedStatus === REFUND_STATUS.PROCESSED ? PAYMENT_STATUS.REFUNDED : PAYMENT_STATUS.REFUND_PENDING;

    const updated = await col.findOneAndUpdate(
      { _id: new ObjectId(orderId) },
      {
        $set: {
          payment_status: paymentStatus,
          refund: {
            refund_id: refund?.id || null,
            amount: refundAmount,
            reason,
            status: mappedStatus,
            requested_at: new Date(),
            processed_at: mappedStatus === REFUND_STATUS.PROCESSED ? new Date() : null,
            gateway_response: refund || null,
          },
          updated_at: new Date(),
        },
      },
      { returnDocument: "after" }
    );
    return NextResponse.json({ message: "Refund initiated", order: { ...updated, order_id: updated._id.toString() } });
  } catch (e) {
    return NextResponse.json({ code: "INTERNAL_ERROR", message: e.message }, { status: 500 });
  }
}
