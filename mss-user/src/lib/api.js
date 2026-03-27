/**
 * API base URL – mss-admin runs on port 5000 and serves all APIs at /api/v1.
 * mss-user runs on 3000 and calls this URL for auth, catalog, orders, etc.
 */
export const API_BASE =
  (typeof process !== "undefined" && process.env.NEXT_PUBLIC_API_URL) || "http://localhost:5000";

/** Full API v1 prefix: e.g. http://localhost:5000/api/v1 */
export function getApiV1Url() {
  return `${API_BASE.replace(/\/$/, "")}/api/v1`;
}

async function fetchJson(path) {
  const res = await fetch(`${getApiV1Url()}${path}`, {
    next: { revalidate: 60 },
  });

  if (!res.ok) {
    throw new Error(`Request failed: ${path}`);
  }

  return res.json();
}

export async function fetchJourneySteps() {
  return fetchJson("/journey-steps");
}

export async function fetchJourneyStep(stepIdOrSlug) {
  return fetchJson(`/journey-steps/${encodeURIComponent(stepIdOrSlug)}`);
}

export async function fetchStepCategories(stepIdOrSlug) {
  return fetchJson(`/journey-steps/${encodeURIComponent(stepIdOrSlug)}/categories`);
}

export async function fetchItems(params = {}) {
  const qs = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== "") {
      qs.set(key, value);
    }
  });

  return fetchJson(`/items${qs.toString() ? `?${qs.toString()}` : ""}`);
}

export async function fetchItem(itemId) {
  return fetchJson(`/items/${encodeURIComponent(itemId)}`);
}

export async function submitQuotationRequest(payload) {
  const res = await fetch(`${getApiV1Url()}/quotation-requests`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.message || "Failed to submit quotation request");
  return data;
}

export async function createShoppingOrder(payload) {
  const res = await fetch(`${getApiV1Url()}/orders`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.message || "Failed to create order");
  return data;
}

/**
 * Verify Razorpay payment after checkout modal success.
 * Sends the 3 Razorpay values to our backend which verifies the
 * HMAC-SHA256 signature and marks the order as Paid.
 */
export async function verifyRazorpayPayment({ razorpay_order_id, razorpay_payment_id, razorpay_signature }) {
  const res = await fetch(`${getApiV1Url()}/orders/verify-payment`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ razorpay_order_id, razorpay_payment_id, razorpay_signature }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.message || "Payment verification failed");
  return data;
}

/**
 * Track an order (public, no auth needed).
 * Requires order_number + phone for security.
 */
export async function trackOrder(orderNumber, phone) {
  const qs = new URLSearchParams({ order_number: orderNumber, phone });
  return fetchJson(`/orders/track?${qs.toString()}`);
}

export async function requestUserOtp(phone, purpose = "signup") {
  const res = await fetch(`${getApiV1Url()}/auth/user/request-otp`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ phone, purpose }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.message || "Failed to request OTP");
  return data;
}

export async function verifyUserOtp(phone, otp, purpose = "signup") {
  const res = await fetch(`${getApiV1Url()}/auth/user/verify-otp`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ phone, otp, purpose }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.message || "Failed to verify OTP");
  return data;
}

export async function signupUser(payload) {
  const res = await fetch(`${getApiV1Url()}/auth/user/signup`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.message || "Failed to complete signup");
  return data;
}

/**
 * Progressive save - saves partial signup data at each step
 */
export async function progressiveSave(payload) {
  const res = await fetch(`${getApiV1Url()}/auth/user/progressive-save`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.message || "Failed to save progress");
  return data;
}

export async function loginUser(phone, password) {
  const res = await fetch(`${getApiV1Url()}/auth/user/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ phone, password }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.message || "Failed to login");
  return data;
}

export async function requestResetOtp(phone) {
  const res = await fetch(`${getApiV1Url()}/auth/user/forgot-password/request-otp`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ phone }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.message || "Failed to request reset OTP");
  return data;
}

export async function resetPassword(payload) {
  const res = await fetch(`${getApiV1Url()}/auth/user/forgot-password/reset`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.message || "Failed to reset password");
  return data;
}

/* ── Authenticated user APIs ───────────────────────────────────── */

function authHeaders(token) {
  return {
    "Content-Type": "application/json",
    Authorization: `Bearer ${token}`,
  };
}

export async function fetchMyProfile(token) {
  const res = await fetch(`${getApiV1Url()}/user/me`, {
    headers: authHeaders(token),
    cache: "no-store",
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.message || "Failed to fetch profile");
  return data;
}

export async function updateMyProfile(token, payload) {
  const res = await fetch(`${getApiV1Url()}/user/me`, {
    method: "PUT",
    headers: authHeaders(token),
    body: JSON.stringify(payload),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.message || "Failed to update profile");
  return data;
}

export async function fetchMyOrders(token) {
  const res = await fetch(`${getApiV1Url()}/user/orders`, {
    headers: authHeaders(token),
    cache: "no-store",
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.message || "Failed to fetch orders");
  return data;
}
