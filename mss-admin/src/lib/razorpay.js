/**
 * Razorpay server-side helper.
 *
 * Uses the official `razorpay` npm package to create orders and
 * verify payment signatures.  All env vars are read once at module level.
 */
import Razorpay from "razorpay";
import crypto from "crypto";

const KEY_ID = process.env.RAZORPAY_KEY_ID || "";
const KEY_SECRET = process.env.RAZORPAY_KEY_SECRET || "";

let _instance = null;

/** Lazily initialise the Razorpay SDK instance. */
function getInstance() {
  if (_instance) return _instance;
  if (!KEY_ID || !KEY_SECRET) {
    throw new Error("RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET must be set in .env");
  }
  _instance = new Razorpay({ key_id: KEY_ID, key_secret: KEY_SECRET });
  return _instance;
}

/**
 * Create a Razorpay order.
 * @param {number} amountInPaise – amount in paise (₹100 = 10000 paise)
 * @param {string} currency – e.g. "INR"
 * @param {string} receipt – a unique receipt id (our order_number)
 * @param {object} [notes] – optional key-value metadata
 * @returns {Promise<object>} Razorpay order object
 */
export async function createRazorpayOrder(amountInPaise, currency = "INR", receipt = "", notes = {}) {
  const rz = getInstance();
  return rz.orders.create({
    amount: amountInPaise,
    currency,
    receipt,
    notes,
  });
}

export async function createRazorpayRefund(paymentId, amountInPaise, notes = {}) {
  const rz = getInstance();
  const payload = {
    notes,
  };
  if (Number(amountInPaise) > 0) {
    payload.amount = Number(amountInPaise);
  }
  return rz.payments.refund(paymentId, payload);
}

/**
 * Verify the payment signature returned by Razorpay Checkout.
 *
 * Razorpay sends: razorpay_order_id, razorpay_payment_id, razorpay_signature
 * Signature = HMAC-SHA256( razorpay_order_id + "|" + razorpay_payment_id, key_secret )
 *
 * @returns {boolean}
 */
export function verifyPaymentSignature({ razorpay_order_id, razorpay_payment_id, razorpay_signature }) {
  const body = `${razorpay_order_id}|${razorpay_payment_id}`;
  const expected = crypto
    .createHmac("sha256", KEY_SECRET)
    .update(body)
    .digest("hex");
  return expected === razorpay_signature;
}

/**
 * Verify Razorpay webhook signature.
 * Header: X-Razorpay-Signature
 * Body: raw JSON string
 * Secret: webhook secret (can be same as KEY_SECRET or a separate one)
 */
export function verifyWebhookSignature(rawBody, signature, webhookSecret) {
  const secret = webhookSecret || KEY_SECRET;
  const expected = crypto
    .createHmac("sha256", secret)
    .update(rawBody)
    .digest("hex");
  return expected === signature;
}

/** Expose the key_id so the frontend can open the checkout modal. */
export function getPublicKeyId() {
  return KEY_ID;
}
