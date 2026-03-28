import { NextResponse } from "next/server";
import { ObjectId } from "mongodb";
import { requireAdmin } from "@/lib/auth";
import { getOrdersCollection } from "@/lib/db";
import { ORDER_STATUS, PAYMENT_STATUS } from "@/lib/orderLifecycle";

export async function POST(request, { params }) {
  const err = requireAdmin(request);
  if (err) return err;
  try {
    const { orderId } = await params;
    if (!ObjectId.isValid(orderId)) {
      return NextResponse.json({ code: "NOT_FOUND", message: "Order not found" }, { status: 404 });
    }
    const body = await request.json().catch(() => ({}));
    const courierName = String(body.courier_name || body.courierName || "").trim();
    const trackingNumber = String(body.tracking_number || body.trackingNumber || "").trim();
    const trackingUrl = String(body.tracking_url || body.trackingUrl || "").trim() || null;
    if (!courierName || !trackingNumber) {
      return NextResponse.json(
        { code: "BAD_REQUEST", message: "courier_name and tracking_number are required" },
        { status: 400 }
      );
    }
    const col = await getOrdersCollection();
    const order = await col.findOne({ _id: new ObjectId(orderId) });
    if (!order) {
      return NextResponse.json({ code: "NOT_FOUND", message: "Order not found" }, { status: 404 });
    }
    if (order.payment_status !== PAYMENT_STATUS.PAID) {
      return NextResponse.json({ code: "BAD_REQUEST", message: "Order payment must be paid before shipping" }, { status: 400 });
    }

    const updated = await col.findOneAndUpdate(
      { _id: new ObjectId(orderId) },
      {
        $set: {
          status: ORDER_STATUS.SHIPPED,
          fulfillment_status: "Shipped",
          shipment: {
            mode: "manual",
            courier_name: courierName,
            awb_code: trackingNumber,
            tracking_number: trackingNumber,
            tracking_url: trackingUrl,
            shipped_at: new Date(),
          },
          updated_at: new Date(),
        },
      },
      { returnDocument: "after" }
    );
    return NextResponse.json({ message: "Order marked as shipped", order: { ...updated, order_id: updated._id.toString() } });
  } catch (e) {
    return NextResponse.json({ code: "INTERNAL_ERROR", message: e.message }, { status: 500 });
  }
}
