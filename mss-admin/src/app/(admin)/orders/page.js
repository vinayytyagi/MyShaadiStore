"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import {
  ShoppingCart,
  IndianRupee,
  Search,
  Calendar,
  User,
  Truck,
  CheckCircle2,
  Clock,
  XCircle,
  ChevronRight,
  ArrowUpDown,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import SectionHeader from "@/components/ui/section-header";

const API_BASE = "/api/v1";
const PAGE_SIZE = 25;

function getToken() {
  if (typeof window === "undefined") return null;
  return localStorage.getItem("mss_token");
}

const statusConfig = {
  Paid: { color: "bg-emerald-50 text-emerald-700 border-emerald-100", icon: <CheckCircle2 className="h-3 w-3" /> },
  Pending: { color: "bg-amber-50 text-amber-700 border-amber-100", icon: <Clock className="h-3 w-3" /> },
  Failed: { color: "bg-red-50 text-red-700 border-red-100", icon: <XCircle className="h-3 w-3" /> },
  Shipped: { color: "bg-blue-50 text-blue-700 border-blue-100", icon: <Truck className="h-3 w-3" /> },
  Delivered: { color: "bg-indigo-50 text-indigo-700 border-indigo-100", icon: <CheckCircle2 className="h-3 w-3" /> },
  Cancelled: { color: "bg-slate-100 text-slate-600 border-slate-200", icon: <XCircle className="h-3 w-3" /> },
};

