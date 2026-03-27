import { NextResponse } from "next/server";
import { getOrdersCollection } from "@/lib/db";
import { verifyWebhookSignature } from "@/lib/razorpay";

/**
 * POST /api/v1/orders/razorpay-webhook
 *
 * This is the **primary server-to-server confirmation** from Razorpay.
 * Razorpay calls this webhook on EVERY payment event – it fires automatically
 * for every transaction regardless of what happens on the frontend.
 *
 * Two channels confirm each payment:
 *   1. Frontend /verify-payment  → gives the user instant UI feedback
 *   2. This webhook              → authoritative server-to-server confirmation
 *
 * Both update the same order. The webhook is essential because it runs
 * even if the user closes their browser, loses connection, etc.
 *
 * Configure this URL in Razorpay Dashboard → Settings → Webhooks.
 *
 * Events handled:
 *   - payment.captured  → mark order as Paid + Confirmed
 *   - payment.failed    → mark order as Payment Failed
 *
 * The webhook secret can be the same as RAZORPAY_KEY_SECRET
 * or a dedicated RAZORPAY_WEBHOOK_SECRET env variable.
 */
export async function POST(request) {
  try {
    const rawBody = await request.text();
    const signature = request.headers.get("x-razorpay-signature") || "";
    const webhookSecret = process.env.RAZORPAY_WEBHOOK_SECRET || process.env.RAZORPAY_KEY_SECRET || "";

    /* ── Signature verification ────────────────────────── */
    const isValid = verifyWebhookSignature(rawBody, signature, webhookSecret);
    if (!isValid) {
      console.warn("[razorpay-webhook] Invalid signature – ignoring.");
      return NextResponse.json({ status: "invalid_signature" }, { status: 400 });
    }

    const event = JSON.parse(rawBody);
    const eventType = event?.event;
    const paymentEntity = event?.payload?.payment?.entity;

    if (!paymentEntity) {
      return NextResponse.json({ status: "ignored", reason: "no payment entity" });
    }

    const razorpay_order_id = paymentEntity.order_id;
    const razorpay_payment_id = paymentEntity.id;

    if (!razorpay_order_id) {
      return NextResponse.json({ status: "ignored", reason: "no order_id in payload" });
    }

    const col = await getOrdersCollection();

    /* ── payment.captured ──────────────────────────────── */
    if (eventType === "payment.captured") {
      await col.updateOne(
        { razorpay_order_id },
        {
          $set: {
            payment_status: "Paid",
            status: "Confirmed",
            razorpay_payment_id,
            paid_at: new Date(),
            updated_at: new Date(),
          },
        }
      );
      console.log(`[razorpay-webhook] payment.captured → order ${razorpay_order_id} marked Paid.`);
      return NextResponse.json({ status: "ok" });
    }

    /* ── payment.failed ────────────────────────────────── */
    if (eventType === "payment.failed") {
      await col.updateOne(
        { razorpay_order_id },
        {
          $set: {
            payment_status: "Failed",
            status: "Payment Failed",
            razorpay_payment_id,
            updated_at: new Date(),
          },
        }
      );
      console.log(`[razorpay-webhook] payment.failed → order ${razorpay_order_id} marked Failed.`);
      return NextResponse.json({ status: "ok" });
    }

    /* ── Other events → ignore ─────────────────────────── */
    return NextResponse.json({ status: "ignored", event: eventType });
  } catch (e) {
    console.error("[razorpay-webhook] Error:", e);
    return NextResponse.json({ status: "error", message: e.message }, { status: 500 });
  }
}
