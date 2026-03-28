"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
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

export default function EditVendorPage() {
  const params = useParams();
  const vendorId = useMemo(() => params?.vendorId, [params]);
  const router = useRouter();

  const [loading, setLoading] = useState(true);
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
    pickup_addresses: [],
  });

  useEffect(() => {
    async function load() {
      const token = getToken();
      if (!token) return;
      setLoading(true);
      try {
        const res = await fetch(`${API_BASE}/admin/vendors/${vendorId}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (!res.ok) {
          const err = await res.json().catch(() => ({}));
          throw new Error(err.message || "Failed to load vendor");
        }
        const v = await res.json();
        setForm({
          business_name: v.business_name || "",
          contact_email: v.contact_email || v.email || "",
          password: "",
          vendor_type: v.vendor_type || "Venue",
          city: v.city || "",
          contact_phone: v.contact_phone || "",
          commission_percentage: v.commission_percentage != null ? String(v.commission_percentage) : "",
          status: v.status || "Active",
          image_url: v.image_url || "",
          pickup_addresses: Array.isArray(v.pickup_addresses) ? v.pickup_addresses : [],
        });
      } catch (e) {
        toast.error(e.message || "Failed to load vendor");
      } finally {
        setLoading(false);
      }
    }
    if (vendorId) load();
  }, [vendorId]);

  async function onSubmit(e) {
    e.preventDefault();
    const token = getToken();
    if (!token) return;

    setSaving(true);
    try {
      const body = {
        business_name: form.business_name,
        contact_email: form.contact_email,
        vendor_type: form.vendor_type,
        city: form.city || null,
        contact_phone: form.contact_phone || null,
        commission_percentage: form.commission_percentage ? Number(form.commission_percentage) : null,
        status: form.status,
        image_url: form.image_url || null,
        pickup_addresses: form.pickup_addresses,
      };
      if (form.password && form.password.length >= 6) body.password = form.password;

      const res = await fetch(`${API_BASE}/admin/vendors/${vendorId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify(body),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.message || "Failed to update vendor");
      }
      toast.success("Vendor updated");
      router.push("/vendors");
      router.refresh();
    } catch (e2) {
      toast.error(e2.message || "Failed to update vendor");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-6">
      <SectionHeader
        title="Edit vendor"
        description="Update vendor details and credentials."
        action={
          <Button variant="ghost" size="sm" asChild className="h-10 gap-2 rounded-lg px-4 text-sm font-medium">
            <Link href="/vendors">
              <ArrowLeft className="size-4" />
              Back
            </Link>
          </Button>
        }
      />

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <Building2 className="size-5" />
            Vendor details
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="py-12 text-center text-sm text-muted-foreground">Loading…</div>
          ) : (
            <form onSubmit={onSubmit} className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2 sm:col-span-2">
                <Label htmlFor="business_name">Business Name *</Label>
                <Input
                  id="business_name"
                  value={form.business_name}
                  onChange={(e) => setForm((f) => ({ ...f, business_name: e.target.value }))}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="contact_email">Email (login)</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    id="contact_email"
                    type="email"
                    className="pl-9"
                    value={form.contact_email}
                    onChange={(e) => setForm((f) => ({ ...f, contact_email: e.target.value }))}
                    disabled
                  />
                </div>
                <p className="text-xs text-muted-foreground">Email can’t be changed (used as unique login).</p>
              </div>

              <div className="space-y-4 sm:col-span-2">
                <div className="flex items-center justify-between">
                  <Label>Pickup Addresses</Label>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() =>
                      setForm((f) => ({
                        ...f,
                        pickup_addresses: [
                          ...(f.pickup_addresses || []),
                          {
                            label: `Pickup ${(f.pickup_addresses || []).length + 1}`,
                            line1: "",
                            line2: "",
                            city: "",
                            state: "",
                            pincode: "",
                            contact_name: "",
                            contact_phone: "",
                            is_default: (f.pickup_addresses || []).length === 0,
                          },
                        ],
                      }))
                    }
                  >
                    Add Pickup
                  </Button>
                </div>
                {(form.pickup_addresses || []).map((addr, idx) => (
                  <div key={idx} className="grid grid-cols-1 gap-3 rounded-xl border border-slate-200 p-4 sm:grid-cols-3">
                    <Input placeholder="Label" value={addr.label || ""} onChange={(e) => setForm((f) => ({ ...f, pickup_addresses: f.pickup_addresses.map((p, i) => i === idx ? { ...p, label: e.target.value } : p) }))} />
                    <Input placeholder="Address line 1" value={addr.line1 || ""} onChange={(e) => setForm((f) => ({ ...f, pickup_addresses: f.pickup_addresses.map((p, i) => i === idx ? { ...p, line1: e.target.value } : p) }))} />
                    <Input placeholder="Address line 2" value={addr.line2 || ""} onChange={(e) => setForm((f) => ({ ...f, pickup_addresses: f.pickup_addresses.map((p, i) => i === idx ? { ...p, line2: e.target.value } : p) }))} />
                    <Input placeholder="City" value={addr.city || ""} onChange={(e) => setForm((f) => ({ ...f, pickup_addresses: f.pickup_addresses.map((p, i) => i === idx ? { ...p, city: e.target.value } : p) }))} />
                    <Input placeholder="State" value={addr.state || ""} onChange={(e) => setForm((f) => ({ ...f, pickup_addresses: f.pickup_addresses.map((p, i) => i === idx ? { ...p, state: e.target.value } : p) }))} />
                    <Input placeholder="Pincode" value={addr.pincode || ""} onChange={(e) => setForm((f) => ({ ...f, pickup_addresses: f.pickup_addresses.map((p, i) => i === idx ? { ...p, pincode: e.target.value } : p) }))} />
                    <Input placeholder="Contact name" value={addr.contact_name || ""} onChange={(e) => setForm((f) => ({ ...f, pickup_addresses: f.pickup_addresses.map((p, i) => i === idx ? { ...p, contact_name: e.target.value } : p) }))} />
                    <Input placeholder="Contact phone" value={addr.contact_phone || ""} onChange={(e) => setForm((f) => ({ ...f, pickup_addresses: f.pickup_addresses.map((p, i) => i === idx ? { ...p, contact_phone: e.target.value } : p) }))} />
                    <div className="flex items-center gap-4">
                      <label className="flex items-center gap-2 text-sm">
                        <input type="checkbox" checked={addr.is_default === true} onChange={() => setForm((f) => ({ ...f, pickup_addresses: f.pickup_addresses.map((p, i) => ({ ...p, is_default: i === idx })) }))} />
                        Default
                      </label>
                      {(form.pickup_addresses || []).length > 0 && (
                        <Button type="button" variant="ghost" onClick={() => setForm((f) => ({ ...f, pickup_addresses: f.pickup_addresses.filter((_, i) => i !== idx) }))}>
                          Remove
                        </Button>
                      )}
                    </div>
                  </div>
                ))}
              </div>

              <div className="space-y-2">
                <Label htmlFor="password">New Password (optional, min 6)</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    id="password"
                    type="password"
                    className="pl-9"
                    minLength={6}
                    value={form.password}
                    onChange={(e) => setForm((f) => ({ ...f, password: e.target.value }))}
                    placeholder="Leave blank to keep current"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="vendor_type">Type</Label>
                <select
                  id="vendor_type"
                  value={form.vendor_type}
                  onChange={(e) => setForm((f) => ({ ...f, vendor_type: e.target.value }))}
                  className={cn(
                    "flex h-10 w-full rounded-lg border border-(--input) bg-transparent px-3 py-2 text-sm",
                    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-(--ring)"
                  )}
                >
                  {VENDOR_TYPES.map((t) => (
                    <option key={t} value={t}>
                      {t}
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="city">City</Label>
                <div className="relative">
                  <MapPin className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    id="city"
                    className="pl-9"
                    value={form.city}
                    onChange={(e) => setForm((f) => ({ ...f, city: e.target.value }))}
                  />
                </div>
              </div>

              <div className="sm:col-span-2">
                <ImageUpload
                  label="Vendor Logo/Profile Image"
                  initialUrl={form.image_url}
                  onUploadComplete={(url) => setForm(f => ({ ...f, image_url: url }))}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="contact_phone">Phone</Label>
                <div className="relative">
                  <Phone className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    id="contact_phone"
                    className="pl-9"
                    value={form.contact_phone}
                    onChange={(e) => setForm((f) => ({ ...f, contact_phone: e.target.value }))}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="commission_percentage">Commission %</Label>
                <div className="relative">
                  <Percent className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    id="commission_percentage"
                    type="number"
                    step="0.01"
                    min="0"
                    max="100"
                    className="pl-9"
                    value={form.commission_percentage}
                    onChange={(e) => setForm((f) => ({ ...f, commission_percentage: e.target.value }))}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="status">Status</Label>
                <select
                  id="status"
                  value={form.status}
                  onChange={(e) => setForm((f) => ({ ...f, status: e.target.value }))}
                  className={cn(
                    "flex h-10 w-full rounded-lg border border-(--input) bg-transparent px-3 py-2 text-sm",
                    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-(--ring)"
                  )}
                >
                  <option value="Active">Active</option>
                  <option value="Inactive">Inactive</option>
                </select>
              </div>

              <div className="flex items-center justify-end gap-2 sm:col-span-2">
                <Button type="button" variant="outline" asChild disabled={saving}>
                  <Link href="/vendors">Cancel</Link>
                </Button>
                <Button type="submit" disabled={saving}>
                  {saving ? "Saving…" : "Save changes"}
                </Button>
              </div>
            </form>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

