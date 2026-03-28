"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import {
  ArrowLeft,
  ClipboardList,
  IndianRupee,
  User,
  MapPin,
  RefreshCw,
  Truck,
  Package,
  ExternalLink,
  CheckCircle2,
  XCircle,
  Clock,
  Loader2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

const API_BASE = "/api/v1";

function getToken() {
  if (typeof window === "undefined") return null;
  return localStorage.getItem("mss_token");
}

const ORDER_STATUSES = ["Pending", "Confirmed", "Processing", "Shipped", "Delivered", "Cancelled", "Payment Failed"];

function money(v) {
  const n = Number(v || 0);
  return `₹${n.toLocaleString()}`;
}

function paymentBadge(status) {
  if (status === "Paid") return "bg-emerald-100 text-emerald-800 border-emerald-200";
  if (status === "Failed") return "bg-red-100 text-red-800 border-red-200";
  return "bg-amber-100 text-amber-800 border-amber-200";
}

function fulfillmentBadge(status) {
  if (status === "Shipped") return "bg-blue-100 text-blue-800 border-blue-200";
  if (status === "Delivered") return "bg-emerald-100 text-emerald-800 border-emerald-200";
  return "bg-slate-100 text-slate-700 border-slate-200";
}

export default function OrderDetailsPage() {
  const params = useParams();
  const orderId = useMemo(() => params?.orderId, [params]);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [shipping, setShipping] = useState(false);
  const [trackingLoading, setTrackingLoading] = useState(false);
  const [order, setOrder] = useState(null);
  const [status, setStatus] = useState("");
  const [trackingData, setTrackingData] = useState(null);
  const [refundAmount, setRefundAmount] = useState("");
  const [refundReason, setRefundReason] = useState("");
  const [cancelReason, setCancelReason] = useState("");

  // Package dimension state for shipping
  const [dims, setDims] = useState({ length: 20, breadth: 15, height: 10, weight: 0.5 });

  useEffect(() => {
    async function load() {
      const token = getToken();
      if (!token) return;
      setLoading(true);
      try {
        const res = await fetch(`${API_BASE}/admin/orders/${orderId}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (!res.ok) {
          const err = await res.json().catch(() => ({}));
          throw new Error(err.message || "Failed to load order");
        }
        const d = await res.json();
        setOrder(d);
        setStatus(d.status || "Pending");
      } catch (e) {
        toast.error(e.message || "Failed to load order");
      } finally {
        setLoading(false);
      }
    }
    if (orderId) load();
  }, [orderId]);

  async function updateStatus() {
    const token = getToken();
    if (!token || !orderId) return;
    setSaving(true);
    try {
      const res = await fetch(`${API_BASE}/admin/orders/${orderId}/status`, {
        method: "PUT",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ status }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.message || "Failed to update status");
      }
      const out = await res.json().catch(() => ({}));
      const nextOrder = out.order || order;
      setOrder(nextOrder);
      toast.success("Order status updated");
    } catch (e) {
      toast.error(e.message || "Failed to update status");
    } finally {
      setSaving(false);
    }
  }

  async function handleShipOrder() {
    const token = getToken();
    if (!token || !orderId) return;
    setShipping(true);
    try {
      const res = await fetch(`${API_BASE}/admin/orders/${orderId}/ship`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify(dims),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.message || "Failed to ship order");
      }
      setOrder(data.order || order);
      setStatus(data.order?.status || status);
      toast.success(data.message || "Order shipped!");
    } catch (e) {
      toast.error(e.message || "Failed to ship order");
    } finally {
      setShipping(false);
    }
  }

  async function handleFetchTracking() {
    const token = getToken();
    if (!token || !orderId) return;
    setTrackingLoading(true);
    try {
      const res = await fetch(`${API_BASE}/admin/orders/${orderId}/tracking`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.message || "Tracking not available");
      }
      setTrackingData(data);
      toast.success("Tracking data refreshed");
    } catch (e) {
      toast.error(e.message || "Tracking not available");
    } finally {
      setTrackingLoading(false);
    }
  }

  async function handleCancelOrder() {
    const token = getToken();
    if (!token || !orderId) return;
    setSaving(true);
    try {
      const res = await fetch(`${API_BASE}/admin/orders/${orderId}/cancel`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ reason: cancelReason }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Failed to cancel order");
      setOrder(data.order || order);
      setStatus(data.order?.status || status);
      toast.success(data.message || "Order cancelled");
    } catch (e) {
      toast.error(e.message || "Failed to cancel order");
    } finally {
      setSaving(false);
    }
  }

  async function handleRefundOrder() {
    const token = getToken();
    if (!token || !orderId) return;
    setSaving(true);
    try {
      const res = await fetch(`${API_BASE}/admin/orders/${orderId}/refund`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          amount: refundAmount ? Number(refundAmount) : undefined,
          reason: refundReason,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Failed to refund");
      setOrder(data.order || order);
      toast.success(data.message || "Refund initiated");
    } catch (e) {
      toast.error(e.message || "Failed to refund");
    } finally {
      setSaving(false);
    }
  }

  const customer = order?.customer || order?.user || null;
  const shipAddr = order?.shipping_address || order?.address || null;
  const items = order?.items || order?.line_items || [];
  const shipment = order?.shipment || null;
  const isPaid = order?.payment_status === "Paid";
  const isShipped = !!shipment?.shiprocket_order_id;

  return (
    <div className="space-y-6">
      {/* ── Header ──────────────────────────────────────── */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <Button variant="ghost" size="sm" asChild className="-ml-2 gap-2">
            <Link href="/orders">
              <ArrowLeft className="size-4" />
              Back
            </Link>
          </Button>
          <h2 className="text-2xl font-bold tracking-tight">Order</h2>
          <p className="text-sm text-[var(--muted-foreground)]">
            {order?.order_number || orderId}
          </p>
        </div>
      </div>

      {loading ? (
        <Card>
          <CardContent className="py-12 text-center text-sm text-[var(--muted-foreground)]">Loading…</CardContent>
        </Card>
      ) : !order ? (
        <Card>
          <CardContent className="py-12 text-center text-sm text-[var(--muted-foreground)]">Order not found.</CardContent>
        </Card>
      ) : (
        <div className="grid gap-6 lg:grid-cols-3">
          {/* ── Left column ─────────────────────────────── */}
          <div className="space-y-6 lg:col-span-2">
            {/* Summary card */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
                  <ClipboardList className="size-5" />
                  Summary
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <div className="space-y-1">
                    <div className="text-sm text-[var(--muted-foreground)]">Total</div>
                    <div className="flex items-center gap-2 text-xl font-semibold">
                      <IndianRupee className="size-5 text-[var(--muted-foreground)]" />
                      {money(order.total_amount)}
                    </div>
                  </div>
                  <div className="flex flex-wrap items-center gap-2">
                    <Badge variant="outline" className={cn("text-xs", order.status === "Cancelled" && "border-red-300")}>
                      {order.status}
                    </Badge>
                    <Badge variant="outline" className={cn("text-xs", paymentBadge(order.payment_status))}>
                      {order.payment_status || "Unknown"}
                    </Badge>
                    <Badge variant="outline" className={cn("text-xs", fulfillmentBadge(order.fulfillment_status))}>
                      {order.fulfillment_status || "Unfulfilled"}
                    </Badge>
                  </div>
                </div>

                {/* Razorpay info */}
                {order.razorpay_order_id && (
                  <div className="rounded-lg border border-[var(--border)] p-3">
                    <div className="mb-1 text-xs font-medium text-[var(--muted-foreground)]">Razorpay</div>
                    <div className="grid gap-1 text-xs">
                      <div><span className="text-[var(--muted-foreground)]">Order ID:</span> {order.razorpay_order_id}</div>
                      {order.razorpay_payment_id && (
                        <div><span className="text-[var(--muted-foreground)]">Payment ID:</span> {order.razorpay_payment_id}</div>
                      )}
                      {order.paid_at && (
                        <div><span className="text-[var(--muted-foreground)]">Paid at:</span> {new Date(order.paid_at).toLocaleString()}</div>
                      )}
                    </div>
                  </div>
                )}

                {/* Customer + Shipping */}
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="rounded-lg border border-[var(--border)] p-4">
                    <div className="mb-2 flex items-center gap-2 text-sm font-medium">
                      <User className="size-4 text-[var(--muted-foreground)]" />
                      Customer
                    </div>
                    <div className="text-sm">
                      <div className="font-medium">{customer?.name || customer?.full_name || "—"}</div>
                      <div className="text-[var(--muted-foreground)]">{customer?.email || "—"}</div>
                      <div className="text-[var(--muted-foreground)]">{customer?.phone || customer?.mobile || "—"}</div>
                    </div>
                  </div>

                  <div className="rounded-lg border border-[var(--border)] p-4">
                    <div className="mb-2 flex items-center gap-2 text-sm font-medium">
                      <MapPin className="size-4 text-[var(--muted-foreground)]" />
                      Shipping
                    </div>
                    <div className="text-sm text-[var(--muted-foreground)]">
                      {shipAddr
                        ? [shipAddr.line1, shipAddr.line2, shipAddr.city, shipAddr.state, shipAddr.pincode]
                            .filter(Boolean)
                            .join(", ")
                        : "—"}
                    </div>
                  </div>
                </div>

                {/* Items */}
                <div className="rounded-lg border border-[var(--border)] p-4">
                  <div className="mb-2 text-sm font-medium">Items</div>
                  {items.length === 0 ? (
                    <div className="text-sm text-[var(--muted-foreground)]">No items data.</div>
                  ) : (
                    <div className="space-y-2">
                      {items.map((it, idx) => (
                        <div key={it.item_id || it.product_id || idx} className="flex items-start justify-between gap-3">
                          <div>
                            <div className="text-sm font-medium">{it.name || it.title || it.item_name || "Item"}</div>
                            <div className="text-xs text-[var(--muted-foreground)]">
                              Qty: {it.qty ?? it.quantity ?? 1}
                            </div>
                          </div>
                          <div className="text-sm font-medium">{money(it.total || it.amount || it.price)}</div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* ── Shipment card ──────────────────────────── */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
                  <Truck className="size-5" />
                  Shipping
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {!isShipped ? (
                  /* ── Ship Order section ── */
                  <div className="space-y-4">
                    {!isPaid ? (
                      <div className="flex items-center gap-3 rounded-lg border border-amber-200 bg-amber-50 p-4">
                        <Clock className="size-5 shrink-0 text-amber-600" />
                        <div className="text-sm text-amber-800">
                          <div className="font-medium">Awaiting payment</div>
                          <div>Order must be paid before shipping. Current payment status: {order.payment_status || "Unknown"}</div>
                        </div>
                      </div>
                    ) : (
                      <>
                        <div className="flex items-center gap-3 rounded-lg border border-emerald-200 bg-emerald-50 p-4">
                          <CheckCircle2 className="size-5 shrink-0 text-emerald-600" />
                          <div className="text-sm text-emerald-800">
                            <div className="font-medium">Payment confirmed</div>
                            <div>Ready to ship via Shiprocket.</div>
                          </div>
                        </div>

                        <div className="rounded-lg border border-[var(--border)] p-4">
                          <div className="mb-3 text-sm font-medium">Package Dimensions</div>
                          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                            <div>
                              <label className="mb-1 block text-xs text-[var(--muted-foreground)]">Length (cm)</label>
                              <input
                                type="number"
                                value={dims.length}
                                onChange={(e) => setDims((d) => ({ ...d, length: Number(e.target.value) || 0 }))}
                                className="flex h-9 w-full rounded-md border border-[var(--input)] bg-transparent px-3 py-1 text-sm"
                              />
                            </div>
                            <div>
                              <label className="mb-1 block text-xs text-[var(--muted-foreground)]">Breadth (cm)</label>
                              <input
                                type="number"
                                value={dims.breadth}
                                onChange={(e) => setDims((d) => ({ ...d, breadth: Number(e.target.value) || 0 }))}
                                className="flex h-9 w-full rounded-md border border-[var(--input)] bg-transparent px-3 py-1 text-sm"
                              />
                            </div>
                            <div>
                              <label className="mb-1 block text-xs text-[var(--muted-foreground)]">Height (cm)</label>
                              <input
                                type="number"
                                value={dims.height}
                                onChange={(e) => setDims((d) => ({ ...d, height: Number(e.target.value) || 0 }))}
                                className="flex h-9 w-full rounded-md border border-[var(--input)] bg-transparent px-3 py-1 text-sm"
                              />
                            </div>
                            <div>
                              <label className="mb-1 block text-xs text-[var(--muted-foreground)]">Weight (kg)</label>
                              <input
                                type="number"
                                step="0.1"
                                value={dims.weight}
                                onChange={(e) => setDims((d) => ({ ...d, weight: Number(e.target.value) || 0 }))}
                                className="flex h-9 w-full rounded-md border border-[var(--input)] bg-transparent px-3 py-1 text-sm"
                              />
                            </div>
                          </div>
                        </div>

                        <Button onClick={handleShipOrder} disabled={shipping} className="w-full gap-2">
                          {shipping ? (
                            <>
                              <Loader2 className="size-4 animate-spin" />
                              Creating shipment…
                            </>
                          ) : (
                            <>
                              <Package className="size-4" />
                              Ship Order via Shiprocket
                            </>
                          )}
                        </Button>
                      </>
                    )}
                  </div>
                ) : (
                  /* ── Shipment Info ── */
                  <div className="space-y-4">
                    <div className="flex items-center gap-3 rounded-lg border border-blue-200 bg-blue-50 p-4">
                      <Truck className="size-5 shrink-0 text-blue-600" />
                      <div className="text-sm text-blue-800">
                        <div className="font-medium">Shipped</div>
                        <div>
                          {shipment.courier_name ? `Courier: ${shipment.courier_name}` : "Courier pending assignment"}
                        </div>
                      </div>
                    </div>

                    <div className="grid gap-3 sm:grid-cols-2">
                      <div className="rounded-lg border border-[var(--border)] p-3">
                        <div className="text-xs text-[var(--muted-foreground)]">AWB Code</div>
                        <div className="mt-1 text-sm font-semibold">{shipment.awb_code || "Pending"}</div>
                      </div>
                      <div className="rounded-lg border border-[var(--border)] p-3">
                        <div className="text-xs text-[var(--muted-foreground)]">Courier</div>
                        <div className="mt-1 text-sm font-semibold">{shipment.courier_name || "Pending"}</div>
                      </div>
                      <div className="rounded-lg border border-[var(--border)] p-3">
                        <div className="text-xs text-[var(--muted-foreground)]">Shiprocket Order ID</div>
                        <div className="mt-1 text-sm font-semibold">{shipment.shiprocket_order_id}</div>
                      </div>
                      <div className="rounded-lg border border-[var(--border)] p-3">
                        <div className="text-xs text-[var(--muted-foreground)]">Shipped At</div>
                        <div className="mt-1 text-sm font-semibold">
                          {shipment.shipped_at ? new Date(shipment.shipped_at).toLocaleString() : "—"}
                        </div>
                      </div>
                    </div>

                    {shipment.courier_assign_error && (
                      <div className="flex items-center gap-3 rounded-lg border border-red-200 bg-red-50 p-4">
                        <XCircle className="size-5 shrink-0 text-red-600" />
                        <div className="text-sm text-red-800">
                          <div className="font-medium">Courier assignment issue</div>
                          <div>{shipment.courier_assign_error}</div>
                          <div className="mt-1 text-xs">You can assign a courier manually from the Shiprocket panel.</div>
                        </div>
                      </div>
                    )}

                    {shipment.tracking_url && (
                      <a
                        href={shipment.tracking_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-2 text-sm font-medium text-[var(--primary)] hover:underline"
                      >
                        <ExternalLink className="size-4" />
                        Track on Shiprocket
                      </a>
                    )}

                    <Button onClick={handleFetchTracking} disabled={trackingLoading} variant="outline" className="w-full gap-2">
                      {trackingLoading ? (
                        <>
                          <Loader2 className="size-4 animate-spin" />
                          Fetching tracking…
                        </>
                      ) : (
                        <>
                          <RefreshCw className="size-4" />
                          Refresh Tracking
                        </>
                      )}
                    </Button>

                    {trackingData?.tracking_summary && (
                      <div className="rounded-lg border border-[var(--border)] p-4">
                        <div className="mb-3 text-sm font-medium">Live Shipment Summary</div>
                        <div className="grid gap-2 text-sm">
                          <div><span className="text-[var(--muted-foreground)]">Current Status:</span> {trackingData.tracking_summary.current_status || "—"}</div>
                          <div><span className="text-[var(--muted-foreground)]">Expected Delivery:</span> {trackingData.tracking_summary.expected_delivery_date || "—"}</div>
                          <div><span className="text-[var(--muted-foreground)]">Last Update:</span> {trackingData.tracking_summary.last_event_at || "—"}</div>
                          <div><span className="text-[var(--muted-foreground)]">Last Location:</span> {trackingData.tracking_summary.last_event_location || "—"}</div>
                        </div>
                      </div>
                    )}

                    {/* Tracking events */}
                    {trackingData && (
                      <div className="rounded-lg border border-[var(--border)] p-4">
                        <div className="mb-3 text-sm font-medium">Tracking Events</div>
                        {(() => {
                          const activities =
                            trackingData?.tracking?.tracking_data?.shipment_track_activities ||
                            trackingData?.tracking?.tracking_data?.track_activities ||
                            [];
                          if (activities.length === 0) {
                            return <div className="text-sm text-[var(--muted-foreground)]">No tracking events yet.</div>;
                          }
                          return (
                            <div className="space-y-3">
                              {activities.map((act, idx) => (
                                <div key={idx} className="flex gap-3">
                                  <div className="mt-0.5 flex flex-col items-center">
                                    <div className={cn(
                                      "size-2.5 rounded-full",
                                      idx === 0 ? "bg-[var(--primary)]" : "bg-slate-300"
                                    )} />
                                    {idx < activities.length - 1 && <div className="mt-1 h-full w-px bg-slate-200" />}
                                  </div>
                                  <div className="pb-3">
                                    <div className="text-sm font-medium">{act["sr-status"] || act.activity || act.status || "Update"}</div>
                                    <div className="text-xs text-[var(--muted-foreground)]">{act.location || ""}</div>
                                    <div className="text-xs text-[var(--muted-foreground)]">{act.date || ""}</div>
                                  </div>
                                </div>
                              ))}
                            </div>
                          );
                        })()}
                      </div>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* ── Right column: Update Status ──────────────── */}
          <Card className="h-fit">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <RefreshCw className="size-5" />
                Update status
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="space-y-2">
                <div className="text-sm font-medium">Status</div>
                <select
                  value={status}
                  onChange={(e) => setStatus(e.target.value)}
                  className={cn(
                    "flex h-10 w-full rounded-lg border border-[var(--input)] bg-transparent px-3 py-2 text-sm",
                    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ring)]"
                  )}
                >
                  {ORDER_STATUSES.map((s) => (
                    <option key={s} value={s}>
                      {s}
                    </option>
                  ))}
                </select>
              </div>

              <Button onClick={updateStatus} disabled={saving || !status} className="w-full">
                {saving ? "Saving…" : "Save"}
              </Button>

              <div className="space-y-2 border-t border-slate-100 pt-3">
                <div className="text-sm font-medium">Cancel order</div>
                <input
                  placeholder="Cancel reason"
                  value={cancelReason}
                  onChange={(e) => setCancelReason(e.target.value)}
                  className="flex h-9 w-full rounded-md border border-[var(--input)] bg-transparent px-3 text-sm"
                />
                <Button onClick={handleCancelOrder} disabled={saving} variant="outline" className="w-full">
                  Cancel Order
                </Button>
              </div>

              <div className="space-y-2 border-t border-slate-100 pt-3">
                <div className="text-sm font-medium">Refund</div>
                <input
                  placeholder="Amount (leave empty for full)"
                  value={refundAmount}
                  onChange={(e) => setRefundAmount(e.target.value)}
                  className="flex h-9 w-full rounded-md border border-[var(--input)] bg-transparent px-3 text-sm"
                />
                <input
                  placeholder="Refund reason"
                  value={refundReason}
                  onChange={(e) => setRefundReason(e.target.value)}
                  className="flex h-9 w-full rounded-md border border-[var(--input)] bg-transparent px-3 text-sm"
                />
                <Button onClick={handleRefundOrder} disabled={saving} variant="outline" className="w-full">
                  Initiate Refund
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
