import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth";
import { getSiteSettingsCollection } from "@/lib/db";
import { normalizeIndicatorColors } from "@/lib/heroSlideshowSettings";

const DOC_ID = "hero_slideshow";

function sanitizeSlide(s) {
  const image_url = String(s?.image_url || "").trim();
  if (!image_url) return null;
  return {
    image_url,
    alt: String(s?.alt || "").trim() || "Wedding hero image",
  };
}

export async function GET(request) {
  const err = requireAdmin(request);
  if (err) return err;
  try {
    const col = await getSiteSettingsCollection();
    const doc = await col.findOne({ _id: DOC_ID });
    const slides = Array.isArray(doc?.slides) ? doc.slides.map(sanitizeSlide).filter(Boolean) : [];
    const indicator_colors = normalizeIndicatorColors(doc?.indicator_colors);
    return NextResponse.json({
      slides,
      interval_seconds: Math.min(60, Math.max(2, Number(doc?.interval_seconds) || 5)),
      transition_ms: Math.min(3000, Math.max(200, Number(doc?.transition_ms) || 900)),
      autoplay: doc?.autoplay !== false,
      indicator_colors,
      updated_at: doc?.updated_at || null,
    });
  } catch (e) {
    return NextResponse.json({ code: "INTERNAL_ERROR", message: e.message }, { status: 500 });
  }
}

export async function PUT(request) {
  const err = requireAdmin(request);
  if (err) return err;
  try {
    const body = await request.json().catch(() => ({}));
    const rawSlides = Array.isArray(body.slides) ? body.slides : [];
    const slides = rawSlides.map(sanitizeSlide).filter(Boolean);
    const interval_seconds = Math.min(60, Math.max(2, Number(body.interval_seconds) || 5));
    const transition_ms = Math.min(3000, Math.max(200, Number(body.transition_ms) || 900));
    const autoplay = body.autoplay !== false;
    const indicator_colors = normalizeIndicatorColors(body.indicator_colors);

    const col = await getSiteSettingsCollection();
    const now = new Date();
    await col.updateOne(
      { _id: DOC_ID },
      {
        $set: {
          slides,
          interval_seconds,
          transition_ms,
          autoplay,
          indicator_colors,
          updated_at: now,
        },
      },
      { upsert: true },
    );

    return NextResponse.json({
      slides,
      interval_seconds,
      transition_ms,
      autoplay,
      indicator_colors,
      updated_at: now.toISOString(),
    });
  } catch (e) {
    return NextResponse.json({ code: "INTERNAL_ERROR", message: e.message }, { status: 500 });
  }
}
