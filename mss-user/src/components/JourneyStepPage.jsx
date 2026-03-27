"use client";

import BudgetBadge from "@/components/BudgetBadge";
import BasketButton from "@/components/BasketButton";
import CartActionButtons from "@/components/CartActionButtons";
import {
  ChevronLeft, 
  ChevronRight, 
  Pencil, 
  LayoutGrid, 
  Search,
  Check,
  LockKeyhole,
  X,
  MapPin,
  SlidersHorizontal
} from "lucide-react";
import { getAuthToken, saveAuthCookies, useAuthUser } from "@/lib/authCookies";
import { updateMyProfile } from "@/lib/api";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";

function StarRating({ value = 4 }) {
  return (
    <div className="flex items-center gap-1">
      {[0, 1, 2, 3, 4].map((index) => (
        <span
          key={index}
          className={`h-2.5 w-2.5 rounded-full ${index < value ? "bg-[#ffbb28]" : "bg-slate-200"}`}
        />
      ))}
    </div>
  );
}

function formatAmount(value) {
  const amount = Number(value || 0);
  if (amount >= 100000) {
    return `${(amount / 100000).toFixed(amount % 100000 === 0 ? 0 : 1)}L`;
  }
  return new Intl.NumberFormat("en-IN", { maximumFractionDigits: 0 }).format(amount);
}

const MAX_BUDGET_PER_STEP = 10000000;
const BUDGET_STEP = 50000;

