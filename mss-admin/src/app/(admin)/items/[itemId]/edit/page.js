"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Save } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Combobox } from "@/components/Combobox";
import { toast } from "sonner";
import ImageUpload from "@/components/ImageUpload";
import { cn } from "@/lib/utils";
import SectionHeader from "@/components/ui/section-header";

const API_BASE = "/api/v1";

function getToken() {
  if (typeof window === "undefined") return null;
  return localStorage.getItem("mss_token");
}

function toLocalDateTimeInputValue(d) {
  if (!d) return "";
  const dt = new Date(d);
  const pad = (n) => String(n).padStart(2, "0");
  const yyyy = dt.getFullYear();
  const mm = pad(dt.getMonth() + 1);
  const dd = pad(dt.getDate());
  const hh = pad(dt.getHours());
  const min = pad(dt.getMinutes());
  return `${yyyy}-${mm}-${dd}T${hh}:${min}`;
}

export default function EditItemPage() {
  const params = useParams();
  const router = useRouter();
  const itemId = params.itemId;

  const [steps, setSteps] = useState([]);
  const [vendors, setVendors] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [form, setForm] = useState({
    journey_step_id: "",
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
    replaceable: false,
    exchangeable: false,
    return_window_days: "",
    return_policy_text: "",
    exchange_policy_text: "",
    damage_policy_text: "",
    image_url: "",
  });

  useEffect(() => {
    const token = getToken();
    if (!token || !itemId) return;

    Promise.all([
      fetch(`${API_BASE}/admin/journey-steps`, { headers: { Authorization: `Bearer ${token}` } }).then((r) => r.json()),
      fetch(`${API_BASE}/admin/vendors`, { headers: { Authorization: `Bearer ${token}` } }).then((r) => r.json()),
      fetch(`${API_BASE}/admin/items/${itemId}`, { headers: { Authorization: `Bearer ${token}` } }).then((r) => r.json()),
    ])
      .then(([stepsRes, vendorsRes, item]) => {
        setSteps(stepsRes.steps || []);
        setVendors(vendorsRes.vendors || []);
        setForm({
          journey_step_id: item.journey_step_id || "",
          category_id: item.category_id || "",
          subcategory_id: item.subcategory_id || "",
          vendor_id: item.vendor_id || "",
          name: item.name || "",
          description: item.description || "",
          price: String(item.price ?? ""),
          item_type: item.item_type || "Service",
          location_city: item.location_city || "",
          status: item.status || "Active",
          listing_start_at: toLocalDateTimeInputValue(item.listing_start_at),
          listing_end_at: toLocalDateTimeInputValue(item.listing_end_at),
          discount_enabled: item.discount?.is_enabled === true,
          discount_percentage: String(item.discount?.percentage ?? ""),
          discount_starts_at: toLocalDateTimeInputValue(item.discount?.starts_at),
          discount_ends_at: toLocalDateTimeInputValue(item.discount?.ends_at),
          returnable: item.policies?.returnable === true,
          replaceable: item.policies?.replaceable === true,
          exchangeable: item.policies?.exchangeable === true,
          return_window_days: String(item.policies?.return_window_days ?? ""),
          return_policy_text: item.policies?.return_policy_text || "",
          exchange_policy_text: item.policies?.exchange_policy_text || "",
          damage_policy_text: item.policies?.damage_policy_text || "",
          image_url: Array.isArray(item.images) && item.images.length > 0 ? item.images[0] : "",
        });
      })
      .finally(() => setLoading(false));
  }, [itemId]);

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

  const vendorOptions = useMemo(
    () =>
      vendors.map((v) => ({
        value: v.vendor_id,
        label: `${v.business_name}${v.city ? ` (${v.city})` : ""}`,
        keywords: `${v.vendor_type || ""} ${v.city || ""} ${v.contact_email || v.email || ""}`.trim(),
      })),
    [vendors]
  );

  const currentStep = steps.find((s) => s.step_id === form.journey_step_id);
  const isShopping = currentStep?.slug === "shopping";

  const parentCategories = categories.filter((c) => !c.parent_category_id);
  const subcategories = categories.filter((c) => !!c.parent_category_id);
  const categoryOptions = parentCategories.map((c) => ({ value: c.category_id, label: c.name, keywords: c.slug }));
  const subcategoryOptions = subcategories
    .filter((c) => (form.category_id ? c.parent_category_id === form.category_id : true))
    .map((c) => ({ value: c.category_id, label: c.name, keywords: c.slug }));

  async function onSubmit(e) {
    e.preventDefault();
    const token = getToken();
    if (!token) return;
    setSaving(true);
    try {
      const res = await fetch(`${API_BASE}/admin/items/${itemId}`, {
        method: "PUT",
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
            returnable: !!form.returnable,
            replaceable: !!form.replaceable,
            exchangeable: !!form.exchangeable,
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
        toast.error(err.message || "Failed to update item");
        return;
      }
      toast.success("Item updated");
      router.push("/items");
      router.refresh();
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <SectionHeader
        title="Edit item"
        description="Update listing details, discount windows, and policy settings."
        action={
          <div className="flex items-center gap-3">
            <Button variant="outline" asChild className="h-10 gap-2 rounded-lg px-4 font-medium">
              <Link href="/items">
                <ArrowLeft className="size-4" />
                Cancel
              </Link>
            </Button>
            <Button type="submit" form="item-form" className="h-10 gap-2 rounded-lg bg-slate-900 px-4 font-medium" disabled={saving}>
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
               <div className="h-12 w-12 animate-spin rounded-full border-4 border-emerald-500 border-t-transparent" />
               <p className="text-sm font-medium">Fetching item specifications...</p>
             </div>
          ) : (
            <form id="item-form" className="space-y-12" onSubmit={onSubmit}>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-x-12 gap-y-12">
                
                {/* Categorization Section */}
                <div className="space-y-8 col-span-1 lg:col-span-2">
                   <h3 className="text-sm font-semibold text-slate-700 border-b border-slate-100 pb-3">Classification</h3>
                   <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                      <div className="space-y-3">
                        <Label className="text-sm font-semibold text-slate-700 ml-1">Phase Stage *</Label>
                        <Combobox
                          value={form.journey_step_id}
                          onChange={(v) => setForm((f) => ({ ...f, journey_step_id: v, category_id: "", subcategory_id: "" }))}
                          options={stepOptions}
                          placeholder="Select journey phase…"
                        />
                      </div>
                      <div className="space-y-3">
                        <Label className="text-sm font-semibold text-slate-700 ml-1">Primary Category *</Label>
                        <Combobox
                          value={form.category_id}
                          onChange={(v) => setForm((f) => ({ ...f, category_id: v, subcategory_id: "" }))}
                          options={categoryOptions}
                          placeholder="Select category…"
                          disabled={!form.journey_step_id}
                        />
                      </div>
                      {isShopping && (
                        <div className="space-y-3 animate-in fade-in zoom-in-95 duration-300">
                          <Label className="text-sm font-semibold text-slate-700 ml-1">Deep Subcategory</Label>
                          <Combobox
                            value={form.subcategory_id}
                            onChange={(v) => setForm((f) => ({ ...f, subcategory_id: v }))}
                            options={[{ value: "", label: "General Mall Item" }, ...subcategoryOptions]}
                            placeholder="Specific group…"
                            disabled={!form.category_id}
                          />
                        </div>
                      )}
                   </div>
                </div>

                {/* Core Info Section */}
                <div className="space-y-8">
                  <h3 className="text-sm font-semibold text-slate-700 border-b border-slate-100 pb-3">Business data</h3>
                  <div className="space-y-6">
                    <div className="space-y-3">
                        <Label className="text-sm font-semibold text-slate-700 ml-1">Vendor / Partner Account *</Label>
                        <Combobox
                          value={form.vendor_id}
                          onChange={(v) => setForm((f) => ({ ...f, vendor_id: v }))}
                          options={vendorOptions}
                          placeholder="Assign to vendor…"
                        />
                    </div>
                    <div className="space-y-3">
                      <Label className="text-sm font-semibold text-slate-700 ml-1">Display Name *</Label>
                      <Input value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} required className="h-14 rounded-2xl bg-slate-50 border-transparent focus:bg-white focus:ring-4 focus:ring-emerald-50 transition-all text-lg font-medium" />
                    </div>
                    <div className="grid grid-cols-2 gap-6">
                        <div className="space-y-3">
                          <Label className="text-sm font-semibold text-slate-700 ml-1">Base Price (₹)</Label>
                          <Input type="number" value={form.price} onChange={(e) => setForm((f) => ({ ...f, price: e.target.value }))} className="h-12 rounded-2xl bg-slate-50 border-transparent focus:bg-white focus:ring-4 focus:ring-emerald-50 transition-all font-mono" />
                        </div>
                        <div className="space-y-3">
                          <Label className="text-sm font-semibold text-slate-700 ml-1">Offer Target Type</Label>
                          <select value={form.item_type} onChange={(e) => setForm((f) => ({ ...f, item_type: e.target.value }))} className="h-12 w-full rounded-2xl border-transparent bg-slate-50 px-4 py-2 text-sm focus:bg-white focus:ring-4 focus:ring-emerald-50 outline-none transition-all font-bold text-slate-600">
                            <option value="Service">Professional Service</option>
                            <option value="Product">Physical Product</option>
                            <option value="Venue">Event Venue</option>
                          </select>
                        </div>
                    </div>
                  </div>
                </div>

                <div className="space-y-8">
                   <h3 className="text-sm font-semibold text-slate-700 border-b border-slate-100 pb-3">Visual and context</h3>
                   <div className="space-y-6">
                      <div className="space-y-3">
                        <Label className="text-sm font-semibold text-slate-700 ml-1">Local Operation City</Label>
                        <Input value={form.location_city} onChange={(e) => setForm((f) => ({ ...f, location_city: e.target.value }))} placeholder="Global / Remote" className="h-12 rounded-2xl bg-slate-50 border-transparent focus:bg-white transition-all shadow-sm" />
                      </div>
                      <div className="space-y-3">
                        <Label className="text-sm font-semibold text-slate-700 ml-1">Marketing Pitch / Summary</Label>
                        <Input value={form.description} onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))} className="h-12 rounded-2xl bg-slate-50 border-transparent focus:bg-white transition-all shadow-sm" />
                      </div>
                      <div className="p-1 rounded-2xl bg-slate-50/50 ring-1 ring-slate-100">
                        <ImageUpload 
                          label="Gallery Image"
                          initialUrl={form.image_url}
                          onUploadComplete={(url) => setForm(f => ({ ...f, image_url: url }))}
                        />
                      </div>
                   </div>
                </div>

                {/* Scheduling Section */}
                <div className="space-y-8 col-span-1 lg:col-span-2">
                   <h3 className="text-sm font-semibold text-slate-700 border-b border-slate-100 pb-3">Visibility and campaign</h3>
                   <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
                      <div className="space-y-3">
                        <Label className="text-sm font-semibold text-slate-700 ml-1">Listing Start</Label>
                        <Input type="datetime-local" value={form.listing_start_at} onChange={(e) => setForm((f) => ({ ...f, listing_start_at: e.target.value }))} className="h-12 rounded-2xl bg-slate-50 border-transparent focus:bg-white transition-all" />
                      </div>
                      <div className="space-y-3">
                        <Label className="text-sm font-semibold text-slate-700 ml-1">Listing End</Label>
                        <Input type="datetime-local" value={form.listing_end_at} onChange={(e) => setForm((f) => ({ ...f, listing_end_at: e.target.value }))} className="h-12 rounded-2xl bg-slate-50 border-transparent focus:bg-white transition-all" />
                      </div>
                      <div className="space-y-3 md:col-span-2 flex flex-col justify-end">
                          <Card className="border-none bg-emerald-50/40 shadow-none ring-1 ring-inset ring-emerald-100/50 p-4 rounded-2xl">
                            <label className="flex items-center justify-between w-full h-full cursor-pointer group">
                                <div className="flex flex-col">
                                   <span className="text-sm font-semibold text-emerald-900">Campaign status</span>
                                   <span className="text-xs text-emerald-600 leading-none mt-1">Marketplace visibility</span>
                                </div>
                                <select value={form.status} onChange={(e) => setForm((f) => ({ ...f, status: e.target.value }))} className="h-10 rounded-xl border-none bg-white font-black text-emerald-600 px-4 text-xs shadow-md ring-1 ring-emerald-100 focus:outline-none transition-all hover:scale-105 active:scale-95">
                                  <option value="Active">Operational & Live</option>
                                  <option value="Inactive">Paused / Internal Only</option>
                                </select>
                            </label>
                          </Card>
                      </div>
                   </div>
                </div>

                {/* Promotional Logic */}
                <div className="col-span-1 lg:col-span-2">
                  <Card className="rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden bg-white">
                    <CardHeader className="py-6 px-10 border-b border-slate-50 bg-slate-50/20">
                       <div className="flex items-center justify-between">
                          <CardTitle className="text-sm font-semibold text-cyan-700 flex items-center gap-3">
                             <div className="h-8 w-8 rounded-full bg-cyan-50 flex items-center justify-center">⚡</div>
                             Flash Sale & Discounts
                          </CardTitle>
                          <label className="flex items-center gap-3 cursor-pointer p-2 rounded-full hover:bg-slate-50 transition-all">
                            <span className="text-xs font-medium text-slate-500">Active</span>
                            <input type="checkbox" checked={!!form.discount_enabled} onChange={(e) => setForm((f) => ({ ...f, discount_enabled: e.target.checked }))} className="h-6 w-6 rounded-lg border-slate-200 text-cyan-500 focus:ring-cyan-500 accent-cyan-500" />
                          </label>
                       </div>
                    </CardHeader>
                    <CardContent className="p-10">
                        <div className={cn("grid grid-cols-1 md:grid-cols-3 gap-10 transition-all duration-500", !form.discount_enabled && "opacity-20 pointer-events-none filter grayscale scale-[0.98]")}>
                            <div className="space-y-3">
                              <Label className="text-xs font-medium text-slate-500 ml-1">Percentage %</Label>
                              <Input type="number" min="0" max="100" value={form.discount_percentage} onChange={(e) => setForm((f) => ({ ...f, discount_percentage: e.target.value }))} disabled={!form.discount_enabled} className="h-12 rounded-2xl bg-slate-50 border-transparent focus:bg-white focus:ring-4 focus:ring-cyan-50 font-mono text-cyan-700" />
                            </div>
                            <div className="space-y-3">
                              <Label className="text-xs font-medium text-slate-500 ml-1">Sale start</Label>
                              <Input type="datetime-local" value={form.discount_starts_at} onChange={(e) => setForm((f) => ({ ...f, discount_starts_at: e.target.value }))} disabled={!form.discount_enabled} className="h-12 rounded-2xl bg-slate-50 border-transparent focus:bg-white transition-all shadow-sm" />
                            </div>
                            <div className="space-y-3">
                              <Label className="text-xs font-medium text-slate-500 ml-1">Sale expiry</Label>
                              <Input type="datetime-local" value={form.discount_ends_at} onChange={(e) => setForm((f) => ({ ...f, discount_ends_at: e.target.value }))} disabled={!form.discount_enabled} className="h-12 rounded-2xl bg-slate-50 border-transparent focus:bg-white transition-all shadow-sm" />
                            </div>
                        </div>
                    </CardContent>
                  </Card>
                </div>

                {/* Policies Section */}
                <div className="col-span-1 lg:col-span-2">
                  <Card className="rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden bg-white">
                    <CardHeader className="py-6 px-10 border-b border-slate-50 bg-slate-50/20">
                       <CardTitle className="text-sm font-semibold text-indigo-700 flex items-center gap-3">
                          <div className="h-8 w-8 rounded-full bg-indigo-50 flex items-center justify-center">🛡️</div>
                          Service & Return Policies
                       </CardTitle>
                    </CardHeader>
                    <CardContent className="p-10 space-y-10">
                       <div className="flex flex-wrap gap-10">
                          {[
                            { label: "Returnable", key: "returnable" },
                            { label: "Replaceable", key: "replaceable" },
                            { label: "Exchangeable", key: "exchangeable" }
                          ].map(policy => (
                            <label key={policy.key} className="flex items-center gap-4 cursor-pointer group">
                              <input 
                                type="checkbox" 
                                checked={!!form[policy.key]} 
                                onChange={(e) => setForm((f) => ({ ...f, [policy.key]: e.target.checked }))} 
                                className="h-7 w-7 rounded-xl border-slate-200 text-indigo-500 focus:ring-indigo-500 transition-all accent-indigo-600"
                              />
                              <span className="text-sm font-semibold text-slate-600 group-hover:text-indigo-600 transition-colors">{policy.label}</span>
                            </label>
                          ))}
                          <div className="flex-1 min-w-[280px] flex items-center gap-4 bg-slate-50 p-3 rounded-2xl ring-1 ring-slate-100/50">
                             <div className="flex flex-col">
                               <span className="text-[10px] font-medium text-slate-400">Window</span>
                               <span className="text-xs font-semibold text-slate-700 whitespace-nowrap">Processing days</span>
                             </div>
                             <Input type="number" min="0" value={form.return_window_days} onChange={(e) => setForm((f) => ({ ...f, return_window_days: e.target.value }))} className="h-10 border-none bg-white font-mono text-center shadow-md w-24 rounded-xl text-indigo-600 font-bold" />
                          </div>
                       </div>

                       <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                          <div className="space-y-3">
                            <Label className="text-xs font-medium text-slate-500 ml-1">Return clause</Label>
                            <Input value={form.return_policy_text} onChange={(e) => setForm((f) => ({ ...f, return_policy_text: e.target.value }))} className="h-12 rounded-2xl bg-slate-50 border-transparent focus:bg-white transition-all shadow-sm" />
                          </div>
                          <div className="space-y-3">
                            <Label className="text-xs font-medium text-slate-500 ml-1">Exchange clause</Label>
                            <Input value={form.exchange_policy_text} onChange={(e) => setForm((f) => ({ ...f, exchange_policy_text: e.target.value }))} className="h-12 rounded-2xl bg-slate-50 border-transparent focus:bg-white transition-all shadow-sm" />
                          </div>
                          <div className="space-y-3">
                            <Label className="text-xs font-medium text-slate-500 ml-1">Damage protection</Label>
                            <Input value={form.damage_policy_text} onChange={(e) => setForm((f) => ({ ...f, damage_policy_text: e.target.value }))} className="h-12 rounded-2xl bg-slate-50 border-transparent focus:bg-white transition-all shadow-sm" />
                          </div>
                       </div>
                    </CardContent>
                  </Card>
                </div>

              </div>
            </form>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

