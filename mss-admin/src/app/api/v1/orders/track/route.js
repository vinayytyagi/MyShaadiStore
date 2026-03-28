import { NextResponse } from "next/server";
import { getOrdersCollection } from "@/lib/db";
import { trackByAwb, trackByShipmentId } from "@/lib/shiprocket";

/**
 * GET /api/v1/orders/track?order_number=MSS-123456-ABCD&phone=9876543210
 *
 * Public tracking endpoint for users.
 * Requires order_number + phone (for security so random people can't track).
 * Returns shipment info + live tracking.
 */
export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const orderNumber = searchParams.get("order_number") || "";
    const phone = searchParams.get("phone") || "";

    if (!orderNumber || !phone) {
      return NextResponse.json(
        { code: "BAD_REQUEST", message: "order_number and phone are required" },
        { status: 400 }
      );
    }

    const col = await getOrdersCollection();
    const order = await col.findOne({
      order_number: orderNumber,
      "customer.phone": phone,
    });

    if (!order) {
      return NextResponse.json(
        { code: "NOT_FOUND", message: "Order not found. Check your order number and phone." },
        { status: 404 }
      );
    }

    const shipment = order.shipment;
    if (!shipment || !shipment.awb_code) {
      return NextResponse.json({
        order_number: order.order_number,
        status: order.status,
        fulfillment_status: order.fulfillment_status || "Unfulfilled",
        message: "Your order has not been shipped yet.",
        shipment: null,
        tracking: null,
      });
    }

    let tracking = null;
    try {
      tracking = await trackByAwb(shipment.awb_code);
    } catch {
      if (shipment.shiprocket_shipment_id) {
        try {
          tracking = await trackByShipmentId(shipment.shiprocket_shipment_id);
        } catch {
          tracking = null;
        }
      }
    }

    const trackingData = tracking?.tracking_data || {};
    const activities = trackingData?.shipment_track_activities || trackingData?.track_activities || [];
    const latest = Array.isArray(activities) && activities.length > 0 ? activities[0] : null;
    const summary = {
      current_status:
        trackingData?.current_status ||
        latest?.["sr-status-label"] ||
        latest?.["sr-status"] ||
        latest?.activity ||
        null,
      expected_delivery_date:
        trackingData?.etd || trackingData?.estimated_delivery_date || trackingData?.expected_delivery_date || null,
      last_event_at: latest?.date || null,
      last_event_location: latest?.location || null,
    };

    return NextResponse.json({
      order_number: order.order_number,
      status: order.status,
      fulfillment_status: order.fulfillment_status,
      shipment: {
        awb_code: shipment.awb_code,
        courier_name: shipment.courier_name,
        shipped_at: shipment.shipped_at,
        tracking_url: shipment.tracking_url,
      },
      tracking_summary: summary,
      tracking,
    });
  } catch (e) {
    console.error("[GET /api/v1/orders/track]", e);
    return NextResponse.json({ code: "INTERNAL_ERROR", message: e.message }, { status: 500 });
  }
}
