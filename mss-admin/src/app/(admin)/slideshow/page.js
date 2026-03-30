"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { ArrowDown, ArrowLeft, ArrowUp, Plus, Save, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import ImageUpload from "@/components/ImageUpload";

const API_BASE = "/api/v1";

function getToken() {
  if (typeof window === "undefined") return null;
  return localStorage.getItem("mss_token");
}

function emptySlide() {
  return { image_url: "", alt: "" };
}

const DEFAULT_RING_COLORS = ["#FFC107", "#4C6FFF", "#FF4F86"];

function colorPickerValue(hex, fallback) {
  const s = String(hex || "").trim();
  if (/^#[0-9a-f]{6}$/i.test(s)) return s;
  if (/^#[0-9a-f]{3}$/i.test(s)) {
    return `#${s[1]}${s[1]}${s[2]}${s[2]}${s[3]}${s[3]}`;
  }
  return fallback;
}

export default function SlideshowPage() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [slides, setSlides] = useState([emptySlide()]);
  const [intervalSeconds, setIntervalSeconds] = useState(5);
  const [transitionMs, setTransitionMs] = useState(900);
  const [autoplay, setAutoplay] = useState(true);
  const [indicatorColors, setIndicatorColors] = useState([...DEFAULT_RING_COLORS]);

  const load = useCallback(async () => {
    const token = getToken();
    if (!token) {
      setLoading(false);
      toast.error("Please log in again to manage the slideshow.");
      return;
    }
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/admin/hero-slideshow`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Failed to load");
      const list = Array.isArray(data.slides) && data.slides.length > 0 ? data.slides : [emptySlide()];
      setSlides(list.map((s) => ({ image_url: s.image_url || "", alt: s.alt || "" })));
      setIntervalSeconds(Math.min(60, Math.max(2, Number(data.interval_seconds) || 5)));
      setTransitionMs(Math.min(3000, Math.max(200, Number(data.transition_ms) || 900)));
      setAutoplay(data.autoplay !== false);
      const cols = Array.isArray(data.indicator_colors) ? data.indicator_colors : DEFAULT_RING_COLORS;
      setIndicatorColors([0, 1, 2].map((i) => cols[i] || DEFAULT_RING_COLORS[i]));
    } catch (e) {
      toast.error(e.message || "Could not load slideshow");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  async function onSave(e) {
    e.preventDefault();
    const token = getToken();
    if (!token) {
      toast.error("Please log in again to save.");
      return;
    }
    const filled = slides
      .map((s) => ({
        image_url: String(s.image_url || "").trim(),
        alt: String(s.alt || "").trim(),
      }))
      .filter((s) => s.image_url);
    if (filled.length === 0) {
      toast.error("Add at least one image URL");
      return;
    }
    setSaving(true);
    try {
      const res = await fetch(`${API_BASE}/admin/hero-slideshow`, {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          slides: filled,
          interval_seconds: intervalSeconds,
          transition_ms: transitionMs,
          autoplay,
          indicator_colors: indicatorColors,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Save failed");
      toast.success("Homepage hero slideshow saved");
      setSlides(data.slides.length ? data.slides.map((s) => ({ ...s })) : [emptySlide()]);
      if (Array.isArray(data.indicator_colors)) {
        setIndicatorColors([0, 1, 2].map((i) => data.indicator_colors[i] || DEFAULT_RING_COLORS[i]));
      }
    } catch (e) {
      toast.error(e.message || "Save failed");
    } finally {
      setSaving(false);
    }
  }

  function moveSlide(i, dir) {
    const j = i + dir;
    if (j < 0 || j >= slides.length) return;
    setSlides((prev) => {
      const next = [...prev];
      [next[i], next[j]] = [next[j], next[i]];
      return next;
    });
  }

  return (
    <div className="mx-auto w-full space-y-8 pb-12">
      <div>
        <div className="flex items-center justify-between gap-2">
          <Button variant="ghost" size="sm" className="mb-2 -ml-2 gap-2 text-slate-500" asChild>
            <Link href="/dashboard">
              <ArrowLeft className="h-4 w-4" />
              Back
            </Link>
          </Button>

          <div className="flex justify-end">
            <Button
              type="submit"
              form="slideshow-form"
              disabled={saving || loading}
              className="gap-2 bg-pink-600 cursor-pointer hover:bg-pink-700"
            >
              <Save className="h-4 w-4" />
              {saving ? "Saving…" : "Save slideshow"}
            </Button>
          </div>
        </div>
        <h1 className="text-3xl font-semibold tracking-tight text-slate-900">Homepage hero slideshow</h1>
        <p className="mt-1 text-sm text-slate-500">
          Images rotate on the right side of the landing hero. Set timing and fade duration below.
        </p>
      </div>

      <form id="slideshow-form" onSubmit={onSave} className="space-y-8">
        <Card className="border-slate-100 shadow-sm">
          <CardHeader>
            <CardTitle>Timing & animation</CardTitle>
            <CardDescription>Autoplay advances to the next slide after the interval. Crossfade uses the transition duration.</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-6 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="interval">Slide interval (seconds)</Label>
              <Input
                id="interval"
                type="number"
                min={2}
                max={60}
                value={intervalSeconds}
                onChange={(e) => setIntervalSeconds(Number(e.target.value) || 5)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="transition">Fade duration (milliseconds)</Label>
              <Input
                id="transition"
                type="number"
                min={200}
                max={3000}
                step={50}
                value={transitionMs}
                onChange={(e) => setTransitionMs(Number(e.target.value) || 900)}
              />
            </div>
            <label className="flex cursor-pointer items-center gap-3 sm:col-span-2">
              <input
                type="checkbox"
                checked={autoplay}
                onChange={(e) => setAutoplay(e.target.checked)}
                className="h-4 w-4 rounded border-slate-300 accent-pink-600"
              />
              <span className="text-sm font-medium text-slate-700">Autoplay (loop slideshow)</span>
            </label>
          </CardContent>
        </Card>

        <Card className="border-slate-100 shadow-sm">
          <CardHeader>
            <CardTitle>Slide indicators (rings)</CardTitle>
            <CardDescription>
              Three colors repeat in order (slide 1, 4, 7… use color A; 2, 5, 8… use B; etc.). Inactive rings are
              the same size; the active slide uses a larger ring.
            </CardDescription>
          </CardHeader>
          <CardContent className="grid gap-6 sm:grid-cols-3">
            {["Color A (1st, 4th, …)", "Color B (2nd, 5th, …)", "Color C (3rd, 6th, …)"].map((label, i) => (
              <div key={label} className="space-y-2">
                <Label htmlFor={`ind-color-${i}`}>{label}</Label>
                <div className="flex items-center gap-3">
                  <input
                    id={`ind-color-${i}`}
                    type="color"
                    value={colorPickerValue(indicatorColors[i], DEFAULT_RING_COLORS[i])}
                    onChange={(e) => {
                      const v = e.target.value;
                      setIndicatorColors((prev) => {
                        const next = [...prev];
                        next[i] = v;
                        return next;
                      });
                    }}
                    className="h-10 w-14 cursor-pointer rounded-md border border-slate-200 bg-white p-0.5"
                  />
                  <Input
                    value={indicatorColors[i] || ""}
                    onChange={(e) => {
                      const v = e.target.value.trim();
                      setIndicatorColors((prev) => {
                        const next = [...prev];
                        next[i] = v;
                        return next;
                      });
                    }}
                    placeholder="#FFC107"
                    className="font-mono text-sm"
                  />
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card className="border-slate-100 shadow-sm">
          <CardHeader className="flex flex-row items-start justify-between gap-4">
            <div>
              <CardTitle>Slides</CardTitle>
              <CardDescription>Order matches playback order. Upload or paste an image URL (Oracle CDN or HTTPS).</CardDescription>
            </div>
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="shrink-0 gap-1 border-pink-200 cursor-pointer text-pink-700"
              onClick={() => setSlides((s) => [...s, emptySlide()])}
            >
              <Plus className="h-4 w-4" />
              Add slide
            </Button>
          </CardHeader>
          <CardContent className="space-y-8">
            {loading ? (
              <p className="text-sm text-slate-500">Loading…</p>
            ) : (
              slides.map((slide, i) => (
                <div key={i} className="rounded-xl border border-slate-100 bg-slate-50/50 p-4">
                  <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
                    <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Slide {i + 1}</span>
                    <div className="flex items-center gap-1">
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8"
                        disabled={i === 0}
                        onClick={() => moveSlide(i, -1)}
                        aria-label="Move up"
                      >
                        <ArrowUp className="h-4 w-4" />
                      </Button>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8"
                        disabled={i === slides.length - 1}
                        onClick={() => moveSlide(i, 1)}
                        aria-label="Move down"
                      >
                        <ArrowDown className="h-4 w-4" />
                      </Button>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-red-600 hover:text-red-700"
                        disabled={slides.length <= 1}
                        onClick={() => setSlides((s) => s.filter((_, j) => j !== i))}
                        aria-label="Remove slide"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                  <div className="space-y-4">
                    <ImageUpload
                      key={`slide-${i}-${slide.image_url || "empty"}`}
                      label="Upload hero image"
                      initialUrl={slide.image_url}
                      onUploadComplete={(url) => {
                        setSlides((prev) => {
                          const next = [...prev];
                          next[i] = { ...next[i], image_url: url };
                          return next;
                        });
                      }}
                    />
                    <div className="space-y-2">
                      <Label htmlFor={`url-${i}`}>Image URL</Label>
                      <Input
                        id={`url-${i}`}
                        value={slide.image_url}
                        onChange={(e) => {
                          const v = e.target.value;
                          setSlides((prev) => {
                            const next = [...prev];
                            next[i] = { ...next[i], image_url: v };
                            return next;
                          });
                        }}
                        placeholder="https://..."
                        disabled
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor={`alt-${i}`}>Alt text (accessibility)</Label>
                      <Input
                        id={`alt-${i}`}
                        value={slide.alt}
                        onChange={(e) => {
                          const v = e.target.value;
                          setSlides((prev) => {
                            const next = [...prev];
                            next[i] = { ...next[i], alt: v };
                            return next;
                          });
                        }}
                        placeholder="Couple at ceremony"
                      />
                    </div>
                  </div>
                </div>
              ))
            )}
          </CardContent>
        </Card>
      </form>
    </div>
  );
}
