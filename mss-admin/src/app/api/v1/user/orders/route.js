import { NextResponse } from "next/server";
import { getAuthUser } from "@/lib/auth";
import { getOrdersCollection } from "@/lib/db";
import { getUsersCollection } from "@/lib/db";

/**
 * GET /api/v1/user/orders
 * Returns all orders for the authenticated user (matched by phone).
 */
export async function GET(request) {
  try {
    const decoded = getAuthUser(request);
    if (!decoded || decoded.type !== "customer") {
      return NextResponse.json({ code: "UNAUTHORIZED", message: "Login required" }, { status: 401 });
    }

    // Get user phone
    const usersCol = await getUsersCollection();
    const { ObjectId } = await import("mongodb");
    const user = await usersCol.findOne({ _id: new ObjectId(decoded.userId) });
    if (!user) {
      return NextResponse.json({ code: "NOT_FOUND", message: "User not found" }, { status: 404 });
    }

    const col = await getOrdersCollection();
    const orders = await col
      .find({ "customer.phone": user.phone })
      .sort({ created_at: -1 })
      .toArray();

    // Strip sensitive fields
    const cleaned = orders.map((o) => ({
      _id: o._id,
      order_number: o.order_number,
      status: o.status,
      payment_status: o.payment_status,
      fulfillment_status: o.fulfillment_status || "Unfulfilled",
      items: o.items,
      total_amount: o.total_amount,
      currency: o.currency,
      shipping_address: o.shipping_address,
      shipment: o.shipment
        ? {
            awb_code: o.shipment.awb_code,
            courier_name: o.shipment.courier_name,
            shipped_at: o.shipment.shipped_at,
            tracking_url: o.shipment.tracking_url,
          }
        : null,
      created_at: o.created_at,
    }));

    return NextResponse.json({ orders: cleaned });
  } catch (e) {
    console.error("[GET /api/v1/user/orders]", e);
    return NextResponse.json({ code: "INTERNAL_ERROR", message: e.message }, { status: 500 });
  }
}
