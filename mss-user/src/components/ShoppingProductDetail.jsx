import Link from "next/link";
import BasketButton from "@/components/BasketButton";
import CartActionButtons from "@/components/CartActionButtons";
import ShoppingProductCard from "@/components/ShoppingProductCard";
import { formatCurrency, getItemImage } from "@/lib/shopUi";

function PolicyRow({ title, value }) {
  if (!value) return null;
  return (
    <div className="flex items-start justify-between gap-4 border-b border-slate-100 py-4 last:border-b-0">
      <div className="text-sm font-semibold text-slate-700">{title}</div>
      <div className="max-w-[70%] text-right text-sm leading-6 text-slate-500">{value}</div>
    </div>
  );
}

export default function ShoppingProductDetail({ item, categories, relatedItems = [] }) {
  const category = categories.find((entry) => entry.category_id === item.category_id) || null;
  const subcategory = categories.find((entry) => entry.category_id === item.subcategory_id) || null;
  const detailImages = item.images?.length ? item.images : [getItemImage(item, 0)];
  const backQuery = new URLSearchParams();
  if (category?.category_id) backQuery.set("category", category.category_id);
  if (subcategory?.category_id) backQuery.set("subcategory", subcategory.category_id);
  const backHref = `/shopping${backQuery.toString() ? `?${backQuery.toString()}` : ""}`;

  return (
    <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <Link
        href={backHref}
        className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-600 shadow-[0_12px_26px_rgba(15,23,42,0.04)]"
      >
        <span aria-hidden="true">←</span>
        Back to shopping
      </Link>

      <section className="mt-6 grid gap-8 rounded-3xl bg-white p-6 shadow-[0_22px_55px_rgba(15,23,42,0.08)] lg:grid-cols-[1.05fr_0.95fr] lg:p-8">
        <div className="space-y-4">
          <div className="overflow-hidden rounded-2xl bg-[#fff4f7] p-6">
            <div
              className="h-[460px] w-full bg-contain bg-center bg-no-repeat"
              style={{ backgroundImage: `url("${detailImages[0]}")` }}
              role="img"
              aria-label={item.name}
            />
          </div>

          {detailImages.length > 1 ? (
            <div className="grid grid-cols-4 gap-3">
              {detailImages.slice(0, 4).map((image, index) => (
                <div key={image || index} className="overflow-hidden rounded-2xl bg-[#fff4f7] p-3">
                  <div
                    className="h-24 w-full bg-contain bg-center bg-no-repeat"
                    style={{ backgroundImage: `url("${image}")` }}
                  />
                </div>
              ))}
            </div>
          ) : null}
        </div>

        <div className="flex flex-col justify-center">
          <div className="space-y-5">
            <div className="flex flex-wrap gap-2">
              {category ? (
                <span className="rounded-full bg-[#fff1f6] px-3 py-1 text-xs font-medium text-[#ff4f86]">
                  {category.name}
                </span>
              ) : null}
              {subcategory ? (
                <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-600">
                  {subcategory.name}
                </span>
              ) : null}
            </div>

            <div>
              <h1 className="text-3xl font-semibold tracking-tight text-slate-900">{item.name}</h1>
              <p className="mt-4 max-w-xl text-base leading-7 text-slate-500">
                {item.description || "Thoughtfully added to help you shop wedding essentials with ease."}
              </p>
            </div>

            <div className="flex flex-wrap items-end gap-3">
              <div className="text-3xl font-semibold text-slate-900">
                {formatCurrency(item.final_price || item.price)}
              </div>
              {item.is_discount_active ? (
                <>
                  <div className="text-lg font-semibold text-slate-400 line-through">
                    {formatCurrency(item.price)}
                  </div>
                  <div className="rounded-full bg-[#fff1f6] px-3 py-1 text-sm font-semibold text-[#ff4f86]">
                    {item.discount_percentage}% off
                  </div>
                </>
              ) : null}
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              <div className="rounded-3xl border border-slate-200 bg-slate-50 px-5 py-4">
                <div className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">Item Type</div>
                <div className="mt-2 text-sm font-semibold text-slate-700">{item.item_type || "Product"}</div>
              </div>
              <div className="rounded-3xl border border-slate-200 bg-slate-50 px-5 py-4">
                <div className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">Location</div>
                <div className="mt-2 text-sm font-semibold text-slate-700">{item.location_city || item.location || "Available on request"}</div>
              </div>
            </div>

            <div className="flex flex-wrap gap-3">
              <CartActionButtons
                item={{
                  ...item,
                  image: detailImages[0],
                  category_label: category?.name || "",
                  subcategory_label: subcategory?.name || "",
                  source: "shopping",
                }}
                showQuotation
                showShopping
                quotationLabel="Add to Quote"
                shoppingLabel="Buy Now"
                redirectOnShoppingAdd
              />
              <Link
                href={backHref}
                className="rounded-2xl border border-slate-200 bg-white px-6 py-3 text-sm font-semibold text-slate-700"
              >
                Continue Shopping
              </Link>
            </div>

            <div className="rounded-[28px] border border-slate-200 px-5 py-2">
              <PolicyRow
                title="Return Delivery"
                value={
                  item.policies?.returnable
                    ? item.policies?.return_policy_text || `Return available within ${item.policies?.return_window_days || 0} days`
                    : "Not returnable"
                }
              />
              <PolicyRow
                title="Exchange Policy"
                value={
                  item.policies?.exchangeable
                    ? item.policies?.exchange_policy_text || "Exchange available as per vendor policy"
                    : "No exchange policy available"
                }
              />
              <PolicyRow
                title="Damage Policy"
                value={item.policies?.damage_policy_text || "Contact support for damaged item assistance."}
              />
            </div>
          </div>
        </div>
      </section>

      <section className="mt-12">
        <div className="mb-6 flex items-center gap-3">
          <span className="h-10 w-3 rounded-full bg-[#ff4f86]" />
          <h2 className="text-2xl font-semibold tracking-tight text-slate-900">Related Items</h2>
        </div>

        {relatedItems.length > 0 ? (
          <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-4">
            {relatedItems.map((relatedItem, index) => (
              <ShoppingProductCard
                key={relatedItem.item_id}
                item={relatedItem}
                index={index}
                compact
                badge={subcategory?.name || category?.name || "Shopping"}
              />
            ))}
          </div>
        ) : (
          <div className="rounded-[28px] bg-white px-6 py-12 text-center text-slate-500 shadow-[0_20px_50px_rgba(15,23,42,0.06)]">
            No related items found in the same category yet.
          </div>
        )}
      </section>

      <div className="hidden md:block">
        <BasketButton floating />
      </div>
    </main>
  );
}
