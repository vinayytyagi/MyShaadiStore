import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth";
import { getVendorCollection, getOrdersCollection } from "@/lib/db";

export async function GET(request) {
  const err = requireAdmin(request);
  if (err) return err;
  try {
    const [vendorCol, orderCol] = await Promise.all([getVendorCollection(), getOrdersCollection()]);
    const [totalVendors, orders] = await Promise.all([
      vendorCol.countDocuments({ status: "Active" }),
      orderCol.find({}).toArray(),
    ]);
    const totalOrders = orders.length;
    const totalSales = orders.reduce((s, o) => s + (Number(o.total_amount) || 0), 0);
    const now = new Date();
    const last7Days = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date(now);
      d.setDate(d.getDate() - i);
      const dayStr = d.toISOString().split("T")[0];
      const dayOrders = orders.filter((o) => new Date(o.created_at).toISOString().split("T")[0] === dayStr);
      last7Days.push({
        name: d.toLocaleDateString("en-US", { weekday: "short" }),
        revenue: dayOrders.reduce((s, o) => s + (Number(o.total_amount) || 0), 0),
        orders: dayOrders.length,
      });
    }

    const recentOrders = orders
      .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
      .slice(0, 5)
      .map((o) => ({ ...o, id: o._id.toString() }));

    const topVendors = await vendorCol.find({ status: "Active" }).limit(5).toArray();

    return NextResponse.json({
      totalSales,
      totalVendors,
      totalOrders,
      revenueByPeriod: {
        last7Days: orders
          .filter((o) => new Date(o.created_at) > new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000))
          .reduce((s, o) => s + (Number(o.total_amount) || 0), 0),
      },
      chartData: last7Days,
      recentOrders,
      topVendors: topVendors.map((v) => ({ ...v, id: v._id.toString() })),
    });
  } catch (e) {
    return NextResponse.json({ code: "INTERNAL_ERROR", message: e.message }, { status: 500 });
  }
}
