import { NextResponse } from "next/server";
import { ObjectId } from "mongodb";
import { requireAdmin } from "@/lib/auth";
import { getOrdersCollection } from "@/lib/db";
import { createShiprocketOrder, assignCourier, requestPickup } from "@/lib/shiprocket";

/**
 * POST /api/v1/admin/orders/[orderId]/ship
 *
 * Admin clicks "Ship Order" on a Paid/Confirmed order.
 * This endpoint:
 *   1. Creates the order on Shiprocket
 *   2. Requests courier assignment (gets AWB + courier name)
 *   3. Requests a pickup
 *   4. Saves all shipment details in MongoDB
 *   5. Updates order status → "Shipped"
 *
 * Optional body: { length, breadth, height, weight } for package dimensions.
 */
export async function POST(request, { params }) {
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

    /* ── Validate order state ──────────────────────────── */
    if (order.payment_status !== "Paid") {
      return NextResponse.json(
        { code: "BAD_REQUEST", message: "Cannot ship an unpaid order. Payment status must be 'Paid'." },
        { status: 400 }
      );
    }

    if (order.shipment?.shiprocket_order_id) {
      return NextResponse.json(
        { code: "ALREADY_SHIPPED", message: "This order has already been shipped.", shipment: order.shipment },
        { status: 400 }
      );
    }

    const pickupLabels = [
      ...new Set(
        (Array.isArray(order.items) ? order.items : [])
          .map((item) => String(item?.pickup_address?.label || "").trim())
          .filter(Boolean)
      ),
    ];
    if (pickupLabels.length > 1) {
      return NextResponse.json(
        {
          code: "MULTI_PICKUP_NOT_SUPPORTED",
          message:
            "This order contains items from multiple pickup locations. Please split items into separate orders per vendor/pickup.",
          pickup_labels: pickupLabels,
        },
        { status: 400 }
      );
    }
    if (pickupLabels[0]) {
      order.pickup_location_label = pickupLabels[0];
    }

    /* ── Parse optional package dimensions from body ───── */
    let dimensions = {};
    try {
      dimensions = await request.json();
    } catch {
      dimensions = {};
    }

    /* ── Step 1: Create order on Shiprocket ────────────── */
    const srOrder = await createShiprocketOrder(order, dimensions);

    const shiprocketOrderId = srOrder.order_id;
    const shiprocketShipmentId = srOrder.shipment_id;

    if (!shiprocketOrderId || !shiprocketShipmentId) {
      return NextResponse.json(
        { code: "SHIPROCKET_ERROR", message: "Shiprocket did not return order/shipment ID.", data: srOrder },
        { status: 500 }
      );
    }

    /* ── Step 2: Assign courier + get AWB ──────────────── */
    let awbCode = null;
    let courierName = null;
    let courierAssignError = null;

    try {
      const awbRes = await assignCourier(shiprocketShipmentId);
      const awbData = awbRes?.response?.data;
      awbCode = awbData?.awb_code || awbData?.awb_assign_status?.toString() || null;
      courierName = awbData?.courier_name || awbData?.courier_company_id?.toString() || null;
    } catch (e) {
      // Courier assignment can sometimes fail if no serviceable courier is found.
      // We still save the Shiprocket order — admin can assign courier manually from Shiprocket panel.
      courierAssignError = e.message || "Courier assignment failed";
    }

    /* ── Step 3: Request pickup (if courier assigned) ──── */
    let pickupStatus = null;
    if (awbCode) {
      try {
        const pickupRes = await requestPickup(shiprocketShipmentId);
        pickupStatus = pickupRes?.pickup_status || "requested";
      } catch {
        pickupStatus = "pickup_request_failed";
      }
    }

    /* ── Step 4: Update MongoDB ────────────────────────── */
    const shipmentData = {
      shiprocket_order_id: shiprocketOrderId,
      shiprocket_shipment_id: shiprocketShipmentId,
      awb_code: awbCode,
      courier_name: courierName,
      courier_assign_error: courierAssignError,
      pickup_status: pickupStatus,
      shipped_at: new Date(),
      tracking_url: awbCode ? `https://shiprocket.co/tracking/${awbCode}` : null,
    };

    const newStatus = awbCode ? "Shipped" : "Processing";
    const newFulfillment = awbCode ? "Shipped" : "Courier Pending";

    await col.updateOne(
      { _id: new ObjectId(orderId) },
      {
        $set: {
          shipment: shipmentData,
          status: newStatus,
          fulfillment_status: newFulfillment,
          updated_at: new Date(),
        },
      }
    );

    const updatedOrder = await col.findOne({ _id: new ObjectId(orderId) });

    return NextResponse.json({
      message: awbCode
        ? `Order shipped! AWB: ${awbCode}, Courier: ${courierName}`
        : `Shiprocket order created but courier assignment pending. Assign manually from Shiprocket panel.`,
      shipment: shipmentData,
      order: { ...updatedOrder, order_id: updatedOrder._id.toString() },
    });
  } catch (e) {
    console.error("[POST /admin/orders/[orderId]/ship]", e);
    const msg = String(e?.message || "");
    if (msg.toLowerCase().includes("shiprocket auth failed")) {
      return NextResponse.json(
        {
          code: "SHIPROCKET_AUTH_FAILED",
          message:
            `${msg}. Please verify SHIPROCKET credentials/token in mss-admin/.env, then restart admin server.`,
        },
        { status: 400 }
      );
    }
    return NextResponse.json({ code: "INTERNAL_ERROR", message: msg || "Unexpected shipping error" }, { status: 500 });
  }
}
