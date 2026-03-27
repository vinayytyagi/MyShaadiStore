import { NextResponse } from "next/server";
import { ObjectId } from "mongodb";
import { requireAdmin } from "@/lib/auth";
import { getOrdersCollection } from "@/lib/db";
import { trackByAwb, trackByShipmentId } from "@/lib/shiprocket";

/**
 * GET /api/v1/admin/orders/[orderId]/tracking
 *
 * Returns live tracking data for a shipped order.
 * Tries AWB first, falls back to shipment ID.
 */
export async function GET(request, { params }) {
  const err = requireAdmin(request);
  if (err) return err;

  try {
    const { orderId } = await params;
    if (!ObjectId.isValid(orderId)) {
      return NextResponse.json({ code: "NOT_FOUND", message: "Order not found" }, { status: 404 });
    }

    const col = await getOrdersCollection();
    const order = await col.findOne({ _id: new ObjectId(orderId) });

    if (!order) {
      return NextResponse.json({ code: "NOT_FOUND", message: "Order not found" }, { status: 404 });
    }

    const shipment = order.shipment;
    if (!shipment) {
      return NextResponse.json(
        { code: "NOT_SHIPPED", message: "This order has not been shipped yet." },
        { status: 400 }
      );
    }

    let trackingData = null;

    // Try tracking by AWB code first
    if (shipment.awb_code) {
      try {
        trackingData = await trackByAwb(shipment.awb_code);
      } catch {
        // Fall through to shipment ID tracking
      }
    }

    // Fallback: track by Shiprocket shipment ID
    if (!trackingData && shipment.shiprocket_shipment_id) {
      try {
        trackingData = await trackByShipmentId(shipment.shiprocket_shipment_id);
      } catch (e) {
        return NextResponse.json(
          { code: "TRACKING_ERROR", message: e.message || "Could not fetch tracking data" },
          { status: 500 }
        );
      }
    }

    if (!trackingData) {
      return NextResponse.json(
        { code: "NO_TRACKING", message: "No tracking data available yet." },
        { status: 404 }
      );
    }

    return NextResponse.json({
      shipment,
      tracking: trackingData,
    });
  } catch (e) {
    console.error("[GET /admin/orders/[orderId]/tracking]", e);
    return NextResponse.json({ code: "INTERNAL_ERROR", message: e.message }, { status: 500 });
  }
}
