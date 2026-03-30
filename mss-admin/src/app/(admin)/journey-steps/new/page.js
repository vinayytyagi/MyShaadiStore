"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
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

export default function NewJourneyStepPage() {
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    title: "",
    subtitle: "",
    slug: "",
    image_url: "",
    is_active: true,
    default_budget: 0,
    max_budget: 5000000,
  });

  async function onSubmit(e) {
    e.preventDefault();
    const token = getToken();
    if (!token) return;
    setSaving(true);
    try {
      const res = await fetch(`${API_BASE}/admin/journey-steps`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          title: form.title,
          subtitle: form.subtitle || null,
          slug: form.slug || slugify(form.title),
          image_url: form.image_url || null,
          default_budget: Number(form.default_budget) || 0,
          max_budget: Number(form.max_budget) || 0,
          is_active: true,
        }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        toast.error(err.message || "Failed to create step");
        return;
      }
      toast.success("Journey step created");
      router.push("/journey-steps");
      router.refresh();
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-6">
      <SectionHeader
        title="Create journey step"
        description="Add a new journey phase and budget defaults."
        action={
          <Button variant="outline" asChild className="h-10 gap-2 rounded-lg px-4 font-medium">
            <Link href="/journey-steps">
              <ArrowLeft className="size-4" />
              Back
            </Link>
          </Button>
        }
      />

      <Card className="rounded-2xl border border-slate-200/80 shadow-sm">
        <CardHeader>
          <CardTitle>Create journey step</CardTitle>
        </CardHeader>
        <CardContent>
          <form className="space-y-4 max-w-xl" onSubmit={onSubmit}>
            <div className="space-y-2">
              <Label>Title *</Label>
              <Input
                value={form.title}
                onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
                placeholder="Choose Your Wedding Venue"
                required
              />
            </div>
            <div className="space-y-2">
              <Label>Subtitle</Label>
              <Input
                value={form.subtitle}
                onChange={(e) => setForm((f) => ({ ...f, subtitle: e.target.value }))}
                placeholder="Select the perfect venue for your special day!"
              />
            </div>

            <ImageUpload
              label="Step Background/Banner Image"
              initialUrl={form.image_url}
              onUploadComplete={(url) => setForm(f => ({ ...f, image_url: url }))}
            />

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="space-y-2 sm:col-span-2 md:col-span-1">
                <Label>Slug *</Label>
                <Input
                  value={form.slug}
                  onChange={(e) => setForm((f) => ({ ...f, slug: slugify(e.target.value) }))}
                  placeholder="venues"
                  required
                />
              </div>
              <p className="text-xs text-slate-500 sm:col-span-2 md:col-span-1 md:self-end">
                New steps are appended to the end. Reorder from the journey steps list.
              </p>
              <div className="space-y-2">
                <Label>Default Budget (in ₹)</Label>
                <Input
                  type="number"
                  value={form.default_budget}
                  onChange={(e) => setForm((f) => ({ ...f, default_budget: e.target.value }))}
                  placeholder="e.g. 500000"
                />
              </div>
              <div className="space-y-2">
                <Label>Max Budget (in ₹)</Label>
                <Input
                  type="number"
                  value={form.max_budget}
                  onChange={(e) => setForm((f) => ({ ...f, max_budget: e.target.value }))}
                  placeholder="e.g. 5000000"
                />
              </div>
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

