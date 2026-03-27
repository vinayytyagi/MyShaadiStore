"use client";

import { useEffect, useMemo, useState } from "react";
import { getAuthUser } from "@/lib/authCookies";
import { clearCart, removeFromCart, updateCartQuantity, useCartState, useCartSummary } from "@/lib/cartStore";
import { createShoppingOrder, verifyRazorpayPayment, submitQuotationRequest } from "@/lib/api";
import { formatCurrency } from "@/lib/shopUi";
import { toast } from "sonner";

function CartRow({ item, cartType, onRemove, onQuantityChange }) {
  const lineTotal = (Number(item.quantity) || 0) * (Number(item.final_price) || Number(item.price) || 0);

  return (
    <div className="flex flex-col gap-4 rounded-2xl border border-slate-100 bg-white p-4 shadow-[0_14px_32px_rgba(15,23,42,0.05)] sm:flex-row sm:items-center">
      <div className="h-28 w-full shrink-0 rounded-xl bg-[#fff4f7] sm:w-28">
        <div
          className="h-full w-full bg-contain bg-center bg-no-repeat"
          style={{ backgroundImage: `url("${item.image || item.images?.[0] || ""}")` }}
        />
      </div>

      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h3 className="text-lg font-semibold text-slate-800">{item.name}</h3>
            <p className="mt-1 text-sm text-slate-500">
              {item.subcategory_label || item.category_label || item.journey_title || item.item_type}
            </p>
            {item.journey_title ? (
              <p className="mt-1 text-xs font-medium text-[#ff4f86]">
                {item.journey_title}
              </p>
            ) : null}
          </div>

          <div className="text-right">
            <div className="text-sm font-semibold text-slate-900">
              {formatCurrency(item.final_price || item.price)}
            </div>
            <div className="text-xs text-slate-400">
              {cartType === "quotation" ? "Quoted item" : `Line total ${formatCurrency(lineTotal)}`}
            </div>
          </div>
        </div>

        <div className="mt-4 flex flex-wrap items-center gap-3">
          <div className="flex items-center overflow-hidden rounded-2xl border border-slate-200">
            <button
              type="button"
              onClick={() => onQuantityChange(item.item_id, Math.max(1, (Number(item.quantity) || 1) - 1))}
              className="cursor-pointer px-3 py-2 text-slate-600"
            >
              -
            </button>
            <div className="min-w-12 px-3 text-center text-sm font-semibold text-slate-700">
              {item.quantity}
            </div>
            <button
              type="button"
              onClick={() => onQuantityChange(item.item_id, (Number(item.quantity) || 1) + 1)}
              className="cursor-pointer px-3 py-2 text-slate-600"
            >
              +
            </button>
          </div>

          <button
            type="button"
            onClick={() => onRemove(item.item_id)}
            className="cursor-pointer rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-600"
          >
            Remove
          </button>
        </div>
      </div>
    </div>
  );
}

