import OrderDetailClient from "@/components/OrderDetailClient";

export const metadata = {
  title: "Order Details | MyShaadiStore",
  description: "View your order details, items, and tracking information",
};

export default async function OrderDetailPage({ params }) {
  const { orderId } = await params;
  return <OrderDetailClient orderId={orderId} />;
}
