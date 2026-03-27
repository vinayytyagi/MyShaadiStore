"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { 
  ShoppingCart, 
  IndianRupee, 
  Eye, 
  Search, 
  Filter, 
  MoreHorizontal, 
  Calendar,
  User,
  Truck,
  CreditCard,
  CheckCircle2,
  Clock,
  XCircle,
  ChevronRight
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuLabel, 
  DropdownMenuSeparator, 
  DropdownMenuTrigger 
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";
import SectionHeader from "@/components/ui/section-header";

const API_BASE = "/api/v1";

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
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  useEffect(() => {
    const token = getToken();
    if (!token) return;
    fetch(`${API_BASE}/admin/orders`, { headers: { Authorization: `Bearer ${token}` } })
      .then((r) => r.json())
      .then((d) => setOrders(d.orders || []))
      .catch((err) => console.error("Failed to load orders:", err))
      .finally(() => setLoading(false));
  }, []);

  const filtered = orders.filter((o) => {
    const q = search.trim().toLowerCase();
    if (!q) return true;
    const searchable = `${o.order_number} ${o.customer_name || ""} ${o.phone || ""} ${o.status || ""}`.toLowerCase();
    return searchable.includes(q);
  });

  return (
    <div className="space-y-8 pb-10 px-1">
      <SectionHeader
        title="Order fulfillment"
        description="Track and process customer purchases and shipment status."
        action={
          <Badge variant="outline" className="flex h-10 items-center gap-2 border-slate-200 bg-white px-4 py-1.5 text-slate-600 font-medium">
            <ShoppingCart className="h-4 w-4 text-pink-500" />
            {orders.length} total orders
          </Badge>
        }
      />

      <Card className="border-none shadow-sm ring-1 ring-slate-100 overflow-hidden bg-white">
        <CardHeader className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between bg-white border-b border-slate-50 py-5">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-blue-50 ring-1 ring-blue-100">
              <ShoppingCart className="h-5 w-5 text-blue-500" />
            </div>
            <div>
              <CardTitle className="text-lg font-semibold">Live Orders</CardTitle>
              <CardDescription>Real-time view of customer transactions</CardDescription>
            </div>
          </div>
          <div className="relative w-full sm:max-w-md">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <Input 
              value={search} 
              onChange={(e) => setSearch(e.target.value)} 
              placeholder="Search by order ID, customer name or phone..." 
              className="pl-10 h-10 border-slate-200 focus:border-blue-300 ring-0 focus-visible:ring-0"
            />
          </div>
        </CardHeader>

        <CardContent className="p-0">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-24 gap-4">
              <div className="h-10 w-10 animate-spin rounded-full border-4 border-blue-500 border-t-transparent" />
              <p className="text-sm font-medium text-slate-400">Fetching order journal...</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader className="bg-slate-50/50">
                  <TableRow>
                    <TableHead className="font-semibold text-slate-700 w-[160px]">Order ID</TableHead>
                    <TableHead className="font-semibold text-slate-700">Customer Details</TableHead>
                    <TableHead className="font-semibold text-slate-700">Transaction info</TableHead>
                    <TableHead className="font-semibold text-slate-700">Order Status</TableHead>
                    <TableHead className="font-semibold text-slate-700">Payment</TableHead>
                    <TableHead className="text-right w-[80px]"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filtered.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={6} className="h-32 text-center text-slate-400 italic">
                        {orders.length === 0 ? "No orders placed yet." : "No matching orders found."}
                      </TableCell>
                    </TableRow>
                  ) : (
                    filtered.map((o) => (
                      <TableRow key={o.order_id} className="hover:bg-slate-50/30 transition-colors group">
                        <TableCell>
                          <div className="flex flex-col">
                            <span className="font-bold text-slate-800">{o.order_number || "#" + o.order_id.slice(-6)}</span>
                            <span className="flex items-center gap-1.5 text-[10px] text-slate-400 font-bold uppercase tracking-tighter mt-1">
                              <Calendar className="h-3 w-3" />
                              {new Date(o.created_at).toLocaleDateString(undefined, { day: '2-digit', month: 'short', year: 'numeric' })}
                            </span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-3">
                            <div className="h-9 w-9 rounded-full bg-slate-100 flex items-center justify-center border border-slate-200">
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
                            <div className="flex items-center gap-1 text-sm font-bold text-slate-900 leading-none">
                              <IndianRupee className="h-3.5 w-3.5 text-slate-600" />
                              {Number(o.total_amount || 0).toLocaleString()}
                            </div>
                            <span className="text-[10px] text-slate-400 font-bold uppercase tracking-tighter flex items-center gap-1">
                              <ShoppingCart className="h-3 w-3" />
                              {o.items?.length || 0} Items
                            </span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge 
                            variant="outline" 
                            className={cn(
                              "flex items-center gap-1.5 w-fit rounded-lg px-2.5 py-1 font-medium",
                              statusConfig[o.status]?.color || "bg-slate-50 text-slate-600"
                            )}
                          >
                            {statusConfig[o.status]?.icon || <Clock className="h-3 w-3" />}
                            {o.status}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                             <Badge 
                              variant="outline" 
                              className={cn(
                                "rounded-lg px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider",
                                o.payment_status === "Paid" ? "border-emerald-200 text-emerald-600 bg-emerald-50" : "border-slate-200 text-slate-400 bg-slate-50"
                              )}
                            >
                              {o.payment_status || "Unpaid"}
                            </Badge>
                          </div>
                        </TableCell>
                        <TableCell className="text-right whitespace-nowrap">
                          <Button variant="ghost" size="sm" asChild className="h-9 w-9 p-0 rounded-full hover:bg-blue-50 hover:text-blue-600 transition-colors">
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
      </Card>
    </div>
  );
}
