"use client";

import { useEffect, useMemo, useState } from "react";
import { IndianRupee, Save } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import SectionHeader from "@/components/ui/section-header";

const API_BASE = "/api/v1";
const MAX_BUDGET_PER_STEP = 10000000;
const SLIDER_STEP = 50000;

function getToken() {
  if (typeof window === "undefined") return null;
  return localStorage.getItem("mss_token");
}

function formatAmount(value) {
  const amount = Number(value || 0);
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(amount);
}

export default function BudgetDefaultsPage() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [steps, setSteps] = useState([]);

  async function loadSteps() {
    const token = getToken();
    if (!token) return;
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/admin/journey-steps`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      const sorted = (data.steps || []).sort((a, b) => (Number(a.order) || 0) - (Number(b.order) || 0));
      setSteps(
        sorted.map((step) => ({
          ...step,
          default_budget: Number(step.default_budget) || 0,
          max_budget: Math.max(Number(step.max_budget) || 0, Number(step.default_budget) || 0, 500000),
        }))
      );
    } catch {
      toast.error("Failed to load budget defaults");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadSteps();
  }, []);

  const totalDefaultBudget = useMemo(
    () => steps.reduce((sum, step) => sum + (Number(step.default_budget) || 0), 0),
    [steps]
  );

  function updateStepBudget(stepId, field, value) {
    const numeric = Math.max(0, Math.min(MAX_BUDGET_PER_STEP, Number(String(value).replace(/[^\d]/g, "")) || 0));
    setSteps((prev) =>
      prev.map((step) => {
        if (step.step_id !== stepId) return step;
        if (field === "max_budget") {
          return { ...step, max_budget: Math.max(numeric, Number(step.default_budget) || 0) };
        }
        return {
          ...step,
          default_budget: numeric,
          max_budget: Math.max(Number(step.max_budget) || 0, numeric),
        };
      })
    );
  }

  async function saveAll() {
    const token = getToken();
    if (!token) return;
    setSaving(true);
    try {
      await Promise.all(
        steps.map((step) =>
          fetch(`${API_BASE}/admin/journey-steps/${step.step_id}`, {
            method: "PUT",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify({
              default_budget: Number(step.default_budget) || 0,
              max_budget: Math.max(Number(step.max_budget) || 0, Number(step.default_budget) || 0),
            }),
          })
        )
      );
      toast.success("Default budget updated successfully");
      await loadSteps();
    } catch {
      toast.error("Failed to save budget defaults");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-6">
      <SectionHeader
        title="Budget settings"
        description="Configure default and max budget for each journey step used in signup and planning."
        action={
          <Button
            onClick={saveAll}
            disabled={saving || loading || steps.length === 0}
            className="h-10 rounded-lg bg-slate-900 px-4 font-medium hover:bg-slate-800"
          >
            <Save className="mr-2 h-4 w-4" />
            {saving ? "Saving..." : "Save changes"}
          </Button>
        }
      />

      <Card className="border-slate-100 shadow-sm">
        <CardHeader>
          <CardTitle className="text-lg">Budget Summary</CardTitle>
          <CardDescription>Total default budget for a newly signed-up user.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="inline-flex items-center gap-2 rounded-xl border border-pink-100 bg-pink-50 px-4 py-2.5 text-pink-700">
            <IndianRupee className="h-4 w-4" />
            <span className="text-lg font-semibold">{formatAmount(totalDefaultBudget)}</span>
          </div>
        </CardContent>
      </Card>

      <Card className="border-slate-100 shadow-sm">
        <CardHeader>
          <CardTitle className="text-lg">Step-wise Budget Defaults</CardTitle>
          <CardDescription>Use slider and direct amount input for precision.</CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="py-14 text-center text-sm text-slate-400">Loading budget steps...</div>
          ) : (
            <div className="space-y-6">
              {steps.map((step) => (
                <div key={step.step_id} className="rounded-xl border border-slate-100 bg-slate-50/70 p-4">
                  <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
                    <div>
                      <div className="text-sm font-semibold text-slate-800">{step.title}</div>
                      <div className="text-xs text-slate-400">/{step.slug}</div>
                    </div>
                    <div className="rounded-full bg-white px-3 py-1 text-xs font-semibold text-pink-600 ring-1 ring-pink-100">
                      {formatAmount(step.default_budget)}
                    </div>
                  </div>

                  <div className="grid gap-3 md:grid-cols-[220px,1fr]">
                    <div className="grid gap-2">
                      <label className="text-xs font-medium text-slate-500">Default amount</label>
                      <input
                        type="number"
                        min={0}
                        max={step.max_budget || MAX_BUDGET_PER_STEP}
                        step={SLIDER_STEP}
                        value={step.default_budget}
                        onChange={(e) => updateStepBudget(step.step_id, "default_budget", e.target.value)}
                        className="h-10 rounded-lg border border-slate-200 bg-white px-3 text-sm font-medium text-slate-700 outline-none focus:border-pink-300"
                      />
                    </div>
                    <div className="grid gap-2">
                      <label className="text-xs font-medium text-slate-500">Default slider</label>
                      <input
                        type="range"
                        min={0}
                        max={step.max_budget || MAX_BUDGET_PER_STEP}
                        step={SLIDER_STEP}
                        value={step.default_budget}
                        onChange={(e) => updateStepBudget(step.step_id, "default_budget", e.target.value)}
                        className="h-11 w-full cursor-pointer accent-pink-500"
                      />
                    </div>
                  </div>
                  <div className="mt-3 grid gap-3 md:grid-cols-[220px,1fr]">
                    <div className="grid gap-2">
                      <label className="text-xs font-medium text-slate-500">Maximum amount</label>
                      <input
                        type="number"
                        min={0}
                        max={MAX_BUDGET_PER_STEP}
                        step={SLIDER_STEP}
                        value={step.max_budget}
                        onChange={(e) => updateStepBudget(step.step_id, "max_budget", e.target.value)}
                        className="h-10 rounded-lg border border-slate-200 bg-white px-3 text-sm font-medium text-slate-700 outline-none focus:border-pink-300"
                      />
                    </div>
                    <div className="grid gap-2">
                      <label className="text-xs font-medium text-slate-500">Maximum slider</label>
                      <input
                        type="range"
                        min={0}
                        max={MAX_BUDGET_PER_STEP}
                        step={SLIDER_STEP}
                        value={step.max_budget}
                        onChange={(e) => updateStepBudget(step.step_id, "max_budget", e.target.value)}
                        className="h-11 w-full cursor-pointer accent-slate-600"
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