export default function CartPageClient() {
  const carts = useCartState();
  const { quotationCount, shoppingCount, shoppingTotal } = useCartSummary();
  const [quotationForm, setQuotationForm] = useState({
    name: "",
    phone: "",
    email: "",
    note: "",
  });
  const [checkoutForm, setCheckoutForm] = useState({
    name: "",
    phone: "",
    email: "",
    line1: "",
    line2: "",
    city: "",
    state: "",
    pincode: "",
    notes: "",
  });
  const [submitState, setSubmitState] = useState({ loading: false, error: "", success: "" });
  const [checkoutState, setCheckoutState] = useState({ loading: false, error: "", success: "", orderNumber: "" });

  useEffect(() => {
    const user = getAuthUser();
    if (!user) return;
    setQuotationForm((current) => ({
      name: current.name || user.name || "",
      phone: current.phone || user.phone || "",
      email: current.email || user.email || "",
      note: current.note,
    }));
    setCheckoutForm((current) => ({
      ...current,
      name: current.name || user.name || "",
      phone: current.phone || user.phone || "",
      email: current.email || user.email || "",
    }));
  }, []);

  const quotationSummary = useMemo(() => {
    return carts.quotation.reduce((sum, item) => sum + (Number(item.quantity) || 0), 0);
  }, [carts.quotation]);

  async function handleSubmitQuotation(e) {
    e.preventDefault();
    setSubmitState({ loading: true, error: "", success: "" });

    try {
      if (!getAuthUser()) {
        toast.info("Please login to submit quotation.");
        window.location.href = `/login?returnTo=${encodeURIComponent(window.location.pathname)}`;
        return;
      }
      if (!quotationForm.name.trim()) {
        throw new Error("Name is required for quotation.");
      }
      if (!quotationForm.phone.trim()) {
        throw new Error("Phone number is required for quotation.");
      }
      if (carts.quotation.length === 0) {
        throw new Error("Add items to quotation basket first.");
      }

      const payload = {
        customer: {
          name: quotationForm.name.trim(),
          phone: quotationForm.phone.trim(),
          email: quotationForm.email.trim() || null,
        },
        note: quotationForm.note.trim() || null,
        items: carts.quotation,
      };

      const response = await submitQuotationRequest(payload);
      clearCart("quotation");
      setSubmitState({
        loading: false,
        error: "",
        success: response.message || "Quotation request submitted successfully.",
      });
      toast.success(response.message || "Quotation request submitted successfully.");
    } catch (error) {
      toast.error(error.message || "Failed to submit quotation request.");
      setSubmitState({
        loading: false,
        error: error.message || "Failed to submit quotation request.",
        success: "",
      });
    }
  }

  /** Load the Razorpay checkout.js script if not already present. */
  function loadRazorpayScript() {
    return new Promise((resolve) => {
      if (typeof window !== "undefined" && window.Razorpay) {
        return resolve(true);
      }
      const script = document.createElement("script");
      script.src = "https://checkout.razorpay.com/v1/checkout.js";
      script.onload = () => resolve(true);
      script.onerror = () => resolve(false);
      document.body.appendChild(script);
    });
  }

  async function handleCheckout(e) {
    e.preventDefault();
    setCheckoutState({ loading: true, error: "", success: "", orderNumber: "" });

    try {
      /* ── Validate form ─────────────────────────────── */
      if (!getAuthUser()) {
        toast.info("Please login to continue checkout.");
        window.location.href = `/login?returnTo=${encodeURIComponent(window.location.pathname)}`;
        return;
      }
      if (!checkoutForm.name.trim()) throw new Error("Name is required for checkout.");
      if (!checkoutForm.phone.trim()) throw new Error("Phone number is required for checkout.");
      if (!checkoutForm.line1.trim()) throw new Error("Address line 1 is required.");
      if (!checkoutForm.city.trim()) throw new Error("City is required.");
      if (!checkoutForm.state.trim()) throw new Error("State is required.");
      if (!checkoutForm.pincode.trim()) throw new Error("Pincode is required.");
      if (carts.shopping.length === 0) throw new Error("Add items to shopping cart first.");

      /* ── Load Razorpay script ──────────────────────── */
      const loaded = await loadRazorpayScript();
      if (!loaded) throw new Error("Failed to load Razorpay. Check your internet connection.");

      /* ── Step 1: Create order (backend creates Razorpay order too) */
      const response = await createShoppingOrder({
        customer: {
          name: checkoutForm.name.trim(),
          phone: checkoutForm.phone.trim(),
          email: checkoutForm.email.trim() || null,
        },
        shipping_address: {
          line1: checkoutForm.line1.trim(),
          line2: checkoutForm.line2.trim() || null,
          city: checkoutForm.city.trim(),
          state: checkoutForm.state.trim(),
          pincode: checkoutForm.pincode.trim(),
        },
        notes: checkoutForm.notes.trim() || null,
        items: carts.shopping,
      });

      const rzConfig = response.razorpay;
      const orderNumber = response.order?.order_number || "";

      if (!rzConfig?.order_id) {
        throw new Error("Razorpay order was not created. Please try again.");
      }

      /* ── Step 2: Open Razorpay Checkout modal ──────── */
      const rzp = new window.Razorpay({
        key: rzConfig.key_id,
        amount: rzConfig.amount,
        currency: rzConfig.currency,
        name: rzConfig.name,
        description: rzConfig.description,
        order_id: rzConfig.order_id,
        prefill: rzConfig.prefill,
        theme: { color: "#ff4f86" },
        handler: async function (paymentResponse) {
          /* ── Step 3: Verify payment on backend ────── */
          try {
            const verifyRes = await verifyRazorpayPayment({
              razorpay_order_id: paymentResponse.razorpay_order_id,
              razorpay_payment_id: paymentResponse.razorpay_payment_id,
              razorpay_signature: paymentResponse.razorpay_signature,
            });
            clearCart("shopping");
            setCheckoutState({
              loading: false,
              error: "",
              success: verifyRes.message || "Payment successful! Your order is confirmed.",
              orderNumber,
            });
            toast.success(verifyRes.message || "Payment successful! Your order is confirmed.");
          } catch (verifyErr) {
            toast.error(verifyErr.message || "Payment verification failed. Contact support.");
            setCheckoutState({
              loading: false,
              error: verifyErr.message || "Payment verification failed. Contact support.",
              success: "",
              orderNumber,
            });
          }
        },
        modal: {
          ondismiss: function () {
            toast.error("Payment was cancelled. You can try again.");
            setCheckoutState({
              loading: false,
              error: "Payment was cancelled. You can try again.",
              success: "",
              orderNumber,
            });
          },
        },
      });

      rzp.on("payment.failed", function (failResponse) {
        toast.error(failResponse?.error?.description || "Payment failed. Please try again.");
        setCheckoutState({
          loading: false,
          error: failResponse?.error?.description || "Payment failed. Please try again.",
          success: "",
          orderNumber,
        });
      });

      rzp.open();
    } catch (error) {
      toast.error(error.message || "Failed to create order.");
      setCheckoutState({
        loading: false,
        error: error.message || "Failed to create order.",
        success: "",
        orderNumber: "",
      });
    }
  }

  return (
    <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <section className="rounded-3xl bg-[linear-gradient(135deg,#ffffff_0%,#fff3f7_48%,#fff9fb_100%)] px-6 py-8 shadow-[0_20px_55px_rgba(15,23,42,0.06)] sm:px-10">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <div className="inline-flex rounded-full bg-[#fff1f6] px-4 py-2 text-xs font-medium text-[#ff4f86]">
              Basket
            </div>
            <h1 className="mt-5 text-3xl font-semibold tracking-tight text-slate-800 sm:text-4xl">
              Quotation and Shopping Carts
            </h1>
            <p className="mt-4 max-w-3xl text-base leading-7 text-slate-500">
              Journey items and shopping products can be added to the quotation basket. Shopping
              products that you want to purchase immediately go into the shopping cart.
            </p>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <div className="rounded-2xl bg-white px-6 py-5 shadow-[0_14px_32px_rgba(15,23,42,0.05)]">
              <div className="text-xs font-medium text-slate-400">
                Quotation Basket
              </div>
              <div className="mt-2 text-3xl font-semibold text-slate-900">{quotationCount}</div>
            </div>
            <div className="rounded-2xl bg-white px-6 py-5 shadow-[0_14px_32px_rgba(15,23,42,0.05)]">
              <div className="text-xs font-medium text-slate-400">
                Shopping Cart
              </div>
              <div className="mt-2 text-3xl font-semibold text-slate-900">{shoppingCount}</div>
            </div>
          </div>
        </div>
      </section>

      <section className="mt-10 grid gap-8 xl:grid-cols-[1.2fr_0.8fr]">
        <div className="space-y-8">
          <div>
            <div className="mb-5 flex items-center justify-between gap-4">
              <div>
                <h2 className="text-2xl font-semibold text-slate-900">Quotation Basket</h2>
                <p className="mt-1 text-sm text-slate-500">
                  {quotationSummary} item{quotationSummary === 1 ? "" : "s"} ready to send for quotation.
                </p>
              </div>
              {carts.quotation.length > 0 ? (
                <button
                  type="button"
                  onClick={() => clearCart("quotation")}
                  className="cursor-pointer rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-600"
                >
                  Clear
                </button>
              ) : null}
            </div>

            {carts.quotation.length > 0 ? (
              <div className="space-y-4">
                {carts.quotation.map((item) => (
                  <CartRow
                    key={`quotation-${item.item_id}`}
                    item={item}
                    cartType="quotation"
                    onRemove={(itemId) => removeFromCart("quotation", itemId)}
                    onQuantityChange={(itemId, quantity) => updateCartQuantity("quotation", itemId, quantity)}
                  />
                ))}
              </div>
            ) : (
              <div className="rounded-2xl bg-white px-6 py-12 text-center text-slate-500 shadow-[0_18px_42px_rgba(15,23,42,0.06)]">
                No items in quotation basket yet.
              </div>
            )}
          </div>

          <div>
            <div className="mb-5 flex items-center justify-between gap-4">
              <div>
                <h2 className="text-2xl font-semibold text-slate-900">Shopping Cart</h2>
                <p className="mt-1 text-sm text-slate-500">Pay securely via Razorpay checkout.</p>
              </div>
              {carts.shopping.length > 0 ? (
                <button
                  type="button"
                  onClick={() => clearCart("shopping")}
                  className="cursor-pointer rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-600"
                >
                  Clear
                </button>
              ) : null}
            </div>

            {carts.shopping.length > 0 ? (
              <div className="space-y-4">
                {carts.shopping.map((item) => (
                  <CartRow
                    key={`shopping-${item.item_id}`}
                    item={item}
                    cartType="shopping"
                    onRemove={(itemId) => removeFromCart("shopping", itemId)}
                    onQuantityChange={(itemId, quantity) => updateCartQuantity("shopping", itemId, quantity)}
                  />
                ))}
              </div>
            ) : (
              <div className="rounded-2xl bg-white px-6 py-12 text-center text-slate-500 shadow-[0_18px_42px_rgba(15,23,42,0.06)]">
                No items in shopping cart yet.
              </div>
            )}
          </div>
        </div>

        <aside className="space-y-6">
          <form
            onSubmit={handleSubmitQuotation}
            className="rounded-2xl bg-white p-6 shadow-[0_20px_50px_rgba(15,23,42,0.08)]"
          >
            <h3 className="text-xl font-semibold text-slate-900">Send Quotation Request</h3>
            <p className="mt-2 text-sm leading-6 text-slate-500">
              We will use these quotation basket items and contact details to send a quotation request.
            </p>

            <div className="mt-6 space-y-4">
              <input
                type="text"
                placeholder="Your name"
                value={quotationForm.name}
                onChange={(e) => setQuotationForm((current) => ({ ...current, name: e.target.value }))}
                className="h-11 w-full rounded-xl border border-slate-200 bg-white px-4 text-sm font-medium text-slate-700 outline-none focus:border-[#ff4f86]"
              />
              <input
                type="tel"
                placeholder="Phone number"
                value={quotationForm.phone}
                onChange={(e) => setQuotationForm((current) => ({ ...current, phone: e.target.value }))}
                className="h-11 w-full rounded-xl border border-slate-200 bg-white px-4 text-sm font-medium text-slate-700 outline-none focus:border-[#ff4f86]"
              />
              <input
                type="email"
                placeholder="Email address"
                value={quotationForm.email}
                onChange={(e) => setQuotationForm((current) => ({ ...current, email: e.target.value }))}
                className="h-11 w-full rounded-xl border border-slate-200 bg-white px-4 text-sm font-medium text-slate-700 outline-none focus:border-[#ff4f86]"
              />
              <textarea
                placeholder="Add note for quotation request"
                value={quotationForm.note}
                onChange={(e) => setQuotationForm((current) => ({ ...current, note: e.target.value }))}
                className="min-h-28 w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-medium text-slate-700 outline-none focus:border-[#ff4f86]"
              />
            </div>

            {submitState.error ? (
              <p className="mt-4 rounded-2xl bg-red-50 px-4 py-3 text-sm text-red-600">{submitState.error}</p>
            ) : null}
            {submitState.success ? (
              <p className="mt-4 rounded-2xl bg-emerald-50 px-4 py-3 text-sm text-emerald-600">
                {submitState.success}
              </p>
            ) : null}

            <button
              type="submit"
              disabled={submitState.loading || carts.quotation.length === 0}
              className="mt-6 w-full cursor-pointer rounded-xl bg-[#ff4f86] px-5 py-2.5 text-sm font-semibold text-white shadow-[0_16px_30px_rgba(255,79,134,0.22)]"
            >
              {submitState.loading ? "Sending..." : "Send Quotation"}
            </button>
          </form>

          <form
            onSubmit={handleCheckout}
            className="rounded-2xl bg-white p-6 shadow-[0_20px_50px_rgba(15,23,42,0.08)]"
          >
            <h3 className="text-xl font-semibold text-slate-900">Shopping Checkout</h3>
            <p className="mt-2 text-sm leading-6 text-slate-500">
              Fill in your details and pay securely via Razorpay.
            </p>

            <div className="mt-5 space-y-4">
              <div className="flex items-center justify-between text-sm text-slate-500">
                <span>Items</span>
                <span className="font-semibold text-slate-800">{shoppingCount}</span>
              </div>
              <div className="flex items-center justify-between text-sm text-slate-500">
                <span>Total</span>
                <span className="font-semibold text-slate-800">{formatCurrency(shoppingTotal)}</span>
              </div>
            </div>

            <div className="mt-6 space-y-4">
              <input
                type="text"
                placeholder="Full name"
                value={checkoutForm.name}
                onChange={(e) => setCheckoutForm((current) => ({ ...current, name: e.target.value }))}
                className="h-11 w-full rounded-xl border border-slate-200 bg-white px-4 text-sm font-medium text-slate-700 outline-none focus:border-[#ff4f86]"
              />
              <input
                type="tel"
                placeholder="Phone number"
                value={checkoutForm.phone}
                onChange={(e) => setCheckoutForm((current) => ({ ...current, phone: e.target.value }))}
                className="h-11 w-full rounded-xl border border-slate-200 bg-white px-4 text-sm font-medium text-slate-700 outline-none focus:border-[#ff4f86]"
              />
              <input
                type="email"
                placeholder="Email address"
                value={checkoutForm.email}
                onChange={(e) => setCheckoutForm((current) => ({ ...current, email: e.target.value }))}
                className="h-11 w-full rounded-xl border border-slate-200 bg-white px-4 text-sm font-medium text-slate-700 outline-none focus:border-[#ff4f86]"
              />
              <input
                type="text"
                placeholder="Address line 1"
                value={checkoutForm.line1}
                onChange={(e) => setCheckoutForm((current) => ({ ...current, line1: e.target.value }))}
                className="h-11 w-full rounded-xl border border-slate-200 bg-white px-4 text-sm font-medium text-slate-700 outline-none focus:border-[#ff4f86]"
              />
              <input
                type="text"
                placeholder="Address line 2"
                value={checkoutForm.line2}
                onChange={(e) => setCheckoutForm((current) => ({ ...current, line2: e.target.value }))}
                className="h-11 w-full rounded-xl border border-slate-200 bg-white px-4 text-sm font-medium text-slate-700 outline-none focus:border-[#ff4f86]"
              />
              <div className="grid gap-4 sm:grid-cols-2">
                <input
                  type="text"
                  placeholder="City"
                  value={checkoutForm.city}
                  onChange={(e) => setCheckoutForm((current) => ({ ...current, city: e.target.value }))}
                  className="h-11 w-full rounded-xl border border-slate-200 bg-white px-4 text-sm font-medium text-slate-700 outline-none focus:border-[#ff4f86]"
                />
                <input
                  type="text"
                  placeholder="State"
                  value={checkoutForm.state}
                  onChange={(e) => setCheckoutForm((current) => ({ ...current, state: e.target.value }))}
                  className="h-11 w-full rounded-xl border border-slate-200 bg-white px-4 text-sm font-medium text-slate-700 outline-none focus:border-[#ff4f86]"
                />
              </div>
              <input
                type="text"
                placeholder="Pincode"
                value={checkoutForm.pincode}
                onChange={(e) => setCheckoutForm((current) => ({ ...current, pincode: e.target.value }))}
                className="h-11 w-full rounded-xl border border-slate-200 bg-white px-4 text-sm font-medium text-slate-700 outline-none focus:border-[#ff4f86]"
              />
              <textarea
                placeholder="Order note"
                value={checkoutForm.notes}
                onChange={(e) => setCheckoutForm((current) => ({ ...current, notes: e.target.value }))}
                className="min-h-24 w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-medium text-slate-700 outline-none focus:border-[#ff4f86]"
              />
            </div>

            {checkoutState.error ? (
              <p className="mt-4 rounded-2xl bg-red-50 px-4 py-3 text-sm text-red-600">
                {checkoutState.error}
              </p>
            ) : null}
            {checkoutState.success ? (
              <div className="mt-4 rounded-2xl bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
                <div>{checkoutState.success}</div>
                {checkoutState.orderNumber ? (
                  <div className="mt-1 font-semibold">Order: {checkoutState.orderNumber}</div>
                ) : null}
              </div>
            ) : null}

            <button
              type="submit"
              disabled={checkoutState.loading || carts.shopping.length === 0}
              className="mt-6 w-full cursor-pointer rounded-xl bg-[#ff4f86] px-5 py-2.5 text-sm font-semibold text-white shadow-[0_16px_30px_rgba(255,79,134,0.22)]"
            >
              {checkoutState.loading ? "Creating Order..." : "Pay with Razorpay"}
            </button>
          </form>
        </aside>
      </section>
    </main>
  );
}
