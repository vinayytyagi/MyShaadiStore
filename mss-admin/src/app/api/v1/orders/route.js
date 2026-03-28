import { NextResponse } from "next/server";
import { ObjectId } from "mongodb";
import { getItemsCollection, getOrdersCollection, getVendorCollection } from "@/lib/db";
import { createRazorpayOrder, getPublicKeyId } from "@/lib/razorpay";
import { ORDER_STATUS, PAYMENT_STATUS } from "@/lib/orderLifecycle";

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
        vendor_id: item.vendor_id || null,
      };
    });
    const uniqueItemIds = [
      ...new Set(normalizedItems.map((item) => String(item.item_id || "")).filter((id) => ObjectId.isValid(id))),
    ];
    const itemCol = await getItemsCollection();
    const itemDocs = uniqueItemIds.length
      ? await itemCol.find({ _id: { $in: uniqueItemIds.map((id) => new ObjectId(id)) } }).toArray()
      : [];
    const itemDocMap = new Map(itemDocs.map((doc) => [doc._id.toString(), doc]));

    const uniqueVendorIds = [
      ...new Set(
        normalizedItems
          .map((item) => item.vendor_id || itemDocMap.get(String(item.item_id || ""))?.vendor_id)
          .filter((id) => ObjectId.isValid(id))
      ),
    ];
    const vendorCol = await getVendorCollection();
    const vendorDocs = uniqueVendorIds.length
      ? await vendorCol.find({ _id: { $in: uniqueVendorIds.map((id) => new ObjectId(id)) } }).toArray()
      : [];
    const vendorMap = new Map(vendorDocs.map((doc) => [doc._id.toString(), doc]));

    const enrichedItems = normalizedItems.map((item) => {
      const itemDoc = itemDocMap.get(String(item.item_id || ""));
      const vendorId = item.vendor_id || itemDoc?.vendor_id || null;
      const vendorIdStr = vendorId ? String(vendorId) : null;
      const vendor = vendorIdStr ? vendorMap.get(vendorIdStr) : null;
      const pickupAddresses = Array.isArray(vendor?.pickup_addresses) ? vendor.pickup_addresses : [];
      const defaultPickup = pickupAddresses.find((addr) => addr?.is_default) || pickupAddresses[0] || null;
      return {
        ...item,
        vendor_id: vendorIdStr,
        policies: {
          cancellable: itemDoc?.policies?.cancellable !== false,
          refundable: itemDoc?.policies?.refundable === true,
          cancellation_window_hours: Number(itemDoc?.policies?.cancellation_window_hours) || 24,
          refund_window_days: Number(itemDoc?.policies?.refund_window_days) || 0,
        },
        pickup_address: defaultPickup
          ? {
              label: defaultPickup.label || null,
              line1: defaultPickup.line1 || null,
              line2: defaultPickup.line2 || null,
              city: defaultPickup.city || null,
              state: defaultPickup.state || null,
              pincode: defaultPickup.pincode || null,
              contact_name: defaultPickup.contact_name || null,
              contact_phone: defaultPickup.contact_phone || null,
            }
          : null,
      };
    });

    const totalAmount = enrichedItems.reduce((sum, item) => sum + item.total, 0);

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
      status: ORDER_STATUS.PENDING,
      payment_status: PAYMENT_STATUS.CREATED,
      fulfillment_status: "Unfulfilled",
      checkout_mode: "razorpay",
      payment_provider: "razorpay",
      shipping_provider: "manual",
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
      items: enrichedItems,
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
