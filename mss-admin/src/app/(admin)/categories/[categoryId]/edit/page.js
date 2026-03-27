"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Plus, Save, Trash2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Combobox } from "@/components/Combobox";
import { toast } from "sonner";
import ImageUpload from "@/components/ImageUpload";
import { Separator } from "@/components/ui/separator";
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

export default function EditCategoryPage() {
  const params = useParams();
  const router = useRouter();
  const categoryId = params.categoryId;

  const [steps, setSteps] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [subcategories, setSubcategories] = useState([]);
  const [initialChildIds, setInitialChildIds] = useState([]);
  const [form, setForm] = useState({
    journey_step_id: "",
    parent_category_id: "",
    name: "",
    slug: "",
    is_active: true,
    image_url: "",
  });

  useEffect(() => {
    const token = getToken();
    if (!token || !categoryId) return;
    async function load() {
      setLoading(true);
      try {
        const [stepsRes, cat] = await Promise.all([
          fetch(`${API_BASE}/admin/journey-steps`, { headers: { Authorization: `Bearer ${token}` } }).then((r) => r.json()),
          fetch(`${API_BASE}/admin/categories/${categoryId}`, { headers: { Authorization: `Bearer ${token}` } }).then((r) => r.json()),
        ]);

        setSteps(stepsRes.steps || []);
        setForm({
          journey_step_id: cat.journey_step_id || "",
          parent_category_id: cat.parent_category_id || "",
          name: cat.name || "",
          slug: cat.slug || "",
          is_active: cat.is_active !== false,
          image_url: cat.image_url || "",
        });
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [categoryId]);

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

  useEffect(() => {
    const childList = categories.filter((c) => c.parent_category_id === categoryId);
    if (childList.length > 0) {
      setSubcategories(
        childList.map((c) => ({
          id: c.category_id,
          name: c.name || "",
          slug: c.slug || "",
          is_active: c.is_active !== false,
        }))
      );
      setInitialChildIds(childList.map((c) => c.category_id));
      return;
    }
    if (categories.length > 0) {
      setSubcategories([{ id: null, name: "", slug: "", is_active: true }]);
      setInitialChildIds([]);
    }
  }, [categories, categoryId]);

  const currentStep = steps.find((s) => s.step_id === form.journey_step_id);
  const isShopping = currentStep?.slug === "shopping";
  const isTopLevelShopping = isShopping && !form.parent_category_id;
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
    const parents = categories.filter((c) => !c.parent_category_id && c.category_id !== categoryId);
    return parents.map((c) => ({ value: c.category_id, label: c.name, keywords: c.slug }));
  }, [categories, categoryId]);

  function updateSubcategory(index, key, value) {
    setSubcategories((list) => list.map((item, i) => (i === index ? { ...item, [key]: value } : item)));
  }

  async function onSubmit(e) {
    e.preventDefault();
    const token = getToken();
    if (!token) return;
    if (!form.journey_step_id) {
      toast.error("Please select a journey step");
      return;
    }
    if (!isTopLevelShopping && initialChildIds.length > 0) {
      toast.error("Remove subcategories first or keep this as a top-level Shopping category");
      return;
    }
    setSaving(true);
    try {
      const res = await fetch(`${API_BASE}/admin/categories/${categoryId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          journey_step_id: form.journey_step_id,
          parent_category_id: isShopping ? (form.parent_category_id || null) : null,
          name: form.name,
          slug: form.slug || slugify(form.name),
          is_active: !!form.is_active,
          image_url: form.image_url || null,
        }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        toast.error(err.message || "Failed to update category");
        return;
      }

      if (isTopLevelShopping) {
        const validSubs = subcategories
          .map((item) => ({
            ...item,
            name: String(item.name || "").trim(),
            slug: slugify(item.slug || item.name),
          }))
          .filter((item) => item.name);

        const keptIds = new Set(validSubs.filter((item) => item.id).map((item) => item.id));
        const removedIds = initialChildIds.filter((id) => !keptIds.has(id));

        for (const removedId of removedIds) {
          const removeRes = await fetch(`${API_BASE}/admin/categories/${removedId}`, {
            method: "DELETE",
            headers: { Authorization: `Bearer ${token}` },
          });
          if (!removeRes.ok) {
            const err = await removeRes.json().catch(() => ({}));
            toast.error(err.message || "Failed to delete subcategory");
            return;
          }
        }

        for (const sub of validSubs) {
          if (sub.id) {
            const updateRes = await fetch(`${API_BASE}/admin/categories/${sub.id}`, {
              method: "PUT",
              headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
              body: JSON.stringify({
                journey_step_id: form.journey_step_id,
                parent_category_id: categoryId,
                name: sub.name,
                slug: sub.slug,
                is_active: sub.is_active,
              }),
            });
            if (!updateRes.ok) {
              const err = await updateRes.json().catch(() => ({}));
              toast.error(err.message || `Failed to update subcategory: ${sub.name}`);
              return;
            }
          } else {
            const createRes = await fetch(`${API_BASE}/admin/categories`, {
              method: "POST",
              headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
              body: JSON.stringify({
                journey_step_id: form.journey_step_id,
                parent_category_id: categoryId,
                name: sub.name,
                slug: sub.slug,
                is_active: true,
              }),
            });
            if (!createRes.ok) {
              const err = await createRes.json().catch(() => ({}));
              toast.error(err.message || `Failed to create subcategory: ${sub.name}`);
              return;
            }
          }
        }
      }

      toast.success("Category updated");
      router.push(`/categories?stepId=${encodeURIComponent(form.journey_step_id)}`);
      router.refresh();
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <SectionHeader
        title="Edit category"
        description="Update category structure, media, and visibility."
        action={
          <div className="flex items-center gap-3">
            <Button variant="outline" asChild className="h-10 gap-2 rounded-lg px-4 font-medium">
              <Link href="/categories">
                <ArrowLeft className="size-4" />
                Cancel
              </Link>
            </Button>
            <Button type="submit" form="category-form" className="h-10 gap-2 rounded-lg bg-slate-900 px-4 font-medium" disabled={saving}>
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
               <div className="h-12 w-12 animate-spin rounded-full border-4 border-pink-500 border-t-transparent" />
               <p className="text-sm font-medium">Fetching category data...</p>
             </div>
          ) : (
            <form id="category-form" className="space-y-10" onSubmit={onSubmit}>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-10">
                
                <div className="space-y-3">
                  <Label className="text-sm font-medium text-slate-700 ml-1">Journey step *</Label>
                  <Combobox
                    value={form.journey_step_id}
                    onChange={(v) => setForm((f) => ({ ...f, journey_step_id: v, parent_category_id: "" }))}
                    options={stepOptions}
                    placeholder="Select step…"
                    searchPlaceholder="Search steps…"
                  />
                  <p className="text-xs text-slate-500 ml-1">This decides where the category appears in the journey.</p>
                </div>

                {isShopping && (
                  <div className="space-y-3">
                    <Label className="text-sm font-medium text-slate-700 ml-1">Parent category (optional)</Label>
                    <select
                      value={form.parent_category_id}
                      onChange={(e) => setForm((f) => ({ ...f, parent_category_id: e.target.value }))}
                      className="flex h-12 w-full rounded-2xl border-transparent bg-slate-50 px-4 py-2 text-sm font-medium focus:bg-white focus:ring-4 focus:ring-slate-100 transition-all outline-none"
                    >
                      <option value="">Top-level category</option>
                      {parentOptions.map((p) => (
                        <option key={p.value} value={p.value}>
                          {p.label}
                        </option>
                      ))}
                    </select>
                    <p className="text-xs text-slate-500 ml-1">Use parent category to create hierarchy.</p>
                  </div>
                )}

                <div className="space-y-3 col-span-1 md:col-span-2">
                   <Separator className="bg-slate-100" />
                </div>

                <div className="space-y-3">
                  <Label className="text-sm font-medium text-slate-700 ml-1">Category name *</Label>
                  <Input 
                    value={form.name} 
                    onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} 
                    required 
                    className="h-12 bg-slate-50 border-transparent focus:bg-white focus:ring-4 focus:ring-slate-100 transition-all rounded-xl text-base font-medium"
                    placeholder="e.g. Photography & Video"
                  />
                </div>

                <div className="space-y-3">
                  <Label className="text-sm font-medium text-slate-700 ml-1">Slug</Label>
                  <Input 
                    value={form.slug} 
                    onChange={(e) => setForm((f) => ({ ...f, slug: slugify(e.target.value) }))} 
                    className="h-12 bg-slate-50 border-transparent focus:bg-white focus:ring-4 focus:ring-slate-100 transition-all rounded-xl font-mono text-sm text-slate-500"
                    placeholder="photography-video"
                  />
                </div>

                <div className="col-span-1 md:col-span-2">
                   <ImageUpload
                     label="Hero Banner / Thumbnail"
                     initialUrl={form.image_url}
                     onUploadComplete={(url) => setForm(f => ({ ...f, image_url: url }))}
                   />
                </div>

                {isTopLevelShopping && (
                  <div className="col-span-1 md:col-span-2 space-y-6 pt-6 border-t border-slate-100">
                    <div className="flex items-center justify-between gap-2">
                      <div>
                        <Label className="text-base font-bold text-slate-900">Sub-Classification</Label>
                        <p className="text-xs text-slate-500 mt-1">Define children categories for better navigation</p>
                      </div>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        className="gap-2 rounded-xl border-slate-200 hover:bg-slate-50 font-bold"
                        onClick={() =>
                          setSubcategories((list) => [...list, { id: null, name: "", slug: "", is_active: true }])
                        }
                      >
                        <Plus className="size-4" />
                        Add Node
                      </Button>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                      {subcategories.map((sub, index) => (
                        <div key={sub.id || index} className="space-y-4 rounded-3xl border border-slate-100 bg-slate-50/30 p-5 relative group transition-all hover:bg-white hover:shadow-xl hover:shadow-slate-200/50">
                           <div className="flex flex-col gap-4">
                              <div className="space-y-2">
                                <Label className="text-[10px] font-black uppercase text-slate-400 ml-1">Sub-Name</Label>
                                <Input
                                  value={sub.name}
                                  onChange={(e) => updateSubcategory(index, "name", e.target.value)}
                                  placeholder="Child name"
                                  className="bg-white border-slate-200 rounded-xl"
                                />
                              </div>
                              <div className="space-y-2">
                                <Label className="text-[10px] font-black uppercase text-slate-400 ml-1">Sub-Slug</Label>
                                <Input
                                  value={sub.slug}
                                  onChange={(e) => updateSubcategory(index, "slug", slugify(e.target.value))}
                                  placeholder="child-slug"
                                  className="bg-white border-slate-200 rounded-xl font-mono text-xs"
                                />
                              </div>
                           </div>
                           <Button
                              type="button"
                              variant="ghost"
                              size="icon"
                              onClick={() => setSubcategories((list) => list.filter((_, i) => i !== index))}
                              disabled={subcategories.length === 1}
                              className="absolute -top-2 -right-2 bg-white border border-slate-100 shadow-lg rounded-full h-8 w-8 hover:bg-red-50 hover:text-red-600 transition-all opacity-0 group-hover:opacity-100"
                            >
                              <Trash2 className="size-4" />
                            </Button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                <div className="col-span-1 md:col-span-2 pt-6 border-t border-slate-100">
                  <div className="flex items-center gap-3 bg-slate-50 p-4 rounded-2xl w-fit">
                    <input 
                      type="checkbox" 
                      id="is_active"
                      checked={!!form.is_active} 
                      onChange={(e) => setForm((f) => ({ ...f, is_active: e.target.checked }))} 
                      className="size-5 accent-pink-500 rounded-md border-slate-300"
                    />
                    <Label htmlFor="is_active" className="text-sm font-bold text-slate-700 cursor-pointer">Visibility is currently public (Live)</Label>
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

