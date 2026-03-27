import CartHeaderStatsClient from "@/components/CartHeaderStatsClient";
import CartItemsClient from "@/components/CartItemsClient";
import CartActionsClient from "@/components/CartActionsClient";

export default function CartPageServer() {
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

          <CartHeaderStatsClient />
        </div>
      </section>

      <section className="mt-10 grid gap-8 xl:grid-cols-[1.2fr_0.8fr]">
        <CartItemsClient />
        <CartActionsClient />
      </section>
    </main>
  );
}

