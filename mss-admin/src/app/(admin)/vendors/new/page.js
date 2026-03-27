"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, Building2, Mail, Lock, MapPin, Percent, Phone } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import ImageUpload from "@/components/ImageUpload";
import SectionHeader from "@/components/ui/section-header";

const API_BASE = "/api/v1";

function getToken() {
  if (typeof window === "undefined") return null;
  return localStorage.getItem("mss_token");
}

const VENDOR_TYPES = [
  "Venue",
  "Catering",
  "Decor",
  "Photographer",
  "Makeup Artist",
  "Invitation",
  "Return Gift",
];

export default function NewVendorPage() {
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    business_name: "",
    contact_email: "",
    password: "",
    vendor_type: "Venue",
    city: "",
    contact_phone: "",
    commission_percentage: "",
    status: "Active",
    image_url: "",
  });

  async function onSubmit(e) {
    e.preventDefault();
    const token = getToken();
    if (!token) return;

    setSaving(true);
    try {
      const body = {
        business_name: form.business_name,
        email: form.contact_email,
        password: form.password,
        vendor_type: form.vendor_type,
        city: form.city || null,
        contact_phone: form.contact_phone || null,
        commission_percentage: form.commission_percentage ? Number(form.commission_percentage) : null,
        status: form.status,
        description: form.description || null, // Added description to body
        image_url: form.image_url || null, // Added image_url to body
      };

      const res = await fetch(`${API_BASE}/admin/vendors`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify(body),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.message || "Failed to create vendor");
      }
      toast.success("Vendor created");
      router.push("/vendors");
      router.refresh();
    } catch (e2) {
      toast.error(e2.message || "Failed to create vendor");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <SectionHeader
        title="Onboard vendor"
        description="Configure business profile and vendor portal access."
        action={
          <div className="flex items-center gap-3">
            <Button variant="ghost" asChild className="h-10 rounded-lg px-4 text-sm font-medium text-slate-500 hover:bg-slate-100">
              <Link href="/vendors">Discard</Link>
            </Button>
            <Button
              type="submit"
              form="vendor-form"
              className="h-10 gap-2 rounded-lg bg-slate-900 px-5 font-medium text-white hover:bg-slate-800"
              disabled={saving}
            >
              <Building2 className="size-4" />
              {saving ? "Creating..." : "Create vendor"}
            </Button>
          </div>
        }
      />

      <Card className="overflow-hidden rounded-2xl border-none shadow-xl shadow-slate-200/40 ring-1 ring-slate-100/50">
        <CardContent className="p-8 lg:p-12">
          <form id="vendor-form" onSubmit={onSubmit} className="space-y-10">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-8">
              
              <div className="space-y-3 col-span-1 md:col-span-2">
                <Label htmlFor="business_name" className="ml-1 text-sm font-medium text-slate-700">Legal business name *</Label>
                <Input
                  id="business_name"
                  value={form.business_name}
                  onChange={(e) => setForm((f) => ({ ...f, business_name: e.target.value }))}
                  placeholder="e.g. Dream Wedding Studios"
                  required
                  className="h-11 rounded-xl border-transparent bg-slate-50 text-sm font-medium transition-all focus:bg-white focus:ring-2 focus:ring-pink-100"
                />
              </div>

              <div className="space-y-3">
                <Label htmlFor="contact_email" className="ml-1 text-sm font-medium text-slate-700">Login / official email *</Label>
                <div className="relative group">
                  <Mail className="absolute left-4 top-1/2 size-5 -translate-y-1/2 text-slate-400 transition-colors group-focus-within:text-pink-500" />
                  <Input
                    id="contact_email"
                    type="email"
                    className="h-11 rounded-xl border-transparent bg-slate-50 pl-12 shadow-sm transition-all focus:bg-white"
                    value={form.contact_email}
                    onChange={(e) => setForm((f) => ({ ...f, contact_email: e.target.value }))}
                    placeholder="partner@myshaadistore.com"
                    required
                  />
                </div>
              </div>

              <div className="space-y-3">
                <Label htmlFor="password" className="ml-1 text-sm font-medium text-slate-700">Access password *</Label>
                <div className="relative group">
                  <Lock className="absolute left-4 top-1/2 size-5 -translate-y-1/2 text-slate-400 transition-colors group-focus-within:text-pink-500" />
                  <Input
                    id="password"
                    type="password"
                    className="h-11 rounded-xl border-transparent bg-slate-50 pl-12 shadow-sm transition-all focus:bg-white"
                    minLength={6}
                    value={form.password}
                    onChange={(e) => setForm((f) => ({ ...f, password: e.target.value }))}
                    required
                    placeholder="••••••••"
                  />
                </div>
              </div>

              <div className="space-y-3">
                <Label htmlFor="vendor_type" className="ml-1 text-sm font-medium text-slate-700">Service category</Label>
                <select
                  id="vendor_type"
                  value={form.vendor_type}
                  onChange={(e) => setForm((f) => ({ ...f, vendor_type: e.target.value }))}
                  className="h-11 w-full rounded-xl border-transparent bg-slate-50 px-4 py-2 text-sm font-medium text-slate-600 shadow-sm outline-none transition-all focus:bg-white"
                >
                  {VENDOR_TYPES.map((t) => (
                    <option key={t} value={t}>
                      {t}
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-3">
                <Label htmlFor="city" className="ml-1 text-sm font-medium text-slate-700">Primary city hub</Label>
                <div className="relative group">
                  <MapPin className="absolute left-4 top-1/2 size-5 -translate-y-1/2 text-slate-400 transition-colors group-focus-within:text-pink-500" />
                  <Input
                    id="city"
                    className="h-11 rounded-xl border-transparent bg-slate-50 pl-12 shadow-sm transition-all focus:bg-white"
                    value={form.city}
                    onChange={(e) => setForm((f) => ({ ...f, city: e.target.value }))}
                    placeholder="Enter city name..."
                  />
                </div>
              </div>

              <div className="space-y-3 col-span-1 md:col-span-2">
                <Label htmlFor="description" className="ml-1 text-sm font-medium text-slate-700">Professional description</Label>
                <Input
                  id="description"
                  value={form.description}
                  onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
                  placeholder="Brief overview of what makes this vendor special..."
                   className="h-11 rounded-xl border-transparent bg-slate-50 shadow-sm transition-all focus:bg-white"
                />
              </div>

              <div className="col-span-1 mt-4 rounded-2xl bg-slate-50/50 p-6 ring-1 ring-slate-100 md:col-span-2">
                <ImageUpload
                  label="Business Logo / Brand Identity"
                  initialUrl={form.image_url}
                  onUploadComplete={(url) => setForm(f => ({ ...f, image_url: url }))}
                />
              </div>

              <div className="space-y-3">
                <Label htmlFor="contact_phone" className="ml-1 text-sm font-medium text-slate-700">Customer support phone</Label>
                <div className="relative group">
                  <Phone className="absolute left-4 top-1/2 size-5 -translate-y-1/2 text-slate-400 transition-colors group-focus-within:text-pink-500" />
                  <Input
                    id="contact_phone"
                    className="h-11 rounded-xl border-transparent bg-slate-50 pl-12 shadow-sm transition-all focus:bg-white"
                    value={form.contact_phone}
                    onChange={(e) => setForm((f) => ({ ...f, contact_phone: e.target.value }))}
                    placeholder="+91"
                  />
                </div>
              </div>

              <div className="space-y-3">
                <Label htmlFor="commission_percentage" className="ml-1 text-sm font-medium text-slate-700">Base commission (%)</Label>
                <div className="relative group">
                  <Percent className="absolute left-4 top-1/2 size-5 -translate-y-1/2 text-slate-400 transition-colors group-focus-within:text-pink-500" />
                  <Input
                    id="commission_percentage"
                    type="number"
                    step="0.01"
                    min="0"
                    max="100"
                    className="h-11 rounded-xl border-transparent bg-slate-50 pl-12 shadow-sm transition-all focus:bg-white"
                    value={form.commission_percentage}
                    onChange={(e) => setForm((f) => ({ ...f, commission_percentage: e.target.value }))}
                    placeholder="0.00"
                  />
                </div>
              </div>

              <div className="space-y-3 md:col-span-2 py-4">
                 <div className="flex h-14 items-center justify-between rounded-xl border border-emerald-100/50 bg-emerald-50/50 px-6">
                    <div className="flex items-center gap-4">
                      <div className="h-3 w-3 rounded-full bg-emerald-500 shadow-[0_0_12px_rgba(16,185,129,0.5)] animate-pulse" />
                      <div>
                        <span className="block text-sm font-semibold text-emerald-900">Marketplace activation</span>
                        <span className="mt-1 text-[10px] text-emerald-600">Vendor will be publicly listable</span>
                      </div>
                    </div>
                    <select
                      id="status"
                      value={form.status}
                      onChange={(e) => setForm((f) => ({ ...f, status: e.target.value }))}
                       className="h-9 rounded-lg border-none bg-white px-4 text-xs font-medium text-emerald-600 shadow-md ring-1 ring-emerald-100 transition-all focus:outline-none"
                    >
                      <option value="Active">Operational</option>
                      <option value="Inactive">Under Review</option>
                    </select>
                 </div>
              </div>

            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}

