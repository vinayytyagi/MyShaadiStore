/**
 * Shiprocket server-side helper.
 *
 * Uses the Shiprocket REST API v1 to:
 *  - Authenticate (email + password → JWT token, cached for 9 days)
 *  - Create a shipping order
 *  - Request courier assignment + AWB
 *  - Track shipment by AWB
 *
 * API docs: https://apidocs.shiprocket.in/
 */

const SR_BASE = "https://apiv2.shiprocket.in/v1/external";
const SR_EMAIL = process.env.SHIPROCKET_EMAIL || "";
const SR_PASSWORD = process.env.SHIPROCKET_PASSWORD || "";
const SR_PICKUP_LOCATION = process.env.SHIPROCKET_PICKUP_LOCATION || "Primary";

/* ── Token cache (in-memory, survives across requests in serverless cold starts) ── */
let _cachedToken = null;
let _tokenExpiresAt = 0;  // epoch ms

/**
 * Get a valid Shiprocket auth token.
 * Token is valid for 10 days; we cache it for 9 days to be safe.
 */
export async function getShiprocketToken() {
  const now = Date.now();
  if (_cachedToken && now < _tokenExpiresAt) {
    return _cachedToken;
  }

  if (!SR_EMAIL || !SR_PASSWORD) {
    throw new Error("SHIPROCKET_EMAIL and SHIPROCKET_PASSWORD must be set in .env");
  }

  const res = await fetch(`${SR_BASE}/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email: SR_EMAIL, password: SR_PASSWORD }),
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Shiprocket auth failed: ${err}`);
  }

  const data = await res.json();
  _cachedToken = data.token;
  // Cache for 9 days (Shiprocket tokens last 10 days)
  _tokenExpiresAt = now + 9 * 24 * 60 * 60 * 1000;
  return _cachedToken;
}

/** Helper to make authenticated Shiprocket API calls. */
async function srFetch(path, options = {}) {
  const token = await getShiprocketToken();
  const res = await fetch(`${SR_BASE}${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
      ...(options.headers || {}),
    },
  });

  const text = await res.text();
  let data;
  try {
    data = JSON.parse(text);
  } catch {
    data = { raw: text };
  }

  if (!res.ok) {
    const msg = data?.message || data?.raw || `Shiprocket API error (${res.status})`;
    const error = new Error(msg);
    error.status = res.status;
    error.data = data;
    throw error;
  }

  return data;
}

/**
 * Create an order on Shiprocket.
 *
 * @param {object} order – MongoDB order document
 * @param {object} opts – optional overrides
 * @param {number} opts.length – package length in cm (default 20)
 * @param {number} opts.breadth – package breadth in cm (default 15)
 * @param {number} opts.height – package height in cm (default 10)
 * @param {number} opts.weight – package weight in kg (default 0.5)
 * @returns {Promise<{ order_id, shipment_id, status, ... }>}
 */
export async function createShiprocketOrder(order, opts = {}) {
  const customer = order.customer || {};
  const shipping = order.shipping_address || {};
  const items = order.items || [];

  // Format date as YYYY-MM-DD HH:mm
  const orderDate = order.created_at
    ? new Date(order.created_at).toISOString().replace("T", " ").slice(0, 16)
    : new Date().toISOString().replace("T", " ").slice(0, 16);

  // Build line items for Shiprocket
  const orderItems = items.map((item, idx) => ({
    name: item.name || "Item",
    sku: item.item_id || `SKU-${idx + 1}`,
    units: item.quantity || 1,
    selling_price: String(item.price || 0),
    discount: "",
    tax: "",
    hsn: "",
  }));

  const nameParts = String(customer.name || "Customer").split(" ");

  const payload = {
    order_id: order.order_number || order._id?.toString(),
    order_date: orderDate,
    pickup_location: SR_PICKUP_LOCATION,
    channel_id: "",
    comment: order.notes || "",
    billing_customer_name: nameParts[0] || "Customer",
    billing_last_name: nameParts.slice(1).join(" ") || "",
    billing_address: shipping.line1 || "",
    billing_address_2: shipping.line2 || "",
    billing_city: shipping.city || "",
    billing_pincode: shipping.pincode || "",
    billing_state: shipping.state || "",
    billing_country: "India",
    billing_email: customer.email || "noreply@myshaadistore.com",
    billing_phone: customer.phone || "",
    shipping_is_billing: true,
    shipping_customer_name: "",
    shipping_last_name: "",
    shipping_address: "",
    shipping_address_2: "",
    shipping_city: "",
    shipping_pincode: "",
    shipping_state: "",
    shipping_country: "",
    shipping_email: "",
    shipping_phone: "",
    order_items: orderItems,
    payment_method: "Prepaid",       // Already paid via Razorpay
    shipping_charges: 0,
    giftwrap_charges: 0,
    transaction_charges: 0,
    total_discount: 0,
    sub_total: order.total_amount || 0,
    length: opts.length || 20,
    breadth: opts.breadth || 15,
    height: opts.height || 10,
    weight: opts.weight || 0.5,
  };

  return srFetch("/orders/create/adhoc", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

/**
 * Request courier assignment + AWB for a shipment.
 * @param {number|string} shipmentId – Shiprocket shipment ID
 * @returns {Promise<{ response: { data: { awb_code, courier_name, ... } } }>}
 */
export async function assignCourier(shipmentId) {
  return srFetch("/courier/assign/awb", {
    method: "POST",
    body: JSON.stringify({ shipment_id: shipmentId }),
  });
}

/**
 * Generate pickup request for a shipment.
 * @param {number|string} shipmentId – Shiprocket shipment ID
 * @returns {Promise<object>}
 */
export async function requestPickup(shipmentId) {
  return srFetch("/courier/generate/pickup", {
    method: "POST",
    body: JSON.stringify({ shipment_id: [shipmentId] }),
  });
}

/**
 * Track shipment by AWB code.
 * @param {string} awbCode
 * @returns {Promise<object>} tracking data
 */
export async function trackByAwb(awbCode) {
  return srFetch(`/courier/track/awb/${encodeURIComponent(awbCode)}`, {
    method: "GET",
  });
}

/**
 * Track shipment by Shiprocket shipment ID.
 * @param {string|number} shipmentId
 * @returns {Promise<object>} tracking data
 */
export async function trackByShipmentId(shipmentId) {
  return srFetch(`/courier/track/shipment/${encodeURIComponent(shipmentId)}`, {
    method: "GET",
  });
}

/**
 * Cancel a Shiprocket order.
 * @param {number[]} orderIds – Shiprocket order IDs to cancel
 * @returns {Promise<object>}
 */
export async function cancelShiprocketOrder(orderIds) {
  return srFetch("/orders/cancel", {
    method: "POST",
    body: JSON.stringify({ ids: orderIds }),
  });
}