function BudgetModal({
  isOpen,
  onClose,
  stepId,
  stepTitle,
  defaultBudget = 0,
  maxBudget = MAX_BUDGET_PER_STEP,
  onboarding = {},
  onSave,
}) {
  const allocations = Array.isArray(onboarding.budget_allocations) ? onboarding.budget_allocations : [];
  const current = allocations.find((item) => item.step_id === stepId);
  const [amount, setAmount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (isOpen) {
      setAmount(Number(current?.amount ?? defaultBudget) || 0);
    }
  }, [isOpen, current, defaultBudget]);

  if (!isOpen) return null;

  const effectiveMaxBudget = Math.max(Number(maxBudget) || 0, Number(defaultBudget) || 0, 500000);
  const currentStepDiff = Number(amount) - (Number(current?.amount) || 0);
  const projectedTotal = (Number(onboarding.budget_total) || 0) + currentStepDiff;

  async function handleSave() {
    setLoading(true);
    setError("");
    try {
      const token = getAuthToken();
      if (!token) throw new Error("Please login to update budget.");
      let nextAllocations = allocations.map((a) =>
        a.step_id === stepId ? { ...a, amount: Number(amount) } : a
      );

      if (!nextAllocations.find((a) => a.step_id === stepId)) {
        nextAllocations.push({ step_id: stepId, amount: Number(amount), title: stepTitle, slug: "", max_budget: effectiveMaxBudget });
      }

      const nextTotal = nextAllocations.reduce((sum, a) => sum + (Number(a.amount) || 0), 0);

      const payload = {
        onboarding: {
          ...onboarding,
          budget_total: nextTotal,
          budget_allocations: nextAllocations,
        },
      };

      const response = await updateMyProfile(token, payload);
      saveAuthCookies({ token, user: response.user });
      onSave?.(response.user);
      onClose();
    } catch (err) {
      setError(err?.message || "Failed to update budget");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="fixed inset-0 z-60 flex items-center justify-center bg-slate-900/35 backdrop-blur-sm p-4">
      <div className="w-full max-w-lg rounded-2xl border border-slate-100 bg-white p-6 shadow-[0_24px_80px_rgba(15,23,42,0.2)]">
        <div className="mb-5 flex items-center justify-between">
          <h3 className="text-lg font-semibold text-slate-800">{stepTitle} budget planner</h3>
          <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-full transition-colors cursor-pointer">
            <X className="h-4 w-4 text-slate-400" />
          </button>
        </div>

        <div className="space-y-5">
          <div className="rounded-xl border border-slate-100 bg-slate-50 px-4 py-3">
               <div className="text-xs font-semibold uppercase tracking-wide text-slate-400">Projected total budget</div>
               <div className="mt-1 text-xl font-semibold text-slate-800">{formatCurrency(projectedTotal)}</div>
          </div>

          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <label className="text-xs font-semibold uppercase tracking-wide text-slate-500">Allocation</label>
              <div className="text-sm font-semibold text-slate-800">{formatCurrency(amount)}</div>
            </div>
            
            <div className="relative">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-sm font-semibold text-slate-400">Rs</span>
              <input
                type="number"
                min="0"
                max={effectiveMaxBudget}
                step={BUDGET_STEP}
                value={amount}
                onChange={(e) =>
                  setAmount(Math.max(0, Math.min(effectiveMaxBudget, Number(e.target.value) || 0)))
                }
                className="h-11 w-full rounded-xl border border-slate-200 bg-white pl-10 pr-4 text-sm font-semibold text-slate-700 outline-none focus:border-[#ff4f86]"
                autoFocus
              />
            </div>

            <div className="pt-1">
               <input
                type="range"
                min="0"
                max={effectiveMaxBudget}
                step={BUDGET_STEP}
                value={amount}
                onChange={(e) => setAmount(Number(e.target.value))}
                className="h-2 w-full cursor-pointer accent-[#ff4f86]"
              />
              <div className="mt-2 flex justify-between text-[11px] text-slate-500">
                <span>0</span>
                <span>Max {formatAmount(effectiveMaxBudget)}</span>
              </div>
            </div>
          </div>

          {error ? (
            <div className="rounded-xl border border-red-100 bg-red-50 px-3 py-2 text-sm text-red-600">{error}</div>
          ) : null}

          <div className="rounded-xl bg-slate-50 px-3 py-2 text-xs text-slate-500">
            Saves this step allocation and updates your overall budget.
          </div>

          <div className="flex items-center justify-end gap-2">
            <button
              onClick={onClose}
              className="h-10 rounded-xl border border-slate-200 px-4 text-sm font-medium text-slate-600 hover:bg-slate-50"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              disabled={loading}
              className="h-10 rounded-xl bg-[#ff4f86] px-4 text-sm font-semibold text-white hover:bg-[#ff3d79] disabled:opacity-60"
            >
              {loading ? "Saving..." : "Save"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

const fallbackImages = [
  "https://images.unsplash.com/photo-1519167758481-83f550bb49b3?auto=format&fit=crop&w=900&q=80",
  "https://images.unsplash.com/photo-1519741497674-611481863552?auto=format&fit=crop&w=900&q=80",
  "https://images.unsplash.com/photo-1522673607200-164d1b6ce486?auto=format&fit=crop&w=900&q=80",
  "https://images.unsplash.com/photo-1511285560929-80b456fea0bc?auto=format&fit=crop&w=900&q=80",
];

function formatCurrency(value) {
  const amount = Number(value || 0);
  if (amount >= 100000) {
    return `${(amount / 100000).toFixed(amount % 100000 === 0 ? 0 : 1)}L`;
  }

  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(amount);
}

export default function JourneyStepPage({
  steps,
  step,
  categories,
  items,
  selectedCategoryId = "",
  search = "",
}) {
  const router = useRouter();
  const authUser = useAuthUser();
  const [liveOnboarding, setLiveOnboarding] = useState(authUser?.onboarding || {});
  const [isBudgetModalOpen, setIsBudgetModalOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState(search);

  useEffect(() => {
    setLiveOnboarding(authUser?.onboarding || {});
  }, [authUser]);

  const activeIndex = Math.max(
    0,
    steps.findIndex((item) => item.step_id === step.step_id)
  );
  const progress = Math.round(((activeIndex + 1) / Math.max(steps.length, 1)) * 100);

  const topCategories = categories.filter((category) => !category.parent_category_id);
  const selectedCategory =
    topCategories.find((category) => category.category_id === selectedCategoryId) || topCategories[0] || null;

  const visibleItems = items.filter((item) => {
    const matchesSearch = !searchQuery || item.name.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = !selectedCategory || item.category_id === selectedCategory.category_id;
    return matchesSearch && matchesCategory;
  });

  const searchPlaceholder = step.slug === "venues" ? "Search Venue" : `Search ${step.title}`;

  function handleSearch() {
    if (!searchQuery.trim()) {
      router.push(`/journey/${step.slug}`);
      return;
    }
    router.push(`/journey/${step.slug}?search=${encodeURIComponent(searchQuery)}`);
  }

  return (
    <div className="mx-auto w-full px-4 py-8 sm:px-6 lg:px-20 overflow-hidden">
      <div className="flex justify-center">
        <div className="inline-flex items-center overflow-x-auto rounded-full bg-white px-1 py-1 shadow-[0_12px_30px_rgba(0,0,0,0.03)] ring-1 ring-slate-100 no-scrollbar">
          <div className="flex items-center">
            {steps.map((item, index) => {
              const active = item.step_id === step.step_id;
              const isLast = index === steps.length - 1;

              return (
                <div key={item.step_id} className="flex items-center">
                  <a
                    href={`/journey/${item.slug}`}
                    className={`flex items-center gap-2 rounded-full px-4 py-1 transition-all duration-300 shrink-0 transform active:scale-95 cursor-pointer ${
                      index<=activeIndex ? "bg-[#fff1f6]" : "hover:bg-slate-50"
                    }`}
                  >
                    <div className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full transition-all shadow-sm ${
                      (index <= activeIndex) 
                        ? "bg-[#ff4f86] text-white" 
                        : "bg-[#d98fa3] text-white"
                    }`}>
                      {(index <= activeIndex) ? <Check className="h-3 w-3" strokeWidth={4} /> : <LockKeyhole className="h-3.5 w-3.5" strokeWidth={3} />}
                    </div>
                    <span className={`text-sm font-semibold transition-colors duration-300 ${
                      index<=activeIndex ? "text-slate-800" : "text-slate-400"
                    }`}>
                      {item.title}
                    </span>
                  </a>
                  {!isLast && (
                    <div className="h-[4px] w-6 bg-linear-to-r from-pink-100 via-pink-500 to-pink-100 shrink-0" />
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>

      <div className="mx-auto mt-4 max-w-4xl">
        <div className="rounded-full bg-white/80 px-2 py-1 shadow-[0_18px_36px_rgba(15,23,42,0.06)]">
          <div className="flex items-center gap-3">
            <div className="h-4 flex-1 overflow-hidden rounded-full bg-slate-100">
              <div
                className="h-full rounded-full bg-[#ff4f86] shadow-[0_10px_20px_rgba(255,79,134,0.35)]"
                style={{ width: `${progress}%` }}
              />
            </div>
            <span className="text-sm font-semibold text-slate-500">{progress}% Completed</span>
          </div>
        </div>
      </div>

      <div className="mx-auto mt-10 max-w-4xl rounded-2xl border border-slate-100 bg-white/70 px-6 py-6 text-center shadow-sm">
        <h1 className="text-3xl font-semibold tracking-tight text-slate-700 sm:text-4xl">{step.title}</h1>
        <p className="mt-3 text-sm text-slate-500">{step.subtitle || "Select the perfect option for your special day."}</p>
      </div>

      <div className="mt-10 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-center">
        {/* Budget Section */}
        <div
          onClick={() => setIsBudgetModalOpen(true)}
          className="flex cursor-pointer select-none items-center gap-3 rounded-xl bg-white px-4 py-3 text-slate-700 shadow-sm ring-1 ring-slate-100 transition-all hover:bg-slate-50"
        >
          <div className="rounded-lg bg-pink-50 p-2 text-pink-500">
            <SlidersHorizontal className="h-4 w-4" />
          </div>
          <div className="text-sm font-medium whitespace-nowrap">
            {step.title} Budget: <span className="font-bold text-slate-900 leading-none"><BudgetBadge stepId={step.step_id} defaultBudget={step.default_budget} /></span>
          </div>
          <button className="ml-1 p-1 text-slate-300 pointer-events-none">
            <Pencil className="h-3.5 w-3.5" />
          </button>
        </div>

        {/* Categories Section */}
        <details className="group relative">
          <summary className="flex cursor-pointer list-none items-center gap-3 rounded-2xl bg-white px-5 py-4 text-sm font-bold text-slate-700 shadow-[0_12px_30px_rgba(0,0,0,0.03)] ring-1 ring-slate-100 ring-inset hover:bg-slate-50 transition-all">
            <div className="text-slate-400 group-open:text-[#ff4f86] transition-colors">
              <LayoutGrid className="h-5 w-5" />
            </div>
            <span>{selectedCategory ? selectedCategory.name : "Categories"}</span>
          </summary>
          {topCategories.length > 0 ? (
            <div className="absolute left-0 top-full z-20 mt-3 min-w-[240px] rounded-3xl bg-white p-3 shadow-[0_25px_80px_rgba(16,24,40,0.12)] ring-1 ring-slate-100">
              <div className="grid gap-2">
                {topCategories.map((category) => {
                  const active = category.category_id === selectedCategory?.category_id;
                  return (
                    <a
                      key={category.category_id}
                      href={`/journey/${step.slug}?category=${category.category_id}`}
                      className={`cursor-pointer rounded-2xl px-4 py-3 text-sm font-bold transition-all ${
                        active ? "bg-[#fff1f6] text-[#ff4f86]" : "text-slate-600 hover:bg-slate-50"
                      }`}
                    >
                      {category.name}
                    </a>
                  );
                })}
              </div>
            </div>
          ) : null}
        </details>

        {/* Search Section */}
        <div className="flex flex-1 items-center gap-3 rounded-2xl bg-white p-1.5 pl-6 shadow-[0_12px_30px_rgba(0,0,0,0.03)] ring-1 ring-slate-100 lg:max-w-xl">
          <input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSearch()}
            className="min-w-0 flex-1 bg-transparent text-[15px] font-medium text-slate-600 outline-none placeholder:text-slate-400"
            placeholder={searchPlaceholder}
          />
          <div className="flex items-center gap-1.5 pr-1">
            <button 
              onClick={handleSearch}
              className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[#ff4f86] text-white transition-all active:scale-95 hover:bg-[#ff3d79]"
            >
              <Search className="h-5 w-5" />
            </button>
          </div>
        </div>
      </div>

      <BudgetModal 
        isOpen={isBudgetModalOpen}
        onClose={() => setIsBudgetModalOpen(false)}
        stepId={step.step_id}
        stepTitle={step.title}
        defaultBudget={step.default_budget || 0}
        maxBudget={step.max_budget || MAX_BUDGET_PER_STEP}
        onboarding={liveOnboarding}
        onSave={(updatedUser) => {
          setLiveOnboarding(updatedUser?.onboarding || {});
          router.refresh();
        }}
      />

      <div className="mt-10 flex items-center gap-6">
        {/* Left Phase Control */}
        <a 
          href={activeIndex > 0 ? `/journey/${steps[activeIndex-1].slug}` : "#"}
          className={`hidden md:flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-white shadow-xl ring-1 ring-slate-100 transition-all hover:bg-slate-50 hover:shadow-2xl active:scale-90 ${
            activeIndex === 0 ? "pointer-events-none opacity-10" : "cursor-pointer"
          }`}
          aria-label="Previous Phase"
        >
          <ChevronLeft className="h-6 w-6 text-slate-500" />
        </a>

        <div className="flex-1">
          <div className="grid gap-8 sm:grid-cols-2 xl:grid-cols-4">
            {visibleItems.map((item, index) => {
              const image = item.images?.[0] || fallbackImages[index % fallbackImages.length];
              const label = item.subcategory_id
                ? categories.find((category) => category.category_id === item.item_id)?.name
                : selectedCategory?.name || step.title;

              return (
                <article key={item.item_id} className="group cursor-pointer">
                  <div className="overflow-hidden rounded-[28px] bg-white p-3 shadow-[0_28px_60px_rgba(15,23,42,0.08)] transition duration-300 group-hover:-translate-y-1">
                    <div className="relative h-64 overflow-hidden rounded-[24px] bg-slate-100">
                      <div
                        className="h-full w-full bg-cover bg-center transition duration-500 group-hover:scale-105"
                        style={{ backgroundImage: `url("${image}")` }}
                        aria-label={item.name}
                        role="img"
                      />
                      <span className="absolute bottom-3 left-3 rounded-full bg-[#ffbb28] px-3 py-1 text-xs font-semibold text-slate-700">
                        {label}
                      </span>
                    </div>

                    <div className="mt-4 space-y-3 px-1 pb-1">
                      <StarRating value={item.is_discount_active ? 4 : 3} />
                      <div className="space-y-1">
                        <div className="flex items-center justify-between gap-3">
                          <h3 className="text-xl font-bold text-slate-700">{item.name}</h3>
                          <CartActionButtons
                            item={{
                              ...item,
                              image,
                              category_label: selectedCategory?.name || step.title,
                              subcategory_label: label,
                              journey_title: step.title,
                              source: "journey",
                            }}
                            quotationLabel="Select"
                          />
                        </div>
                        <div className="flex items-center gap-2 text-sm text-slate-400">
                          <MapPin className="h-3.5 w-3.5" />
                          <span>{item.location_city || "Bekasi, Jawa Barat"}</span>
                        </div>
                      </div>

                      <div className="flex items-end justify-between gap-3">
                        <div>
                          <div className="text-xs uppercase tracking-[0.2em] text-slate-400 text-[10px] font-bold">Starting from</div>
                          <div className="text-lg font-black text-slate-700">
                            {formatCurrency(item.final_price || item.price)}
                          </div>
                        </div>
                        {item.is_discount_active && (
                          <span className="rounded-full bg-[#fff1f6] px-3 py-1 text-xs font-bold text-[#ff4f86]">
                            {item.discount_percentage}% off
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </article>
              );
            })}
          </div>

          {visibleItems.length === 0 && (
            <div className="rounded-[28px] bg-white px-6 py-12 text-center text-slate-500 shadow-[0_28px_60px_rgba(15,23,42,0.06)]">
              No items added for this step yet.
            </div>
          )}
        </div>

        {/* Right Phase Control */}
        <a 
          href={activeIndex < steps.length - 1 ? `/journey/${steps[activeIndex+1].slug}` : "#"}
          className={`hidden md:flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-white shadow-xl ring-1 ring-slate-100 transition-all hover:bg-slate-50 hover:shadow-2xl active:scale-90 ${
            activeIndex === steps.length - 1 ? "pointer-events-none opacity-10" : "cursor-pointer"
          }`}
          aria-label="Next Phase"
        >
          <ChevronRight className="h-6 w-6 text-slate-500" />
        </a>
      </div>

      <div className="hidden md:block">
        <BasketButton floating />
      </div>
    </div>
  );
}
