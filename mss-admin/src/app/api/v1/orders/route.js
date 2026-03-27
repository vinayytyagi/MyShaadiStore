import { NextResponse } from "next/server";
import { getOrdersCollection } from "@/lib/db";
import { createRazorpayOrder, getPublicKeyId } from "@/lib/razorpay";

function randomPart(length = 5) {
  return Math.random().toString(36).slice(2, 2 + length).toUpperCase();
}

function makeOrderNumber() {
  return `MSS-${Date.now().toString().slice(-6)}-${randomPart(4)}`;
}

/**
 * POST /api/v1/orders
 *
 * 1. Validate payload (customer, items, shipping address).
 * 2. Save a "Pending" order in MongoDB.
 * 3. Create a Razorpay order for the total amount.
 * 4. Save the razorpay_order_id back into the MongoDB document.
 * 5. Return order + Razorpay checkout details so the frontend can open the modal.
 */
export async function POST(request) {
  try {
    const body = await request.json();
    const customer = body.customer || {};
    const shipping = body.shipping_address || body.shippingAddress || {};
    const items = Array.isArray(body.items) ? body.items : [];

    /* ── Validation ─────────────────────────────────────── */
    const customerName = String(customer.name || "").trim();
    const customerPhone = String(customer.phone || "").trim();

    if (!customerName || !customerPhone) {
      return NextResponse.json(
        { code: "BAD_REQUEST", message: "Customer name and phone are required" },
        { status: 400 }
      );
    }
    if (items.length === 0) {
      return NextResponse.json(
        { code: "BAD_REQUEST", message: "Order items are required" },
        { status: 400 }
      );
    }

    /* ── Normalize items ────────────────────────────────── */
    const normalizedItems = items.map((item) => {
      const quantity = Math.max(1, Number(item.quantity) || 1);
      const unitPrice = Number(item.final_price) || Number(item.price) || 0;
      return {
        item_id: item.item_id,
        name: item.name || "Untitled item",
        quantity,
        price: unitPrice,
        total: quantity * unitPrice,
        category_label: item.category_label || null,
        subcategory_label: item.subcategory_label || null,
        image: item.image || item.images?.[0] || null,
      };
    });

    const totalAmount = normalizedItems.reduce((sum, item) => sum + item.total, 0);

    if (totalAmount <= 0) {
      return NextResponse.json(
        { code: "BAD_REQUEST", message: "Order total must be greater than zero" },
        { status: 400 }
      );
    }

    /* ── Save order in MongoDB (status = Pending) ──────── */
    const col = await getOrdersCollection();
    const orderNumber = makeOrderNumber();

    const doc = {
      order_number: orderNumber,
      status: "Pending",
      payment_status: "Created",
      fulfillment_status: "Unfulfilled",
      checkout_mode: "razorpay",
      payment_provider: "razorpay",
      shipping_provider: "shiprocket",
      razorpay_order_id: null,       // will be filled below
      razorpay_payment_id: null,     // filled after verification
      customer: {
        name: customerName,
        phone: customerPhone,
        email: String(customer.email || "").trim() || null,
      },
      shipping_address: {
        line1: String(shipping.line1 || "").trim() || null,
        line2: String(shipping.line2 || "").trim() || null,
        city: String(shipping.city || "").trim() || null,
        state: String(shipping.state || "").trim() || null,
        pincode: String(shipping.pincode || "").trim() || null,
      },
      notes: String(body.notes || "").trim() || null,
      items: normalizedItems,
      total_amount: totalAmount,
      currency: "INR",
      created_at: new Date(),
      updated_at: new Date(),
    };

    const result = await col.insertOne(doc);
    const orderId = result.insertedId.toString();

    /* ── Create Razorpay order ─────────────────────────── */
    const amountInPaise = Math.round(totalAmount * 100);

    const rzOrder = await createRazorpayOrder(amountInPaise, "INR", orderNumber, {
      mss_order_id: orderId,
      order_number: orderNumber,
    });

    // Update MongoDB doc with the razorpay_order_id
    await col.updateOne(
      { _id: result.insertedId },
      { $set: { razorpay_order_id: rzOrder.id, updated_at: new Date() } }
    );

    /* ── Return everything the frontend needs ──────────── */
    return NextResponse.json(
      {
        message: "Order created. Complete payment via Razorpay.",
        order: {
          ...doc,
          _id: result.insertedId,
          order_id: orderId,
          razorpay_order_id: rzOrder.id,
        },
        razorpay: {
          key_id: getPublicKeyId(),
          order_id: rzOrder.id,
          amount: amountInPaise,
          currency: "INR",
          name: "MyShaadiStore",
          description: `Order ${orderNumber}`,
          prefill: {
            name: customerName,
            contact: customerPhone,
            email: doc.customer.email || "",
          },
        },
      },
      { status: 201 }
    );
  } catch (e) {
    console.error("[POST /api/v1/orders]", e);
    return NextResponse.json({ code: "INTERNAL_ERROR", message: e.message }, { status: 500 });
  }
}
