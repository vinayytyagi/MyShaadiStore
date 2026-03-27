"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { ArrowLeft, FileText, Mail, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

const API_BASE = "/api/v1";

function getToken() {
  if (typeof window === "undefined") return null;
  return localStorage.getItem("mss_token");
}

function money(value) {
  return `₹${Number(value || 0).toLocaleString()}`;
}

function formatDate(value) {
  if (!value) return "—";
  return new Date(value).toLocaleString("en-IN", {
    dateStyle: "medium",
    timeStyle: "short",
  });
}

export default function QuotationRequestDetailsPage() {
  const params = useParams();
  const quotationId = useMemo(() => params?.quotationId, [params]);
  const [loading, setLoading] = useState(true);
  const [requestItem, setRequestItem] = useState(null);

  useEffect(() => {
    async function load() {
      const token = getToken();
      if (!token || !quotationId) return;
      setLoading(true);
      try {
        const res = await fetch(`${API_BASE}/admin/quotation-requests/${quotationId}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const data = await res.json();
        if (res.ok) setRequestItem(data);
      } finally {
        setLoading(false);
      }
    }

    load();
  }, [quotationId]);

  return (
    <div className="space-y-6">
      <div>
        <Button variant="ghost" size="sm" asChild className="-ml-2 gap-2">
          <Link href="/quotation-requests">
            <ArrowLeft className="size-4" />
            Back
          </Link>
        </Button>
        <h2 className="text-2xl font-bold tracking-tight">Quotation Request</h2>
        <p className="text-sm text-muted-foreground">{quotationId}</p>
      </div>

      {loading ? (
        <Card>
          <CardContent className="py-12 text-center text-sm text-muted-foreground">
            Loading…
          </CardContent>
        </Card>
      ) : !requestItem ? (
        <Card>
          <CardContent className="py-12 text-center text-sm text-muted-foreground">
            Quotation request not found.
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-6 lg:grid-cols-3">
          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <FileText className="size-5" />
                Request Summary
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="text-sm text-muted-foreground">
                  Submitted {formatDate(requestItem.created_at)}
                </div>
                <Badge variant="outline">{requestItem.email_status || "pending"}</Badge>
              </div>

              <div className="rounded-lg border border-border p-4">
                <div className="mb-2 text-sm font-medium">Items</div>
                {Array.isArray(requestItem.items) && requestItem.items.length > 0 ? (
                  <div className="space-y-3">
                    {requestItem.items.map((item, index) => (
                      <div
                        key={item.item_id || index}
                        className="flex items-start justify-between gap-3 rounded-lg border border-border p-3"
                      >
                        <div>
                          <div className="text-sm font-medium">{item.name || "Item"}</div>
                          <div className="text-xs text-muted-foreground">
                            {item.journey_title || item.category_label || item.item_type || "—"}
                          </div>
                          <div className="text-xs text-muted-foreground">
                            {item.subcategory_label || item.location_city || "—"}
                          </div>
                          <div className="text-xs text-muted-foreground">
                            Qty: {item.quantity || 1}
                          </div>
                        </div>
                        <div className="text-sm font-medium">{money(item.final_price || item.price)}</div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-sm text-muted-foreground">No items found.</div>
                )}
              </div>

              <div className="rounded-lg border border-border p-4">
                <div className="mb-2 text-sm font-medium">Customer Note</div>
                <div className="text-sm text-muted-foreground">{requestItem.note || "—"}</div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <User className="size-5" />
                Customer
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="rounded-lg border border-border p-4">
                <div className="text-sm font-medium">{requestItem.customer?.name || "—"}</div>
                <div className="mt-1 text-sm text-muted-foreground">
                  {requestItem.customer?.phone || "—"}
                </div>
                <div className="mt-1 text-sm text-muted-foreground">
                  {requestItem.customer?.email || "—"}
                </div>
              </div>

              <div className="rounded-lg border border-border p-4">
                <div className="mb-2 flex items-center gap-2 text-sm font-medium">
                  <Mail className="size-4 text-muted-foreground" />
                  Email Delivery
                </div>
                <div className="text-sm text-muted-foreground">
                  Status: {requestItem.email_status || "pending"}
                </div>
                <div className="mt-2 text-xs text-muted-foreground">
                  {requestItem.email_error || "No email error recorded."}
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