export default function OrdersPage() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const listQ = (searchParams.get("q") || "").trim();
  const sort = (searchParams.get("sort") || "created_at").trim();
  const dir = (searchParams.get("dir") || "desc").toLowerCase() === "asc" ? "asc" : "desc";
  const page = Math.max(1, Number(searchParams.get("page")) || 1);

  const [orders, setOrders] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [draftQ, setDraftQ] = useState(listQ);

  useEffect(() => {
    setDraftQ(listQ);
  }, [listQ]);

  useEffect(() => {
    if (draftQ === listQ) return;
    const h = setTimeout(() => {
      const q = new URLSearchParams(searchParams.toString());
      if (draftQ.trim()) q.set("q", draftQ.trim());
      else q.delete("q");
      q.set("page", "1");
      router.replace(q.toString() ? `${pathname}?${q}` : pathname, { scroll: false });
    }, 400);
    return () => clearTimeout(h);
  }, [draftQ, listQ, pathname, router, searchParams]);

  const setSort = useCallback(
    (field) => {
      const q = new URLSearchParams(searchParams.toString());
      const cur = (q.get("sort") || "created_at").trim();
      const curDir = (q.get("dir") || "desc").toLowerCase();
      if (cur === field) {
        q.set("dir", curDir === "asc" ? "desc" : "asc");
      } else {
        q.set("sort", field);
        q.set("dir", field === "order_number" || field === "status" || field === "customer_name" ? "asc" : "desc");
      }
      q.set("page", "1");
      router.replace(q.toString() ? `${pathname}?${q}` : pathname, { scroll: false });
    },
    [pathname, router, searchParams],
  );

  function goPage(nextPage) {
    const q = new URLSearchParams(searchParams.toString());
    if (nextPage <= 1) q.delete("page");
    else q.set("page", String(nextPage));
    router.replace(q.toString() ? `${pathname}?${q}` : pathname, { scroll: false });
  }

  const load = useCallback(() => {
    const token = getToken();
    if (!token) return;
    setLoading(true);
    const qs = new URLSearchParams();
    if (listQ) qs.set("q", listQ);
    qs.set("sort", sort);
    qs.set("dir", dir);
    qs.set("page", String(page));
    qs.set("limit", String(PAGE_SIZE));
    fetch(`${API_BASE}/admin/orders?${qs.toString()}`, { headers: { Authorization: `Bearer ${token}` } })
      .then((r) => r.json())
      .then((d) => {
        setOrders(d.orders || []);
        setTotal(Number(d.total) || 0);
      })
      .catch((err) => console.error("Failed to load orders:", err))
      .finally(() => setLoading(false));
  }, [listQ, sort, dir, page]);

  useEffect(() => {
    load();
  }, [load]);

  const canPrev = page > 1;
  const canNext = page * PAGE_SIZE < total;

  function SortHead({ field, children, className }) {
    const active = sort === field;
    return (
      <TableHead className={cn("font-semibold text-slate-700", className)}>
        <button
          type="button"
          onClick={() => setSort(field)}
          className={cn(
            "inline-flex items-center gap-1 rounded-md px-1 py-0.5 text-left hover:bg-slate-100/80",
            active && "text-blue-700",
          )}
        >
          {children}
          <ArrowUpDown className="h-3.5 w-3.5 shrink-0 opacity-50" />
        </button>
      </TableHead>
    );
  }

  return (
    <div className="space-y-8 pb-10 px-1">
      <SectionHeader
        title="Order fulfillment"
        description="Track and process customer purchases and shipment status."
        action={
          <Badge variant="outline" className="flex h-10 items-center gap-2 border-slate-200 bg-white px-4 py-1.5 text-slate-600 font-medium">
            <ShoppingCart className="h-4 w-4 text-pink-500" />
            {loading ? "…" : `${total.toLocaleString()} orders`}
          </Badge>
        }
      />

      <Card className="border-none shadow-sm ring-1 ring-slate-100 overflow-hidden bg-white">
        <CardHeader className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between bg-white border-b border-slate-50 py-5">
          <div className="flex items-center gap-3">
            <div className="rounded-xl bg-blue-50 p-2.5 ring-1 ring-blue-100">
              <ShoppingCart className="h-5 w-5 text-blue-500" />
            </div>
            <div>
              <CardTitle className="text-lg font-semibold">Live Orders</CardTitle>
              <CardDescription>Search and sort run on the server; URL holds the current view.</CardDescription>
            </div>
          </div>
          <div className="relative w-full sm:max-w-md">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <Input
              value={draftQ}
              onChange={(e) => setDraftQ(e.target.value)}
              placeholder="Search order #, customer name, phone, status…"
              className="pl-10 h-10 border-slate-200 focus:border-blue-300 ring-0 focus-visible:ring-0"
            />
          </div>
        </CardHeader>

        <CardContent className="p-0">
          {loading ? (
            <div className="flex flex-col items-center justify-center gap-4 py-24">
              <div className="h-10 w-10 animate-spin rounded-full border-4 border-blue-500 border-t-transparent" />
              <p className="text-sm font-medium text-slate-400">Fetching order journal...</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader className="bg-slate-50/50">
                  <TableRow>
                    <TableHead className="w-10 font-semibold text-slate-700">#</TableHead>
                    <SortHead field="order_number" className="w-[160px]">
                      Order ID
                    </SortHead>
                    <SortHead field="customer_name">Customer</SortHead>
                    <SortHead field="total_amount">Amount</SortHead>
                    <SortHead field="status">Order status</SortHead>
                    <TableHead className="font-semibold text-slate-700">Payment</TableHead>
                    <TableHead className="w-[80px] text-right" />
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {orders.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={7} className="h-32 text-center text-slate-400 italic">
                        {total === 0 ? "No orders placed yet." : "No matching orders found."}
                      </TableCell>
                    </TableRow>
                  ) : (
                    orders.map((o, idx) => (
                      <TableRow key={o.order_id} className="group transition-colors hover:bg-slate-50/30">
                        <TableCell className="text-sm font-medium tabular-nums text-slate-500">
                          {(page - 1) * PAGE_SIZE + idx + 1}
                        </TableCell>
                        <TableCell>
                          <div className="flex flex-col">
                            <span className="font-bold text-slate-800">
                              {o.order_number || "#" + String(o.order_id || "").slice(-6)}
                            </span>
                            <span className="mt-1 flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-tighter text-slate-400">
                              <Calendar className="h-3 w-3" />
                              {new Date(o.created_at).toLocaleDateString(undefined, {
                                day: "2-digit",
                                month: "short",
                                year: "numeric",
                              })}
                            </span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-3">
                            <div className="flex h-9 w-9 items-center justify-center rounded-full border border-slate-200 bg-slate-100">
                              <User className="h-4 w-4 text-slate-500" />
                            </div>
                            <div className="flex flex-col">
                              <span className="text-sm font-semibold text-slate-700">{o.customer?.name || "Guest User"}</span>
                              <span className="text-xs text-slate-500">{o.customer?.phone || "No phone"}</span>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex flex-col gap-1">
                            <div className="flex items-center gap-1 text-sm font-bold leading-none text-slate-900">
                              <IndianRupee className="h-3.5 w-3.5 text-slate-600" />
                              {Number(o.total_amount || 0).toLocaleString()}
                            </div>
                            <span className="flex items-center gap-1 text-[10px] font-bold uppercase tracking-tighter text-slate-400">
                              <ShoppingCart className="h-3 w-3" />
                              {o.items?.length || 0} Items
                            </span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge
                            variant="outline"
                            className={cn(
                              "flex w-fit items-center gap-1.5 rounded-lg px-2.5 py-1 font-medium",
                              statusConfig[o.status]?.color || "bg-slate-50 text-slate-600",
                            )}
                          >
                            {statusConfig[o.status]?.icon || <Clock className="h-3 w-3" />}
                            {o.status}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Badge
                            variant="outline"
                            className={cn(
                              "rounded-lg px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider",
                              o.payment_status === "Paid"
                                ? "border-emerald-200 bg-emerald-50 text-emerald-600"
                                : "border-slate-200 bg-slate-50 text-slate-400",
                            )}
                          >
                            {o.payment_status || "Unpaid"}
                          </Badge>
                        </TableCell>
                        <TableCell className="whitespace-nowrap text-right">
                          <Button
                            variant="ghost"
                            size="sm"
                            asChild
                            className="h-9 w-9 rounded-full p-0 transition-colors hover:bg-blue-50 hover:text-blue-600"
                          >
                            <Link href={`/orders/${o.order_id}`}>
                              <ChevronRight className="h-5 w-5" />
                              <span className="sr-only">View Details</span>
                            </Link>
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
        <div className="flex flex-col gap-3 border-t border-slate-50 bg-slate-50/30 px-6 py-4 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-xs font-bold uppercase tracking-widest text-slate-400">
            {total.toLocaleString()} records · {PAGE_SIZE} per page
          </p>
          <div className="flex items-center gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="h-9 rounded-lg border-slate-200"
              disabled={!canPrev || loading}
              onClick={() => goPage(page - 1)}
            >
              Previous
            </Button>
            <div className="flex h-9 min-w-9 items-center justify-center rounded-lg border border-slate-200 bg-white px-2 font-mono text-xs font-bold">
              {page}
            </div>
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="h-9 rounded-lg border-slate-200"
              disabled={!canNext || loading}
              onClick={() => goPage(page + 1)}
            >
              Next
            </Button>
          </div>
        </div>
      </Card>
    </div>
  );
}
