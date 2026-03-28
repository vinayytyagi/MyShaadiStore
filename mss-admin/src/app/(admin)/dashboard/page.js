"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { 
  IndianRupee, 
  Users, 
  ShoppingCart, 
  TrendingUp, 
  ArrowRight,
  Package,
  Store,
  Calendar,
  ChevronRight
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer, 
  AreaChart, 
  Area 
} from "recharts";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

const API_BASE = "/api/v1";

function getToken() {
  if (typeof window === "undefined") return null;
  return localStorage.getItem("mss_token");
}

export default function DashboardPage() {
  const router = useRouter();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = getToken();
    if (!token) return;
    fetch(`${API_BASE}/admin/dashboard`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((r) => r.json())
      .then(setData)
      .catch(() =>
        setData({ 
          totalSales: 0, 
          totalVendors: 0, 
          totalOrders: 0, 
          revenueByPeriod: { last7Days: 0 },
          chartData: [],
          recentOrders: [],
          topVendors: []
        })
      )
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="flex h-[70vh] items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="h-12 w-12 animate-spin rounded-full border-4 border-pink-500 border-t-transparent" />
          <p className="text-sm font-medium text-slate-500">Preparing your business overview...</p>
        </div>
      </div>
    );
  }

  const stats = [
    {
      label: "Total Sales",
      amount: `₹${(data?.totalSales || 0).toLocaleString()}`,
      description: "Lifetime revenue",
      icon: <IndianRupee className="h-5 w-5" />,
      color: "text-emerald-600",
      bg: "bg-emerald-50",
    },
    {
      label: "Total Orders",
      amount: (data?.totalOrders || 0).toString(),
      description: "Orders placed",
      icon: <ShoppingCart className="h-5 w-5" />,
      color: "text-blue-600",
      bg: "bg-blue-50",
    },
    {
      label: "Active Vendors",
      amount: (data?.totalVendors || 0).toString(),
      description: "Onboarded partners",
      icon: <Users className="h-5 w-5" />,
      color: "text-violet-600",
      bg: "bg-violet-50",
    },
    {
      label: "7d Revenue",
      amount: `₹${(data?.revenueByPeriod?.last7Days || 0).toLocaleString()}`,
      description: "Last 7 days",
      icon: <TrendingUp className="h-5 w-5" />,
      color: "text-pink-600",
      bg: "bg-pink-50",
    },
  ];

  return (
    <div className="space-y-8 pb-10">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight text-slate-900">Dashboard</h1>
          <p className="text-sm text-slate-500">Welcome back! Here's what's happening today.</p>
        </div>
        <div className="flex items-center gap-3">
          <Button variant="outline" className="h-10 gap-2 border-pink-200 text-pink-700 hover:bg-pink-50 hover:text-pink-800" asChild>
            <Link href="/orders">
              <Package className="h-4 w-4" />
              Orders
            </Link>
          </Button>
          <Button className="h-10 gap-2 bg-pink-600 hover:bg-pink-700" asChild>
            <Link href="/vendors">
              <Store className="h-4 w-4" />
              Add Vendor
            </Link>
          </Button>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat, i) => (
          <Card key={i} className="overflow-hidden border-none bg-white shadow-sm ring-1 ring-slate-100 transition-all hover:shadow-md">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-slate-500">{stat.label}</p>
                  <h3 className="mt-1 text-2xl font-semibold text-slate-900">{stat.amount}</h3>
                  <p className="mt-1 text-xs text-slate-400">{stat.description}</p>
                </div>
                <div className={`rounded-2xl p-3 ${stat.bg} ${stat.color}`}>
                  {stat.icon}
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-7">
        {/* Revenue Chart */}
        <Card className="lg:col-span-4 border-none shadow-sm ring-1 ring-slate-100">
          <CardHeader>
            <CardTitle className="text-lg font-semibold">Revenue Overview</CardTitle>
            <CardDescription>Daily sales progress over the last 7 days</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[300px] w-full pt-4">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={data?.chartData}>
                  <defs>
                    <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#ff4f86" stopOpacity={0.1}/>
                      <stop offset="95%" stopColor="#ff4f86" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis 
                    dataKey="name" 
                    axisLine={false} 
                    tickLine={false} 
                    tick={{fill: '#64748b', fontSize: 12}}
                    dy={10}
                  />
                  <YAxis 
                    axisLine={false} 
                    tickLine={false} 
                    tick={{fill: '#64748b', fontSize: 12}}
                    tickFormatter={(val) => `₹${val >= 1000 ? (val/1000).toFixed(0) + 'k' : val}`}
                  />
                  <Tooltip 
                    contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                    formatter={(val) => [`₹${val.toLocaleString()}`, 'Revenue']}
                  />
                  <Area 
                    type="monotone" 
                    dataKey="revenue" 
                    stroke="#ff4f86" 
                    strokeWidth={2.5}
                    fillOpacity={1} 
                    fill="url(#colorRevenue)" 
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Top Vendors */}
        <Card className="lg:col-span-3 border-none shadow-sm ring-1 ring-slate-100">
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle className="text-lg font-semibold">Our Top Vendors</CardTitle>
              <CardDescription>Recently active partners</CardDescription>
            </div>
            <Button variant="ghost" size="sm" asChild>
              <Link href="/vendors" className="text-pink-600 hover:text-pink-700 hover:bg-pink-50 transition-colors">
                View all
              </Link>
            </Button>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              {data?.topVendors?.map((v) => (
                <div key={v.id} className="flex items-center gap-4 group">
                  <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-pink-100 text-pink-600 font-bold transition-transform group-hover:scale-110">
                    {v.business_name?.[0] || 'V'}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-slate-900 truncate">{v.business_name}</p>
                    <p className="text-xs text-slate-500 truncate">{v.vendor_type} • {v.city || 'No City'}</p>
                  </div>
                  <Badge variant="outline" className={`${v.status === 'Active' ? 'bg-emerald-50 text-emerald-700 border-emerald-100' : 'bg-slate-50 text-slate-600'}`}>
                    {v.status}
                  </Badge>
                </div>
              ))}
              {!data?.topVendors?.length && (
                <div className="py-10 text-center">
                  <p className="text-sm text-slate-400 font-medium">No vendors found</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recent Orders Table */}
      <Card className="border-none shadow-sm ring-1 ring-slate-100">
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle className="text-lg font-semibold">Recent Orders</CardTitle>
            <CardDescription>The latest 5 transactions in your store</CardDescription>
          </div>
          <Button variant="outline" size="sm" asChild className="rounded-lg">
            <Link href="/orders">View All Orders</Link>
          </Button>
        </CardHeader>
        <CardContent>
          <div className="rounded-xl border border-slate-100 overflow-hidden">
            <Table>
              <TableHeader className="bg-slate-50/50">
                <TableRow>
                  <TableHead className="font-semibold text-slate-700">Order ID</TableHead>
                  <TableHead className="font-semibold text-slate-700">Customer</TableHead>
                  <TableHead className="font-semibold text-slate-700">Date</TableHead>
                  <TableHead className="font-semibold text-slate-700">Status</TableHead>
                  <TableHead className="font-semibold text-slate-700 text-right">Amount</TableHead>
                  <TableHead className="w-[50px]"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data?.recentOrders?.map((order) => (
                  <TableRow key={order.id} className="hover:bg-slate-50/50 transition-colors cursor-pointer" onClick={() => router.push(`/orders/${order.id}`)}>
                    <TableCell className="font-medium text-slate-900">{order.order_number}</TableCell>
                    <TableCell className="text-slate-600">{order.customer_name || 'Anonymous'}</TableCell>
                    <TableCell className="text-slate-500 text-xs">
                      {new Date(order.created_at).toLocaleDateString()}
                    </TableCell>
                    <TableCell>
                      <Badge 
                        variant="outline"
                        className={cn(
                          "rounded-full px-3 py-0.5 font-bold text-[10px] transition-all shadow-sm",
                          order.status === 'Paid' || order.status === 'Confirmed' || order.status === 'Delivered'
                            ? "bg-emerald-100/80 text-emerald-700 border-emerald-200/60 shadow-emerald-50" 
                            : order.status === 'Cancelled' 
                            ? "bg-red-100/80 text-red-700 border-red-200/60 shadow-red-50" 
                            : "bg-amber-100/80 text-amber-700 border-amber-200/60 shadow-amber-50"
                        )}
                      >
                        {['Paid', 'Confirmed', 'Delivered'].includes(order.status) && (
                           <div className="size-1 rounded-full bg-emerald-500 mr-1.5 animate-pulse" />
                        )}
                        {order.status.toUpperCase()}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right font-bold text-slate-900">
                      ₹{order.total_amount.toLocaleString()}
                    </TableCell>
                    <TableCell>
                      <ChevronRight className="h-4 w-4 text-slate-300" />
                    </TableCell>
                  </TableRow>
                ))}
                {!data?.recentOrders?.length && (
                  <TableRow>
                    <TableCell colSpan={6} className="h-24 text-center text-slate-400">
                      No orders yet
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
