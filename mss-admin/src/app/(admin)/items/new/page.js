"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Save } from "lucide-react";
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

export default function NewItemPage() {
  const router = useRouter();
  const sp = useSearchParams();
  const initialStepId = sp.get("stepId") || "";

  const [steps, setSteps] = useState([]);
  const [vendors, setVendors] = useState([]);
  const [categories, setCategories] = useState([]);
  const [saving, setSaving] = useState(false);

  const [form, setForm] = useState({
    journey_step_id: initialStepId,
    category_id: "",
    subcategory_id: "",
    vendor_id: "",
    name: "",
    description: "",
    price: "",
    item_type: "Service",
    location_city: "",
    status: "Active",
    listing_start_at: "",
    listing_end_at: "",
    discount_enabled: false,
    discount_percentage: "",
    discount_starts_at: "",
    discount_ends_at: "",
    returnable: false,
    cancellable: true,
    refundable: false,
    replaceable: false,
    exchangeable: false,
    cancellation_window_hours: "24",
    refund_window_days: "",
    return_window_days: "",
    return_policy_text: "",
    exchange_policy_text: "",
    damage_policy_text: "",
    image_url: "",
  });

  useEffect(() => {
    const token = getToken();
    if (!token) return;
    fetch(`${API_BASE}/admin/journey-steps`, { headers: { Authorization: `Bearer ${token}` } })
      .then((r) => r.json())
      .then((d) => setSteps(d.steps || []));
    fetch(`${API_BASE}/admin/vendors`, { headers: { Authorization: `Bearer ${token}` } })
      .then((r) => r.json())
      .then((d) => setVendors(d.vendors || []));
  }, []);

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

  const stepOptions = useMemo(
    () =>
      steps.map((s) => ({
        value: s.step_id,
        label: `${Number(s.order) || 0}. ${s.title}`,
        keywords: s.slug,
      })),
    [steps]
  );

  const currentStep = steps.find((s) => s.step_id === form.journey_step_id);
  const isShopping = currentStep?.slug === "shopping";

  const parentCategories = categories.filter((c) => !c.parent_category_id);
  const subcategories = categories.filter((c) => !!c.parent_category_id);
  const categoryOptions = parentCategories.map((c) => ({ value: c.category_id, label: c.name, keywords: c.slug }));
  const subcategoryOptions = subcategories
    .filter((c) => (form.category_id ? c.parent_category_id === form.category_id : true))
    .map((c) => ({ value: c.category_id, label: c.name, keywords: c.slug }));

  const vendorOptions = vendors.map((v) => ({
    value: v.vendor_id,
    label: `${v.business_name}${v.city ? ` (${v.city})` : ""}`,
    keywords: `${v.vendor_type || ""} ${v.city || ""} ${v.contact_email || v.email || ""}`.trim(),
  }));

  async function onSubmit(e) {
    e.preventDefault();
    const token = getToken();
    if (!token) return;
    setSaving(true);
    try {
      const res = await fetch(`${API_BASE}/admin/items`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          journey_step_id: form.journey_step_id,
          category_id: form.category_id,
          subcategory_id: isShopping ? (form.subcategory_id || null) : null,
          vendor_id: form.vendor_id,
          name: form.name,
          description: form.description || null,
          price: Number(form.price) || 0,
          item_type: form.item_type,
          location_city: form.location_city || null,
          status: form.status,
          listing_start_at: form.listing_start_at ? new Date(form.listing_start_at).toISOString() : null,
          listing_end_at: form.listing_end_at ? new Date(form.listing_end_at).toISOString() : null,
          discount: {
            is_enabled: !!form.discount_enabled,
            percentage: Number(form.discount_percentage) || 0,
            starts_at: form.discount_starts_at ? new Date(form.discount_starts_at).toISOString() : null,
            ends_at: form.discount_ends_at ? new Date(form.discount_ends_at).toISOString() : null,
          },
          policies: {
            cancellable: !!form.cancellable,
            refundable: !!form.refundable,
            returnable: !!form.returnable,
            replaceable: !!form.replaceable,
            exchangeable: !!form.exchangeable,
            cancellation_window_hours: form.cancellation_window_hours ? Number(form.cancellation_window_hours) : 24,
            refund_window_days: form.refund_window_days ? Number(form.refund_window_days) : 0,
            return_window_days: form.return_window_days ? Number(form.return_window_days) : null,
            return_policy_text: form.return_policy_text || null,
            exchange_policy_text: form.exchange_policy_text || null,
            damage_policy_text: form.damage_policy_text || null,
          },
          images: form.image_url ? [form.image_url] : [],
        }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        toast.error(err.message || "Failed to create item");
        return;
      }
      toast.success("Item created");
      router.push("/items");
      router.refresh();
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-6">
      <SectionHeader
        title="Create item"
        description="Add a new marketplace listing with pricing and policy settings."
        action={
          <Button variant="outline" asChild className="h-10 gap-2 rounded-lg px-4 font-medium">
            <Link href="/items">
              <ArrowLeft className="size-4" />
              Back
            </Link>
          </Button>
        }
      />

      <Card className="rounded-2xl border border-slate-200/80 shadow-sm">
        <CardHeader>
          <CardTitle>Create item</CardTitle>
        </CardHeader>
        <CardContent>
          <form className="space-y-6 max-w-3xl" onSubmit={onSubmit}>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label>Journey step *</Label>
                <Combobox
                  value={form.journey_step_id}
                  onChange={(v) => setForm((f) => ({ ...f, journey_step_id: v, category_id: "", subcategory_id: "" }))}
                  options={stepOptions}
                  placeholder="Select step…"
                  searchPlaceholder="Search steps…"
                />
              </div>
              <div className="space-y-2">
                <Label>Category *</Label>
                <Combobox
                  value={form.category_id}
                  onChange={(v) => setForm((f) => ({ ...f, category_id: v, subcategory_id: "" }))}
                  options={categoryOptions}
                  placeholder="Select category…"
                  searchPlaceholder="Search categories…"
                  disabled={!form.journey_step_id}
                />
              </div>
            </div>

            {isShopping && (
              <div className="space-y-2">
                <Label>Subcategory (Shopping only)</Label>
                <Combobox
                  value={form.subcategory_id}
                  onChange={(v) => setForm((f) => ({ ...f, subcategory_id: v }))}
                  options={[{ value: "", label: "No subcategory" }, ...subcategoryOptions]}
                  placeholder={form.category_id ? "Select subcategory…" : "Select category first…"}
                  searchPlaceholder="Search subcategories…"
                  disabled={!form.category_id}
                />
              </div>
            )}

            <div className="space-y-2">
              <Label>Vendor *</Label>
              <Combobox
                value={form.vendor_id}
                onChange={(v) => setForm((f) => ({ ...f, vendor_id: v }))}
                options={vendorOptions}
                placeholder="Select vendor…"
                searchPlaceholder="Search vendors…"
              />
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label>Name *</Label>
                <Input value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} required />
              </div>
              <div className="space-y-2">
                <Label>City</Label>
                <Input value={form.location_city} onChange={(e) => setForm((f) => ({ ...f, location_city: e.target.value }))} placeholder="Mumbai" />
              </div>
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
              <div className="space-y-2">
                <Label>Price</Label>
                <Input type="number" value={form.price} onChange={(e) => setForm((f) => ({ ...f, price: e.target.value }))} placeholder="250000" />
              </div>
              <div className="space-y-2">
                <Label>Type</Label>
                <select value={form.item_type} onChange={(e) => setForm((f) => ({ ...f, item_type: e.target.value }))} className="h-10 w-full rounded-lg border border-(--input) bg-transparent px-3 py-2 text-sm">
                  <option value="Service">Service</option>
                  <option value="Product">Product</option>
                  <option value="Venue">Venue</option>
                </select>
              </div>
              <div className="space-y-2">
                <Label>Status</Label>
                <select value={form.status} onChange={(e) => setForm((f) => ({ ...f, status: e.target.value }))} className="h-10 w-full rounded-lg border border-(--input) bg-transparent px-3 py-2 text-sm">
                  <option value="Active">Active</option>
                  <option value="Inactive">Inactive</option>
                </select>
              </div>
            </div>

            <div className="space-y-2">
              <Label>Description</Label>
              <Input value={form.description} onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))} placeholder="Short description…" />
            </div>

            <ImageUpload 
              label="Product/Venue Image"
              initialUrl={form.image_url}
              onUploadComplete={(url) => setForm(f => ({ ...f, image_url: url }))}
            />

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label>Listing start</Label>
                <Input type="datetime-local" value={form.listing_start_at} onChange={(e) => setForm((f) => ({ ...f, listing_start_at: e.target.value }))} />
              </div>
              <div className="space-y-2">
                <Label>Listing end</Label>
                <Input type="datetime-local" value={form.listing_end_at} onChange={(e) => setForm((f) => ({ ...f, listing_end_at: e.target.value }))} />
              </div>
            </div>

            <Card className="border-border">
              <CardHeader className="py-4">
                <CardTitle className="text-base">Discount (time-bound)</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 pt-0">
                <label className="flex items-center gap-2 text-sm">
                  <input type="checkbox" checked={!!form.discount_enabled} onChange={(e) => setForm((f) => ({ ...f, discount_enabled: e.target.checked }))} />
                  Enable discount
                </label>
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                  <div className="space-y-2">
                    <Label>Percentage</Label>
                    <Input type="number" min="0" max="100" value={form.discount_percentage} onChange={(e) => setForm((f) => ({ ...f, discount_percentage: e.target.value }))} disabled={!form.discount_enabled} />
                  </div>
                  <div className="space-y-2">
                    <Label>Starts at</Label>
                    <Input type="datetime-local" value={form.discount_starts_at} onChange={(e) => setForm((f) => ({ ...f, discount_starts_at: e.target.value }))} disabled={!form.discount_enabled} />
                  </div>
                  <div className="space-y-2">
                    <Label>Ends at</Label>
                    <Input type="datetime-local" value={form.discount_ends_at} onChange={(e) => setForm((f) => ({ ...f, discount_ends_at: e.target.value }))} disabled={!form.discount_enabled} />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="border-border">
              <CardHeader className="py-4">
                <CardTitle className="text-base">Policies</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 pt-0">
                <div className="flex flex-wrap gap-4 text-sm">
                  <label className="flex items-center gap-2">
                    <input type="checkbox" checked={!!form.cancellable} onChange={(e) => setForm((f) => ({ ...f, cancellable: e.target.checked }))} />
                    Cancellable
                  </label>
                  <label className="flex items-center gap-2">
                    <input type="checkbox" checked={!!form.refundable} onChange={(e) => setForm((f) => ({ ...f, refundable: e.target.checked }))} />
                    Refundable
                  </label>
                  <label className="flex items-center gap-2">
                    <input type="checkbox" checked={!!form.returnable} onChange={(e) => setForm((f) => ({ ...f, returnable: e.target.checked }))} />
                    Returnable
                  </label>
                  <label className="flex items-center gap-2">
                    <input type="checkbox" checked={!!form.replaceable} onChange={(e) => setForm((f) => ({ ...f, replaceable: e.target.checked }))} />
                    Replaceable
                  </label>
                  <label className="flex items-center gap-2">
                    <input type="checkbox" checked={!!form.exchangeable} onChange={(e) => setForm((f) => ({ ...f, exchangeable: e.target.checked }))} />
                    Exchangeable
                  </label>
                </div>
                <div className="space-y-2">
                  <Label>Cancellation window (hours)</Label>
                  <Input type="number" min="0" value={form.cancellation_window_hours} onChange={(e) => setForm((f) => ({ ...f, cancellation_window_hours: e.target.value }))} />
                </div>
                <div className="space-y-2">
                  <Label>Refund window (days)</Label>
                  <Input type="number" min="0" value={form.refund_window_days} onChange={(e) => setForm((f) => ({ ...f, refund_window_days: e.target.value }))} />
                </div>
                <div className="space-y-2">
                  <Label>Return window (days)</Label>
                  <Input type="number" min="0" value={form.return_window_days} onChange={(e) => setForm((f) => ({ ...f, return_window_days: e.target.value }))} />
                </div>
                <div className="space-y-2">
                  <Label>Return policy</Label>
                  <Input value={form.return_policy_text} onChange={(e) => setForm((f) => ({ ...f, return_policy_text: e.target.value }))} />
                </div>
                <div className="space-y-2">
                  <Label>Exchange policy</Label>
                  <Input value={form.exchange_policy_text} onChange={(e) => setForm((f) => ({ ...f, exchange_policy_text: e.target.value }))} />
                </div>
                <div className="space-y-2">
                  <Label>Damage policy</Label>
                  <Input value={form.damage_policy_text} onChange={(e) => setForm((f) => ({ ...f, damage_policy_text: e.target.value }))} />
                </div>
              </CardContent>
            </Card>

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

