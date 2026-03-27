import Link from "next/link";
import BasketButton from "@/components/BasketButton";
import ShoppingProductCard from "@/components/ShoppingProductCard";
import { getItemImage, isProductItem } from "@/lib/shopUi";

function buildQuery(categoryId, subcategoryId) {
  const qs = new URLSearchParams();
  if (categoryId) qs.set("category", categoryId);
  if (subcategoryId) qs.set("subcategory", subcategoryId);
  const query = qs.toString();
  return query ? `?${query}` : "";
}

export default function ShoppingCatalog({
  step,
  categories,
  items,
  selectedCategoryId = "",
  selectedSubcategoryId = "",
}) {
  const productItems = items.filter(isProductItem);
  const topCategories = categories.filter((category) => !category.parent_category_id);
  const selectedCategory =
    topCategories.find((category) => category.category_id === selectedCategoryId) || null;
  const visibleSubcategories = selectedCategory
    ? categories.filter((category) => category.parent_category_id === selectedCategory.category_id)
    : [];
  const selectedSubcategory =
    visibleSubcategories.find((category) => category.category_id === selectedSubcategoryId) || null;

  const filteredItems = productItems.filter((item) => {
    if (selectedCategory && item.category_id !== selectedCategory.category_id) return false;
    if (selectedSubcategory && item.subcategory_id !== selectedSubcategory.category_id) return false;
    return true;
  });

  const showcaseCategories = topCategories.slice(0, 6);
  const filterSubcategories = visibleSubcategories.length
    ? visibleSubcategories
    : categories.filter((category) => !category.parent_category_id).slice(0, 6);

  return (
    <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <section className="rounded-[28px] bg-[#f7f3f6] p-6 shadow-[0_14px_36px_rgba(15,23,42,0.06)]">
        <h1 className="text-center text-5xl font-medium leading-tight text-[#75152f]">
          Shop Curated Essentials for
          <br />
          Your Dream Wedding
        </h1>

        <div className="mt-8">
          <h2 className="text-4xl font-medium text-slate-900">Category</h2>
          <div className="mt-4 grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-6">
            {showcaseCategories.map((category, index) => {
              const categoryItem =
                productItems.find((item) => item.category_id === category.category_id) || productItems[index];
              const isActive = selectedCategory?.category_id === category.category_id;
              return (
                <Link
                  key={category.category_id}
                  href={`/shopping${buildQuery(category.category_id, "")}`}
                  className={`flex h-48 cursor-pointer flex-col items-center justify-between rounded-[22px] border px-3 py-4 transition ${
                    isActive
                      ? "border-[#88072f] bg-[#88072f] text-white"
                      : "border-[#ead2da] bg-[#edd6df] text-slate-700"
                  }`}
                >
                  <div
                    className="h-28 w-full bg-contain bg-center bg-no-repeat"
                    style={{ backgroundImage: `url("${getItemImage(categoryItem, index)}")` }}
                  />
                  <div className="text-center text-base font-medium">{category.name}</div>
                </Link>
              );
            })}
          </div>
        </div>

        <div className="mt-6 flex items-center gap-3 overflow-x-auto rounded-full bg-transparent py-1">
          <span className="h-4 w-4 shrink-0 rounded-full bg-[#ff4f86]" />
          <span className="h-7 w-px bg-[#caa8b6]" />
          <Link
            href="/shopping"
            className={`shrink-0 rounded-full px-4 py-2 text-sm font-medium ${!selectedCategory ? "bg-[#f5de32] text-slate-900" : "text-[#a44f6b]"}`}
          >
            All
          </Link>
          {topCategories.map((category) => (
            <Link
              key={category.category_id}
              href={`/shopping${buildQuery(category.category_id, "")}`}
              className={`shrink-0 rounded-full px-4 py-2 text-sm font-medium ${
                selectedCategory?.category_id === category.category_id
                  ? "bg-[#f5de32] text-slate-900"
                  : "text-[#a44f6b]"
              }`}
            >
              {category.name}
            </Link>
          ))}
          <span className="ml-auto h-12 w-12 shrink-0 rounded-full bg-[#f5de32] text-center text-xl leading-[48px] text-[#8f1036]">→</span>
        </div>
      </section>

      <section className="mt-8 grid gap-6 lg:grid-cols-[230px_1fr]">
        <aside className="rounded-[22px] bg-[#e6ced7] p-5">
          <h3 className="text-2xl font-medium text-[#7b1535]">Filters</h3>
          <div className="mt-4 space-y-4">
            <div>
              <p className="text-sm font-medium text-[#8f2748]">Subcategory</p>
              <div className="mt-2 space-y-2">
                {filterSubcategories.map((sub) => (
                  <Link
                    key={sub.category_id}
                    href={`/shopping${buildQuery(selectedCategory?.category_id || "", sub.category_id)}`}
                    className={`block text-sm ${
                      selectedSubcategory?.category_id === sub.category_id ? "text-[#7b1535] font-semibold" : "text-[#9f5672]"
                    }`}
                  >
                    {sub.name}
                  </Link>
                ))}
              </div>
            </div>
            <div>
              <p className="text-sm font-medium text-[#8f2748]">Price</p>
              <div className="mt-2 grid grid-cols-2 gap-2">
                <input className="h-9 w-full rounded-md border border-[#dcb9c7] bg-white px-2 text-xs" placeholder="15,000" />
                <input className="h-9 w-full rounded-md border border-[#dcb9c7] bg-white px-2 text-xs" placeholder="60,000" />
              </div>
              <button className="mt-3 h-8 w-full rounded-full bg-[#ff4f86] text-xs font-semibold text-white">
                Filter
              </button>
            </div>
          </div>
        </aside>

        <div>
          {filteredItems.length > 0 ? (
            <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
              {filteredItems.map((item, index) => {
                const categoryLabel =
                  categories.find((category) => category.category_id === item.subcategory_id)?.name ||
                  categories.find((category) => category.category_id === item.category_id)?.name ||
                  "Shopping";
                return (
                  <ShoppingProductCard
                    key={item.item_id}
                    item={item}
                    index={index}
                    badge={categoryLabel}
                  />
                );
              })}
            </div>
          ) : (
            <div className="rounded-[22px] bg-[#f1dfe6] px-6 py-12 text-center text-[#8f2748]">
              No shopping products found for this selection.
            </div>
          )}

          <div className="mt-7 flex items-center justify-center gap-4 text-[#d19cb0]">
            <button className="text-2xl">←</button>
            <span className="flex h-10 w-10 items-center justify-center rounded-full bg-[#f2dbe4] text-[#b96e88]">1</span>
            <button className="text-2xl text-[#ff4f86]">→</button>
          </div>
        </div>
      </section>

      <div className="hidden md:block">
        <BasketButton floating />
      </div>
    </main>
  );
}
