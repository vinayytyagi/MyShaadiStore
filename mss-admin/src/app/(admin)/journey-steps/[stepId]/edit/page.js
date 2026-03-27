"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Save } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import ImageUpload from "@/components/ImageUpload";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import SectionHeader from "@/components/ui/section-header";

const API_BASE = "/api/v1";

function getToken() {
  if (typeof window === "undefined") return null;
  return localStorage.getItem("mss_token");
}

function slugify(s) {
  return String(s || "")
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-");
}

export default function EditJourneyStepPage() {
  const params = useParams();
  const router = useRouter();
  const stepId = params.stepId;
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ title: "", subtitle: "", slug: "", order: 1, is_active: true, default_budget: 0, max_budget: 5000000 });

  useEffect(() => {
    const token = getToken();
    if (!token || !stepId) return;
    setLoading(true);
    fetch(`${API_BASE}/admin/journey-steps/${stepId}`, { headers: { Authorization: `Bearer ${token}` } })
      .then((r) => r.json())
      .then((d) =>
        setForm({
          title: d.title || "",
          subtitle: d.subtitle || "",
          slug: d.slug || "",
          order: d.order ?? 1,
          is_active: d.is_active !== false,
          image_url: d.image_url || "",
          default_budget: d.default_budget || 0,
          max_budget: d.max_budget || 5000000,
        })
      )
      .finally(() => setLoading(false));
  }, [stepId]);

  async function onSubmit(e) {
    e.preventDefault();
    const token = getToken();
    if (!token) return;
    setSaving(true);
    try {
      const res = await fetch(`${API_BASE}/admin/journey-steps/${stepId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          title: form.title,
          subtitle: form.subtitle || null,
          slug: slugify(form.slug),
          order: Number(form.order) || 0,
          image_url: form.image_url || null,
          default_budget: Number(form.default_budget) || 0,
          max_budget: Number(form.max_budget) || 0,
          is_active: !!form.is_active,
        }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        toast.error(err.message || "Failed to update step");
        return;
      }
      toast.success("Journey step updated");
      router.push("/journey-steps");
      router.refresh();
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <SectionHeader
        title="Edit journey step"
        description="Update phase details and budget controls."
        action={
          <div className="flex items-center gap-3">
            <Button variant="outline" asChild className="h-10 gap-2 rounded-lg px-4 font-medium">
              <Link href="/journey-steps">
                <ArrowLeft className="size-4" />
                Cancel
              </Link>
            </Button>
            <Button type="submit" form="step-form" className="h-10 gap-2 rounded-lg bg-slate-900 px-4 font-medium" disabled={saving}>
              <Save className="size-4" />
              {saving ? "Saving..." : "Save changes"}
            </Button>
          </div>
        }
      />

      <Card className="rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden">
        <CardContent className="p-8 lg:p-12">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-24 gap-4 text-slate-400">
               <div className="h-10 w-10 animate-spin rounded-full border-4 border-pink-500 border-t-transparent" />
               <p className="text-sm font-medium">Fetching step details...</p>
            </div>
          ) : (
            <form id="step-form" className="space-y-12" onSubmit={onSubmit}>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-10">
                <div className="space-y-3 col-span-1 md:col-span-2">
                  <Label className="text-sm font-medium text-slate-700 ml-1">Title *</Label>
                  <Input 
                    value={form.title} 
                    onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))} 
                    required 
                    className="h-14 bg-slate-50 border-transparent focus:bg-white focus:border-pink-200 focus:ring-4 focus:ring-pink-50/50 transition-all rounded-2xl text-lg font-medium"
                  />
                </div>
                
                <div className="space-y-3 col-span-1 md:col-span-2">
                  <Label className="text-sm font-medium text-slate-700 ml-1">Subtitle</Label>
                  <Input 
                    value={form.subtitle} 
                    onChange={(e) => setForm((f) => ({ ...f, subtitle: e.target.value }))} 
                    className="h-14 bg-slate-50 border-transparent focus:bg-white focus:border-pink-200 focus:ring-4 focus:ring-pink-50/50 transition-all rounded-2xl"
                  />
                </div>

                <div className="space-y-3 col-span-1 md:col-span-2">
                  <Label className="text-sm font-medium text-slate-700 ml-1">Step image</Label>
                  <div className="p-1 rounded-2xl bg-slate-50/50 ring-1 ring-slate-100">
                    <ImageUpload 
                      label=""
                      initialUrl={form.image_url}
                      onUploadComplete={(url) => setForm(f => ({ ...f, image_url: url }))}
                    />
                  </div>
                </div>

                <div className="space-y-3">
                  <Label className="text-sm font-medium text-slate-700 ml-1">Slug *</Label>
                  <Input 
                    value={form.slug} 
                    onChange={(e) => setForm((f) => ({ ...f, slug: e.target.value }))} 
                    required 
                    className="h-12 bg-slate-50 border-transparent focus:bg-white focus:border-pink-200 transition-all rounded-2xl font-mono text-pink-600"
                  />
                </div>

                <div className="space-y-3">
                  <Label className="text-sm font-medium text-slate-700 ml-1">Order</Label>
                  <Input 
                    type="number" 
                    value={form.order} 
                    onChange={(e) => setForm((f) => ({ ...f, order: e.target.value }))} 
                    className="h-12 bg-slate-50 border-transparent focus:bg-white focus:border-pink-200 transition-all rounded-2xl"
                  />
                </div>

                <div className="space-y-3">
                  <Label className="text-sm font-medium text-slate-700 ml-1">Default budget (in ₹)</Label>
                  <Input 
                    type="number" 
                    value={form.default_budget} 
                    onChange={(e) => setForm((f) => ({ ...f, default_budget: e.target.value }))} 
                    className="h-12 bg-slate-50 border-transparent focus:bg-white focus:border-pink-200 transition-all rounded-2xl"
                    placeholder="e.g. 500000"
                  />
                  <p className="text-xs text-slate-500 ml-1">Recommended amount for new signups.</p>
                </div>
                <div className="space-y-3">
                  <Label className="text-sm font-medium text-slate-700 ml-1">Max budget (in ₹)</Label>
                  <Input 
                    type="number" 
                    value={form.max_budget} 
                    onChange={(e) => setForm((f) => ({ ...f, max_budget: e.target.value }))} 
                    className="h-12 bg-slate-50 border-transparent focus:bg-white focus:border-pink-200 transition-all rounded-2xl"
                    placeholder="e.g. 5000000"
                  />
                </div>

                <div className="col-span-1 md:col-span-2 py-4">
                   <div className="flex h-14 items-center justify-between px-6 rounded-2xl bg-emerald-50/50 border border-emerald-100/50">
                      <div className="flex items-center gap-3">
                        <div className="h-2 w-2 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.6)] animate-pulse" />
                        <span className="text-sm font-medium text-emerald-800">Public visibility</span>
                      </div>
                      <input 
                        type="checkbox" 
                        id="is_active"
                        checked={!!form.is_active} 
                        className="h-6 w-6 rounded-lg border-emerald-300 text-emerald-600 focus:ring-emerald-500 transition-all cursor-pointer accent-emerald-600"
                        onChange={(e) => setForm((f) => ({ ...f, is_active: e.target.checked }))} 
                      />
                   </div>
                </div>
              </div>
            </form>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

