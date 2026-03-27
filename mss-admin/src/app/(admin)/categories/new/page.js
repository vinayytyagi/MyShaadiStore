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
  const [categories, setCategories] = useState([]);
  const [saving, setSaving] = useState(false);
  const [subcats, setSubcats] = useState([""]);
  const [form, setForm] = useState({
    journey_step_id: initialStepId,
    parent_category_id: "",
    name: "",
    slug: "",
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

  useEffect(() => {
    const token = getToken();
    if (!token || !form.journey_step_id) {
      setCategories([]);
      return;
    }
    fetch(`${API_BASE}/admin/categories?journeyStepId=${encodeURIComponent(form.journey_step_id)}`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((r) => r.json())
      .then((d) => setCategories(d.categories || []));
  }, [form.journey_step_id]);

  const currentStep = steps.find((s) => s.step_id === form.journey_step_id);
  const isShopping = currentStep?.slug === "shopping";
  const stepOptions = useMemo(
    () =>
      steps.map((s) => ({
        value: s.step_id,
        label: `${Number(s.order) || 0}. ${s.title}`,
        keywords: s.slug,
      })),
    [steps]
  );

  const parentOptions = useMemo(() => {
    const parents = categories.filter((c) => !c.parent_category_id);
    return parents.map((c) => ({ value: c.category_id, label: c.name, keywords: c.slug }));
  }, [categories]);

  async function onSubmit(e) {
    e.preventDefault();
    const token = getToken();
    if (!token) return;
    if (!form.journey_step_id) {
      toast.error("Please select a journey step");
      return;
    }
    setSaving(true);
    try {
      const creatingSubcats =
        isShopping &&
        !form.parent_category_id &&
        subcats.some((s) => String(s || "").trim().length > 0);

      const res = await fetch(`${API_BASE}/admin/categories`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          journey_step_id: form.journey_step_id,
          name: form.name,
          slug: form.slug || slugify(form.name),
          is_active: !!form.is_active,
          image_url: form.image_url || null,
          parent_category_id: isShopping ? (form.parent_category_id || null) : null,
        }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        toast.error(err.message || "Failed to create category");
        return;
      }
      const created = await res.json().catch(() => ({}));
      const parentId = created.categoryId || created?.category?.category_id;

      if (creatingSubcats && parentId) {
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
        toast.success("Category + subcategories created");
      } else {
        toast.success("Category created");
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
        title="Create category"
        description="Organize journey content with clean category structure."
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
          <CardTitle>Create category</CardTitle>
        </CardHeader>
        <CardContent>
          <form className="space-y-4 max-w-xl" onSubmit={onSubmit}>
            <div className="space-y-2">
              <Label>Journey step *</Label>
              <Combobox
                value={form.journey_step_id}
                onChange={(v) =>
                  setForm((f) => ({ ...f, journey_step_id: v, parent_category_id: "" }))
                }
                options={stepOptions}
                placeholder="Select step…"
                searchPlaceholder="Search steps…"
              />
            </div>

            {isShopping && (
              <div className="space-y-2">
                <Label>Parent category (optional)</Label>
                <select
                  value={form.parent_category_id}
                  onChange={(e) => setForm((f) => ({ ...f, parent_category_id: e.target.value }))}
                  className="flex h-10 w-full rounded-lg border border-(--input) bg-transparent px-3 py-2 text-sm"
                  disabled={!form.journey_step_id}
                >
                  <option value="">Top-level category</option>
                  {parentOptions.map((p) => (
                    <option key={p.value} value={p.value}>
                      {p.label}
                    </option>
                  ))}
                </select>
                <p className="text-xs text-muted-foreground">
                  If selected, this becomes a subcategory under the parent.
                </p>
              </div>
            )}

            <div className="space-y-2">
              <Label>Name *</Label>
              <Input value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} required />
            </div>

            <ImageUpload 
              label="Category Image"
              initialUrl={form.image_url}
              onUploadComplete={(url) => setForm(f => ({ ...f, image_url: url }))}
            />
            <div className="space-y-2">
              <Label>Slug</Label>
              <Input value={form.slug} onChange={(e) => setForm((f) => ({ ...f, slug: slugify(e.target.value) }))} placeholder="banquet-hall" />
            </div>

            {isShopping && !form.parent_category_id && (
              <div className="space-y-2">
                <div className="flex items-center justify-between gap-2">
                  <Label>Subcategories (Shopping)</Label>
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
                        placeholder={idx === 0 ? "e.g., Saree" : "Subcategory name"}
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
                  Parent category ke saath hi subcategories create ho jayengi.
                </p>
              </div>
            )}

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

