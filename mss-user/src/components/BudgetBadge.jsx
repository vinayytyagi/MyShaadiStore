"use client";

import { useAuthUser } from "@/lib/authCookies";

function formatAmount(value) {
  const amount = Number(value || 0);
  if (!amount) return "—";
  if (amount >= 100000) {
    return `${(amount / 100000).toFixed(amount % 100000 === 0 ? 0 : 1)}L`;
  }
  return new Intl.NumberFormat("en-IN", { maximumFractionDigits: 0 }).format(amount);
}

export default function BudgetBadge({ stepId, defaultBudget = 0 }) {
  const user = useAuthUser();
  if (!user) return <>{formatAmount(defaultBudget)}</>;
  
  const onboarding = user?.onboarding || {};
  const allocations = Array.isArray(onboarding.budget_allocations) ? onboarding.budget_allocations : [];
  const current = allocations.find((item) => item.step_id === stepId);
  return <>{formatAmount(current?.amount ?? defaultBudget)}</>;
}
