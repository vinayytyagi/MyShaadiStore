import { NextResponse } from "next/server";
import { getOrdersCollection } from "@/lib/db";
import { verifyPaymentSignature } from "@/lib/razorpay";
import { ORDER_STATUS, PAYMENT_STATUS } from "@/lib/orderLifecycle";

/**
 * POST /api/v1/orders/verify-payment
 *
 * Called by the frontend immediately after Razorpay Checkout's
 * `handler` callback fires with a successful payment.
 *
 * Body: { razorpay_order_id, razorpay_payment_id, razorpay_signature }
 *
 * 1. Verify the HMAC signature.
 * 2. Update the MongoDB order → payment_status = "Paid".
 * 3. Return the updated order.
 */
export async function POST(request) {
  try {
    const body = await request.json();
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = body;

    if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
      return NextResponse.json(
        { code: "BAD_REQUEST", message: "Missing razorpay_order_id, razorpay_payment_id or razorpay_signature" },
        { status: 400 }
      );
    }

    /* ── Verify signature ──────────────────────────────── */
    const isValid = verifyPaymentSignature({
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature,
    });

    if (!isValid) {
      return NextResponse.json(
        { code: "PAYMENT_VERIFICATION_FAILED", message: "Invalid payment signature. Payment could not be verified." },
        { status: 400 }
      );
    }

    /* ── Update order in MongoDB ───────────────────────── */
    const col = await getOrdersCollection();
    const updated = await col.findOneAndUpdate(
      { razorpay_order_id },
      {
        $set: {
          payment_status: PAYMENT_STATUS.PAID,
          status: ORDER_STATUS.CONFIRMED,
          razorpay_payment_id,
          razorpay_signature,
          paid_at: new Date(),
          updated_at: new Date(),
        },
      },
      { returnDocument: "after" }
    );

    if (!updated) {
      return NextResponse.json(
        { code: "NOT_FOUND", message: "Order not found for this Razorpay order ID" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      message: "Payment verified successfully. Order confirmed.",
      order: { ...updated, order_id: updated._id.toString() },
    });
  } catch (e) {
    console.error("[POST /api/v1/orders/verify-payment]", e);
    return NextResponse.json({ code: "INTERNAL_ERROR", message: e.message }, { status: 500 });
  }
}
