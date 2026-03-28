"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Plus, Save, Trash2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Combobox } from "@/components/Combobox";
import { toast } from "sonner";
import ImageUpload from "@/components/ImageUpload";
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

export default function NewCategoryPage() {
  const router = useRouter();
  const sp = useSearchParams();
  const initialStepId = sp.get("stepId") || "";

  const [steps, setSteps] = useState([]);
  const [saving, setSaving] = useState(false);
  const [subcats, setSubcats] = useState([""]);
  const [form, setForm] = useState({
    journey_step_id: initialStepId,
    name: "",
    is_active: true,
    image_url: "",
  });

  useEffect(() => {
    const token = getToken();
    if (!token) return;
    fetch(`${API_BASE}/admin/journey-steps`, { headers: { Authorization: `Bearer ${token}` } })
      .then((r) => r.json())
      .then((d) => {
        const list = d.steps || [];
        setSteps(list);
        if (!initialStepId && list.length > 0) {
          setForm((f) => ({ ...f, journey_step_id: list[0].step_id }));
        }
      });
  }, [initialStepId]);

  const stepOptions = useMemo(
    () =>
      steps.map((s) => ({
        value: s.step_id,
        label: `${Number(s.order) || 0}. ${s.title}`,
        keywords: s.slug,
      })),
    [steps],
  );

  async function onSubmit(e) {
    e.preventDefault();
    const token = getToken();
    if (!token) return;
    if (!form.journey_step_id) {
      toast.error("Please select a journey step");
      return;
    }
    if (!form.image_url) {
      toast.error("Please add a category image");
      return;
    }
    setSaving(true);
    try {
      const hasSubs = subcats.some((s) => String(s || "").trim().length > 0);

      const res = await fetch(`${API_BASE}/admin/categories`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          journey_step_id: form.journey_step_id,
          name: form.name,
          slug: slugify(form.name),
          is_active: !!form.is_active,
          image_url: form.image_url || null,
          parent_category_id: null,
        }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        toast.error(err.message || "Failed to create category");
        return;
      }
      const created = await res.json().catch(() => ({}));
      const parentId = created.categoryId || created?.category?.category_id;

      if (hasSubs && parentId) {
        const toCreate = subcats.map((s) => String(s || "").trim()).filter(Boolean);
        for (const name of toCreate) {
          // eslint-disable-next-line no-await-in-loop
          const subRes = await fetch(`${API_BASE}/admin/categories`, {
            method: "POST",
            headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
            body: JSON.stringify({
              journey_step_id: form.journey_step_id,
              name,
              slug: slugify(name),
              is_active: true,
              parent_category_id: parentId,
            }),
          });
          if (!subRes.ok) {
            const err = await subRes.json().catch(() => ({}));
            toast.error(err.message || `Failed to create subcategory: ${name}`);
            return;
          }
        }
        toast.success("Category and subcategories saved");
      } else {
        toast.success("Category saved");
      }

      router.push(`/categories?stepId=${encodeURIComponent(form.journey_step_id)}`);
      router.refresh();
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-6">
      <SectionHeader
        title="Add category"
        description="Pick a journey step, name your category, then optionally add subcategories. They appear the same way on the customer site."
        action={
          <Button variant="outline" asChild className="h-10 gap-2 rounded-lg px-4 font-medium">
            <Link href={form.journey_step_id ? `/categories?stepId=${encodeURIComponent(form.journey_step_id)}` : "/categories"}>
              <ArrowLeft className="size-4" />
              Back
            </Link>
          </Button>
        }
      />

      <Card className="rounded-2xl border border-slate-200/80 shadow-sm">
        <CardHeader>
          <CardTitle>Add category</CardTitle>
        </CardHeader>
        <CardContent>
          <form className="max-w-xl space-y-4" onSubmit={onSubmit}>
            <div className="space-y-2">
              <Label>Journey step *</Label>
              <Combobox
                value={form.journey_step_id}
                onChange={(v) => setForm((f) => ({ ...f, journey_step_id: v }))}
                options={stepOptions}
                placeholder="Select step…"
                searchPlaceholder="Search steps…"
              />
            </div>

            <div className="space-y-2">
              <Label>Category name *</Label>
              <Input
                value={form.name}
                onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                placeholder="e.g. Photography"
                required
              />
            </div>

            <ImageUpload
              label="Category image *"
              initialUrl={form.image_url}
              onUploadComplete={(url) => setForm((f) => ({ ...f, image_url: url }))}
            />

            <p className="text-xs text-muted-foreground">
              URL slug is generated from the category name (lowercase, spaces become hyphens). Same for each subcategory name.
            </p>

            <div className="space-y-2">
              <div className="flex items-center justify-between gap-2">
                <Label>Subcategories (optional)</Label>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="gap-2"
                  onClick={() => setSubcats((arr) => [...arr, ""])}
                  disabled={!form.journey_step_id}
                >
                  <Plus className="size-4" />
                  Add subcategory
                </Button>
              </div>
              <div className="space-y-2">
                {subcats.map((v, idx) => (
                  <div key={idx} className="flex items-center gap-2">
                    <Input
                      value={v}
                      onChange={(e) =>
                        setSubcats((arr) => arr.map((x, i) => (i === idx ? e.target.value : x)))
                      }
                      placeholder={idx === 0 ? "e.g. Candid" : "Subcategory name"}
                      disabled={!form.journey_step_id}
                    />
                    <Button
                      type="button"
                      variant="outline"
                      size="icon"
                      onClick={() => setSubcats((arr) => arr.filter((_, i) => i !== idx))}
                      disabled={subcats.length === 1}
                      aria-label="Remove subcategory"
                    >
                      <Trash2 className="size-4" />
                    </Button>
                  </div>
                ))}
              </div>
              <p className="text-xs text-muted-foreground">
                If you add any, they show next to this category on the user website (same journey step).
              </p>
            </div>

            <Button type="submit" className="gap-2" disabled={saving}>
              <Save className="size-4" />
              {saving ? "Saving…" : "Save"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
