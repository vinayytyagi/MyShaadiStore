"use client";

import { useCartSummary } from "@/lib/cartStore";

export default function CartHeaderStatsClient() {
  const { quotationCount, shoppingCount } = useCartSummary();

  return (
    <div className="grid gap-3 sm:grid-cols-2">
      <div className="rounded-2xl bg-white px-6 py-5 shadow-[0_14px_32px_rgba(15,23,42,0.05)]">
        <div className="text-xs font-medium text-slate-400">Quotation Basket</div>
        <div className="mt-2 text-3xl font-semibold text-slate-900">{quotationCount}</div>
      </div>
      <div className="rounded-2xl bg-white px-6 py-5 shadow-[0_14px_32px_rgba(15,23,42,0.05)]">
        <div className="text-xs font-medium text-slate-400">Shopping Cart</div>
        <div className="mt-2 text-3xl font-semibold text-slate-900">{shoppingCount}</div>
      </div>
    </div>
  );
}

